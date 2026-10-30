import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import config from '../src/payload.config'
import { storageSettings } from '../src/lib/storage'

const base = 'http://127.0.0.1:3001'
const { enabled, buckets, config: s3Config } = storageSettings()
assert.ok(enabled)
assert.ok((await fetch(base + '/ru')).ok, 'Run npm run preview:dev first')
const payload = await getPayload({ config })
const s3 = new S3Client(s3Config)
const originalCounts = await Promise.all(
  (['artworks', 'users', 'media', 'references', 'requests'] as const).map(
    async (collection) =>
      [collection, (await payload.count({ collection, overrideAccess: true })).totalDocs] as const,
  ),
)
assert.equal(
  originalCounts.find(([collection]) => collection === 'users')?.[1],
  0,
  'Run provisioning QA before creating the real preview administrator',
)
const nonce = randomUUID()
let userID: number | undefined
const files: { collection: 'media' | 'references'; id: number; filename: string }[] = []
const objects: { Bucket: string; Key: string }[] = []
try {
  // This is disposable QA data, never a real employee or artwork.
  const email = `storage-qa-${nonce}@example.com`
  const password = randomUUID() + randomUUID()
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, role: 'admin', name: 'Temporary storage QA' },
  })
  userID = user.id
  const login = await fetch(base + '/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  assert.equal(login.status, 200)
  const { token } = await login.json()
  const buffer = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: '#81878c' },
  })
    .png()
    .toBuffer()
  for (const collection of ['media', 'references'] as const) {
    const data = new FormData()
    data.set(
      '_payload',
      JSON.stringify(
        collection === 'media'
          ? { alt: 'Temporary storage QA image' }
          : { note: 'Temporary storage QA reference' },
      ),
    )
    data.set(
      'file',
      new File([new Uint8Array(buffer)], `storage-qa-${nonce}-${collection}.png`, {
        type: 'image/png',
      }),
    )
    const upload = await fetch(base + `/api/${collection}?locale=ru`, {
      method: 'POST',
      headers: { Authorization: `JWT ${token}`, Origin: base },
      body: data,
    })
    assert.equal(upload.status, 201, `Multipart upload for ${collection}`)
    const { doc } = await upload.json()
    files.push({ collection, id: doc.id, filename: doc.filename })
    const filenames = [
      doc.filename,
      ...(collection === 'media' && doc.sizes?.card?.filename ? [doc.sizes.card.filename] : []),
    ]
    for (const filename of filenames) {
      const object = {
        Bucket: buckets[collection],
        Key: [doc.prefix, doc._objectKey, filename].filter(Boolean).join('/'),
      }
      objects.push(object)
      assert.equal((await s3.send(new HeadObjectCommand(object))).ContentType, 'image/png')
      await assert.rejects(
        access(path.join('media', collection === 'media' ? 'artworks' : 'references', filename)),
        'Cloud uploads must not write local files',
      )
    }
    const fileURL = new URL(doc.url, base)
    assert.equal(fileURL.origin, base, 'Files must go through Payload access control')
    const guest = await fetch(fileURL)
    if (collection === 'media') assert.equal(guest.status, 200)
    else assert.ok([401, 403, 404].includes(guest.status), 'Guest cannot read private reference')
    const authenticated = await fetch(fileURL, { headers: { Authorization: `JWT ${token}` } })
    assert.equal(authenticated.status, 200)
    assert.ok((await authenticated.arrayBuffer()).byteLength > 0)
    if (collection === 'references') {
      assert.equal(
        (await fetch(fileURL, { headers: { Cookie: `payload-token=${token}` } })).status,
        200,
      )
      assert.ok(
        [401, 403, 404].includes((await fetch(fileURL)).status),
        'Authenticated reads must not make a private reference public',
      )
    }
    const publicEndpoint = new URL(process.env.S3_ENDPOINT!)
    publicEndpoint.pathname = `/storage/v1/object/public/${buckets[collection]}/${[doc.prefix, doc._objectKey, doc.filename].filter(Boolean).map(encodeURIComponent).join('/')}`
    const direct = await fetch(publicEndpoint)
    if (collection === 'media') assert.equal(direct.status, 200)
    else assert.ok(!direct.ok, 'Private reference must not be readable via a public bucket URL')
  }
  console.log(
    'PASS: multipart uploads, generated thumbnail, S3 persistence, public images, private references, authenticated reads, no local files.',
  )
} finally {
  try {
    for (const file of files.reverse())
      await payload.delete({ collection: file.collection, id: file.id, overrideAccess: true })
    if (userID !== undefined)
      await payload.delete({ collection: 'users', id: userID, overrideAccess: true })
    for (const object of objects) {
      const result = await s3.send(
        new ListObjectsV2Command({ Bucket: object.Bucket, Prefix: object.Key }),
      )
      assert.ok(
        !result.Contents?.some((item) => item.Key === object.Key),
        'Deleted QA object must be removed from S3',
      )
    }
    for (const [collection, count] of originalCounts)
      assert.equal((await payload.count({ collection, overrideAccess: true })).totalDocs, count)
    console.log(
      'PASS: QA files and employee removed; original record counts preserved. No artworks were copied or created.',
    )
  } finally {
    s3.destroy()
    await payload.destroy()
  }
}

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
const base = 'http://127.0.0.1:3000'
let token
const records = []
const headers = () => ({ Authorization: `JWT ${token}` })
const send = (data, file) => {
  const form = new FormData()
  form.set('data', JSON.stringify(data))
  if (file) form.append('references', file)
  return fetch(`${base}/api/inquiries`, { method: 'POST', headers: { Origin: base }, body: form })
}
try {
  for (const route of [
    '/ru',
    '/en',
    '/ru/works',
    '/en/commission',
    '/ru/about',
    '/ru/contact',
    '/ru/works/olive-grove',
    '/admin/login',
  ]) {
    const response = await fetch(base + route)
    assert.equal(response.status, 200, route)
  }
  console.log('PASS: RU/EN pages, work detail and admin login')
  const login = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  })
  assert.equal(login.status, 200)
  token = (await login.json()).token
  assert.ok(token)
  const privateResponse = await fetch(`${base}/api/requests`)
  assert.ok([401, 403].includes(privateResponse.status))
  const forbiddenUser = await fetch(`${base}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unauthorized@example.com', password: 'not-a-real-password' }),
  })
  assert.ok([401, 403].includes(forbiddenUser.status))
  console.log('PASS: admin authentication, guest request access denied, public registration denied')
  const media = await (await fetch(`${base}/api/media?limit=1`, { headers: headers() })).json()
  const temporaryTitle = `Тестовая картина ${randomUUID().slice(0, 8)}`
  const created = await fetch(`${base}/api/artworks?locale=ru`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: temporaryTitle,
      description: 'Only for a local automated check.',
      image: media.docs[0].id,
      medium: 'oil',
      width: 40,
      height: 40,
      year: 2026,
      priceMinor: 10000,
      currency: 'EUR',
      availability: 'available',
      published: false,
      demo: true,
    }),
  })
  assert.equal(created.status, 201)
  const temporaryWork = (await created.json()).doc
  records.push({ collection: 'artworks', id: temporaryWork.id })
  const temporarySlug = temporaryWork.slug
  assert.match(temporarySlug, /^testovaya-kartina-/)
  const sameName = await fetch(`${base}/api/artworks?locale=ru`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: temporaryTitle,
      description: 'Duplicate-title QA',
      image: media.docs[0].id,
      medium: 'oil',
      width: 40,
      height: 40,
      year: 2026,
      priceMinor: 65050,
      currency: 'EUR',
      availability: 'available',
      published: false,
      demo: true,
    }),
  })
  assert.equal(sameName.status, 201)
  const duplicateWork = (await sameName.json()).doc
  records.push({ collection: 'artworks', id: duplicateWork.id })
  assert.equal(duplicateWork.slug, `${temporarySlug}-2`)
  const rename = await fetch(`${base}/api/artworks/${duplicateWork.id}?locale=ru`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Новое название', slug: '' }),
  })
  assert.equal(rename.status, 200)
  assert.equal((await rename.json()).doc.slug, duplicateWork.slug)
  const adminEdit = await fetch(`${base}/admin/collections/artworks/${duplicateWork.id}`, {
    headers: { Cookie: `payload-token=${token}` },
  })
  assert.equal(adminEdit.status, 200)
  const adminHTML = await adminEdit.text()
  assert.ok(adminHTML.includes('Цена картины'))
  assert.ok(adminHTML.includes('Введите обычную цену'))
  const priceInput = adminHTML.match(/<input\b[^>]*\bid="field-priceMinor"[^>]*>/)?.[0]
  assert.ok(priceInput, 'Admin has a price input')
  assert.ok(
    priceInput.includes('value="650.5"'),
    'Admin shows 650.50 instead of storage value 65050',
  )
  assert.equal((await fetch(`${base}/ru/works/${temporarySlug}`)).status, 404)
  const publish = await fetch(`${base}/api/artworks/${temporaryWork.id}?locale=ru`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ published: true }),
  })
  assert.equal(publish.status, 200)
  assert.equal((await fetch(`${base}/ru/works/${temporarySlug}`)).status, 200)
  assert.equal((await fetch(`${base}/en/works/${temporarySlug}`)).status, 404)
  const translate = await fetch(`${base}/api/artworks/${temporaryWork.id}?locale=en`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Temporary test painting',
      description: 'Only for a local automated check.',
    }),
  })
  assert.equal(translate.status, 200)
  assert.equal((await fetch(`${base}/en/works/${temporarySlug}`)).status, 200)
  const dashboard = await fetch(`${base}/admin`, { headers: { Cookie: `payload-token=${token}` } })
  assert.equal(dashboard.status, 200)
  assert.ok((await dashboard.text()).includes('Ваша мастерская'))
  console.log(
    'PASS: automatic unique links, stable links on rename, CMS editing, draft visibility, RU/EN publication and Russian admin',
  )
  const choice = { subject: 'portrait', medium: 'oil', size: '40x40' }
  const estimate = await (await fetch(`${base}/api/estimate?${new URLSearchParams(choice)}`)).json()
  assert.ok(estimate.quote?.token)
  const manual = await (
    await fetch(`${base}/api/estimate?subject=portrait&medium=oil&size=custom`)
  ).json()
  assert.equal(manual.quote, null)
  const data = {
    kind: 'commission',
    locale: 'en',
    ...choice,
    name: 'Local QA',
    channel: 'email',
    contact: `qa-${randomUUID().slice(0, 8)}@example.com`,
    message: 'Local smoke test; safe to delete.',
    consent: true,
    idempotencyKey: randomUUID(),
    estimateToken: estimate.quote.token,
  }
  const file = new File([await readFile('public/art/sea.png')], 'reference.png', {
    type: 'image/png',
  })
  const response = await send(data, file)
  const saved = await response.json()
  assert.equal(response.status, 201, JSON.stringify(saved))
  assert.ok(saved.reference)
  const list = await (
    await fetch(`${base}/api/requests?where[idempotencyKey][equals]=${data.idempotencyKey}`, {
      headers: headers(),
    })
  ).json()
  assert.equal(list.docs.length, 1)
  const doc = list.docs[0]
  records.push({ collection: 'requests', id: doc.id })
  assert.equal(doc.details.quote.currency, 'EUR')
  assert.equal(doc.details.quote.token, estimate.quote.token)
  for (const reference of doc.references)
    records.push({ collection: 'references', id: reference.id })
  const fileURL = doc.references[0].url
  assert.ok(fileURL)
  const privateFile = await fetch(new URL(fileURL, base))
  assert.ok(
    [401, 403, 404].includes(privateFile.status),
    `Guest private file: ${privateFile.status}`,
  )
  const ownFile = await fetch(new URL(fileURL, base), { headers: headers() })
  assert.equal(ownFile.status, 200)
  const again = await send(data)
  assert.equal((await again.json()).reference, saved.reference)
  assert.equal(
    (
      await (
        await fetch(`${base}/api/requests?where[idempotencyKey][equals]=${data.idempotencyKey}`, {
          headers: headers(),
        })
      ).json()
    ).docs.length,
    1,
  )
  const changed = await send({ ...data, idempotencyKey: randomUUID(), estimateToken: 'stale' })
  assert.equal(changed.status, 409)
  const badFile = await send(
    { ...data, idempotencyKey: randomUUID() },
    new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' }),
  )
  assert.equal(badFile.status, 400)
  console.log(
    'PASS: estimate, manual fallback, persisted quote snapshot, idempotency, private references and changed-price rejection',
  )
} finally {
  for (const record of records) {
    const result = await fetch(`${base}/api/${record.collection}/${record.id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    assert.equal(result.status, 200, `Cleanup ${record.collection}`)
  }
  console.log('Removed smoke-test requests and references.')
}

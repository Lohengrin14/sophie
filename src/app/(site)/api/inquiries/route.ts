import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createLocalReq } from 'payload'
import sharp from 'sharp'
import { cms } from '@/lib/data'
import { requestSchema } from '@/lib/requests'
import { getQuote } from '@/lib/estimate'
import { artworkPrice } from '@/lib/artwork-prices'

const MAX_BODY = 17 * 1024 * 1024
async function boundedForm(req: Request) {
  if (Number(req.headers.get('content-length')) > MAX_BODY) throw new Error('large')
  const reader = req.body?.getReader()
  if (!reader) throw new Error('invalid')
  let length = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_BODY) {
      await reader.cancel()
      throw new Error('large')
    }
    chunks.push(value)
  }
  return new Response(Buffer.concat(chunks), {
    headers: { 'Content-Type': req.headers.get('content-type') || '' },
  }).formData()
}
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const expectedOrigin = `${new URL(req.url).protocol}//${req.headers.get('host')}`
  if (!origin || origin !== expectedOrigin)
    return NextResponse.json({ error: 'origin' }, { status: 403 })
  let form: FormData
  try {
    form = await boundedForm(req)
  } catch {
    return NextResponse.json({ error: 'files' }, { status: 413 })
  }
  let input: unknown
  try {
    input = JSON.parse(String(form.get('data')))
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const data = parsed.data
  const files = form.getAll('references').filter((f): f is File => f instanceof File && f.size > 0)
  if (
    files.length > 3 ||
    files.some(
      (f) =>
        f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
    )
  )
    return NextResponse.json({ error: 'files' }, { status: 400 })
  const payload = await cms()
  const existing = await payload.find({
    collection: 'requests',
    overrideAccess: true,
    where: { idempotencyKey: { equals: data.idempotencyKey } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return NextResponse.json({ reference: existing.docs[0].reference })
  // Database-backed per-contact limit works across application processes; no IP-based assumptions.
  const recent = await payload.count({
    collection: 'requests',
    overrideAccess: true,
    where: {
      and: [
        { contact: { equals: data.contact.toLowerCase() } },
        { createdAt: { greater_than: new Date(Date.now() - 15 * 60_000).toISOString() } },
      ],
    },
  })
  if (recent.totalDocs >= 5) return NextResponse.json({ error: 'rate' }, { status: 429 })
  let snapshot: Record<string, unknown> = {}
  if (data.kind === 'purchase') {
    const work = await payload.findByID({
      collection: 'artworks',
      id: data.artworkId!,
      overrideAccess: false,
      locale: data.locale,
      depth: 0,
      disableErrors: true,
    })
    if (!work || work.availability !== 'available')
      return NextResponse.json({ error: 'unavailable' }, { status: 409 })
    snapshot = { title: work.title, ...artworkPrice(work, data.locale) }
  }
  if (data.kind === 'commission') {
    const studio = await payload.findGlobal({ slug: 'studio', overrideAccess: false })
    if (studio.commissionsOpen === false)
      return NextResponse.json({ error: 'closed' }, { status: 409 })
    const quote = await getQuote({ subject: data.subject!, medium: data.medium!, size: data.size! })
    if ((quote?.token || 'manual') !== data.estimateToken)
      return NextResponse.json({ error: 'quoteChanged' }, { status: 409 })
    snapshot = {
      subject: data.subject,
      medium: data.medium,
      size: data.size,
      customWidth: data.customWidth,
      customHeight: data.customHeight,
      referenceLink: data.referenceLink,
      quote,
    }
  }
  const reference = `ART-${randomUUID().slice(0, 8).toUpperCase()}`
  const requestContext = await createLocalReq({}, payload)
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) return NextResponse.json({ error: 'save' }, { status: 503 })
  requestContext.transactionID = transactionID
  try {
    const uploaded: number[] = []
    for (const file of files) {
      const inputBuffer = Buffer.from(await file.arrayBuffer())
      const metadata = await sharp(inputBuffer, { limitInputPixels: 20_000_000 }).metadata()
      if (!['jpeg', 'png', 'webp'].includes(metadata.format || ''))
        throw new Error('Unsupported reference')
      const buffer = await sharp(inputBuffer, { limitInputPixels: 20_000_000 })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()
      const doc = await payload.create({
        collection: 'references',
        overrideAccess: true,
        req: requestContext,
        data: { note: reference },
        file: {
          data: buffer,
          mimetype: 'image/webp',
          name: `${randomUUID()}.webp`,
          size: buffer.length,
        },
      })
      uploaded.push(Number(doc.id))
    }
    await payload.create({
      collection: 'requests',
      overrideAccess: true,
      req: requestContext,
      data: {
        reference,
        idempotencyKey: data.idempotencyKey,
        kind: data.kind,
        locale: data.locale,
        name: data.name,
        channel: data.channel,
        contact: data.contact.toLowerCase(),
        message: data.message,
        artwork: data.kind === 'purchase' ? data.artworkId : undefined,
        details: snapshot,
        references: uploaded,
        status: 'new',
        consentVersion: 'local-preview-v1',
      },
    })
    await payload.db.commitTransaction(transactionID)
    return NextResponse.json({ reference }, { status: 201 })
  } catch {
    await payload.db.rollbackTransaction(transactionID)
    const duplicate = await payload.find({
      collection: 'requests',
      overrideAccess: true,
      where: { idempotencyKey: { equals: data.idempotencyKey } },
      limit: 1,
    })
    if (duplicate.docs[0]) return NextResponse.json({ reference: duplicate.docs[0].reference })
    return NextResponse.json({ error: 'save' }, { status: 500 })
  }
}

import assert from 'node:assert/strict'
import sharp from 'sharp'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { canvasSize } from '../src/lib/canvas-size'

// Deliberately simple, reproducible layout targets. No AI generation or external images.
const fixtures = [
  { width: 29.7, height: 42, color: '#c7d7cc' },
  { width: 60, height: 40, color: '#c7cfdf' },
  { width: 60, height: 90, color: '#ddbca7' },
  { width: 42, height: 29.7, color: '#e2d4a5' },
  { width: 30, height: 50, color: '#c7bdd9' },
  { width: 50, height: 30, color: '#b9d4da' },
  { width: 40, height: 60, color: '#dcbfc7' },
  { width: 50, height: 75, color: '#c3caa5' },
  { width: 75, height: 50, color: '#cec4b6' },
  { width: 120, height: 120, color: '#b8c9dd' },
] as const

const prefix = 'layout-study-v1-'
const databaseHost = new URL(process.env.DATABASE_URL || '').hostname
if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseHost))
  throw new Error('Layout fixtures may only be added to a local database.')

const payload = await getPayload({ config })
let created = 0
let skipped = 0
try {
  const before = await payload.find({ collection: 'artworks', limit: 1000, depth: 0 })
  const original = before.docs.filter((work) => !work.slug.startsWith(prefix))

  for (const [index, fixture] of fixtures.entries()) {
    const number = String(index + 1).padStart(2, '0')
    const slug = `${prefix}${number}`
    const exists = await payload.count({
      collection: 'artworks',
      where: { slug: { equals: slug } },
    })
    if (exists.totalDocs) {
      skipped++
      continue
    }
    const tier = canvasSize(fixture.width, fixture.height)
    const ratio = 1200 / Math.max(fixture.width, fixture.height)
    const width = Math.round(fixture.width * ratio)
    const height = Math.round(fixture.height * ratio)
    const unit = Math.min(width, height)
    const dimensions = `${fixture.width} x ${fixture.height} cm`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${fixture.color}"/>
      <rect x="16" y="16" width="${width - 32}" height="${height - 32}" fill="none" stroke="#1e2026" stroke-width="3"/>
      <circle cx="${width / 2}" cy="${height / 2}" r="${unit * 0.31}" fill="#fcfcfa" fill-opacity=".55"/>
      <path d="M ${width / 2} 36 V ${height - 36} M 36 ${height / 2} H ${width - 36}" stroke="#1e2026" stroke-opacity=".25" stroke-width="2" stroke-dasharray="12 12"/>
      <g font-family="sans-serif" fill="#1e2026" text-anchor="middle">
        <text x="${width / 2}" y="${unit * 0.13}" font-size="${unit * 0.06}">TIER ${tier.tier} / ${tier.scale}x</text>
        <text x="${width / 2}" y="${height / 2}" dominant-baseline="central" font-size="${unit * 0.38}" font-weight="600">${number}</text>
        <text x="${width / 2}" y="${height - unit * 0.07}" font-size="${unit * 0.065}">${dimensions}</text>
      </g>
    </svg>`
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
    const filename = `${slug}.png`
    const existingMedia = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    const image =
      existingMedia.docs[0] ??
      (await payload.create({
        collection: 'media',
        locale: 'ru',
        data: { alt: `Тест холста ${number}: ${fixture.width} × ${fixture.height} см` },
        file: { data: buffer, mimetype: 'image/png', name: filename, size: buffer.length },
      }))
    if (!existingMedia.docs.length) {
      await payload.update({
        collection: 'media',
        id: image.id,
        locale: 'en',
        data: { alt: `Canvas layout target ${number}: ${dimensions}` },
      })
    }
    const work = await payload.create({
      collection: 'artworks',
      locale: 'ru',
      data: {
        workKind: 'physical',
        slug,
        title: `Тест холста ${number} · ${fixture.width} × ${fixture.height}`,
        description: `Технический пример для проверки расположения. Не настоящая картина. Масштаб ${tier.scale}×, категория ${tier.tier} из 5. Изображение создано программно, без ИИ. Цена условная.`,
        image: image.id,
        width: fixture.width,
        height: fixture.height,
        medium: 'acrylic',
        year: 2026,
        priceMinor: 10000 + index * 5000,
        currency: 'EUR',
        availability: index === 7 ? 'sold' : 'available',
        demo: true,
        featured: true,
        sortOrder: index + 1,
        published: false,
      },
    })
    await payload.update({
      collection: 'artworks',
      id: work.id,
      locale: 'en',
      data: {
        title: `Canvas study ${number} · ${fixture.width} × ${fixture.height}`,
        description: `Technical layout target, not an original painting. Display scale ${tier.scale}x, tier ${tier.tier} of 5. Programmatically drawn, not AI-generated. The price is illustrative.`,
        published: true,
      },
    })
    created++
    console.log(`Created ${slug}: ${dimensions}, tier ${tier.tier}`)
  }

  const after = await payload.find({ collection: 'artworks', limit: 1000, depth: 0 })
  for (const previous of original) {
    const current = after.docs.find((work) => work.id === previous.id)
    assert.ok(current, 'An original artwork is missing')
    assert.equal(
      current.updatedAt,
      previous.updatedAt,
      'An original artwork changed during the seed',
    )
  }
  assert.equal(after.docs.filter((work) => work.slug.startsWith(prefix)).length, fixtures.length)
  console.log(
    `Layout fixtures: ${created} added, ${skipped} already present. ${original.length} original artworks preserved.`,
  )
} finally {
  await payload.destroy()
}
process.exit(0)

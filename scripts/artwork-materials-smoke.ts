import assert from 'node:assert/strict'
import pg from 'pg'
import { getPayload } from 'payload'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import config from '../src/payload.config'
import { migrations } from '../src/migrations'
import { artworkDimensions } from '../src/lib/artwork-materials'

assert.equal(process.env.DATABASE_TARGET, 'local')
assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/sophie_migration_qa_[a-f0-9]+$/)
const payload = await getPayload({ config })
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
const qaMigrations = migrations.map((migration) => ({
  name: migration.name,
  up: (args: unknown) => migration.up(args as MigrateUpArgs),
  down: (args: unknown) => migration.down(args as MigrateDownArgs),
}))
try {
  await db.connect()
  const index = migrations.findIndex((migration) => migration.name.endsWith('artwork_materials'))
  assert.ok(index > 0)
  await payload.db.migrate({ migrations: qaMigrations.slice(0, index) })
  const media = await db.query('INSERT INTO media DEFAULT VALUES RETURNING id')
  const image = media.rows[0].id
  const old = await db.query(
    'INSERT INTO artworks (image_id,width,height,medium,slug,price_usd_minor) VALUES ($1,60,40,$2,$3,70025) RETURNING id',
    [image, 'oil', 'legacy-material-qa'],
  )
  await payload.db.migrate({ migrations: qaMigrations })
  const legacy = await payload.findByID({ collection: 'artworks', id: old.rows[0].id })
  assert.equal(legacy.workKind, 'physical')
  assert.equal(legacy.surface, 'canvas')
  assert.equal(legacy.medium, 'oil')
  assert.equal(legacy.width, 60)
  assert.equal(legacy.height, 40)
  assert.equal(legacy.priceUsdMinor, 70025)
  const paper = await payload.create({
    collection: 'artworks',
    data: {
      title: 'Paper QA',
      workKind: 'physical',
      medium: 'watercolor',
      surface: 'paper',
      paperFormat: 'A3',
      width: 42,
      height: 29.7,
      image,
      year: 2026,
      availability: 'available',
      slug: 'paper-material-qa',
    },
  })
  assert.equal(artworkDimensions(paper, 'en'), 'A3 · 42 × 29.7 cm')
  const cardboard = await payload.update({
    collection: 'artworks',
    id: paper.id,
    data: { medium: 'gouache', surface: 'cardboard', paperFormat: 'A5' },
  })
  assert.equal(cardboard.width, 21)
  assert.equal(cardboard.height, 14.8)
  const custom = await payload.update({ collection: 'artworks', id: paper.id, data: { width: 30 } })
  assert.equal(custom.paperFormat, null)
  assert.equal(custom.medium, 'gouache')
  const digital = await payload.create({
    collection: 'artworks',
    data: {
      title: 'Digital QA',
      workKind: 'digital',
      medium: 'digital',
      width: 2400,
      height: 1600,
      image,
      year: 2026,
      availability: 'available',
      slug: 'digital-material-qa',
    },
  })
  assert.equal(digital.surface, null)
  assert.equal(digital.paperFormat, null)
  assert.equal(artworkDimensions(digital, 'en'), '2,400 × 1,600 px')
  const edited = await payload.update({
    collection: 'artworks',
    id: digital.id,
    data: { description: 'Digital artwork' },
  })
  assert.equal(edited.medium, 'digital')
  await assert.rejects(
    payload.update({ collection: 'artworks', id: digital.id, data: { width: 20.5 } }),
  )
  await assert.rejects(
    payload.update({
      collection: 'artworks',
      id: paper.id,
      data: { paperFormat: 'A3', width: 40, height: 40 },
    }),
  )
  await payload.db.migrate({ migrations: qaMigrations })
  assert.equal((await payload.count({ collection: 'artworks' })).totalDocs, 3)
  console.log(
    'PASS: legacy artwork preserved, watercolor on paper, gouache on cardboard, paper rotation, custom sizes, digital pixels and validation.',
  )
} finally {
  await db.query('DELETE FROM artworks')
  await db.query('DELETE FROM media')
  await db.end()
  await payload.destroy()
}

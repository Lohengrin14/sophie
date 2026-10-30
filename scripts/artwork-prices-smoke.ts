import assert from 'node:assert/strict'
import pg from 'pg'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { migrations } from '../src/migrations'
import { artworkPrice } from '../src/lib/artwork-prices'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// The generic Payload adapter types use unknown; these migrations use the Postgres adapter.
const qaMigrations = migrations.map((migration) => ({
  name: migration.name,
  up: (args: unknown) => migration.up(args as MigrateUpArgs),
  down: (args: unknown) => migration.down(args as MigrateDownArgs),
}))

assert.equal(process.env.DATABASE_TARGET, 'local')
assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/sophie_migration_qa_[a-f0-9]+$/)
const payload = await getPayload({ config })
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
try {
  await db.connect()
  await payload.db.migrate({ migrations: qaMigrations.slice(0, -1) })
  const media = await db.query('INSERT INTO media DEFAULT VALUES RETURNING id')
  const image = media.rows[0].id
  for (const [currency, price] of [
    ['RUB', 3500050],
    ['USD', 40025],
    ['EUR', 60000],
  ] as const) {
    await db.query(
      'INSERT INTO artworks (image_id,width,height,price_minor,currency,slug) VALUES ($1,40,60,$2,$3,$4)',
      [image, price, currency, currency.toLowerCase()],
    )
  }
  await payload.db.migrate({ migrations: qaMigrations })
  const migrated = await db.query(
    'SELECT currency,price_minor,price_rub_minor,price_usd_minor FROM artworks ORDER BY currency',
  )
  assert.equal(migrated.rows.length, 3)
  for (const row of migrated.rows) {
    assert.equal(row.price_rub_minor, row.currency === 'RUB' ? row.price_minor : null)
    assert.equal(row.price_usd_minor, row.currency === 'USD' ? row.price_minor : null)
  }
  const work = await payload.create({
    collection: 'artworks',
    locale: 'ru',
    data: {
      title: 'Проверка цен',
      description: 'Русское описание',
      image,
      width: 40,
      height: 60,
      medium: 'oil',
      year: 2026,
      availability: 'available',
      slug: 'price-qa',
    },
  })
  assert.equal(artworkPrice(work, 'ru'), null)
  assert.equal(artworkPrice(work, 'en'), null)
  await payload.update({
    collection: 'artworks',
    id: work.id,
    locale: 'ru',
    data: { priceRubMinor: 3500050, priceUsdMinor: 40025 },
  })
  await payload.update({
    collection: 'artworks',
    id: work.id,
    locale: 'en',
    data: { title: 'Price QA', description: 'English description' },
  })
  const ru = await payload.findByID({ collection: 'artworks', id: work.id, locale: 'ru' })
  const en = await payload.findByID({ collection: 'artworks', id: work.id, locale: 'en' })
  assert.equal(ru.description, 'Русское описание')
  assert.equal(en.description, 'English description')
  assert.deepEqual(artworkPrice(ru, 'ru'), { priceMinor: 3500050, currency: 'RUB' })
  assert.deepEqual(artworkPrice(en, 'en'), { priceMinor: 40025, currency: 'USD' })
  const cleared = await payload.update({
    collection: 'artworks',
    id: work.id,
    data: { priceRubMinor: null },
  })
  assert.equal(cleared.priceRubMinor, null)
  assert.equal(cleared.priceUsdMinor, 40025)
  for (const value of [-1, 10.5])
    await assert.rejects(
      payload.update({ collection: 'artworks', id: work.id, data: { priceUsdMinor: value } }),
    )
  await payload.db.migrate({ migrations: qaMigrations })
  assert.equal(
    (await payload.findByID({ collection: 'artworks', id: work.id })).priceRubMinor,
    null,
  )
  console.log(
    'PASS: preserved legacy prices, RUB/USD backfill, no EUR conversion, optional prices, localized descriptions, shared prices, clearing and validation.',
  )
} finally {
  await db.query('DELETE FROM artworks')
  await db.query('DELETE FROM media')
  await db.end()
  await payload.destroy()
}

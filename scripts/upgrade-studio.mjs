// Local data upgrade for the 10-step board scale and 1–50 priority controls.
// Run before starting a new schema when the old reserved enum is still in use.
import pg from 'pg'
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query(
    "UPDATE artworks SET availability='available' WHERE availability::text='reserved'",
  )
  await client.query(
    'WITH ordered AS (SELECT id, row_number() OVER (ORDER BY sort_order, id) AS position FROM artworks) UPDATE artworks SET sort_order=LEAST(50, ordered.position) FROM ordered WHERE artworks.id=ordered.id AND (artworks.sort_order < 1 OR artworks.sort_order > 50 OR artworks.sort_order IS NULL)',
  )
  const field = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name='artworks' AND column_name='display_size'",
  )
  if (field.rowCount)
    await client.query('UPDATE artworks SET display_size=4 WHERE display_size IS NULL')
  await client.query('COMMIT')
  console.log('Gallery settings upgraded. Accounts, images, prices and dimensions were preserved.')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawn } from 'node:child_process'
import pg from 'pg'

const local = parseEnv(readFileSync('.env.local', 'utf8'))
const url = new URL(local.DATABASE_URL)
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname),
  'Migration QA only runs on a local database',
)
const name = 'sophie_migration_qa_' + randomUUID().replaceAll('-', '')
const admin = new pg.Client({ connectionString: local.DATABASE_URL })
const testURL = new URL(url)
testURL.pathname = '/' + name
const env = {
  ...process.env,
  ...local,
  NODE_ENV: 'production',
  DATABASE_TARGET: 'local',
  STORAGE_TARGET: 'local',
  DATABASE_URL: testURL.href,
  DATABASE_PUSH: 'false',
  DATABASE_POOL_MAX: '3',
  PAYLOAD_DROP_DATABASE: 'false',
}
function cli(command, ...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/payload/bin.js', command, ...args], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      // No connection details or secret-containing error objects in CI output.
      if (code !== 0) reject(new Error(`Migration QA command ${command} failed (${code}).`))
      else resolve(output)
    })
  })
}
async function verify() {
  const db = new pg.Client({ connectionString: testURL.href })
  try {
    await db.connect()
    const history = await db.query('SELECT count(*)::int AS count FROM payload_migrations')
    assert.equal(
      history.rows[0].count,
      readdirSync('src/migrations').filter((file) => file.endsWith('.ts') && file !== 'index.ts')
        .length,
    )
    for (const table of ['users', 'media', 'artworks', 'quote_rules', 'requests', 'references']) {
      const result = await db.query(`SELECT count(*)::int AS count FROM "${table}"`)
      assert.equal(result.rows[0].count, 0, table)
    }
    const localized = await db.query(
      "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = '_locales' ORDER BY enumsortorder",
    )
    assert.deepEqual(
      localized.rows.map((row) => row.enumlabel),
      ['ru', 'en'],
    )
  } finally {
    await db.end()
  }
}
let created = false
try {
  await admin.connect()
  await admin.query(`CREATE DATABASE "${name}"`)
  created = true
  await cli('migrate')
  await verify()
  if (process.argv.includes('--google-auth')) {
    await cli('run', 'scripts/google-auth-smoke.ts')
    await verify()
    console.log('PASS: Google session bridge, employee permissions, denied access, refresh, logout, and password fallback.')
  }
  await cli('migrate')
  await verify()
  console.log(
    'PASS: fresh migration, empty collections, RU/EN schema, repeat migration is a no-op.',
  )
} finally {
  if (created) await admin.query(`DROP DATABASE "${name}"`)
  await admin.end()
  console.log('Temporary local QA database removed; application database was not migrated.')
}

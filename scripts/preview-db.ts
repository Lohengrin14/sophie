import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawn } from 'node:child_process'
import pg from 'pg'
import { databaseOptions } from '../src/lib/database'

const command = process.argv[2] || 'check'
if (!['check', 'status', 'migrate'].includes(command)) {
  console.error('Use check, status or migrate. Destructive commands are not supported here.')
  process.exit(1)
}
const preview = parseEnv(readFileSync('.env.preview.local', 'utf8'))
if (preview.DATABASE_TARGET !== 'supabase')
  throw new Error('Set DATABASE_TARGET=supabase in .env.preview.local')
Object.assign(process.env, preview)
process.env.PAYLOAD_MIGRATING = 'true'
process.env.PAYLOAD_DROP_DATABASE = 'false'
const options = databaseOptions(preview)

// Never print connection strings, passwords or signing secrets, including on CLI failures.
function redact(output: string) {
  for (const value of [
    preview.SUPABASE_DB_PASSWORD,
    preview.PAYLOAD_SECRET,
    preview.S3_ACCESS_KEY_ID,
    preview.S3_SECRET_ACCESS_KEY,
    options.pool.connectionString,
  ]) {
    if (value) {
      output = output
        .replaceAll(value, '[redacted]')
        .replaceAll(encodeURIComponent(value), '[redacted]')
    }
  }
  return output
}

async function inspect() {
  const client = new pg.Client(options.pool)
  try {
    await client.connect()
    await client.query('SELECT 1')
    const { rows } = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
    )
    return rows.map((row) => row.table_name)
  } finally {
    await client.end()
  }
}

try {
  const tables = await inspect()
  console.log(`TLS connection verified. Public tables: ${tables.length}.`)
  if (command !== 'check') {
    if (!preview.PAYLOAD_SECRET) throw new Error('Missing PAYLOAD_SECRET in preview settings')
    if (command === 'migrate' && tables.length && !tables.includes('payload_migrations')) {
      throw new Error(
        'This database already contains tables without Payload migration history. Migration stopped for review.',
      )
    }
    let output = ''
    const child = spawn(
      process.execPath,
      ['node_modules/payload/bin.js', command === 'status' ? 'migrate:status' : 'migrate'],
      {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })
    const code = await new Promise<number>((resolve, reject) => {
      child.on('error', reject)
      child.on('close', (code) => resolve(code ?? 1))
    })
    process.stdout.write(redact(output))
    if (code !== 0) process.exitCode = code
    else if (command === 'migrate')
      console.log(`Migration completed. Public tables: ${(await inspect()).length}.`)
  }
} catch (error) {
  if (error instanceof Error && error.message.includes('EMAXCONNSESSION')) {
    console.error(
      'Database session pool exhausted. Use Supabase transaction pooler port 6543 for serverless runtime.',
    )
    process.exit(1)
  }
  // Driver errors may contain connection details; report codes rather than serialized objects.
  const code =
    error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined
  console.error(
    code
      ? `Database check failed (${code}).`
      : redact(error instanceof Error ? error.message : 'Database command failed.'),
  )
  process.exitCode = 1
}

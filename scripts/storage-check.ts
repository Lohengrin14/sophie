import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import pg from 'pg'
import { storageSettings } from '../src/lib/storage'
import { databaseOptions } from '../src/lib/database'

const env = parseEnv(readFileSync('.env.preview.local', 'utf8'))
const { config, buckets, enabled } = storageSettings(env)
assert.ok(enabled, 'Cloud storage must be explicitly enabled')
const client = new S3Client(config)
const db = new pg.Client(databaseOptions(env).pool)
try {
  for (const Bucket of Object.values(buckets)) {
    await client.send(new HeadBucketCommand({ Bucket }))
    console.log(`PASS: S3 access to ${Bucket}`)
  }
  await db.connect()
  const { rows } = await db.query(
    'SELECT id, public FROM storage.buckets WHERE id = ANY($1::text[])',
    [Object.values(buckets)],
  )
  assert.equal(
    rows.find((row) => row.id === buckets.media)?.public,
    true,
    'Artwork bucket must be public',
  )
  assert.equal(
    rows.find((row) => row.id === buckets.references)?.public,
    false,
    'Reference bucket must be private',
  )
  console.log('PASS: artwork bucket public; reference bucket private. No files changed.')
} catch (error) {
  // Do not serialize SDK errors, request objects or credentials.
  console.error('Storage check failed: ' + (error instanceof Error ? error.name : 'unknown'))
  process.exitCode = 1
} finally {
  client.destroy()
  await db.end()
}

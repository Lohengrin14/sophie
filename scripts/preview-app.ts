import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawn } from 'node:child_process'

const preview = parseEnv(readFileSync('.env.preview.local', 'utf8'))
if (preview.DATABASE_TARGET !== 'supabase' || preview.STORAGE_TARGET !== 'supabase') {
  throw new Error('Preview requires explicit Supabase database and storage targets')
}
const mode = process.argv[2] || 'dev'
if (!['dev', 'storage-test'].includes(mode)) throw new Error('Use dev or storage-test')
const args =
  mode === 'dev'
    ? ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3001']
    : ['node_modules/payload/bin.js', 'run', 'scripts/storage-smoke.ts']
const child = spawn(process.execPath, args, {
  env: { ...process.env, ...preview, LOCAL_CLOUD_PREVIEW: 'true', PAYLOAD_DROP_DATABASE: 'false' },
  stdio: ['inherit', 'pipe', 'pipe'],
})
const secrets = Object.entries(preview).flatMap(([key, value]) =>
  value && /PASSWORD|SECRET|KEY|DATABASE_URL/.test(key) ? [value] : [],
)
function redact(value: string) {
  for (const secret of secrets)
    value = value
      .replaceAll(secret, '[redacted]')
      .replaceAll(encodeURIComponent(secret), '[redacted]')
  return value
}
for (const stream of [child.stdout, child.stderr]) {
  let pending = ''
  stream.on('data', (chunk) => {
    pending += chunk.toString()
    const lines = pending.split('\n')
    pending = lines.pop() || ''
    for (const line of lines) process.stdout.write(redact(line) + '\n')
  })
  stream.on('end', () => {
    if (pending) process.stdout.write(redact(pending))
  })
}
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    child.kill(signal)
  })
child.on('error', () => {
  console.error('Could not start preview process')
  process.exitCode = 1
})
child.on('close', (code) => {
  process.exitCode = code ?? 0
})

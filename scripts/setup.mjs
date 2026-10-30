import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

if (!existsSync('.env.local')) {
  const password = randomBytes(18).toString('base64url')
  const env = readFileSync('.env.example', 'utf8')
    .replace('PAYLOAD_SECRET=\n', `PAYLOAD_SECRET=${randomBytes(32).toString('hex')}\n`)
    .replace('ADMIN_EMAIL=\n', 'ADMIN_EMAIL=studio@localhost.test\n')
    .replace('ADMIN_PASSWORD=\n', `ADMIN_PASSWORD=${password}\n`)
  writeFileSync('.env.local', env, { mode: 0o600, flag: 'wx' })
  console.log(
    'Created .env.local. Local admin credentials are in ADMIN_EMAIL / ADMIN_PASSWORD (not printed).',
  )
} else console.log('.env.local already exists; preserved.')
mkdirSync('media/artworks', { recursive: true })
mkdirSync('media/references', { recursive: true })

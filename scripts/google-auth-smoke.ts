import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createLocalReq, getPayload, logoutOperation, refreshOperation } from 'payload'
import config from '../src/payload.config'
import { googlePayloadSession, StaffLoginDenied } from '../src/lib/google-payload-session'
import { can } from '../src/lib/studio-access'

// This test must never write to the application or cloud database.
assert.equal(process.env.DATABASE_TARGET, 'local')
assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/sophie_migration_qa_[a-f0-9]+$/)
const payload = await getPayload({ config })
const ids: number[] = []
try {
  const password = randomUUID() + randomUUID()
  const admin = await payload.create({
    collection: 'users',
    data: { email: 'admin@example.test', password },
  })
  ids.push(admin.id)
  const adminReq = await createLocalReq({ user: { ...admin, collection: 'users' } }, payload)
  const staff = await payload.create({
    collection: 'users',
    req: adminReq,
    data: {
      email: 'staff@example.test',
      password,
      role: 'staff',
      permissions: { gallery: { read: true, edit: false } },
    },
  })
  ids.push(staff.id)
  await assert.rejects(googlePayloadSession(payload, 'stranger@example.test'), StaffLoginDenied)
  assert.equal(
    (await payload.count({ collection: 'users' })).totalDocs,
    2,
    'Unknown Google users must not become staff',
  )
  const cookie = await googlePayloadSession(payload, staff.email)
  assert.ok(cookie.includes('HttpOnly'))
  assert.ok(cookie.includes('SameSite=Lax'))
  const headers = new Headers({ Cookie: cookie.split(';')[0] })
  const authenticated = await payload.auth({ headers })
  assert.equal(authenticated.user?.id, staff.id)
  assert.equal(authenticated.user?.role, 'staff')
  assert.equal(can(authenticated.user, 'gallery'), true)
  assert.equal(can(authenticated.user, 'gallery', 'edit'), false)
  assert.equal(can(authenticated.user, 'users'), false)
  // Permissions must be read from the database on each request, not frozen in an OAuth token.
  await payload.update({
    collection: 'users',
    id: staff.id,
    req: adminReq,
    data: { permissions: { gallery: { read: false, edit: false } } },
  })
  assert.equal(can((await payload.auth({ headers })).user, 'gallery'), false)
  const req = await createLocalReq({ user: authenticated.user! }, payload)
  const refreshed = await refreshOperation({ collection: payload.collections.users, req })
  assert.ok(refreshed.refreshedToken)
  const refreshedHeaders = new Headers({ Authorization: `JWT ${refreshed.refreshedToken}` })
  assert.equal((await payload.auth({ headers: refreshedHeaders })).user?.id, staff.id)
  await logoutOperation({ collection: payload.collections.users, req })
  assert.equal((await payload.auth({ headers })).user, null)
  assert.equal((await payload.auth({ headers: refreshedHeaders })).user, null)
  await payload.db.updateOne({
    collection: 'users',
    id: staff.id,
    data: { lockUntil: new Date(Date.now() + 60_000).toISOString() },
  })
  await assert.rejects(googlePayloadSession(payload, staff.email), StaffLoginDenied)
  await payload.db.updateOne({ collection: 'users', id: staff.id, data: { lockUntil: null } })
  const fallback = await payload.login({
    collection: 'users',
    data: { email: staff.email, password },
  })
  assert.equal(fallback.user?.id, staff.id)
  const adminCookie = await googlePayloadSession(payload, admin.email)
  assert.equal(
    (await payload.auth({ headers: new Headers({ Cookie: adminCookie.split(';')[0] }) })).user
      ?.role,
    'admin',
  )
} finally {
  for (const id of ids.reverse()) await payload.delete({ collection: 'users', id })
  await payload.destroy()
}

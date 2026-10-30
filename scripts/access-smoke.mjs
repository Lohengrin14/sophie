import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
const base = 'http://127.0.0.1:3000'
let owner, member, id
async function api(path, token, method = 'GET', data) {
  return fetch(base + path, {
    method,
    headers: {
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  })
}
try {
  const login = await api('/api/users/login', null, 'POST', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
  assert.equal(login.status, 200)
  owner = (await login.json()).token
  const password = randomUUID() + randomUUID(),
    email = `qa-${randomUUID()}@localhost.test`
  const created = await api('/api/users', owner, 'POST', {
    email,
    password,
    role: 'staff',
    name: 'Temporary access QA',
    permissions: { gallery: { read: true, edit: false }, requests: { read: false, edit: false } },
  })
  assert.equal(created.status, 201)
  id = (await created.json()).doc.id
  const session = await api('/api/users/login', null, 'POST', { email, password })
  assert.equal(session.status, 200)
  member = (await session.json()).token
  assert.equal((await api('/api/artworks', member)).status, 200)
  const works = await (await api('/api/artworks?limit=1', owner)).json()
  const work = works.docs[0]
  assert.equal(
    (await api(`/api/artworks/${work.id}`, member, 'PATCH', { displaySize: 10 })).status,
    403,
  )
  for (const path of ['/api/requests', '/api/references', '/api/users', '/api/quote-rules'])
    assert.ok([401, 403].includes((await api(path, member)).status), path)
  assert.equal(
    (await api('/api/globals/studio', member, 'POST', { name: 'Forbidden' })).status,
    403,
  )
  assert.equal((await api(`/api/users/${id}`, member, 'PATCH', { role: 'admin' })).status, 403)
  assert.equal(
    (await api(`/api/users/${id}`, member, 'PATCH', { permissions: { gallery: { edit: true } } }))
      .status,
    403,
  )
  const guest = await api('/api/users', null, 'POST', {
    email: `blocked-${randomUUID()}@localhost.test`,
    password,
  })
  assert.ok([401, 403].includes(guest.status))
  console.log(
    'PASS: read-only gallery, private sections denied, writes and self-escalation denied; guest account creation denied',
  )
} finally {
  if (id) assert.equal((await api(`/api/users/${id}`, owner, 'DELETE')).status, 200)
  console.log('Removed only temporary access QA account.')
}

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
const base = 'http://127.0.0.1:3000'
const cleanup = []
let token
const headers = () => ({ Authorization: `JWT ${token}`, Origin: base })
async function api(path, method = 'GET', data) {
  return fetch(base + path, {
    method,
    headers: { ...headers(), ...(data ? { 'Content-Type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined,
  })
}
const get = async (path) => {
  const response = await api(path)
  assert.equal(response.status, 200, path)
  return response.json()
}
try {
  const login = await fetch(base + '/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  })
  assert.equal(login.status, 200)
  token = (await login.json()).token
  const adminCookie = { Cookie: `payload-token=${token}` }
  const listHTML = await (await fetch(base + '/admin?tab=gallery', { headers: adminCookie })).text()
  assert.ok(
    listHTML.includes('Добавить галерею'),
    'The gallery list always exposes creation to an administrator',
  )
  assert.ok(
    listHTML.includes('href="/admin?tab=gallery"'),
    'The gallery tab explicitly links back to the list',
  )
  const createHTML = await (
    await fetch(base + '/admin?tab=gallery&gallery=new', { headers: adminCookie })
  ).text()
  assert.ok(
    createHTML.includes('Новая галерея'),
    'The URL opens creation directly, including after reload',
  )
  assert.ok(createHTML.includes('name="description"'))
  const returnedHTML = await (
    await fetch(base + '/admin?tab=gallery', { headers: adminCookie })
  ).text()
  assert.ok(returnedHTML.includes('Добавить галерею'))
  assert.ok(
    !returnedHTML.includes('name="files"'),
    'Returning to the list must not retain the creation form',
  )
  const originals = (await get('/api/artworks?limit=1000&depth=0')).docs.map(
    ({ id, updatedAt }) => ({ id, updatedAt }),
  )
  const guide = await api('/api/quote-rules', 'POST', {
    label: 'Temporary range QA',
    subject: 'portrait',
    medium: 'oil',
    size: '40x40',
    minPrice: 10000,
    maxPrice: 20000,
    currency: 'EUR',
    minDays: 10,
    maxDays: 20,
    active: false,
    demo: true,
  })
  assert.equal(guide.status, 201)
  const guideID = (await guide.json()).doc.id
  cleanup.push(['quote-rules', guideID])
  assert.equal((await api(`/api/quote-rules/${guideID}`, 'PATCH', { minPrice: 30000 })).status, 400)
  assert.equal((await api(`/api/quote-rules/${guideID}`, 'PATCH', { maxDays: 5 })).status, 400)
  const file = await readFile('public/art/sea.png')
  const upload = new FormData()
  upload.set('_payload', JSON.stringify({ alt: 'Temporary studio admin QA image' }))
  upload.set('file', new File([file], 'studio-qa.png', { type: 'image/png' }))
  const uploaded = await fetch(base + '/api/media?locale=ru', {
    method: 'POST',
    headers: headers(),
    body: upload,
  })
  assert.equal(uploaded.status, 201, 'Multipart upload used by the new interface')
  const image = (await uploaded.json()).doc
  cleanup.push(['media', image.id])
  const media = (await get('/api/media?limit=20')).docs
  const ids = [...new Set([image.id, ...media.map((item) => item.id)])]
  assert.ok(ids.length >= 11)
  const response = await api('/api/artworks?locale=ru&depth=1', 'POST', {
    title: `QA Gallery ${randomUUID().slice(0, 8)}`,
    description: '',
    image: image.id,
    images: ids.slice(0, 10),
    width: 40,
    height: 60,
    priceRubMinor: 65050,
    priceUsdMinor: 70025,
    availability: 'available',
    medium: 'oil',
    year: 2026,
    displaySize: 3,
    sortOrder: 1,
    published: false,
  })
  const body = await response.json()
  assert.equal(response.status, 201, JSON.stringify(body))
  const work = body.doc
  cleanup.push(['artworks', work.id])
  assert.equal(work.images.length, 10)
  assert.equal((await fetch(`${base}/ru/works/${work.slug}`)).status, 404)
  let patch = await api(`/api/artworks/${work.id}?locale=ru&depth=1`, 'PATCH', {
    image: ids[9],
    images: ids.slice(0, 10),
  })
  assert.equal(patch.status, 200)
  assert.equal((await patch.json()).doc.image.id, ids[9])
  const cookieSave = await fetch(`${base}/api/artworks/${work.id}?locale=en`, {
    method: 'PATCH',
    headers: { Cookie: `payload-token=${token}`, Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceRubMinor: 65050 }),
  })
  assert.equal(cookieSave.status, 200, 'Shared fields save even when this locale has no title yet')
  assert.equal(
    (await api(`/api/artworks/${work.id}`, 'PATCH', { images: ids.slice(0, 11) })).status,
    400,
  )
  assert.equal((await get(`/api/artworks/${work.id}`)).images.length, 10)
  assert.equal((await api(`/api/artworks/${work.id}`, 'PATCH', { sortOrder: 0 })).status, 400)
  assert.equal((await api(`/api/artworks/${work.id}`, 'PATCH', { sortOrder: 51 })).status, 400)
  for (const sort of [
    'image',
    'title',
    'sortOrder,-displaySize,title,id',
    'availability',
    'priceRubMinor',
    'priceUsdMinor',
    'width',
    'slug',
  ])
    assert.equal((await api(`/api/artworks?locale=ru&limit=2&sort=${sort}`)).status, 200)
  assert.equal((await api(`/api/artworks/${work.id}`, 'PATCH', { displaySize: 11 })).status, 400)
  patch = await api(`/api/artworks/${work.id}?locale=en`, 'PATCH', { title: 'QA English gallery' })
  assert.equal(patch.status, 200, 'Title can be saved independently from optional description')
  assert.ok(
    (await get(`/api/artworks/${work.id}?locale=ru`)).title,
    'Russian title remains after English edit',
  )
  patch = await api(`/api/artworks/${work.id}?locale=ru`, 'PATCH', {
    displaySize: 10,
    published: true,
  })
  assert.equal(patch.status, 200, JSON.stringify(await patch.json()))
  for (const locale of ['ru', 'en']) {
    const page = await fetch(`${base}/${locale}/works/${work.slug}`)
    assert.equal(page.status, 200)
    const detail = await page.text()
    assert.ok(detail.includes('work-thumbnails'))
    assert.ok(detail.includes('work-lightbox'))
    assert.ok(!detail.includes('id="purchase"'))
    assert.ok(!detail.includes('class="request-form"'))
    assert.ok(
      detail.includes('aria-haspopup="dialog"'),
      'The image opens the lazily rendered fullscreen viewer',
    )
    const priceBlock = detail.match(/<div class="detail-price">([^<]*)<\/div>/)?.[1]
    assert.ok(
      priceBlock?.includes(locale === 'ru' ? '650,50' : '$700.25'),
      'The correct independently entered price is displayed',
    )
    const home = await (await fetch(`${base}/${locale}`)).text()
    const main = home.match(/<main\b[\s\S]*?<\/main>/)?.[0]
    const card = main.match(new RegExp(`<a[^>]*id="work-${work.id}"[\\s\\S]*?</a>`))?.[0]
    assert.ok(card?.includes('data-canvas-tier="10"'))
    assert.ok(main.indexOf(`id="work-${work.id}"`) < main.indexOf('layout-study-v1-01'))
  }
  for (const locale of ['ru', 'en']) {
    const contact = await (await fetch(`${base}/${locale}/contact`)).text()
    assert.ok(!contact.includes('class="request-form"'))
    const commission = await (await fetch(`${base}/${locale}/commission`)).text()
    assert.ok(commission.includes('class="request-form"'))
    assert.ok(!commission.includes('name="name"'))
  }
  const latest = await get(`/api/artworks/${work.id}`)
  assert.equal(latest.width, 40)
  assert.equal(latest.height, 60)
  assert.equal(latest.priceRubMinor, 65050)
  assert.equal(latest.priceUsdMinor, 70025)
  assert.equal(
    (await api(`/api/artworks/${work.id}`, 'PATCH', { priceRubMinor: null })).status,
    200,
  )
  const hiddenPrice = await (await fetch(`${base}/ru/works/${work.slug}`)).text()
  assert.ok(
    !hiddenPrice.includes('<div class="detail-price">'),
    'Clearing RUB hides its price without falling back to USD',
  )
  assert.equal(
    (
      await api(`/api/artworks/${work.id}`, 'PATCH', {
        workKind: 'physical',
        medium: 'watercolor',
        surface: 'paper',
        paperFormat: 'A3',
        width: 29.7,
        height: 42,
      })
    ).status,
    200,
  )
  const paperPage = await (await fetch(`${base}/ru/works/${work.slug}`)).text()
  assert.ok(paperPage.includes('Акварель'))
  assert.ok(paperPage.includes('Бумага'))
  assert.ok(paperPage.includes('A3 · 29,7 × 42 см'))
  assert.equal(
    (
      await api(`/api/artworks/${work.id}`, 'PATCH', {
        workKind: 'digital',
        width: 2400,
        height: 1600,
      })
    ).status,
    200,
  )
  const digitalPage = await (await fetch(`${base}/ru/works/${work.slug}`)).text()
  const specs = digitalPage.match(/<dl class="work-specs">([\s\S]*?)<\/dl>/)?.[1]
  assert.ok(specs?.includes('Цифровая работа'))
  assert.ok(specs?.includes('px'))
  assert.ok(!specs?.includes('см') && !specs?.includes('Холст'))
  assert.equal((await api(`/api/artworks/${work.id}`, 'PATCH', { width: 20.5 })).status, 400)
  console.log(
    'PASS: upload, ten images, cover selection, overflow rejection, independent fields, RU/EN, priority, board size, public thumbnails',
  )

  const form = new FormData()
  form.set(
    'data',
    JSON.stringify({
      kind: 'question',
      locale: 'ru',
      name: 'Studio QA',
      channel: 'email',
      contact: `studio-${randomUUID().slice(0, 8)}@example.com`,
      message: 'Temporary QA request',
      consent: true,
      idempotencyKey: randomUUID(),
    }),
  )
  form.set('references', new File([file], 'qa-reference.png', { type: 'image/png' }))
  const submitted = await fetch(base + '/api/inquiries', {
    method: 'POST',
    headers: { Origin: base },
    body: form,
  })
  const saved = await submitted.json()
  assert.equal(submitted.status, 201, JSON.stringify(saved))
  const list = await get(`/api/requests?depth=2&where[reference][equals]=${saved.reference}`)
  const request = list.docs[0]
  assert.ok(request)
  cleanup.push(['requests', request.id])
  for (const reference of request.references) {
    cleanup.push(['references', reference.id])
    assert.ok([401, 403, 404].includes((await fetch(base + reference.url)).status))
    assert.equal((await fetch(base + reference.url, { headers: headers() })).status, 200)
    assert.equal(
      (await fetch(base + reference.url, { headers: { Cookie: `payload-token=${token}` } })).status,
      200,
    )
  }
  for (const status of ['processing', 'shipped', 'cancelled']) {
    const changed = await api(`/api/requests/${request.id}?depth=2`, 'PATCH', { status })
    assert.equal(changed.status, 200)
    const doc = (await changed.json()).doc
    assert.equal(doc.status, status)
    assert.equal(doc.contact, request.contact)
    assert.equal(doc.message, request.message)
    assert.equal(doc.references.length, request.references.length)
  }
  const archived = await get('/api/requests?where[status][in]=completed,cancelled&limit=1000')
  assert.ok(archived.docs.some((item) => item.id === request.id))
  const active = await get('/api/requests?where[status][not_in]=completed,cancelled&limit=1000')
  assert.ok(!active.docs.some((item) => item.id === request.id))
  assert.ok([401, 403].includes((await fetch(base + '/api/requests')).status))
  assert.ok([401, 403].includes((await fetch(base + '/api/references')).status))
  for (const sort of ['reference', 'name', 'kind', '-createdAt', 'referenceCount', 'status'])
    assert.equal((await api(`/api/requests?limit=2&sort=${sort}`)).status, 200)
  console.log(
    'PASS: readable request data, attached private references, processing/shipped/cancelled statuses, guest access denied',
  )

  for (const route of [
    '/admin',
    '/admin?tab=artist',
    '/admin?tab=requests',
    '/admin/collections/users',
    '/admin/collections/quote-rules',
  ]) {
    const page = await fetch(base + route, { headers: { Cookie: `payload-token=${token}` } })
    assert.equal(page.status, 200, route)
    const html = await page.text()
    assert.ok(html.includes('studio-topbar'))
    assert.ok(html.includes('Галерея'))
  }
  for (const original of originals) {
    const current = await get(`/api/artworks/${original.id}`)
    assert.equal(current.updatedAt, original.updatedAt)
  }
  console.log(
    'PASS: authenticated workspace tabs, unchanged employee/quote pages, all original galleries preserved',
  )
} finally {
  // Delete only records created by this check, parents before their uploaded files.
  for (const collection of ['requests', 'artworks', 'references', 'media', 'quote-rules']) {
    for (const [kind, id] of cleanup.filter(([kind]) => kind === collection)) {
      const response = await api(`/api/${kind}/${id}`, 'DELETE')
      assert.equal(response.status, 200, `cleanup ${kind}/${id}`)
    }
  }
  console.log('Removed studio QA records and uploads.')
}

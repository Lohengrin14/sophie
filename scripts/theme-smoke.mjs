import assert from 'node:assert/strict'

// Read-only check against the running local site; no database fixtures are needed.
for (const [locale, theme, background] of [
  ['ru', 'winter', '#1b1f26'],
  ['en', 'autumn', '#f1e8dc'],
  ['ru', 'summer', '#f7f3df'],
  ['en', 'spring', '#eff3eb'],
  ['en', 'invalid', '#1b1f26'],
]) {
  const response = await fetch(`http://127.0.0.1:3000/${locale}`, {
    headers: { Cookie: `artist_theme=${theme}` },
  })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes(`data-site-theme="${theme === 'invalid' ? 'winter' : theme}"`))
  assert.ok(html.includes(`--bg:${background}`))
  assert.ok(html.includes('theme-trigger'))
  console.log(`PASS ${locale}: ${theme}`)
}

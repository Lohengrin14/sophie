import assert from 'node:assert/strict'

// Read-only check against the running local site; no database fixtures are needed.
for (const [locale, theme, background] of [
  ['ru', 'mono', '#ffffff'],
  ['en', 'paper', '#f8f5ef'],
  ['ru', 'mist', '#f5f7f9'],
  ['en', 'sage', '#f3f5f0'],
  ['ru', 'graphite', '#1b1d1f'],
  ['en', 'invalid', '#ffffff'],
]) {
  const response = await fetch(`http://127.0.0.1:3000/${locale}`, {
    headers: { Cookie: `artist_theme=${theme}` },
  })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes(`data-site-theme="${theme === 'invalid' ? 'mono' : theme}"`))
  assert.ok(html.includes(`--bg:${background}`))
  assert.ok(html.includes('theme-trigger'))
  console.log(`PASS ${locale}: ${theme}`)
}

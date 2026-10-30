import assert from 'node:assert/strict'

// Read-only check against the running local site; no database fixtures are needed.
for (const [locale, theme, background] of [
  ['ru', 'mono', '#ffffff'],
  ['en', 'paper', '#f8f5ef'],
  ['ru', 'mist', '#f5f7f9'],
  ['en', 'sage', '#f3f5f0'],
  ['ru', 'graphite', '#1b1d1f'],
  ['ru', 'cream', '#f5f1e3'],
  ['en', 'mineral', '#dcdcd7'],
  ['ru', 'blush', '#eee3e1'],
  ['en', 'olive', '#20251e'],
  ['ru', 'ink', '#1a2130'],
  ['en', 'invalid', '#1b1d1f'],
]) {
  const response = await fetch(`http://127.0.0.1:3000/${locale}`, {
    headers: { Cookie: `artist_theme=${theme}` },
  })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes(`data-site-theme="${theme === 'invalid' ? 'graphite' : theme}"`))
  assert.ok(html.includes(`--bg:${background}`))
  assert.ok(html.includes('theme-trigger'))
  console.log(`PASS ${locale}: ${theme}`)
}

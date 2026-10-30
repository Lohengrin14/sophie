import { describe, expect, it } from 'vitest'
import { resolveTheme, siteThemes, themeVariables } from '../src/lib/site-themes'

function luminance(hex: string) {
  const values = hex
    .slice(1)
    .match(/../g)!
    .map((value) => {
      const n = parseInt(value, 16) / 255
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
    })
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}
describe('public site palettes', () => {
  it('offers four seasonal preferences and safely handles invalid cookies', () => {
    expect(new Set(siteThemes.map((theme) => theme.id)).size).toBe(4)
    for (const value of [undefined, null, '', '__proto__', '<script>', 'unknown']) {
      expect(resolveTheme(value).id).toBe('winter')
    }
    for (const theme of siteThemes) expect(resolveTheme(theme.id)).toBe(theme)
    expect(resolveTheme('graphite').id).toBe('winter')
    expect(resolveTheme('paper').id).toBe('autumn')
    expect(resolveTheme('cream').id).toBe('summer')
    expect(resolveTheme('sage').id).toBe('spring')
  })
  for (const theme of siteThemes)
    it(`${theme.id}: keeps text readable on its surfaces`, () => {
      const c = theme.colors
      for (const [fg, bg] of [
        [c.ink, c.bg],
        [c.muted, c.bg],
        [c.muted, c.header],
        [c.muted, c.soft],
        [c.accent, c.soft],
        [c.onAccent, c.accent],
      ]) {
        expect(contrast(fg, bg), `${theme.id}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(themeVariables(theme).colorScheme).toBe(theme.scheme)
    })
})

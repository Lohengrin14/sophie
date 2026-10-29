import { describe, expect, it } from 'vitest'
import { artworkSlug, formatPriceInput, parsePriceInput } from '../src/lib/admin-helpers'
import { money } from '../src/lib/i18n'

describe('human-readable artwork links', () => {
  it('transliterates Russian names and removes URL punctuation', () => {
    expect(artworkSlug('Вечер у моря')).toBe('vecher-u-morya')
    expect(artworkSlug('«Тёплый свет» / 2026')).toBe('teplyy-svet-2026')
    expect(artworkSlug('Été — Summer')).toBe('ete-summer')
  })
  it('provides a valid base for an empty or unsupported title', () => {
    expect(artworkSlug('🎨')).toBe('artwork')
  })
})
describe('prices entered by an artist', () => {
  it('converts ordinary prices to integer storage without losing cents', () => {
    expect(parsePriceInput('650')).toBe(65000)
    expect(parsePriceInput('650,50')).toBe(65050)
    expect(parsePriceInput('1 250.05')).toBe(125005)
    expect(parsePriceInput('0,29')).toBe(29)
    expect(parsePriceInput('0')).toBe(0)
    expect(formatPriceInput(65050)).toBe('650.5')
    expect(money(65050, 'EUR', 'en')).toContain('650.50')
  })
  it('rejects negatives, excess decimals, non-numbers and unsafe amounts', () => {
    for (const input of ['', '-5', '65.001', '1e5', 'abc', '9999999999999999999'])
      expect(parsePriceInput(input)).toBeNull()
  })
})

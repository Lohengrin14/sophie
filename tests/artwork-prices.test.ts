import { describe, expect, it } from 'vitest'
import { artworkPrice, readArtworkPrices } from '../src/lib/artwork-prices'

describe('optional artwork prices', () => {
  it('selects independent RUB and USD amounts without currency conversion', () => {
    const work = { priceRubMinor: 35_000_00, priceUsdMinor: 400_00 }
    expect(artworkPrice(work, 'ru')).toEqual({ priceMinor: 35_000_00, currency: 'RUB' })
    expect(artworkPrice(work, 'en')).toEqual({ priceMinor: 400_00, currency: 'USD' })
  })
  it('hides absent prices without falling back to the other version or inventing zero', () => {
    expect(artworkPrice({ priceRubMinor: null, priceUsdMinor: 400_00 }, 'ru')).toBeNull()
    expect(artworkPrice({ priceRubMinor: 35_000_00 }, 'en')).toBeNull()
    expect(artworkPrice({}, 'ru')).toBeNull()
    expect(artworkPrice({ priceUsdMinor: 0 }, 'en')?.priceMinor).toBe(0)
  })
  it('clears optional prices explicitly and distinguishes blank fields from invalid input', () => {
    const data = new FormData()
    expect(readArtworkPrices(data)).toEqual({ priceRubMinor: null, priceUsdMinor: null })
    data.set('priceRub', ' 35 000,50 ')
    data.set('priceUsd', '400.25')
    expect(readArtworkPrices(data)).toEqual({ priceRubMinor: 3500050, priceUsdMinor: 40025 })
    data.set('priceRub', '   ')
    expect(readArtworkPrices(data).priceRubMinor).toBeNull()
    for (const invalid of ['abc', '-1', '10.001', 'Infinity']) {
      data.set('priceUsd', invalid)
      expect(() => readArtworkPrices(data)).toThrow()
    }
  })
})

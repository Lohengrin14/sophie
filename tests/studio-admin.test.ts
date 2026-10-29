import { describe, expect, it } from 'vitest'
import { galleryImageIDs, relationID, requestSummary } from '../src/lib/studio-admin'
import { mosaicLayout } from '../src/lib/mosaic-layout'
import { resolveBrand } from '../src/lib/brand'

describe('gallery image consistency', () => {
  it('preserves a legacy cover and accepts populated relations', () => {
    expect(galleryImageIDs(undefined, 7)).toEqual([7])
    expect(galleryImageIDs([7, { id: 8 }, 8], { id: 7 })).toEqual([7, 8])
    expect(relationID(null)).toBeNull()
    expect(galleryImageIDs(['7', { id: 8 }], '7')).toEqual([7, 8])
  })
  it('counts the cover in the ten-image limit', () => {
    const images = Array.from({ length: 10 }, (_, index) => index + 1)
    expect(galleryImageIDs(images, 1)).toHaveLength(10)
    expect(() => galleryImageIDs(images, 11)).toThrow('10')
    expect(() => galleryImageIDs([...images, 11], 1)).toThrow('10')
  })
})
describe('artist-controlled presentation', () => {
  it('uses manual board size independently of physical size', () => {
    const tiny = mosaicLayout([{ width: 30, height: 40, displaySize: 1 }], 24)[0]
    const large = mosaicLayout([{ width: 30, height: 40, displaySize: 5 }], 24)[0]
    expect(large.rows).toBeGreaterThan(tiny.rows)
    expect(large.columns).toBeGreaterThan(tiny.columns)
  })
  it('uses saved artist information before environment fallbacks', () => {
    expect(
      resolveBrand({ name: 'Имя из админки', alias: 'STUDIO', email: 'studio@example.com' }),
    ).toMatchObject({ name: 'Имя из админки', alias: 'STUDIO', email: 'studio@example.com' })
  })
  it('shows readable request details without exposing internal quote tokens', () => {
    const rows = requestSummary({
      subject: 'portrait',
      size: 'custom',
      customWidth: 40,
      customHeight: 50,
      quote: {
        minPrice: 50000,
        maxPrice: 60000,
        currency: 'EUR',
        minDays: 28,
        maxDays: 49,
        token: 'internal-token',
      },
    })
    expect(rows).toContainEqual(['Сюжет', 'Портрет'])
    expect(rows).toContainEqual(['Размер', '40 × 50 см'])
    expect(JSON.stringify(rows)).not.toContain('internal-token')
  })
})

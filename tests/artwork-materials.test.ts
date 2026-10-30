import { describe, expect, it } from 'vitest'
import {
  artworkDimensions,
  matchesPaperSize,
  normalizeArtworkMaterials,
  readArtworkMaterials,
} from '../src/lib/artwork-materials'

describe('artwork materials and dimensions', () => {
  it('preserves legacy physical artwork and does not bind paint to canvas', () => {
    expect(
      normalizeArtworkMaterials({
        medium: 'watercolor',
        surface: 'paper',
        width: 21,
        height: 29.7,
      }),
    ).toMatchObject({ medium: 'watercolor', surface: 'paper', paperFormat: null })
    expect(
      normalizeArtworkMaterials(
        { title: 'New title' },
        { medium: 'acrylic', width: 40, height: 60 },
      ),
    ).toMatchObject({ medium: 'acrylic', surface: 'canvas' })
    expect(artworkDimensions({ width: 40, height: 60 }, 'ru')).toBe('40 × 60 см')
  })
  it('supports paper formats in both orientations and clears stale formats on custom resizing', () => {
    expect(matchesPaperSize('A3', 42, 29.7)).toBe(true)
    expect(matchesPaperSize('A3', 40, 60)).toBe(false)
    const original = { surface: 'paper', paperFormat: 'A3', width: 42, height: 29.7 }
    expect(normalizeArtworkMaterials({ paperFormat: 'A5' }, original)).toMatchObject({
      width: 21,
      height: 14.8,
    })
    expect(normalizeArtworkMaterials({ width: 30 }, original).paperFormat).toBeNull()
    expect(normalizeArtworkMaterials({ surface: 'canvas' }, original).paperFormat).toBeNull()
    expect(
      normalizeArtworkMaterials({ paperFormat: 'A3', width: 40, height: 60 }, original).paperFormat,
    ).toBeNull()
    expect(() =>
      normalizeArtworkMaterials({ paperFormat: 'A4', width: 40, height: 60 }, original),
    ).toThrow()
    expect(
      artworkDimensions({ surface: 'cardboard', paperFormat: 'A3', width: 42, height: 29.7 }, 'en'),
    ).toBe('A3 · 42 × 29.7 cm')
  })
  it('represents digital artwork in pixels without a physical support or paper size', () => {
    const work = normalizeArtworkMaterials(
      { workKind: 'digital', width: 2400, height: 3600 },
      { medium: 'oil', surface: 'paper', paperFormat: 'A3' },
    )
    expect(work).toMatchObject({ medium: 'digital', surface: null, paperFormat: null })
    expect(artworkDimensions({ workKind: 'digital', width: 2400, height: 3600 }, 'en')).toBe(
      '2,400 × 3,600 px',
    )
    expect(() =>
      normalizeArtworkMaterials({ workKind: 'digital', width: 100.5, height: 200 }),
    ).toThrow()
    expect(() =>
      normalizeArtworkMaterials({ workKind: 'physical', medium: 'digital', width: 40, height: 60 }),
    ).toThrow()
  })
  it('reads independent type, medium, support and dimensions from editor forms', () => {
    const data = new FormData()
    for (const [key, value] of Object.entries({
      workKind: 'physical',
      medium: 'gouache',
      surface: 'cardboard',
      paperFormat: 'A4',
      width: '21',
      height: '29.7',
    }))
      data.set(key, value)
    expect(readArtworkMaterials(data)).toEqual({
      workKind: 'physical',
      medium: 'gouache',
      surface: 'cardboard',
      paperFormat: 'A4',
      width: 21,
      height: 29.7,
    })
    data.set('workKind', 'digital')
    expect(readArtworkMaterials(data)).toMatchObject({ surface: null, paperFormat: null })
  })
})

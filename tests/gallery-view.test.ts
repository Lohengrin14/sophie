import { describe, expect, it } from 'vitest'
import { previewRect, galleryIndex } from '../src/lib/gallery-view'
describe('gallery preview bounds', () => {
  it('enlarges by sixteen percent without moving the base slot', () => {
    const original = { left: 100, top: 150, width: 300, height: 200 }
    const result = previewRect(original, { width: 1200, height: 800 }, 90)
    expect(result.width).toBeCloseTo(348)
    expect(original.width).toBe(300)
  })
  it('keeps previews within the viewport at all four edges and below header', () => {
    for (const left of [-100, 0, 250, 1100])
      for (const top of [-100, 0, 600, 900]) {
        const rect = previewRect(
          { left, top, width: 600, height: 900 },
          { width: 390, height: 700 },
          80,
        )
        expect(rect.left).toBeGreaterThanOrEqual(8)
        expect(rect.top).toBeGreaterThanOrEqual(80)
        expect(rect.left + rect.width).toBeLessThanOrEqual(382)
        expect(rect.top + rect.height).toBeLessThanOrEqual(692)
      }
  })
  it('does not navigate beyond gallery ends', () => {
    expect(galleryIndex(0, -1, 5)).toBe(0)
    expect(galleryIndex(4, 1, 5)).toBe(4)
    expect(galleryIndex(0, 1, 1)).toBe(0)
    expect(galleryIndex(2, -1, 5)).toBe(1)
  })
})

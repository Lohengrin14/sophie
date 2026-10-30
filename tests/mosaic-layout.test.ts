import { describe, expect, it } from 'vitest'
import { mosaicLayout, type MosaicColumns } from '../src/lib/mosaic-layout'

const examples = [
  { width: 29.7, height: 42 },
  { width: 60, height: 40 },
  { width: 60, height: 90 },
  { width: 42, height: 29.7 },
  { width: 30, height: 50 },
  { width: 50, height: 30 },
  { width: 40, height: 60 },
  { width: 50, height: 75 },
  { width: 75, height: 50 },
  { width: 120, height: 120 },
]

describe('automatic gallery packing', () => {
  for (const columns of [24, 16, 12] as MosaicColumns[]) {
    it(`places 100 works without overlap on ${columns} columns and pins the first`, () => {
      const works = Array.from({ length: 100 }, (_, index) => examples[index % examples.length])
      const layout = mosaicLayout(works, columns)
      expect(layout).toHaveLength(works.length)
      expect(layout[0]).toMatchObject({ column: 1, row: 1 })
      for (let index = 1; index < layout.length; index++)
        expect((layout[index].row - 1) * columns + layout[index].column).toBeGreaterThan(
          (layout[index - 1].row - 1) * columns + layout[index - 1].column,
        )
      const occupied = new Set<string>()
      for (const tile of layout) {
        expect(tile.column).toBeGreaterThan(0)
        expect(tile.column + tile.columns - 1).toBeLessThanOrEqual(columns)
        expect(tile.rows).toBeGreaterThan(0)
        for (let row = tile.row; row < tile.row + tile.rows; row++) {
          for (let column = tile.column; column < tile.column + tile.columns; column++) {
            const key = `${row}:${column}`
            expect(occupied.has(key)).toBe(false)
            occupied.add(key)
          }
        }
      }
      expect(mosaicLayout(works, columns)).toEqual(layout)
    })
  }
  it('caps an oversized square at the maximum canvas envelope', () => {
    const portrait = mosaicLayout([{ width: 60, height: 90 }], 24)[0]
    const square = mosaicLayout([{ width: 120, height: 120 }], 24)[0]
    expect(square.rows).toBe(portrait.rows)
    expect(square.columns).toBe(square.rows)
    expect(mosaicLayout([{ width: 900, height: 900 }], 24)[0]).toEqual(square)
  })
  it('handles no works and invalid legacy dimensions', () => {
    expect(mosaicLayout([], 24)).toEqual([])
    const tiles = mosaicLayout([{ width: 0, height: NaN }], 12)
    expect(tiles[0]).toMatchObject({ column: 1, row: 1 })
    expect(Number.isFinite(tiles[0].rows)).toBe(true)
  })
})

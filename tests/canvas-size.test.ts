import { describe, expect, it } from 'vitest'
import { canvasSize, boardSize, canvasSizes } from '../src/lib/canvas-size'
import { mosaicLayout } from '../src/lib/mosaic-layout'
describe('independent board scale', () => {
  it('has ten steps from 1x to 4x', () => {
    expect(canvasSizes).toHaveLength(10)
    expect(boardSize(1).scale).toBe(1)
    expect(boardSize(10).scale).toBe(4)
  })
  it('uses dimensions only for aspect ratio', () => {
    expect(mosaicLayout([{ width: 20, height: 40 }], 24)).toEqual(
      mosaicLayout([{ width: 200, height: 400 }], 24),
    )
    expect(canvasSize(1, 2)).toEqual(canvasSize(100, 200))
  })
  it('uses a fixed fallback for legacy entries', () => {
    expect(boardSize(null).tier).toBe(4)
    expect(boardSize(50)).toEqual(boardSize())
  })
})

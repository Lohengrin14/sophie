import { describe, expect, it } from 'vitest'
import { canvasSize } from '../src/lib/canvas-size'

describe('physical canvas display tiers', () => {
  it('uses physical size and keeps a rotated canvas in the same tier', () => {
    expect(canvasSize(29.7, 42).scale).toBe(1)
    expect(canvasSize(42, 29.7)).toEqual(canvasSize(29.7, 42))
    expect(canvasSize(40, 60).scale).toBe(1.5)
    expect(canvasSize(60, 40)).toEqual(canvasSize(40, 60))
  })
  it('keeps boundary sizes in their tier and caps oversized canvases', () => {
    expect(canvasSize(30, 42).tier).toBe(1)
    expect(canvasSize(30, 42.1).tier).toBe(2)
    expect(canvasSize(50, 75).tier).toBe(4)
    expect(canvasSize(60, 90).scale).toBe(2)
    expect(canvasSize(120, 120)).toEqual(canvasSize(60, 90))
    expect(canvasSize(300, 500).scale).toBe(2)
  })
  it('falls back safely for invalid legacy dimensions', () => {
    for (const invalid of [0, -1, NaN, Infinity]) {
      expect(canvasSize(invalid, 60).scale).toBe(1)
      expect(canvasSize(60, invalid).scale).toBe(1)
    }
  })
})

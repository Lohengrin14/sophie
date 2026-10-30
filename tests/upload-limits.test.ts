import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, MAX_INQUIRY_BODY_BYTES, validReferences } from '../src/lib/upload-limits'

describe('serverless image upload limits', () => {
  const file = (size: number, type = 'image/jpeg') => ({ size, type })
  it('accepts optional references and images within the total upload budget', () => {
    expect(validReferences([])).toBe(true)
    expect(validReferences([file(MAX_IMAGE_BYTES)])).toBe(true)
    expect(validReferences([file(1_000_000), file(2_000_000), file(1_000_000)])).toBe(true)
    expect(MAX_INQUIRY_BODY_BYTES).toBeGreaterThan(MAX_IMAGE_BYTES)
    expect(MAX_INQUIRY_BODY_BYTES).toBeLessThan(4_500_000)
  })
  it('rejects excessive totals even when every individual reference is small enough', () => {
    expect(validReferences([file(2_000_001), file(2_000_000)])).toBe(false)
    expect(validReferences([file(MAX_IMAGE_BYTES + 1)])).toBe(false)
    expect(validReferences([file(1), file(1), file(1), file(1)])).toBe(false)
    expect(validReferences([file(100, 'image/svg+xml')])).toBe(false)
  })
})

// Display tiers are independent of the image's pixel resolution and selling price.
// The longest physical edge chooses a tier; anything above 90 cm stays in tier 5.
export const canvasSizes = [
  { tier: 1, scale: 1, maxEdgeCm: 42 },
  { tier: 2, scale: 1.25, maxEdgeCm: 50 },
  { tier: 3, scale: 1.5, maxEdgeCm: 60 },
  { tier: 4, scale: 1.75, maxEdgeCm: 75 },
  { tier: 5, scale: 2, maxEdgeCm: 90 },
] as const

export function canvasSize(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return canvasSizes[0]
  const longestEdge = Math.max(width, height)
  return canvasSizes.find((size) => longestEdge <= size.maxEdgeCm) ?? canvasSizes[4]
}

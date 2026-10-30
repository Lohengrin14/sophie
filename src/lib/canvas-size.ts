// Dimensions (centimeters or pixels) define aspect ratio only. Board scale is independent.
export const canvasSizes = Array.from({ length: 10 }, (_, index) => ({
  tier: index + 1,
  scale: 1 + index / 3,
}))
export function boardSize(value?: number | null) {
  return canvasSizes.find((size) => size.tier === value) ?? canvasSizes[3]
}
// Kept for callers outside the editor; physical dimensions never choose the scale.
export function canvasSize(_width?: number, _height?: number) {
  return boardSize()
}

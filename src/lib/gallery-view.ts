export type ViewRect = { left: number; top: number; width: number; height: number }
export function previewRect(
  rect: ViewRect,
  viewport: { width: number; height: number },
  topInset = 8,
): ViewRect {
  const margin = 8
  const top = Math.max(margin, Math.min(topInset, viewport.height - margin))
  const scale = Math.max(
    0,
    Math.min(
      1.16,
      (viewport.width - margin * 2) / Math.max(rect.width, 1),
      (viewport.height - top - margin) / Math.max(rect.height, 1),
    ),
  )
  const width = rect.width * scale,
    height = rect.height * scale
  return {
    width,
    height,
    left: Math.max(
      margin,
      Math.min(rect.left - (width - rect.width) / 2, viewport.width - width - margin),
    ),
    top: Math.max(
      top,
      Math.min(rect.top - (height - rect.height) / 2, viewport.height - height - margin),
    ),
  }
}
export function galleryIndex(index: number, direction: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index + direction))
}

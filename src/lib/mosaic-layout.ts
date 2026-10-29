import { canvasSize, canvasSizes } from './canvas-size'

export type MosaicColumns = 12 | 16 | 24
export type MosaicTile = {
  column: number
  row: number
  columns: number
  rows: number
}

// First-fit packing is deterministic: no Math.random(), and the first work always
// occupies the upper-left corner. CMS ordering is the input priority for packing.
export function mosaicLayout(
  works: ReadonlyArray<{ width: number; height: number; displaySize?: number | null }>,
  columns: MosaicColumns,
): MosaicTile[] {
  const occupied: number[] = []
  const maximumEdge = columns === 24 ? 12 : columns === 16 ? 10 : 12
  return works.map((work) => {
    const size =
      canvasSizes.find((size) => size.tier === work.displaySize) ??
      canvasSize(work.width, work.height)
    const width = Number.isFinite(work.width) && work.width > 0 ? work.width : 1
    const height = Number.isFinite(work.height) && work.height > 0 ? work.height : 1
    const longest = Math.max(width, height)
    const edge = Math.round((maximumEdge * size.scale) / 2)
    const tileColumns = Math.max(1, Math.round((edge * width) / longest))
    const tileRows = Math.max(1, Math.round((edge * height) / longest))

    for (let row = 0; ; row++) {
      for (let column = 0; column <= columns - tileColumns; column++) {
        const mask = ((1 << tileColumns) - 1) << column
        let fits = true
        for (let offset = 0; offset < tileRows; offset++) {
          if ((occupied[row + offset] ?? 0) & mask) {
            fits = false
            break
          }
        }
        if (!fits) continue
        for (let offset = 0; offset < tileRows; offset++)
          occupied[row + offset] = (occupied[row + offset] ?? 0) | mask
        return { column: column + 1, row: row + 1, columns: tileColumns, rows: tileRows }
      }
    }
  })
}

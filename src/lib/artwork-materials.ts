import type { Locale } from './i18n'

export const techniques = [
  { value: 'oil', ru: 'Масло', en: 'Oil' },
  { value: 'acrylic', ru: 'Акрил', en: 'Acrylic' },
  { value: 'watercolor', ru: 'Акварель', en: 'Watercolor' },
  { value: 'gouache', ru: 'Гуашь', en: 'Gouache' },
  { value: 'pastel', ru: 'Пастель', en: 'Pastel' },
  { value: 'ink', ru: 'Тушь', en: 'Ink' },
  { value: 'pencil', ru: 'Карандаш', en: 'Pencil' },
  { value: 'mixed', ru: 'Смешанная техника', en: 'Mixed media' },
  { value: 'other', ru: 'Другая техника', en: 'Other medium' },
] as const
export const surfaces = [
  { value: 'canvas', ru: 'Холст', en: 'Canvas' },
  { value: 'paper', ru: 'Бумага', en: 'Paper' },
  { value: 'cardboard', ru: 'Картон', en: 'Cardboard' },
  { value: 'wood', ru: 'Дерево', en: 'Wood' },
  { value: 'other', ru: 'Другая основа', en: 'Other support' },
] as const
export const paperSizes = [
  { format: 'A1', width: 59.4, height: 84.1 },
  { format: 'A2', width: 42, height: 59.4 },
  { format: 'A3', width: 29.7, height: 42 },
  { format: 'A4', width: 21, height: 29.7 },
  { format: 'A5', width: 14.8, height: 21 },
] as const
export const supportsPaperFormat = (surface: unknown) =>
  surface === 'paper' || surface === 'cardboard'
export const techniqueLabel = (value: string, locale: Locale) =>
  value === 'digital'
    ? locale === 'ru'
      ? 'Цифровая графика'
      : 'Digital art'
    : techniques.find((item) => item.value === value)?.[locale] || value
export const surfaceLabel = (value: string, locale: Locale) =>
  surfaces.find((item) => item.value === value)?.[locale] || value
export function matchesPaperSize(format: string, width: number, height: number) {
  const size = paperSizes.find((item) => item.format === format)
  return Boolean(
    size &&
    ((Math.abs(width - size.width) < 0.01 && Math.abs(height - size.height) < 0.01) ||
      (Math.abs(width - size.height) < 0.01 && Math.abs(height - size.width) < 0.01)),
  )
}
export function artworkDimensions(
  work: {
    workKind?: string | null
    surface?: string | null
    paperFormat?: string | null
    width: number
    height: number
  },
  locale: Locale,
) {
  const dimensions = `${new Intl.NumberFormat(locale).format(work.width)} × ${new Intl.NumberFormat(locale).format(work.height)}`
  if (work.workKind === 'digital') return `${dimensions} px`
  const format =
    supportsPaperFormat(work.surface) &&
    work.paperFormat &&
    matchesPaperSize(work.paperFormat, work.width, work.height)
      ? `${work.paperFormat} · `
      : ''
  return `${format}${dimensions} ${locale === 'ru' ? 'см' : 'cm'}`
}
export class ArtworkMaterialError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message)
  }
}
export function readArtworkMaterials(data: Pick<FormData, 'get'>) {
  const digital = data.get('workKind') === 'digital'
  return {
    workKind: digital ? ('digital' as const) : ('physical' as const),
    medium: String(data.get('medium') || 'oil'),
    surface: digital ? null : String(data.get('surface') || 'canvas'),
    paperFormat: digital ? null : String(data.get('paperFormat') || '') || null,
    width: Number(data.get('width')),
    height: Number(data.get('height')),
  }
}
export function normalizeArtworkMaterials(
  data: Record<string, unknown>,
  original: Record<string, unknown> = {},
) {
  const result = { ...data }
  const kind = data.workKind ?? original.workKind ?? 'physical'
  const medium = data.medium ?? original.medium ?? 'oil'
  const surface = data.surface ?? original.surface ?? 'canvas'
  const width = Number(data.width ?? original.width)
  const height = Number(data.height ?? original.height)
  if (kind === 'digital') {
    result.medium = 'digital'
    result.surface = null
    result.paperFormat = null
    if (![width, height].every((value) => Number.isSafeInteger(value) && value > 0))
      throw new ArtworkMaterialError(
        'width',
        'Для цифровой работы укажите ширину и высоту в целых пикселях.',
      )
    return result
  }
  if (medium === 'digital')
    throw new ArtworkMaterialError('medium', 'Для физической работы выберите краски или технику.')
  result.medium = medium
  result.surface = surface
  const format = data.paperFormat === undefined ? original.paperFormat : data.paperFormat
  if (!supportsPaperFormat(surface) || !format) result.paperFormat = null
  else {
    const preset = paperSizes.find((item) => item.format === format)
    // Payload passes merged data to update hooks, including unchanged dimensions.
    const formatChanged =
      data.paperFormat !== undefined && data.paperFormat !== original.paperFormat
    const dimensionsChanged = width !== Number(original.width) || height !== Number(original.height)
    if (
      preset &&
      formatChanged &&
      (!dimensionsChanged || !Number.isFinite(width) || !Number.isFinite(height))
    ) {
      result.width = width > height ? preset.height : preset.width
      result.height = width > height ? preset.width : preset.height
    } else if (preset && !matchesPaperSize(preset.format, width, height)) {
      if (formatChanged)
        throw new ArtworkMaterialError(
          'paperFormat',
          'Размеры не совпадают с выбранным форматом бумаги. Выберите произвольный размер.',
        )
      result.paperFormat = null
    }
  }
  return result
}

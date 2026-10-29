export const requestStatuses = [
  ['new', 'Новая'],
  ['processing', 'В обработке'],
  ['discussing', 'Обсуждаем'],
  ['accepted', 'Согласована'],
  ['shipped', 'Отправлена'],
  ['completed', 'Завершена'],
  ['cancelled', 'Отменена'],
] as const

export const canvasPresets = [
  ['29.7x42', 'A3 · 29,7 × 42 см'],
  ['42x29.7', 'A3 · 42 × 29,7 см'],
  ['20x30', '20 × 30 см'],
  ['30x40', '30 × 40 см'],
  ['40x30', '40 × 30 см'],
  ['40x40', '40 × 40 см'],
  ['40x50', '40 × 50 см'],
  ['50x40', '50 × 40 см'],
  ['40x60', '40 × 60 см'],
  ['60x40', '60 × 40 см'],
  ['50x70', '50 × 70 см'],
  ['70x50', '70 × 50 см'],
  ['60x80', '60 × 80 см'],
  ['60x90', '60 × 90 см'],
  ['90x60', '90 × 60 см'],
  ['100x100', '100 × 100 см'],
  ['120x120', '120 × 120 см'],
] as const

export function relationID(value: unknown): number | null {
  const id = value && typeof value === 'object' && 'id' in value ? value.id : value
  const number = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id
  return typeof number === 'number' && Number.isSafeInteger(number) && number > 0 ? number : null
}

export function galleryImageIDs(images: unknown, cover: unknown): number[] {
  const values = Array.isArray(images) ? images : []
  const ids = values.map(relationID).filter((id): id is number => id !== null)
  const coverID = relationID(cover)
  if (coverID !== null && !ids.includes(coverID)) ids.unshift(coverID)
  const unique = [...new Set(ids)]
  if (unique.length > 10)
    throw new Error('В галерее может быть не больше 10 изображений, включая обложку.')
  return unique
}

const words: Record<string, string> = {
  portrait: 'Портрет',
  landscape: 'Пейзаж',
  'still-life': 'Натюрморт',
  other: 'Другая идея',
  oil: 'Масло, холст',
  acrylic: 'Акрил, холст',
  unsure: 'Нужна помощь с выбором',
}
const price = (amount: unknown, currency: unknown) =>
  typeof amount === 'number' && typeof currency === 'string'
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount / 100)
    : '—'

export function requestSummary(data: Record<string, unknown> = {}): [string, string][] {
  const rows: [string, string][] = []
  if (data.title)
    rows.push(
      ['Галерея', String(data.title)],
      ['Цена при обращении', price(data.priceMinor, data.currency)],
    )
  for (const [key, label] of [
    ['subject', 'Сюжет'],
    ['medium', 'Техника'],
  ])
    if (data[key]) rows.push([label, words[String(data[key])] || String(data[key])])
  if (data.size)
    rows.push([
      'Размер',
      data.size === 'custom'
        ? `${data.customWidth} × ${data.customHeight} см`
        : `${String(data.size).replace('x', ' × ')} см`,
    ])
  const quote =
    data.quote && typeof data.quote === 'object' ? (data.quote as Record<string, unknown>) : null
  if ('quote' in data)
    rows.push([
      'Ориентир',
      quote
        ? `${price(quote.minPrice, quote.currency)} — ${price(quote.maxPrice, quote.currency)}`
        : 'Нужно уточнить лично',
    ])
  if (quote) rows.push(['Готовность', `${quote.minDays}–${quote.maxDays} дней, включая просушку`])
  return rows
}

const cyrillic: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}
export function artworkSlug(title: string) {
  return (
    Array.from(title.toLowerCase())
      .map((char) => cyrillic[char] ?? char)
      .join('')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90)
      .replace(/-$/g, '') || 'artwork'
  )
}

// The admin shows ordinary currency units; storage and the public API remain integer minor units.
export function parsePriceInput(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(minor) && minor >= 0 ? minor : null
}
export function formatPriceInput(value: number | null | undefined): string {
  return typeof value === 'number' ? String(value / 100) : ''
}
export const validStoredPrice = (value: unknown) =>
  (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
  'Введите цену не меньше нуля, максимум с двумя цифрами после запятой. Например: 650 или 650,50.'

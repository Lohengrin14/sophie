import { parsePriceInput } from './admin-helpers'

export type ArtworkPrices = { priceRubMinor?: number | null; priceUsdMinor?: number | null }

export function artworkPrice(work: ArtworkPrices, locale: 'ru' | 'en') {
  const amount = locale === 'ru' ? work.priceRubMinor : work.priceUsdMinor
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0
    ? { priceMinor: amount, currency: locale === 'ru' ? 'RUB' : 'USD' }
    : null
}

export function readArtworkPrices(data: Pick<FormData, 'get'>): Required<ArtworkPrices> {
  const read = (name: string) => {
    const input = String(data.get(name) ?? '').trim()
    if (!input) return null
    const amount = parsePriceInput(input)
    if (amount === null)
      throw new Error('Укажите цену, например 650 или 650,50, либо оставьте поле пустым.')
    return amount
  }
  return { priceRubMinor: read('priceRub'), priceUsdMinor: read('priceUsd') }
}

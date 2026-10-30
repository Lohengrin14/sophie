export const locales = ['ru', 'en'] as const
export type Locale = (typeof locales)[number]
export const isLocale = (value: string): value is Locale => locales.includes(value as Locale)
export const text = (locale: Locale, ru: string, en: string) => (locale === 'ru' ? ru : en)
export const money = (amountMinor: number, currency: string, locale: Locale) =>
  new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100)
export { techniqueLabel as mediumLabel } from './artwork-materials'
export const availabilityLabel = (status: string, locale: Locale) =>
  ({
    available: text(locale, 'Доступна', 'Available'),
    reserved: text(locale, 'В резерве', 'Reserved'),
    sold: text(locale, 'В коллекции', 'Collected'),
  })[status] ?? status

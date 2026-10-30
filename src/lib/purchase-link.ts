import type { Brand } from './brand'
import type { Locale } from './i18n'
// These links open a draft/chat; they never send a message automatically.
export function purchaseLink(brand: Brand, locale: Locale, title: string, path: string) {
  const message =
    locale === 'ru'
      ? `Здравствуйте! Хочу купить картину «${title}».\n${path}`
      : `Hello! I would like to buy “${title}”.\n${path}`
  const choices = {
    telegram: brand.telegram
      ? {
          channel: 'Telegram',
          href: (() => {
            const url = new URL(brand.telegram)
            url.searchParams.delete('profile')
            url.searchParams.set('text', message)
            return url.href
          })(),
        }
      : null,
    instagram: brand.instagram ? { channel: 'Instagram', href: brand.instagram } : null,
    email: brand.email
      ? {
          channel: 'Email',
          href: `mailto:${brand.email}?${new URLSearchParams({ subject: locale === 'ru' ? `Картина «${title}»` : `Artwork “${title}”`, body: message })}`,
        }
      : null,
  }
  const preferred = brand.purchaseChannel as keyof typeof choices
  return (
    (Object.hasOwn(choices, preferred) ? choices[preferred] : null) ||
    choices.telegram ||
    choices.instagram ||
    choices.email ||
    null
  )
}

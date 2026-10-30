export function safeSocial(value: unknown, hosts: string[]) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase())
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}
export function resolveBrand(studio: Record<string, unknown> = {}) {
  const configured = (value: unknown, fallback: string | undefined) =>
    typeof value === 'string' && value.trim() ? value.trim() : fallback?.trim() || ''
  const email = configured(studio.email, process.env.NEXT_PUBLIC_ARTIST_EMAIL)
  return {
    name: configured(studio.name, process.env.NEXT_PUBLIC_ARTIST_NAME),
    alias: configured(studio.alias, process.env.NEXT_PUBLIC_ARTIST_ALIAS),
    instagram: safeSocial(
      configured(studio.instagram, process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM_URL),
      ['instagram.com', 'www.instagram.com'],
    ),
    telegram: safeSocial(configured(studio.telegram, process.env.NEXT_PUBLIC_ARTIST_TELEGRAM_URL), [
      't.me',
      'www.t.me',
    ]),
    email:
      typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    purchaseChannel: typeof studio.purchaseChannel === 'string' ? studio.purchaseChannel : 'auto',
    seller: {
      name: configured(studio.sellerName, undefined),
      country: configured(studio.sellerCountry, undefined),
      status: configured(studio.sellerStatus, undefined),
      taxId: configured(studio.sellerTaxId, undefined),
      registration: configured(studio.sellerRegistration, undefined),
      address: configured(studio.sellerAddress, undefined),
      email: configured(studio.sellerEmail, undefined),
      phone: configured(studio.sellerPhone, undefined),
      terms: configured(studio.sellerTerms, undefined),
    },
    demo: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false',
  }
}
export type Brand = ReturnType<typeof resolveBrand>

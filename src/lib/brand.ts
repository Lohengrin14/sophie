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
  const email = process.env.NEXT_PUBLIC_ARTIST_EMAIL || studio.email
  return {
    name: process.env.NEXT_PUBLIC_ARTIST_NAME?.trim() || String(studio.name || ''),
    alias: process.env.NEXT_PUBLIC_ARTIST_ALIAS?.trim() || String(studio.alias || ''),
    instagram: safeSocial(process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM_URL || studio.instagram, [
      'instagram.com',
      'www.instagram.com',
    ]),
    telegram: safeSocial(process.env.NEXT_PUBLIC_ARTIST_TELEGRAM_URL || studio.telegram, [
      't.me',
      'www.t.me',
    ]),
    email:
      typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    demo: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false',
  }
}
export type Brand = ReturnType<typeof resolveBrand>

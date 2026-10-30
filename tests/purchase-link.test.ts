import { describe, expect, it } from 'vitest'
import { purchaseLink } from '../src/lib/purchase-link'
import { resolveBrand } from '../src/lib/brand'
const base = () => ({
  ...resolveBrand(),
  purchaseChannel: 'auto',
  telegram: 'https://t.me/artist?profile',
  instagram: 'https://www.instagram.com/artist/',
  email: 'artist@example.com',
})
describe('direct artwork purchase', () => {
  it('opens an addressed Telegram draft with the artwork URL without sending it', () => {
    const result = purchaseLink(
      base(),
      'ru',
      'Тишина & свет',
      'https://studio.example/ru/works/quiet',
    )
    const url = new URL(result!.href)
    expect(url.pathname).toBe('/artist')
    expect(url.searchParams.has('profile')).toBe(false)
    expect(url.searchParams.get('text')).toContain('Тишина & свет')
    expect(url.searchParams.get('text')).toContain('https://studio.example/ru/works/quiet')
  })
  it('respects the configured email channel and encodes subject and body', () => {
    const result = purchaseLink(
      { ...base(), purchaseChannel: 'email' },
      'en',
      'Blue & gold',
      'https://studio.example/en/works/blue',
    )
    expect(result!.href).toMatch(/^mailto:artist@example.com\?/)
    const query = new URLSearchParams(result!.href.split('?')[1])
    expect(query.get('subject')).toBe('Artwork “Blue & gold”')
    expect(query.get('body')).toContain('/en/works/blue')
  })
  it('falls back to another supplied contact', () => {
    expect(
      purchaseLink(
        { ...base(), purchaseChannel: 'telegram', telegram: undefined },
        'ru',
        'Работа',
        '/ru/works/work',
      )!.channel,
    ).toBe('Instagram')
  })
  it('does not invent a destination when contacts are absent', () => {
    expect(
      purchaseLink(
        { ...base(), telegram: undefined, instagram: undefined, email: undefined },
        'ru',
        'Работа',
        '/ru/works/work',
      ),
    ).toBeNull()
  })
  it('ignores an unknown saved preference', () => {
    expect(
      purchaseLink({ ...base(), purchaseChannel: '__proto__' }, 'ru', 'Работа', '/ru/works/work')
        ?.channel,
    ).toBe('Telegram')
  })
})

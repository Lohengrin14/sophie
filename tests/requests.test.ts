import { describe, expect, it } from 'vitest'
import { matchQuote, requestSchema, type Rule } from '../src/lib/requests'
import { safeSocial } from '../src/lib/brand'
const rule: Rule = {
  id: 1,
  active: true,
  subject: 'portrait',
  medium: 'oil',
  size: '40x40',
  minPrice: 50000,
  maxPrice: 65000,
  currency: 'EUR',
  minDays: 28,
  maxDays: 49,
  updatedAt: '2026-10-29T00:00:00Z',
}
const choices = { subject: 'portrait', medium: 'oil', size: '40x40' } as const
describe('commission estimates', () => {
  it('matches all three choices and preserves currency and revision', () => {
    expect(matchQuote([rule], choices)).toMatchObject({
      minPrice: 50000,
      currency: 'EUR',
      minDays: 28,
      token: '1:2026-10-29T00:00:00Z',
    })
  })
  it('does not extrapolate custom sizes', () =>
    expect(matchQuote([rule], { ...choices, size: 'custom' })).toBeNull())
  it('does not choose an ambiguous or inactive rule', () => {
    expect(matchQuote([rule, { ...rule, id: 2 }], choices)).toBeNull()
    expect(matchQuote([{ ...rule, active: false }], choices)).toBeNull()
  })
  it('does not display reversed price or time ranges', () => {
    expect(matchQuote([{ ...rule, maxPrice: 1 }], choices)).toBeNull()
    expect(matchQuote([{ ...rule, maxDays: 1 }], choices)).toBeNull()
  })
})
const request = {
  kind: 'question',
  locale: 'ru',
  contact: 'qa@example.com',
  channel: 'email',
  message: 'A test question',
  consent: true,
  idempotencyKey: '3a29b41d-8c26-4d08-9407-a60358e32dc2',
}
describe('public request input', () => {
  it('accepts a question with one contact', () =>
    expect(requestSchema.safeParse(request).success).toBe(true))
  it('requires consent and valid contact', () => {
    expect(requestSchema.safeParse({ ...request, consent: false }).success).toBe(false)
    expect(requestSchema.safeParse({ ...request, contact: 'not-email' }).success).toBe(false)
  })
  it('requires dimensions for a custom commission', () =>
    expect(
      requestSchema.safeParse({ ...request, kind: 'commission', ...choices, size: 'custom' })
        .success,
    ).toBe(false))
  it('rejects executable reference links and honeypot input', () => {
    expect(
      requestSchema.safeParse({ ...request, referenceLink: 'javascript:alert(1)' }).success,
    ).toBe(false)
    expect(requestSchema.safeParse({ ...request, website: 'spam' }).success).toBe(false)
  })
})
describe('public social links', () => {
  it('allows only configured HTTPS providers', () => {
    expect(safeSocial('https://t.me/artist', ['t.me'])).toBe('https://t.me/artist')
    expect(safeSocial('https://t.me.evil.test/artist', ['t.me'])).toBeUndefined()
    expect(safeSocial('javascript:alert(1)', ['t.me'])).toBeUndefined()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/(payload)/api/admin-auth/google/route'
import { GET } from '../src/app/(payload)/api/admin-auth/google/callback/route'
import { googlePayloadSession, StaffLoginDenied } from '../src/lib/google-payload-session'
import { googleFlowCookie } from '../src/lib/google-auth'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({})) }))
vi.mock('../src/lib/google-payload-session', () => ({
  googlePayloadSession: vi.fn(),
  StaffLoginDenied: class extends Error {},
}))
const origin = 'http://127.0.0.1:3001'
const start = (from = origin) =>
  POST(
    new NextRequest(origin + '/api/admin-auth/google', {
      method: 'POST',
      headers: { origin: from },
    }),
  )
const finish = (cookie?: string, query = '?code=valid-code') =>
  GET(
    new NextRequest(origin + '/api/admin-auth/google/callback' + query, {
      headers: cookie ? { Cookie: `${googleFlowCookie}=${encodeURIComponent(cookie)}` } : {},
    }),
  )
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
  vi.stubEnv('GOOGLE_AUTH_ORIGIN', origin)
  vi.mocked(googlePayloadSession).mockResolvedValue(
    'payload-token=session; Path=/; HttpOnly; SameSite=Lax',
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Google sign-in routes', () => {
  it('rejects cross-site attempts to start a sign-in session', async () => {
    const response = await start('https://attacker.example')
    expect(response.status).toBe(403)
    expect(response.cookies.get(googleFlowCookie)).toBeUndefined()
  })
  it('uses an expiring HttpOnly verifier and a fixed return URL', async () => {
    const response = await start()
    expect(response.status).toBe(303)
    const cookie = response.headers.get('set-cookie')!
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Max-Age=600')
    expect(cookie).toContain('SameSite=lax')
    const url = new URL(response.headers.get('location')!)
    expect(url.origin).toBe('https://example.supabase.co')
    expect(url.searchParams.get('redirect_to')).toMatch(
      /^http:\/\/127\.0\.0\.1:3001\/api\/admin-auth\/google\/callback/,
    )
  })
  it('denies missing verifier, cancellation and missing code without trusting callback data', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const [cookie, query] of [
      [undefined, '?code=stolen'],
      ['test', '?error=access_denied'],
      ['test', '?email=admin@example.com'],
    ] as const) {
      const response = await finish(cookie, query)
      expect(response.headers.get('location')).toBe(origin + '/admin/login?google=failed')
      expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
    }
    expect(fetch).not.toHaveBeenCalled()
    expect(googlePayloadSession).not.toHaveBeenCalled()
  })
  it.each(['staff', 'unknown', 'unverified'])(
    'checks the provider identity before issuing a Payload session (%s)',
    async (kind) => {
      const begin = await start()
      const verifier = begin.cookies.get(googleFlowCookie)!.value
      const user = {
        id: 'supabase-id',
        email: 'artist@example.com',
        email_confirmed_at: '2026-10-30',
        identities: [
          {
            provider: 'google',
            identity_data: { email: 'artist@example.com', email_verified: kind !== 'unverified' },
          },
        ],
      }
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input) =>
          String(input).includes('/token?')
            ? Response.json({
                access_token: 'checked-token',
                refresh_token: 'refresh',
                token_type: 'bearer',
                expires_in: 3600,
                user,
              })
            : Response.json(user),
        ),
      )
      if (kind === 'unknown')
        vi.mocked(googlePayloadSession).mockRejectedValueOnce(new StaffLoginDenied())
      const response = await finish(verifier)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('referrer-policy')).toBe('no-referrer')
      expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
      expect(response.headers.get('location')).toBe(
        origin + (kind === 'staff' ? '/admin' : '/admin/login?google=denied'),
      )
      if (kind === 'unverified') expect(googlePayloadSession).not.toHaveBeenCalled()
      else expect(googlePayloadSession).toHaveBeenCalledWith({}, 'artist@example.com')
      expect(response.headers.get('set-cookie')!.includes('payload-token=session')).toBe(
        kind === 'staff',
      )
    },
  )
})

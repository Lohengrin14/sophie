import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { googleAuthClient, googleAuthSettings, verifiedGoogleEmail } from '../src/lib/google-auth'

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  GOOGLE_AUTH_ORIGIN: 'http://127.0.0.1:3001',
}
const identity = {
  id: 'google-user',
  email: 'Artist@example.com',
  email_confirmed_at: '2026-10-30T12:00:00Z',
  app_metadata: { provider: 'google' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-10-30T12:00:00Z',
  identities: [
    {
      id: 'identity',
      user_id: 'google-user',
      identity_id: 'google-id',
      provider: 'google',
      identity_data: { email: 'artist@example.com', email_verified: true },
    },
  ],
} as User

afterEach(() => vi.unstubAllGlobals())

describe('Google admin identity', () => {
  it('only accepts a confirmed Google identity matching the account email', () => {
    expect(verifiedGoogleEmail(identity)).toBe('artist@example.com')
    expect(verifiedGoogleEmail(null)).toBeNull()
    expect(verifiedGoogleEmail({ ...identity, email_confirmed_at: undefined })).toBeNull()
    expect(verifiedGoogleEmail({ ...identity, identities: [] })).toBeNull()
    expect(verifiedGoogleEmail({ ...identity, email: 'other@example.com' })).toBeNull()
    expect(
      verifiedGoogleEmail({
        ...identity,
        identities: [{ ...identity.identities![0], provider: 'email' }],
      }),
    ).toBeNull()
    expect(
      verifiedGoogleEmail({
        ...identity,
        identities: [
          {
            ...identity.identities![0],
            identity_data: { email: identity.email, email_verified: false },
          },
        ],
      }),
    ).toBeNull()
  })
  it('disables unconfigured login and rejects unsafe origins or privileged keys', () => {
    expect(googleAuthSettings({})).toBeNull()
    expect(googleAuthSettings(env)?.origin).toBe(env.GOOGLE_AUTH_ORIGIN)
    for (const origin of [
      'http://example.com',
      'https://example.com/path',
      'https://user:pass@example.com',
    ])
      expect(() => googleAuthSettings({ ...env, GOOGLE_AUTH_ORIGIN: origin })).toThrow()
    expect(() =>
      googleAuthSettings({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test' }),
    ).toThrow()
    const legacy = (role: string) =>
      `eyJheader.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`
    expect(() =>
      googleAuthSettings({ ...env, SUPABASE_PUBLISHABLE_KEY: legacy('service_role') }),
    ).toThrow()
    expect(googleAuthSettings({ ...env, SUPABASE_PUBLISHABLE_KEY: legacy('anon') })).not.toBeNull()
  })
  it('binds the code exchange to the browser PKCE verifier, then verifies identity remotely', async () => {
    const settings = googleAuthSettings(env)!
    const begin = googleAuthClient(settings)
    const { data, error } = await begin.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: env.GOOGLE_AUTH_ORIGIN + '/api/admin-auth/google/callback',
        skipBrowserRedirect: true,
      },
    })
    expect(error).toBeNull()
    const url = new URL(data.url!)
    expect(url.searchParams.get('provider')).toBe('google')
    expect(url.searchParams.get('code_challenge_method')?.toLowerCase()).toBe('s256')
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
    const verifier = begin.verifier()!
    expect(verifier).toBeTruthy()
    const requests: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input, init) => {
        const url = String(input)
        requests.push(url)
        if (url.includes('/token?')) {
          const body = JSON.parse(init.body)
          expect(body.auth_code).toBe('one-time-code')
          const raw = JSON.parse(verifier).split('/')[0]
          expect(body.code_verifier).toBe(raw)
          const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
          expect(Buffer.from(hash).toString('base64url')).toBe(
            new URL(data.url!).searchParams.get('code_challenge'),
          )
          return Response.json({
            access_token: 'verified-token',
            refresh_token: 'refresh-token',
            token_type: 'bearer',
            expires_in: 3600,
            user: identity,
          })
        }
        expect(init.headers.Authorization).toBe('Bearer verified-token')
        return Response.json(identity)
      }),
    )
    const callback = googleAuthClient(settings, verifier)
    const exchanged = await callback.client.auth.exchangeCodeForSession('one-time-code')
    expect(exchanged.error).toBeNull()
    const checked = await callback.client.auth.getUser(exchanged.data.session!.access_token)
    expect(verifiedGoogleEmail(checked.data.user)).toBe('artist@example.com')
    expect(requests).toHaveLength(2)
    expect(requests[1]).toBe(env.SUPABASE_URL + '/auth/v1/user')
    // A code cannot be exchanged without this browser's verifier.
    const missing =
      await googleAuthClient(settings).client.auth.exchangeCodeForSession('one-time-code')
    expect(missing.error).not.toBeNull()
    expect(requests).toHaveLength(2)
  })
})

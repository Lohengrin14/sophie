import { createClient, type User as SupabaseUser } from '@supabase/supabase-js'

export const googleFlowCookie = 'studio-google-pkce'
export const googleCallbackPath = '/api/admin-auth/google/callback'

export function googleAuthSettings(env: Record<string, string | undefined> = process.env) {
  const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, GOOGLE_AUTH_ORIGIN: origin } = env
  if (!url || !key || !origin) return null
  const service = new URL(url)
  const site = new URL(origin)
  if (
    service.protocol !== 'https:' ||
    service.username ||
    service.password ||
    service.pathname !== '/' ||
    service.search ||
    service.hash ||
    !['http:', 'https:'].includes(site.protocol) ||
    site.username ||
    site.password ||
    site.pathname !== '/' ||
    site.search ||
    site.hash ||
    (site.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(site.hostname))
  )
    throw new Error('Invalid Google authentication URLs')
  if (key.startsWith('sb_secret_')) throw new Error('Use a Supabase publishable key')
  // Legacy service-role JWTs are not suitable for a user sign-in client either.
  if (key.startsWith('eyJ')) {
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString())
    if (claims.role !== 'anon') throw new Error('Use a Supabase anon or publishable key')
  }
  return { url: service.origin, key, origin: site.origin }
}

// Only the temporary PKCE verifier is persisted, in a short-lived HttpOnly cookie.
// Supabase access/refresh tokens never go to the browser or localStorage.
export function googleAuthClient(
  settings: NonNullable<ReturnType<typeof googleAuthSettings>>,
  verifier?: string,
) {
  const values = new Map<string, string>()
  const storageKey = 'studio-google'
  if (verifier) values.set(`${storageKey}-code-verifier`, verifier)
  const client = createClient(settings.url, settings.key, {
    auth: {
      flowType: 'pkce',
      storageKey,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value)
        },
        removeItem: (key) => {
          values.delete(key)
        },
      },
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
    },
  })
  return { client, verifier: () => values.get(`${storageKey}-code-verifier`) }
}

export function verifiedGoogleEmail(user: SupabaseUser | null): string | null {
  if (!user?.email || !user.email_confirmed_at) return null
  const email = user.email.trim().toLowerCase()
  const google = user.identities?.some(
    (identity) =>
      identity.provider === 'google' &&
      identity.identity_data?.email_verified === true &&
      identity.identity_data?.email?.trim().toLowerCase() === email,
  )
  return google ? email : null
}

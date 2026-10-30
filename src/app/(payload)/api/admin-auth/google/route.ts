import { NextRequest, NextResponse } from 'next/server'
import {
  googleAuthClient,
  googleAuthSettings,
  googleCallbackPath,
  googleFlowCookie,
} from '@/lib/google-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const settings = googleAuthSettings()
  if (!settings)
    return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 503 })
  if (req.headers.get('origin') !== settings.origin)
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    const auth = googleAuthClient(settings)
    const { data, error } = await auth.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: settings.origin + googleCallbackPath,
        skipBrowserRedirect: true,
        scopes: 'openid email profile',
        queryParams: { prompt: 'select_account' },
      },
    })
    const verifier = auth.verifier()
    if (error || !data.url || !verifier) throw new Error('Could not begin Google sign-in')
    const response = NextResponse.redirect(data.url, 303)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.cookies.set(googleFlowCookie, verifier, {
      httpOnly: true,
      secure: settings.origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/api/admin-auth/google',
      maxAge: 600,
    })
    return response
  } catch {
    return NextResponse.redirect(new URL('/admin/login?google=failed', settings.origin), 303)
  }
}

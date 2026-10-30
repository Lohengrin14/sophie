import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  googleAuthClient,
  googleAuthSettings,
  googleFlowCookie,
  verifiedGoogleEmail,
} from '@/lib/google-auth'
import { googlePayloadSession, StaffLoginDenied } from '@/lib/google-payload-session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const settings = googleAuthSettings()
  if (!settings)
    return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 503 })
  const finish = (path: string, cookie?: string) => {
    const response = NextResponse.redirect(new URL(path, settings.origin), 303)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.cookies.set(googleFlowCookie, '', {
      path: '/api/admin-auth/google',
      maxAge: 0,
      httpOnly: true,
      secure: settings.origin.startsWith('https:'),
      sameSite: 'lax',
    })
    if (cookie) response.headers.append('Set-Cookie', cookie)
    return response
  }
  const code = req.nextUrl.searchParams.get('code')
  const verifier = req.cookies.get(googleFlowCookie)?.value
  if (!code || !verifier || verifier.length > 512 || req.nextUrl.searchParams.has('error'))
    return finish('/admin/login?google=failed')
  try {
    const { client } = googleAuthClient(settings, verifier)
    const { data, error } = await client.auth.exchangeCodeForSession(code)
    if (error || !data.session) return finish('/admin/login?google=failed')
    // getUser performs a server-side check with Supabase; never trust decoded browser claims.
    const checked = await client.auth.getUser(data.session.access_token)
    if (checked.error) return finish('/admin/login?google=failed')
    const email = verifiedGoogleEmail(checked.data.user)
    if (!email) return finish('/admin/login?google=denied')
    const payload = await getPayload({ config })
    const cookie = await googlePayloadSession(payload, email)
    return finish('/admin', cookie)
  } catch (error) {
    // OAuth codes, tokens and provider responses must not appear in logs or URLs.
    return finish(`/admin/login?google=${error instanceof StaffLoginDenied ? 'denied' : 'failed'}`)
  }
}

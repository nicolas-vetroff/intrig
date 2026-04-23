import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/lib/utils/redirect'

// Callback magic link. Supporte les deux flows Supabase :
//  - PKCE (defaut de @supabase/ssr) : la query contient `?code=...`, on
//    echange via exchangeCodeForSession.
//  - OTP token_hash (legacy) : la query contient `?token_hash=...&type=...`,
//    on echange via verifyOtp.
// Dans tous les cas, on termine par un redirect vers `next` sanitise
// pour empecher les open redirects.
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const next = sanitizeNext(url.searchParams.get('next'))
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth] exchangeCodeForSession failed', error)
      return NextResponse.redirect(new URL('/connexion?error=lien-expire', request.url))
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error('[auth] verifyOtp failed', error)
      return NextResponse.redirect(new URL('/connexion?error=lien-expire', request.url))
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/connexion?error=lien-invalide', request.url))
}

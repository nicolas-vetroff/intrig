import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/lib/utils/redirect'

// Magic-link callback. Supports both Supabase flows:
//  - PKCE (@supabase/ssr default): query contains `?code=...`; we
//    exchange via exchangeCodeForSession.
//  - OTP token_hash (legacy): query contains `?token_hash=...&type=...`;
//    we exchange via verifyOtp.
// After the exchange we redirect to the sanitized `next`. If the user
// has no username yet, proxy.ts intercepts this request and redirects
// to /account/choose-username (global, non-bypassable enforcement).
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
      return NextResponse.redirect(new URL('/login?error=link-expired', request.url))
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error('[auth] verifyOtp failed', error)
      return NextResponse.redirect(new URL('/login?error=link-expired', request.url))
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/login?error=link-invalid', request.url))
}

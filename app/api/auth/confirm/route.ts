import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/lib/utils/redirect'

// GET /api/auth/confirm?token_hash=...&type=magiclink&next=/livres
// Callback magic link : echange le token contre une session + cookies puis
// redirige vers `next` (sanitise pour eviter les open redirects).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = sanitizeNext(url.searchParams.get('next'))

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/connexion?error=lien-invalide', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    console.error('[auth] verifyOtp failed', error)
    return NextResponse.redirect(new URL('/connexion?error=lien-expire', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}

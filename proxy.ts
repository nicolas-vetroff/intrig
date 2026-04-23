import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Short-circuit en dev local sans Supabase configure : evite que
  // createServerClient ne jette sur undefined et ne casse chaque requete.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    // Tout sauf les assets statiques et les images. Voir:
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

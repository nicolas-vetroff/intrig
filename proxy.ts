import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Short-circuit in local dev without Supabase configured: avoids
  // createServerClient throwing on undefined and breaking every request.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    // Everything except static assets and images. See:
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

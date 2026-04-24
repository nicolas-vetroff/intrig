import { createServerClient } from '@supabase/ssr'
import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'

// Paths where a connected-without-username user is still allowed: the
// page that lets them pick one, auth endpoints (so they can sign out or
// finalize a magic link) and /login (in case they want to switch
// accounts).
const USERNAME_GUARD_ALLOWLIST = ['/account/choose-username', '/api/auth/', '/login']

function bypassUsernameGuard(pathname: string): boolean {
  return USERNAME_GUARD_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(p))
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // IMPORTANT: do not insert any code between createServerClient and
  // getUser. getUser triggers token refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Username guard: as long as a connected user hasn't picked a username,
  // force /account/choose-username on EVERY page outside the allowlist.
  // This also blocks navigation to the landing, catalog, /account, etc.
  // — the user cannot bypass it.
  if (user && !bypassUsernameGuard(request.nextUrl.pathname)) {
    try {
      const rows = await db
        .select({ username: profiles.username })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)
      const username = rows[0]?.username ?? null
      if (!username) {
        const target = request.nextUrl.clone()
        target.pathname = '/account/choose-username'
        target.search = `?next=${encodeURIComponent(
          request.nextUrl.pathname + request.nextUrl.search,
        )}`
        return NextResponse.redirect(target)
      }
    } catch (err) {
      // DB unreachable: let the request through rather than blocking the
      // whole site. requireProfile will catch it at read time anyway.
      console.error('[proxy] username guard DB lookup failed', err)
    }
  }

  return response
}

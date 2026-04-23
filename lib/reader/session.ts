import { cookies } from 'next/headers'

// Session anonyme tant que l'auth Supabase n'est pas cablee.
// A migrer sur auth.users(id) quand le flow d'inscription sera en place.
export const SESSION_COOKIE = 'reader-session-id'
const ONE_YEAR = 60 * 60 * 24 * 365

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(SESSION_COOKIE)?.value ?? null
}

// A n'utiliser que dans une Server Action / Route Handler (peut ecrire le cookie).
export async function requireSessionId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(SESSION_COOKIE)?.value
  if (existing) return existing
  const id = crypto.randomUUID()
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR,
    path: '/',
  })
  return id
}

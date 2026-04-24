import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

// Silent read: returns null when not signed in.
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Guard to use at the top of authenticated Server Components / Server
// Actions. Redirects to /login and preserves the destination when the
// user is not signed in.
export async function requireUser(next: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }
  return user
}

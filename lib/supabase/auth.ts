import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

// Lecture silencieuse : renvoie null si pas connecte.
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Garde a utiliser en tete de Server Component / Server Action authentifies.
// Redirige vers /connexion en preservant la destination si pas connecte.
export async function requireUser(next: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(next)}`)
  }
  return user
}

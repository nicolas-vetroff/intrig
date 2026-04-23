import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { requireUser } from './auth'

// Gating admin par liste d'emails en env var. Simple, zero migration.
// Quand on ouvrira la creation de livres aux lecteurs (roadmap), on
// remplacera les `requireAdmin` des pages concernees par `requireProfile`
// sans devoir migrer la DB.
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().has(email.toLowerCase())
}

// Garde stricte : requiert auth + email dans ADMIN_EMAILS. Redirige vers
// `/livres` (route publique) si l'utilisateur est connecte mais non admin.
export async function requireAdmin(next: string): Promise<User> {
  const user = await requireUser(next)
  if (!isAdminEmail(user.email)) {
    redirect('/livres')
  }
  return user
}

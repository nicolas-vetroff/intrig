import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { requireUser } from './auth'

// Admin gating via env-var email list. Simple, zero migrations. When
// book creation opens up to readers (roadmap), we just swap `requireAdmin`
// for `requireProfile` on the relevant pages — no DB migration needed.
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

// Strict guard: requires auth + email in ADMIN_EMAILS. Redirects to
// `/books` (public route) if the user is signed in but not admin.
export async function requireAdmin(next: string): Promise<User> {
  const user = await requireUser(next)
  if (!isAdminEmail(user.email)) {
    redirect('/books')
  }
  return user
}

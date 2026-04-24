import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { getCurrentUser, requireUser } from './auth'

export type ProfileRow = typeof profiles.$inferSelect

// Silent read: returns the profile if signed in AND the row exists (it
// should, thanks to the on_auth_user_created trigger), null otherwise.
// No redirect — safe to call from a layout.
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const rows = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  return rows[0] ?? null
}

// Strict guard: requires auth + defined username. Redirects otherwise.
//  - not signed in                 -> /login?next=...
//  - signed in but no username     -> /account/choose-username?next=...
export async function requireProfile(next: string): Promise<ProfileRow> {
  await requireUser(next)
  const profile = await getCurrentProfile()
  if (!profile) {
    // Edge case: user exists in auth.users but no profiles row yet
    // (trigger not run yet or DB error). Still send them to the
    // choose-username page; the action will create the row.
    redirect(`/account/choose-username?next=${encodeURIComponent(next)}`)
  }
  if (!profile.username) {
    redirect(`/account/choose-username?next=${encodeURIComponent(next)}`)
  }
  return profile
}

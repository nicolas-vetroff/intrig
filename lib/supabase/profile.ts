import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { getCurrentUser, requireUser } from './auth'

export type ProfileRow = typeof profiles.$inferSelect

// Lecture silencieuse : renvoie le profil si connecte ET que la ligne
// existe (elle doit exister grace au trigger on_auth_user_created), null
// sinon. Pas de redirect -- utilisable depuis un layout.
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const rows = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  return rows[0] ?? null
}

// Garde stricte : requiert auth + username defini. Redirige sinon.
//  - pas connecte -> /connexion?next=...
//  - connecte mais pas de username -> /compte/choisir-pseudo?next=...
export async function requireProfile(next: string): Promise<ProfileRow> {
  await requireUser(next)
  const profile = await getCurrentProfile()
  if (!profile) {
    // Edge case : user existe dans auth.users mais pas de ligne profiles
    // (trigger pas encore applique ou erreur DB). On envoie quand meme sur
    // la page pseudo, l'action saura creer la ligne.
    redirect(`/compte/choisir-pseudo?next=${encodeURIComponent(next)}`)
  }
  if (!profile.username) {
    redirect(`/compte/choisir-pseudo?next=${encodeURIComponent(next)}`)
  }
  return profile
}

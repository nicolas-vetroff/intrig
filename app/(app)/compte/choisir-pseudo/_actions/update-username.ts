'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { requireUser } from '@/lib/supabase/auth'
import { sanitizeNext } from '@/lib/utils/redirect'
import { validateUsername } from '@/lib/utils/username'

export type UpdateUsernameResult = { status: 'error'; message: string } | { status: 'ok' } // rare : le redirect cote serveur coupe avant de returner

export async function updateUsername(
  _prevState: UpdateUsernameResult | null,
  formData: FormData,
): Promise<UpdateUsernameResult> {
  const user = await requireUser('/compte/choisir-pseudo')

  const raw = formData.get('username')
  const validation = validateUsername(typeof raw === 'string' ? raw : null)
  if (!validation.ok) {
    return { status: 'error', message: validation.message }
  }
  const username = validation.value

  // Verif unicite avant l'update : UX plus claire que de laisser remonter
  // l'erreur 23505 du constraint. La contrainte reste le verrou ultime.
  const clash = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1)
  const conflictsWithSomeoneElse = clash[0] && clash[0].id !== user.id
  if (conflictsWithSomeoneElse) {
    return { status: 'error', message: 'Ce pseudo est déjà pris.' }
  }

  // Upsert plutot que update : couvre le cas ou le trigger n'a pas encore
  // cree la ligne profiles (debut de dev, migration pas encore jouee, etc.).
  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '', username })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { username },
    })

  const next = sanitizeNext(formData.get('next') as string | null, '/livres')
  redirect(next)
}

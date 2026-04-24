'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { requireUser } from '@/lib/supabase/auth'
import { sanitizeNext } from '@/lib/utils/redirect'
import { validateUsername } from '@/lib/utils/username'

// "ok" is rarely observed in practice: the server-side redirect cuts
// off before returning to the client.
export type UpdateUsernameResult = { status: 'error'; message: string } | { status: 'ok' }

// Live UX check. Ignores the caller's own row so that editing a
// username without changing it does not flag it as "taken". Invalid
// usernames short-circuit to { available: true } so the form surfaces
// the format error instead of an availability answer.
export async function checkUsernameAvailable(
  username: string,
): Promise<{ available: boolean }> {
  const user = await requireUser('/account/choose-username')
  const validation = validateUsername(username)
  if (!validation.ok) return { available: true }

  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, validation.value))
    .limit(1)

  const clashWithOther = rows[0] && rows[0].id !== user.id
  return { available: !clashWithOther }
}

export async function updateUsername(
  _prevState: UpdateUsernameResult | null,
  formData: FormData,
): Promise<UpdateUsernameResult> {
  const user = await requireUser('/account/choose-username')

  const raw = formData.get('username')
  const validation = validateUsername(typeof raw === 'string' ? raw : null)
  if (!validation.ok) {
    return { status: 'error', message: validation.message }
  }
  const username = validation.value

  // Uniqueness check before update: clearer UX than bubbling up the
  // 23505 constraint error. The constraint stays the final lock.
  const clash = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1)
  const conflictsWithSomeoneElse = clash[0] && clash[0].id !== user.id
  if (conflictsWithSomeoneElse) {
    return { status: 'error', message: 'Ce pseudo est déjà pris.' }
  }

  // Upsert rather than update: covers the case where the trigger has
  // not yet created the profiles row (early dev, unapplied migration).
  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '', username })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { username },
    })

  const next = sanitizeNext(formData.get('next') as string | null, '/books')
  redirect(next)
}

'use server'

import { z } from 'zod'
import { db } from '@/lib/db/client'
import { waitlist } from '@/lib/db/schema'

const Schema = z.object({
  email: z.email({ message: 'Adresse email invalide.' }),
  source: z.string().max(64).optional(),
})

export type WaitlistResult = {
  success: boolean
  message: string
}

const SUCCESS: WaitlistResult = {
  success: true,
  message: 'Merci, vous êtes sur la liste. À très bientôt.',
}

export async function joinWaitlist(
  _prevState: WaitlistResult | null,
  formData: FormData,
): Promise<WaitlistResult> {
  // Honeypot : champ `website` invisible, toujours vide pour les humains.
  // Si rempli, on simule un succes silencieux pour ne pas renseigner les bots.
  const honeypot = String(formData.get('website') ?? '')
  if (honeypot.length > 0) {
    return SUCCESS
  }

  const parsed = Schema.safeParse({
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    source: formData.get('source') ? String(formData.get('source')) : undefined,
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Formulaire invalide.'
    return { success: false, message }
  }

  try {
    await db
      .insert(waitlist)
      .values({ email: parsed.data.email, source: parsed.data.source })
      .onConflictDoNothing({ target: waitlist.email })
  } catch (error) {
    console.error('[waitlist] insert failed', error)
    return {
      success: false,
      message:
        "Impossible d'enregistrer votre inscription pour le moment. Réessayez dans un instant.",
    }
  }

  return SUCCESS
}

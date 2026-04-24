'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/lib/utils/redirect'

const Schema = z.object({
  email: z.email({ message: 'Adresse email invalide.' }),
  next: z.string().optional(),
})

export type MagicLinkResult =
  | { status: 'sent'; email: string }
  | { status: 'error'; message: string }

export async function sendMagicLink(
  _prevState: MagicLinkResult | null,
  formData: FormData,
): Promise<MagicLinkResult> {
  const parsed = Schema.safeParse({
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    next: formData.get('next') ? String(formData.get('next')) : undefined,
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Formulaire invalide.',
    }
  }

  const hdrs = await headers()
  const host = hdrs.get('host')
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${proto}://${host}` : null)
  if (!origin) {
    return { status: 'error', message: 'Origine introuvable, reessayer depuis le navigateur.' }
  }

  const next = sanitizeNext(parsed.data.next)
  const emailRedirectTo = `${origin}/api/auth/confirm?next=${encodeURIComponent(next)}`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo },
  })

  if (error) {
    console.error('[auth] signInWithOtp failed', error)
    return {
      status: 'error',
      message: "Impossible d'envoyer le lien pour le moment. Reessayer plus tard.",
    }
  }

  return { status: 'sent', email: parsed.data.email }
}

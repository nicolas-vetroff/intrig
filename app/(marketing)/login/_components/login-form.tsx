'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { sendMagicLink, type MagicLinkResult } from '../_actions/magic-link'

type Props = {
  next: string
}

export function LoginForm({ next }: Props) {
  const [state, formAction, isPending] = useActionState<MagicLinkResult | null, FormData>(
    sendMagicLink,
    null,
  )
  const router = useRouter()

  useEffect(() => {
    if (state?.status === 'sent') {
      router.push(`/login/check-email?email=${encodeURIComponent(state.email)}`)
    }
  }, [state, router])

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label className="sr-only" htmlFor="login-email">
        Adresse email
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="votre@email.fr"
        disabled={isPending}
        className="border-border placeholder:text-muted focus:ring-foreground/20 flex-1 rounded-md border bg-white px-4 py-3 text-base focus:ring-2 focus:outline-none disabled:opacity-60"
      />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={isPending}
        className="bg-foreground text-background rounded-md px-5 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? 'Envoi…' : 'Envoyer le lien'}
      </button>
      {state?.status === 'error' ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-700 sm:basis-full">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { updateUsername, type UpdateUsernameResult } from '../_actions/update-username'

type Props = {
  next: string
  initialValue?: string
}

export function UsernameForm({ next, initialValue }: Props) {
  const [state, formAction, isPending] = useActionState<UpdateUsernameResult | null, FormData>(
    updateUsername,
    null,
  )

  return (
    <form action={formAction} noValidate className="flex w-full max-w-md flex-col gap-3">
      <label htmlFor="pseudo-input" className="text-muted text-xs tracking-widest uppercase">
        Pseudo
      </label>
      <input
        id="pseudo-input"
        name="username"
        type="text"
        autoComplete="username"
        required
        minLength={3}
        maxLength={32}
        defaultValue={initialValue}
        placeholder="alice"
        disabled={isPending}
        className="border-border placeholder:text-muted focus:ring-foreground/20 rounded-md border bg-white px-4 py-3 text-base focus:ring-2 focus:outline-none disabled:opacity-60"
      />
      <p className="text-muted text-xs">
        3 à 32 caractères : lettres, chiffres, tirets ou underscores.
      </p>
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={isPending}
        className="bg-foreground text-background mt-2 self-start rounded-md px-5 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? 'Enregistrement…' : 'Valider'}
      </button>
      {state?.status === 'error' ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { joinWaitlist, type WaitlistResult } from '../_actions/waitlist'

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState<
    WaitlistResult | null,
    FormData
  >(joinWaitlist, null)

  if (state?.success) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-foreground font-serif text-lg"
      >
        {state.message}
      </p>
    )
  }

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label className="sr-only" htmlFor="waitlist-email">
        Adresse email
      </label>
      <input
        id="waitlist-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="votre@email.fr"
        disabled={isPending}
        className="flex-1 rounded-md border border-border bg-white px-4 py-3 text-base placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-60"
      />
      {/* Honeypot : champ invisible que les bots remplissent. Ignore cote serveur si non vide. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input type="hidden" name="source" value="landing" />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-5 py-3 text-background font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? 'Envoi…' : 'Rejoindre'}
      </button>
      {state && !state.success ? (
        <p
          role="alert"
          aria-live="polite"
          className="sm:basis-full text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

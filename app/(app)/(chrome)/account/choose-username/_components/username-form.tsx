'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  checkUsernameAvailable,
  updateUsername,
  type UpdateUsernameResult,
} from '../_actions/update-username'
import { validateUsername } from '@/lib/utils/username'

type Props = {
  next: string
  initialValue?: string
}

type UsernameStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid'; message: string }

export function UsernameForm({ next, initialValue }: Props) {
  const [state, formAction, isPending] = useActionState<UpdateUsernameResult | null, FormData>(
    updateUsername,
    null,
  )
  const [value, setValue] = useState(initialValue ?? '')
  const [remoteResult, setRemoteResult] = useState<{
    username: string
    available: boolean
  } | null>(null)

  const normalized = value.trim().toLowerCase()
  const unchanged = !!initialValue && normalized === initialValue.toLowerCase()
  const validation = validateUsername(value)
  const syncStatus: UsernameStatus | null = (() => {
    if (unchanged || !normalized) return { kind: 'idle' }
    if (!validation.ok) return { kind: 'invalid', message: validation.message }
    return null
  })()
  const status: UsernameStatus = syncStatus
    ? syncStatus
    : remoteResult && remoteResult.username === normalized
      ? { kind: remoteResult.available ? 'available' : 'taken' }
      : { kind: 'checking' }

  useEffect(() => {
    if (syncStatus) return
    let cancelled = false
    const handle = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(normalized)
        if (cancelled) return
        setRemoteResult({ username: normalized, available })
      } catch (err) {
        if (cancelled) return
        console.error('[UsernameForm] availability check failed', err)
        setRemoteResult({ username: normalized, available: true })
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [normalized, syncStatus])

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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="alice"
        aria-describedby="username-status"
        disabled={isPending}
        className="border-border placeholder:text-muted focus:ring-foreground/20 rounded-md border bg-white px-4 py-3 text-base focus:ring-2 focus:outline-none disabled:opacity-60"
      />
      <p className="text-muted text-xs">
        3 à 32 caractères : lettres, chiffres, tirets ou underscores.
      </p>
      <UsernameStatusMessage status={status} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={isPending}
        className="bg-foreground text-background mt-2 cursor-pointer self-start rounded-md px-5 py-3 font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

function UsernameStatusMessage({ status }: { status: UsernameStatus }) {
  if (status.kind === 'idle') return null
  if (status.kind === 'checking') {
    return (
      <p id="username-status" className="text-muted text-xs">
        Vérification…
      </p>
    )
  }
  if (status.kind === 'available') {
    return (
      <p id="username-status" className="text-xs text-emerald-700">
        Pseudo disponible.
      </p>
    )
  }
  if (status.kind === 'taken') {
    return (
      <p id="username-status" role="alert" className="text-xs text-red-700">
        Ce pseudo est déjà pris.
      </p>
    )
  }
  return (
    <p id="username-status" role="alert" className="text-xs text-red-700">
      {status.message}
    </p>
  )
}

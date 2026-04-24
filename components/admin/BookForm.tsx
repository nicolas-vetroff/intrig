'use client'

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  checkSlugAvailable,
  type BookFormResult,
  type createBook,
  type updateBook,
} from '@/app/(app)/books/_actions/admin'
import type { Book } from '@/lib/reader/types'

type Action = typeof createBook | typeof updateBook

type Props = {
  action: Action
  initial?: Book | null
  // Value shown in the Author field (read-only). In create mode = the
  // connected admin's username; in edit mode = the book's original
  // author. The real value is written server-side — this field is never
  // submitted.
  authorDisplay: string
  submitLabel: string
}

type DraftMetadata = {
  slug: string
  title: string
  synopsis: string
  genre: string
  tags: string
  coverImage: string
  estimatedMinutes: string
  tier: 'free' | 'premium'
  publish: boolean
}

// Controlled list of genre options. The DB column stays free-form text,
// but we expose a closed list in the UI to avoid case/spelling drift in
// the catalog.
const GENRE_OPTIONS = [
  'Mystère',
  'Thriller',
  'Romance',
  'Science-fiction',
  'Fantasy',
  'Horreur',
  'Aventure',
  'Historique',
] as const

type SlugStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid'; message: string }

// Same rule as lib/db/books-form.ts (server validation). Duplicated here
// for instant client feedback.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_RESERVED = new Set(['create', 'edit', 'read'])

function metadataFromBook(book: Book | null | undefined): DraftMetadata {
  return {
    slug: book?.slug ?? '',
    title: book?.title ?? '',
    synopsis: book?.synopsis ?? '',
    genre: book?.genre ?? '',
    tags: book?.tags?.join(', ') ?? '',
    coverImage: book?.coverImage ?? '',
    estimatedMinutes:
      book?.estimatedMinutes !== null && book?.estimatedMinutes !== undefined
        ? String(book.estimatedMinutes)
        : '',
    tier: book?.tier ?? 'free',
    publish: book?.publishedAt !== null && book?.publishedAt !== undefined,
  }
}

export function BookForm({ action, initial, authorDisplay, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<BookFormResult | null, FormData>(
    action,
    null,
  )
  const [metadata, setMetadata] = useState<DraftMetadata>(metadataFromBook(initial))
  const [content, setContent] = useState<string>(
    initial ? JSON.stringify(initial.content, null, 2) : '',
  )
  const [importWarn, setImportWarn] = useState<string | null>(null)
  // Latest server verdict, tagged with the slug it applies to so we
  // can ignore a stale response when the input has changed since.
  const [remoteResult, setRemoteResult] = useState<{
    slug: string
    available: boolean
  } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  function patchMetadata(patch: Partial<DraftMetadata>) {
    setMetadata((m) => ({ ...m, ...patch }))
  }

  const normalizedSlug = metadata.slug.trim().toLowerCase()
  const slugIsUnchangedFromInitial = !!initial && normalizedSlug === initial.slug
  const syncSlugStatus: SlugStatus | null = (() => {
    if (slugIsUnchangedFromInitial || !normalizedSlug) return { kind: 'idle' }
    if (SLUG_RESERVED.has(normalizedSlug)) return { kind: 'invalid', message: 'Slug réservé.' }
    if (!SLUG_PATTERN.test(normalizedSlug))
      return { kind: 'invalid', message: 'Minuscules, chiffres et tirets uniquement.' }
    return null
  })()
  const slugStatus: SlugStatus = syncSlugStatus
    ? syncSlugStatus
    : remoteResult && remoteResult.slug === normalizedSlug
      ? { kind: remoteResult.available ? 'available' : 'taken' }
      : { kind: 'checking' }

  // Debounce the remote slug check: only fire when the sync validation
  // passes, and only once per input settle (350 ms). setState calls are
  // all inside the async callback, never in the effect body. Swallow
  // server errors (e.g. stale action hash during dev hot-reload) so the
  // form stays usable — the DB UNIQUE constraint is the final lock.
  useEffect(() => {
    if (syncSlugStatus) return
    let cancelled = false
    const handle = setTimeout(async () => {
      try {
        const { available } = await checkSlugAvailable(normalizedSlug, initial?.id)
        if (cancelled) return
        setRemoteResult({ slug: normalizedSlug, available })
      } catch (err) {
        if (cancelled) return
        console.error('[BookForm] slug availability check failed', err)
        setRemoteResult({ slug: normalizedSlug, available: true })
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [normalizedSlug, initial, syncSlugStatus])

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportWarn(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Record<string, unknown>

      // Case 1: file = full Book (metadata + content).
      // Case 2: file = BookContent only (startNodeId present at top).
      const isFullBook = 'content' in parsed && typeof parsed.content === 'object'
      const isBookContent = 'startNodeId' in parsed && 'nodes' in parsed

      if (isFullBook) {
        const b = parsed as Partial<Book>
        // `author` is not imported: it is derived server-side.
        patchMetadata({
          slug: typeof b.slug === 'string' ? b.slug : metadata.slug,
          title: typeof b.title === 'string' ? b.title : metadata.title,
          synopsis: typeof b.synopsis === 'string' ? b.synopsis : '',
          genre: typeof b.genre === 'string' ? b.genre : '',
          tags: Array.isArray(b.tags) ? b.tags.join(', ') : '',
          coverImage: typeof b.coverImage === 'string' ? b.coverImage : '',
          estimatedMinutes:
            typeof b.estimatedMinutes === 'number' ? String(b.estimatedMinutes) : '',
          tier: b.tier === 'premium' ? 'premium' : 'free',
          publish: Boolean(b.publishedAt),
        })
        setContent(JSON.stringify(b.content, null, 2))
      } else if (isBookContent) {
        setContent(JSON.stringify(parsed, null, 2))
        setImportWarn(
          "Fichier reconnu comme BookContent seul : les champs métadonnées n'ont pas été touchés.",
        )
      } else {
        setImportWarn('Format non reconnu : ni Book complet ni BookContent.')
      }
    } catch (err) {
      setImportWarn(`Import impossible : ${(err as Error).message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const errors = state?.status === 'error' ? state.errors : []

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {initial ? <input type="hidden" name="bookId" value={initial.id} /> : null}

      <section className="flex flex-col gap-3">
        <label htmlFor="import-json" className="text-muted text-xs tracking-widest uppercase">
          Importer un fichier JSON (pré-remplit les champs)
        </label>
        <input
          ref={fileRef}
          id="import-json"
          type="file"
          accept=".json,application/json"
          onChange={onFileSelected}
          className="text-sm"
        />
        {importWarn ? <p className="text-sm text-amber-700">{importWarn}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <SlugField
          value={metadata.slug}
          onChange={(v) => patchMetadata({ slug: v })}
          status={slugStatus}
        />
        <Field
          label="Titre"
          name="title"
          required
          value={metadata.title}
          onChange={(v) => patchMetadata({ title: v })}
        />
        <ReadOnlyField
          label="Auteur"
          value={authorDisplay}
          hint={initial ? 'Immuable (auteur d’origine).' : 'Défini automatiquement.'}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="genre-input" className="text-muted text-xs tracking-widest uppercase">
            Genre
          </label>
          <select
            id="genre-input"
            name="genre"
            value={metadata.genre}
            onChange={(e) => patchMetadata({ genre: e.target.value })}
            className="border-border rounded-md border bg-white px-4 py-3 text-base"
          >
            <option value="">— Choisir un genre —</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Cover (URL)"
          name="coverImage"
          value={metadata.coverImage}
          onChange={(v) => patchMetadata({ coverImage: v })}
          placeholder="https://…"
        />
        <Field
          label="Durée estimée (min)"
          name="estimatedMinutes"
          value={metadata.estimatedMinutes}
          onChange={(v) => patchMetadata({ estimatedMinutes: v })}
          type="number"
        />
        <Field
          label="Tags (virgule)"
          name="tags"
          value={metadata.tags}
          onChange={(v) => patchMetadata({ tags: v })}
          placeholder="thriller, court"
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="tier-input" className="text-muted text-xs tracking-widest uppercase">
            Tier
          </label>
          <select
            id="tier-input"
            name="tier"
            value={metadata.tier}
            onChange={(e) => patchMetadata({ tier: e.target.value as 'free' | 'premium' })}
            className="border-border rounded-md border bg-white px-4 py-3 text-base"
          >
            <option value="free">Gratuit</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="synopsis-input" className="text-muted text-xs tracking-widest uppercase">
          Synopsis
        </label>
        <textarea
          id="synopsis-input"
          name="synopsis"
          value={metadata.synopsis}
          onChange={(e) => patchMetadata({ synopsis: e.target.value })}
          rows={3}
          className="border-border rounded-md border bg-white px-4 py-3 text-base"
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="publish"
          checked={metadata.publish}
          onChange={(e) => patchMetadata({ publish: e.target.checked })}
        />
        Publier
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="content-input" className="text-muted text-xs tracking-widest uppercase">
          Content (BookContent JSON)
        </label>
        <textarea
          id="content-input"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          required
          className="border-border rounded-md border bg-white px-4 py-3 font-mono text-xs"
          placeholder='{ "startNodeId": "...", "variablesSchema": [...], "nodes": {...}, "endings": {...} }'
        />
      </div>

      {errors.length > 0 ? (
        <ul
          role="alert"
          className="flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-foreground text-background rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder }: FieldProps) {
  const id = `field-${name}`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-muted text-xs tracking-widest uppercase">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="border-border rounded-md border bg-white px-4 py-3 text-base"
      />
    </div>
  )
}

function SlugField({
  value,
  onChange,
  status,
}: {
  value: string
  onChange: (v: string) => void
  status: SlugStatus
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="field-slug" className="text-muted text-xs tracking-widest uppercase">
        Slug *
      </label>
      <input
        id="field-slug"
        name="slug"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder="la-chambre-secrete"
        aria-describedby="slug-status"
        className="border-border rounded-md border bg-white px-4 py-3 text-base"
      />
      <SlugStatusMessage status={status} />
    </div>
  )
}

function SlugStatusMessage({ status }: { status: SlugStatus }) {
  if (status.kind === 'idle') return null
  if (status.kind === 'checking') {
    return (
      <p id="slug-status" className="text-muted text-xs">
        Vérification…
      </p>
    )
  }
  if (status.kind === 'available') {
    return (
      <p id="slug-status" className="text-xs text-emerald-700">
        Slug disponible.
      </p>
    )
  }
  if (status.kind === 'taken') {
    return (
      <p id="slug-status" role="alert" className="text-xs text-red-700">
        Ce slug est déjà pris.
      </p>
    )
  }
  return (
    <p id="slug-status" role="alert" className="text-xs text-red-700">
      {status.message}
    </p>
  )
}

// Purely informational field: the input is disabled (so it is not
// submitted in FormData) and the real value is set server-side.
function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted text-xs tracking-widest uppercase">{label}</label>
      <input
        type="text"
        value={value}
        disabled
        className="border-border text-muted bg-subtle/60 cursor-not-allowed rounded-md border px-4 py-3 text-base"
      />
      {hint ? <p className="text-muted text-xs">{hint}</p> : null}
    </div>
  )
}

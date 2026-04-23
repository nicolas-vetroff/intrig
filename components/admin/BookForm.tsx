'use client'

import { useActionState, useRef, useState, type ChangeEvent } from 'react'
import type { BookFormResult, createBook, updateBook } from '@/app/(app)/livres/_actions/admin'
import type { Book } from '@/lib/reader/types'

type Action = typeof createBook | typeof updateBook

type Props = {
  action: Action
  initial?: Book | null
  submitLabel: string
}

type DraftMetadata = {
  slug: string
  title: string
  author: string
  synopsis: string
  genre: string
  tags: string
  coverImage: string
  estimatedMinutes: string
  tier: 'free' | 'premium'
  publish: boolean
}

function metadataFromBook(book: Book | null | undefined): DraftMetadata {
  return {
    slug: book?.slug ?? '',
    title: book?.title ?? '',
    author: book?.author ?? '',
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

export function BookForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<BookFormResult | null, FormData>(
    action,
    null,
  )
  const [metadata, setMetadata] = useState<DraftMetadata>(metadataFromBook(initial))
  const [content, setContent] = useState<string>(
    initial ? JSON.stringify(initial.content, null, 2) : '',
  )
  const [importWarn, setImportWarn] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  function patchMetadata(patch: Partial<DraftMetadata>) {
    setMetadata((m) => ({ ...m, ...patch }))
  }

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportWarn(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Record<string, unknown>

      // Cas 1 : fichier = Book complet (metadata + content).
      // Cas 2 : fichier = BookContent seul (presence de startNodeId au top).
      const isFullBook = 'content' in parsed && typeof parsed.content === 'object'
      const isBookContent = 'startNodeId' in parsed && 'nodes' in parsed

      if (isFullBook) {
        const b = parsed as Partial<Book>
        patchMetadata({
          slug: typeof b.slug === 'string' ? b.slug : metadata.slug,
          title: typeof b.title === 'string' ? b.title : metadata.title,
          author: typeof b.author === 'string' ? b.author : metadata.author,
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
        <Field
          label="Slug"
          name="slug"
          required
          value={metadata.slug}
          onChange={(v) => patchMetadata({ slug: v })}
          placeholder="la-chambre-secrete"
        />
        <Field
          label="Titre"
          name="title"
          required
          value={metadata.title}
          onChange={(v) => patchMetadata({ title: v })}
        />
        <Field
          label="Auteur"
          name="author"
          required
          value={metadata.author}
          onChange={(v) => patchMetadata({ author: v })}
        />
        <Field
          label="Genre"
          name="genre"
          value={metadata.genre}
          onChange={(v) => patchMetadata({ genre: v })}
          placeholder="mystère"
        />
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
        Publier (sinon : brouillon, publishedAt reste null)
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

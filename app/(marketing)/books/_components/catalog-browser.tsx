'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { BookSummary } from '@/lib/db/books'

type Props = {
  books: BookSummary[]
}

type DurationBucket = 'any' | 'short' | 'medium' | 'long'

// Minute thresholds for each duration bucket. Aligned with typical
// reading-length buckets (short story, short form, long form).
const DURATION_BUCKETS: Record<DurationBucket, (m: number | null) => boolean> = {
  any: () => true,
  short: (m) => m !== null && m <= 30,
  medium: (m) => m !== null && m > 30 && m <= 90,
  long: (m) => m !== null && m > 90,
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const v of values) {
    if (v) set.add(v)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
}

export function CatalogBrowser({ books }: Props) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [author, setAuthor] = useState('')
  const [tag, setTag] = useState('')
  const [duration, setDuration] = useState<DurationBucket>('any')

  const genres = useMemo(() => uniqueSorted(books.map((b) => b.genre)), [books])
  const authors = useMemo(() => uniqueSorted(books.map((b) => b.author)), [books])
  const tags = useMemo(() => uniqueSorted(books.flatMap((b) => b.tags ?? [])), [books])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return books.filter((book) => {
      if (q && !book.title.toLowerCase().includes(q)) return false
      if (genre && book.genre !== genre) return false
      if (author && book.author !== author) return false
      if (tag && !(book.tags ?? []).includes(tag)) return false
      if (!DURATION_BUCKETS[duration](book.estimatedMinutes)) return false
      return true
    })
  }, [books, query, genre, author, tag, duration])

  const activeFilters = query || genre || author || tag || duration !== 'any'

  function reset() {
    setQuery('')
    setGenre('')
    setAuthor('')
    setTag('')
    setDuration('any')
  }

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-label="Filtres du catalogue"
        className="border-border flex flex-col gap-4 rounded-md border bg-white p-4 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted text-xs tracking-widest uppercase">Titre</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par titre…"
              className="border-border rounded-md border bg-white px-3 py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted text-xs tracking-widest uppercase">Genre</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="border-border rounded-md border bg-white px-3 py-2 text-base"
            >
              <option value="">Tous les genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted text-xs tracking-widest uppercase">Auteur</span>
            <select
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="border-border rounded-md border bg-white px-3 py-2 text-base"
            >
              <option value="">Tous les auteurs</option>
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted text-xs tracking-widest uppercase">Tag</span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="border-border rounded-md border bg-white px-3 py-2 text-base"
            >
              <option value="">Tous les tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-muted text-xs tracking-widest uppercase">Durée</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationBucket)}
              className="border-border rounded-md border bg-white px-3 py-2 text-base"
            >
              <option value="any">Toutes durées</option>
              <option value="short">Court (≤ 30 min)</option>
              <option value="medium">Moyen (30–90 min)</option>
              <option value="long">Long (&gt; 90 min)</option>
            </select>
          </label>
        </div>
        {activeFilters ? (
          <button
            type="button"
            onClick={reset}
            className="text-muted hover:text-foreground self-start text-sm underline underline-offset-4 hover:no-underline"
          >
            Réinitialiser les filtres
          </button>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <p className="text-muted">Aucun livre ne correspond à ces filtres.</p>
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {filtered.map((book) => (
            <li key={book.slug} className="py-6 first:pt-0">
              <Link href={`/books/${book.slug}`} className="group block">
                <h2 className="group-hover:text-muted font-serif text-2xl transition-colors sm:text-3xl">
                  {book.title}
                </h2>
                <p className="text-muted mt-1 text-xs tracking-widest uppercase">
                  {book.author}
                  {book.estimatedMinutes ? ` · ${book.estimatedMinutes} min` : ''}
                  {book.tier === 'premium' ? ' · premium' : ''}
                </p>
                {book.synopsis ? <p className="mt-3 leading-relaxed">{book.synopsis}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

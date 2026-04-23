import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublishedSummaries } from '@/lib/db/books'

export const metadata: Metadata = {
  title: 'Catalogue',
}

export const dynamic = 'force-dynamic'

export default async function LivresPage() {
  const catalog = await listPublishedSummaries()

  if (catalog.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-10">
        <h1 className="mb-4 font-serif text-3xl sm:text-4xl">Catalogue bientôt disponible</h1>
        <p className="text-muted">
          Les premiers livres arrivent. Inscrivez-vous à la liste d&apos;attente pour être
          prévenu·e.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10 sm:py-20">
      <h1 className="mb-10 font-serif text-3xl sm:text-4xl">Catalogue</h1>
      <ul className="flex flex-col gap-6">
        {catalog.map((book) => (
          <li key={book.slug} className="border-border border-b pb-6 last:border-0">
            <Link href={`/livres/${book.slug}`} className="group block">
              <h2 className="group-hover:text-muted font-serif text-xl transition-colors sm:text-2xl">
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
    </section>
  )
}

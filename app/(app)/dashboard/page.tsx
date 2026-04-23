import type { Metadata } from 'next'
import Link from 'next/link'
import { listAllSummaries } from '@/lib/db/books'
import { requireAdmin } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await requireAdmin('/dashboard')
  const books = await listAllSummaries()

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-muted text-xs tracking-widest uppercase">Dashboard</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Catalogue complet</h1>
        </div>
        <Link
          href="/livres/create"
          className="bg-foreground text-background rounded-md px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
        >
          + Nouveau livre
        </Link>
      </header>

      {books.length === 0 ? (
        <p className="text-muted">
          Aucun livre encore.{' '}
          <Link href="/livres/create" className="underline">
            Créer le premier
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {books.map((book) => (
            <li key={book.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex flex-col gap-1">
                <Link href={`/livres/${book.slug}`} className="font-serif text-lg hover:underline">
                  {book.title}
                </Link>
                <p className="text-muted text-xs tracking-widest uppercase">
                  {book.author}
                  {book.tier === 'premium' ? ' · premium' : ' · gratuit'}
                  {book.publishedAt ? ' · publié' : ' · brouillon'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={`/livres/${book.slug}`}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  Voir
                </Link>
                <span className="text-muted">·</span>
                <Link
                  href={`/livres/${book.slug}/edit`}
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Modifier
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

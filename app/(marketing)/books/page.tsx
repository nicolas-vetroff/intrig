import type { Metadata } from 'next'
import { listPublishedSummaries } from '@/lib/db/books'
import { CatalogBrowser } from './_components/catalog-browser'

export const metadata: Metadata = {
  title: 'Catalogue',
}

export const dynamic = 'force-dynamic'

export default async function BooksPage() {
  const catalog = await listPublishedSummaries()

  if (catalog.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center sm:px-10 sm:py-20">
        <h1 className="mb-4 font-serif text-3xl sm:text-4xl">Catalogue bientôt disponible</h1>
        <p className="text-muted">Les premiers livres arrivent très prochainement.</p>
      </section>
    )
  }

  // Fixed-height viewport panel: the <section> fills the visible area
  // under the SiteHeader, the title and filters stay put, and only the
  // books column scrolls (see CatalogBrowser). 4.5rem covers the sticky
  // header (py-4 + pill buttons + border-b ≈ 4.5rem / 72px).
  return (
    <section className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-5xl flex-col px-6 sm:px-10">
      <header className="flex shrink-0 flex-col gap-2 py-8 sm:py-10">
        <p className="text-muted text-xs tracking-widest uppercase">Catalogue</p>
        <h1 className="font-serif text-3xl sm:text-4xl">
          {catalog.length === 1 ? 'Un livre disponible' : `${catalog.length} livres disponibles`}
        </h1>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pb-8 sm:pb-10">
        <CatalogBrowser books={catalog} />
      </div>
    </section>
  )
}

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
      <section className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-10">
        <h1 className="mb-4 font-serif text-3xl sm:text-4xl">Catalogue bientôt disponible</h1>
        <p className="text-muted">Les premiers livres arrivent très prochainement.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10 sm:py-20">
      <header className="mb-10 flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Catalogue</p>
        <h1 className="font-serif text-3xl sm:text-4xl">
          {catalog.length === 1 ? 'Un livre disponible' : `${catalog.length} livres disponibles`}
        </h1>
      </header>
      <CatalogBrowser books={catalog} />
    </section>
  )
}

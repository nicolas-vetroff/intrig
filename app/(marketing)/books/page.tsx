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

  // Desktop only: fix the section height so the title + filters stay
  // put and only the books column scrolls. Mobile keeps natural page
  // flow (title and filters scroll away with the rest). The underscores
  // in the arbitrary value are Tailwind's way to emit `calc(100dvh -
  // 4.5rem)` with the spaces CSS calc requires.
  return (
    <section className="mx-auto flex max-w-5xl flex-col px-6 sm:px-10">
      <header className="flex flex-col gap-2 py-8 sm:py-10 md:shrink-0 md:fixed w-full bg-[#f8f3e4] bg-background/80 backdrop-blur">
        <p className="text-muted text-xs tracking-widest uppercase">Catalogue</p>
        <h1 className="font-serif text-3xl sm:text-4xl">
          {catalog.length === 1 ? 'Un livre disponible' : `${catalog.length} livres disponibles`}
        </h1>
      </header>
      <div className="md:flex md:min-h-0 md:flex-col mt-5">
        <CatalogBrowser books={catalog} />
      </div>
    </section>
  )
}

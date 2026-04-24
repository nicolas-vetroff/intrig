import Link from 'next/link'
import { listPublishedSummaries } from '@/lib/db/books'
import { getCurrentUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const [user, catalog] = await Promise.all([getCurrentUser(), listPublishedSummaries()])

  // Catalog is ordered by publishedAt desc in listPublishedSummaries,
  // so slicing the top N keeps the most recent first.
  const featured = catalog.slice(0, 5)
  const catalogHref = user ? '/books' : '/login?next=/books'

  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-20 sm:gap-14 sm:px-10 sm:py-28">
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Des livres qui vous&nbsp;répondent.
        </h1>

        <p className="text-muted max-w-xl text-lg leading-relaxed sm:text-xl">
          <em className="font-serif italic">Intrig</em> publie des romans interactifs à
          lire en une soirée. À chaque tournant, vos choix orientent l’histoire vers l’une de ses
          fins — certaines ne se laissent pas trouver du premier coup.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={catalogHref}
            className="bg-foreground text-background rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Parcourir le catalogue
          </Link>
          {!user ? (
            <Link
              href="/login"
              className="border-border hover:border-foreground rounded-md border px-6 py-3 text-sm transition-colors"
            >
              Se connecter
            </Link>
          ) : null}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-3xl px-6 pb-24 sm:px-10">
          <p className="text-muted mb-6 text-xs tracking-widest uppercase">Dernières sorties</p>
          <ul className="divide-border flex flex-col divide-y">
            {featured.map((book) => (
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
        </section>
      ) : null}
    </div>
  )
}

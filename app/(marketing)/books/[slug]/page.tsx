import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBookBySlug } from '@/lib/db/books'
import { isAdminEmail } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) return { title: 'Livre introuvable' }
  return {
    title: book.title,
    description: book.synopsis ?? undefined,
  }
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) notFound()

  const endingsCount = Object.keys(book.content.endings).length
  const user = await getCurrentUser()
  const isAdmin = isAdminEmail(user?.email)
  const readUrl = `/books/${book.slug}/read`
  const ctaHref = user ? readUrl : `/login?next=${encodeURIComponent(readUrl)}`

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-3">
        <p className="text-muted text-xs tracking-widest uppercase">
          {book.author}
          {book.estimatedMinutes ? ` · ${book.estimatedMinutes} min` : ''}
          {book.tier === 'premium' ? ' · premium' : ''}
        </p>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{book.title}</h1>
      </header>

      {book.synopsis ? (
        <p className="font-serif text-xl leading-relaxed sm:text-2xl">{book.synopsis}</p>
      ) : null}

      <div className="border-border text-muted flex flex-wrap gap-x-6 gap-y-2 border-y py-4 text-sm">
        {book.genre ? <span>Genre : {book.genre}</span> : null}
        <span>
          {endingsCount} {endingsCount === 1 ? 'fin' : 'fins'} à découvrir
        </span>
        {book.tags && book.tags.length > 0 ? <span>{book.tags.join(' · ')}</span> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href={ctaHref}
          className="bg-foreground text-background rounded-md px-6 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90"
        >
          {user ? 'Commencer ou reprendre la lecture' : 'Se connecter pour lire'}
        </Link>
        {isAdmin ? (
          <Link
            href={`/books/${book.slug}/edit`}
            className="border-border hover:border-foreground rounded-md border px-5 py-3 text-center text-sm transition-colors"
          >
            Modifier
          </Link>
        ) : null}
      </div>
      {!user ? (
        <p className="text-muted text-sm">
          Un lien magique sera envoyé à votre email, pas de mot de passe.
        </p>
      ) : null}
    </article>
  )
}

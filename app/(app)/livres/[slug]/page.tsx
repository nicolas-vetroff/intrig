import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { loadProgress } from '@/app/(app)/livres/_actions/progress'
import { BookReader } from '@/components/reader/BookReader'
import { db } from '@/lib/db/client'
import { books } from '@/lib/db/schema'
import { createInitialState } from '@/lib/reader/runtime'
import type { Book } from '@/lib/reader/types'

// Lit la DB + cookies de progression : pas de prerender.
export const dynamic = 'force-dynamic'

async function getBook(slug: string): Promise<Book | null> {
  const rows = await db.select().from(books).where(eq(books.slug, slug)).limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    coverImage: row.coverImage,
    synopsis: row.synopsis,
    genre: row.genre,
    tags: row.tags,
    estimatedMinutes: row.estimatedMinutes,
    // `tier` est contraint par un CHECK en DB ; cast sur la base de la contrainte.
    tier: row.tier as 'free' | 'premium',
    publishedAt: row.publishedAt,
    content: row.content,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) return { title: 'Livre introuvable' }
  return {
    title: book.title,
    description: book.synopsis ?? undefined,
  }
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) notFound()

  const progress = await loadProgress(book.id)
  const initialState = progress ?? createInitialState(book.content)

  return <BookReader book={book} initialState={initialState} />
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadProgress } from '@/app/(app)/livres/_actions/progress'
import { BookReader } from '@/components/reader/BookReader'
import { getBookBySlug } from '@/lib/db/books'
import { createInitialState } from '@/lib/reader/runtime'
import { requireProfile } from '@/lib/supabase/profile'

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

export default async function LirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await requireProfile(`/livres/${slug}/lire`)

  const book = await getBookBySlug(slug)
  if (!book) notFound()

  const progress = await loadProgress(book.id)
  const initialState = progress ?? createInitialState(book.content)

  return <BookReader book={book} initialState={initialState} />
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { updateBook } from '@/app/(app)/books/_actions/admin'
import { BookForm } from '@/components/admin/BookForm'
import { getBookBySlug } from '@/lib/db/books'
import { requireAdmin } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Modifier un livre',
}

export const dynamic = 'force-dynamic'

export default async function EditBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await requireAdmin(`/books/${slug}/edit`)

  const book = await getBookBySlug(slug)
  if (!book) notFound()

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Dashboard</p>
        <h1 className="font-serif text-3xl sm:text-4xl">Modifier « {book.title} »</h1>
      </header>
      <BookForm
        action={updateBook}
        initial={book}
        authorDisplay={book.author}
        submitLabel="Enregistrer"
      />
    </section>
  )
}

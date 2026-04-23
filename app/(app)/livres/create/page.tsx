import type { Metadata } from 'next'
import { createBook } from '@/app/(app)/livres/_actions/admin'
import { BookForm } from '@/components/admin/BookForm'
import { requireAdmin } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Nouveau livre',
}

export const dynamic = 'force-dynamic'

export default async function CreateBookPage() {
  await requireAdmin('/livres/create')

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Dashboard</p>
        <h1 className="font-serif text-3xl sm:text-4xl">Nouveau livre</h1>
        <p className="text-muted leading-relaxed">
          Remplis les métadonnées et colle le JSON du graphe narratif, ou importe un fichier pour
          pré-remplir. Le contenu est validé côté serveur avant insertion.
        </p>
      </header>
      <BookForm action={createBook} submitLabel="Créer le livre" />
    </section>
  )
}

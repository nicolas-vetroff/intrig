import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catalogue',
}

export default function LivresPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 sm:px-10 text-center">
      <h1 className="font-serif text-3xl sm:text-4xl mb-4">
        Catalogue bientôt disponible
      </h1>
      <p className="text-muted">
        Les premiers livres arrivent. Inscrivez-vous à la liste d&apos;attente
        pour être prévenu·e.
      </p>
    </section>
  )
}

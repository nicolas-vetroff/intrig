import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
}

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="mb-6 font-serif text-3xl">Politique de confidentialité</h1>
      <p className="text-muted">
        {/* TODO: rediger la politique de confidentialite RGPD avant collecte
            de donnees au-dela de la liste d'attente. */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

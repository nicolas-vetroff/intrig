import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
}

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="font-serif text-3xl mb-6">Mentions légales</h1>
      <p className="text-muted">
        {/* TODO: rediger les mentions legales conformement a la LCEN avant
            ouverture des paiements. */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

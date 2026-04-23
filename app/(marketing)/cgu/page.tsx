import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales',
}

export default function CguPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="font-serif text-3xl mb-6">Conditions générales</h1>
      <p className="text-muted">
        {/* TODO: rediger CGU et CGV distinctes avant ouverture des paiements. */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

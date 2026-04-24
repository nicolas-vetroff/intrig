import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales',
}

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="mb-6 font-serif text-3xl">Conditions générales</h1>
      <p className="text-muted">
        {/* TODO: write separate CGU and CGV before opening payments. */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

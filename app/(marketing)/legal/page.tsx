import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
}

export default function LegalPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="mb-6 font-serif text-3xl">Mentions légales</h1>
      <p className="text-muted">
        {/* TODO: write the legal notice in compliance with LCEN before
            opening payments. */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
}

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="mb-6 font-serif text-3xl">Politique de confidentialité</h1>
      <p className="text-muted">
        {/* TODO: write the GDPR privacy policy before opening payments
            (email collection + reading progress via Supabase). */}
        Page en cours de rédaction.
      </p>
    </section>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vérifiez votre email',
}

export const dynamic = 'force-dynamic'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-20 sm:px-10">
      <p className="text-muted text-xs tracking-widest uppercase">Presque fini</p>
      <h1 className="font-serif text-4xl">Vérifiez votre boîte email.</h1>
      <p className="text-muted leading-relaxed">
        Un lien de connexion vient d&apos;être envoyé{email ? ` à ${email}` : ''}. Cliquez dessus
        depuis le même navigateur pour terminer la connexion.
      </p>
      <p className="text-muted text-sm">
        Pas reçu ? Vérifiez les spams ou{' '}
        <Link href="/login" className="text-foreground underline">
          renvoyez un nouveau lien
        </Link>
        .
      </p>
    </section>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/lib/utils/redirect'
import { LoginForm } from './_components/login-form'

export const metadata: Metadata = {
  title: 'Connexion',
}

// Depend de l'auth : pas de prerender statique.
export const dynamic = 'force-dynamic'

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = sanitizeNext(next)

  // Deja connecte ? On renvoie directement la destination.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(safeNext)

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-20 sm:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-muted text-xs tracking-widest uppercase">Se connecter</p>
        <h1 className="font-serif text-4xl">Un lien magique par email.</h1>
        <p className="text-muted leading-relaxed">
          Pas de mot de passe. Saisissez votre email, cliquez sur le lien que nous vous envoyons, et
          la lecture reprend.
        </p>
      </header>
      <LoginForm next={safeNext} />
    </section>
  )
}

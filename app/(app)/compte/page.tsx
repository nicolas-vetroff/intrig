import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Mon compte',
}

export const dynamic = 'force-dynamic'

export default async function ComptePage() {
  const user = await requireUser('/compte')

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-20 sm:px-10">
      <header className="flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Mon compte</p>
        <h1 className="font-serif text-4xl">Bienvenue.</h1>
      </header>

      <div className="border-border flex flex-col gap-2 rounded-md border bg-white p-6">
        <p className="text-muted text-xs tracking-widest uppercase">Email</p>
        <p className="font-medium">{user.email}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/livres"
          className="bg-foreground text-background rounded-md px-5 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90"
        >
          Parcourir les livres
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="border-border hover:border-foreground rounded-md border px-5 py-3 text-sm transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </section>
  )
}

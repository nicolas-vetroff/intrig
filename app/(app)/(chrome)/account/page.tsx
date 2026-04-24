import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/supabase/auth'
import { getCurrentProfile } from '@/lib/supabase/profile'

export const metadata: Metadata = {
  title: 'Mon compte',
}

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await requireUser('/account')
  const profile = await getCurrentProfile()
  const isAdmin = isAdminEmail(user.email)

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Mon compte</p>
        <h1 className="font-serif text-4xl">
          {profile?.username ? `Bienvenue, ${profile.username}.` : 'Bienvenue.'}
        </h1>
      </header>

      <div className="border-border flex flex-col gap-2 rounded-md border bg-white p-6">
        <p className="text-muted text-xs tracking-widest uppercase">Email</p>
        <p className="font-medium">{user.email}</p>
      </div>

      <div className="border-border flex flex-col gap-3 rounded-md border bg-white p-6">
        <p className="text-muted text-xs tracking-widest uppercase">Pseudo</p>
        <p className="font-medium">
          {profile?.username ?? <span className="text-muted italic">Non défini</span>}
        </p>
        <Link
          href="/account/choose-username?next=/account"
          className="text-sm underline underline-offset-4 hover:no-underline"
        >
          {profile?.username ? 'Changer' : 'Choisir un pseudo'}
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/books"
          className="bg-foreground text-background rounded-md px-5 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90"
        >
          Parcourir les livres
        </Link>
        {isAdmin ? (
          <Link
            href="/dashboard"
            className="border-foreground hover:bg-foreground hover:text-background rounded-md border px-5 py-3 text-center text-sm transition-colors"
          >
            Dashboard admin
          </Link>
        ) : null}
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

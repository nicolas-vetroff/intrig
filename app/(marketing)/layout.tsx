import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <>
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="text-foreground font-serif text-2xl tracking-tight transition-opacity hover:opacity-80"
        >
          Intrigue
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <Link href="/compte" className="hover:text-muted transition-colors">
              Mon compte
            </Link>
          ) : (
            <Link href="/connexion" className="hover:text-muted transition-colors">
              Connexion
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-border mt-24 border-t px-6 py-10 sm:px-10">
        <div className="text-muted mx-auto flex max-w-3xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Intrigue</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="hover:text-foreground">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-foreground">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-foreground">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}

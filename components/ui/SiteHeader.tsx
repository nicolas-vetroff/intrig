import Link from 'next/link'
import { isAdminEmail } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/supabase/auth'

// Global header, rendered as a Server Component so it can read the
// session without a flash of auth state. The reader route does NOT use
// this header (immersive reading mode; see
// app/(app)/books/[slug]/read/page.tsx, which sits outside the chrome
// subgroup).
export async function SiteHeader() {
  const user = await getCurrentUser()
  const admin = isAdminEmail(user?.email)

  return (
    <header className="border-border bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight transition-opacity hover:opacity-80 sm:text-2xl"
        >
          Intrigue
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href="/books" className="hover:text-muted transition-colors">
            Catalogue
          </Link>
          {admin ? (
            <Link href="/dashboard" className="hover:text-muted hidden transition-colors sm:inline">
              Dashboard
            </Link>
          ) : null}
          {user ? (
            <Link
              href="/account"
              className="border-border hover:border-foreground rounded-full border px-3 py-1.5 transition-colors"
            >
              Mon compte
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-foreground text-background rounded-full px-3 py-1.5 transition-opacity hover:opacity-90"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          Intrigue
        </Link>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border mt-24 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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

import { SiteFooter } from '@/components/ui/SiteFooter'
import { SiteHeader } from '@/components/ui/SiteHeader'

// Shared layout for the "classic" authenticated pages (account,
// dashboard, create/edit). The reader /books/[slug]/read deliberately
// sits outside this subgroup so it does not inherit the chrome (see
// its own page file).
export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}

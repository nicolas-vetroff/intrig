import Link from 'next/link'
import { getFeedbackMailto } from '@/lib/utils/feedback'

export function SiteFooter() {
  const feedbackHref = getFeedbackMailto()

  return (
    <footer className="border-border mt-24 border-t px-6 py-10 sm:px-10">
      <div className="text-muted mx-auto flex max-w-5xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Intrig</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {feedbackHref ? (
            <a href={feedbackHref} className="hover:text-foreground">
              Feedback
            </a>
          ) : null}
          <Link href="/legal" className="hover:text-foreground">
            Mentions légales
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            CGU
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  )
}

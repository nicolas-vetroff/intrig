import type { Metadata } from 'next'
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://intrigue.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Intrigue — Des livres qui vous répondent',
    template: '%s · Intrigue',
  },
  description:
    'Des romans interactifs à lire en une soirée. Chaque choix oriente l’histoire vers l’une de ses fins.',
  openGraph: {
    title: 'Intrigue — Des livres qui vous répondent',
    description:
      'Des romans interactifs à lire en une soirée. Chaque choix oriente l’histoire vers l’une de ses fins.',
    locale: 'fr_FR',
    type: 'website',
    siteName: 'Intrigue',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intrigue — Des livres qui vous répondent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

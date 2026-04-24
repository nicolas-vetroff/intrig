import type { Metadata } from 'next'
import { requireUser } from '@/lib/supabase/auth'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { sanitizeNext } from '@/lib/utils/redirect'
import { UsernameForm } from './_components/username-form'

export const metadata: Metadata = {
  title: 'Choisir un pseudo',
}

export const dynamic = 'force-dynamic'

export default async function ChooseUsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  // Only requireUser (not requireProfile): this very page needs to stay
  // reachable so the user can pick a username.
  await requireUser('/account/choose-username')

  const { next } = await searchParams
  const safeNext = sanitizeNext(next, '/books')
  const profile = await getCurrentProfile()

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-20 sm:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-muted text-xs tracking-widest uppercase">Dernière étape</p>
        <h1 className="font-serif text-4xl">
          {profile?.username ? 'Changer de pseudo' : 'Choisissez un pseudo'}
        </h1>
        <p className="text-muted leading-relaxed">
          C&apos;est le nom sous lequel vous apparaîtrez. Il peut être changé plus tard depuis votre
          compte.
        </p>
      </header>
      <UsernameForm next={safeNext} initialValue={profile?.username ?? undefined} />
    </section>
  )
}

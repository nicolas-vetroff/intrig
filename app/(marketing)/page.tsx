import { WaitlistForm } from './_components/waitlist-form'

export default function LandingPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 sm:gap-14 sm:px-10 sm:py-28">
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
        Des livres qui vous&nbsp;répondent.
      </h1>

      <p className="text-muted max-w-xl text-lg leading-relaxed sm:text-xl">
        Intrigue publie des romans interactifs à lire en une soirée. À chaque tournant, vos choix
        orientent l’histoire vers l’une de ses fins — certaines ne se laissent pas trouver du
        premier coup.
      </p>

      <div className="flex flex-col gap-3">
        <p className="text-muted text-sm tracking-widest uppercase">Rejoindre la liste d’attente</p>
        <WaitlistForm />
        <p className="text-muted text-xs">Pas de spam, uniquement l’annonce du lancement.</p>
      </div>
    </section>
  )
}

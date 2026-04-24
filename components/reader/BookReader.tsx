'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { saveProgress } from '@/app/(app)/books/_actions/progress'
import {
  advanceScene,
  availableChoices,
  pickChoice,
  restartPreservingEndings,
  type ReaderState,
} from '@/lib/reader/runtime'
import type { Book } from '@/lib/reader/types'

type Props = {
  book: Book
  initialState: ReaderState
}

export function BookReader({ book, initialState }: Props) {
  const [state, setState] = useState<ReaderState>(initialState)
  const [isSaving, startTransition] = useTransition()

  const node = book.content.nodes[state.currentNodeId]
  const totalEndings = Object.keys(book.content.endings).length

  function persist(next: ReaderState) {
    setState(next)
    // After every node transition (scene continue, choice, restart),
    // scroll to the top of the page so the reader always starts at the
    // beginning of the next passage.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    startTransition(async () => {
      await saveProgress(book.id, next)
    })
  }

  function handleRestart() {
    // Preserve already-discovered endings: it's a cross-playthrough
    // counter, not part of the current run's state.
    persist(restartPreservingEndings(state, book.content))
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ReaderBar
        backHref={`/books/${book.slug}`}
        title={book.title}
        reached={state.reachedEndings.length}
        total={totalEndings}
      />

      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 pt-8 pb-20 sm:px-10 sm:pt-12">
        {!node ? (
          <p className="text-muted">
            Noeud introuvable : <code>{state.currentNodeId}</code>. Livre corrompu ?
          </p>
        ) : node.type === 'scene' ? (
          <SceneView
            text={node.text}
            onNext={() => persist(advanceScene(state, book.content))}
            disabled={isSaving}
          />
        ) : node.type === 'choice' ? (
          <ChoiceView
            text={node.text}
            choices={availableChoices(node, state.variables)}
            onPick={(id) => persist(pickChoice(state, book.content, id))}
            disabled={isSaving}
          />
        ) : node.type === 'ending' ? (
          <EndingView
            ending={book.content.endings[node.endingId]}
            totalEndings={totalEndings}
            reachedEndings={state.reachedEndings.length}
            onRestart={handleRestart}
          />
        ) : null}
      </article>
    </div>
  )
}

function ReaderBar({
  backHref,
  title,
  reached,
  total,
}: {
  backHref: string
  title: string
  reached: number
  total: number
}) {
  return (
    <div className="border-border bg-background/80 sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-6">
      <Link
        href={backHref}
        aria-label="Retour à la fiche du livre"
        className="text-muted hover:text-foreground -ml-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        <span>Retour</span>
      </Link>
      <p className="text-muted max-w-[55%] truncate text-center text-xs tracking-widest uppercase sm:text-sm">
        {title}
      </p>
      <p className="text-muted text-xs tabular-nums sm:text-sm">
        {reached}/{total}
      </p>
    </div>
  )
}

function SceneView({
  text,
  onNext,
  disabled,
}: {
  text: string
  onNext: () => void
  disabled: boolean
}) {
  return (
    <section className="flex flex-col gap-10">
      <p className="font-serif text-xl leading-[1.7] sm:text-2xl sm:leading-[1.65]">{text}</p>
      <div>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="bg-foreground text-background rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Continuer
        </button>
      </div>
    </section>
  )
}

function ChoiceView({
  text,
  choices,
  onPick,
  disabled,
}: {
  text: string
  choices: ReturnType<typeof availableChoices>
  onPick: (id: string) => void
  disabled: boolean
}) {
  return (
    <section className="flex flex-col gap-10">
      <p className="font-serif text-xl leading-[1.7] sm:text-2xl sm:leading-[1.65]">{text}</p>
      {choices.length === 0 ? (
        <p className="text-muted text-sm">
          Aucun choix disponible — chemin sans issue. (Reportez un bug au moteur.)
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {choices.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => onPick(choice.id)}
                disabled={disabled}
                className="border-border hover:border-foreground hover:bg-subtle/40 w-full rounded-md border bg-white px-5 py-4 text-left text-base transition-colors disabled:opacity-60"
              >
                {choice.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EndingView({
  ending,
  totalEndings,
  reachedEndings,
  onRestart,
}: {
  ending: { title: string; text: string; type: string } | undefined
  totalEndings: number
  reachedEndings: number
  onRestart: () => void
}) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-muted text-xs tracking-widest uppercase">Fin</p>
        <h2 className="font-serif text-3xl">{ending?.title ?? 'Fin'}</h2>
      </div>
      <p className="font-serif text-xl leading-[1.7] sm:text-2xl sm:leading-[1.65]">
        {ending?.text ?? '…'}
      </p>
      <p className="text-muted text-sm">
        {reachedEndings} / {totalEndings} fins découvertes.
      </p>
      <div>
        <button
          type="button"
          onClick={onRestart}
          className="border-border hover:border-foreground rounded-md border px-5 py-3 text-sm transition-colors"
        >
          Recommencer
        </button>
      </div>
    </section>
  )
}

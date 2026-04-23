'use client'

import { useState, useTransition } from 'react'
import { saveProgress } from '@/app/(app)/livres/_actions/progress'
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
  if (!node) {
    return (
      <p className="text-muted">
        Noeud introuvable : <code>{state.currentNodeId}</code>. Livre corrompu ?
      </p>
    )
  }

  function persist(next: ReaderState) {
    setState(next)
    startTransition(async () => {
      await saveProgress(book.id, next)
    })
  }

  function handleRestart() {
    // Conserve les fins deja decouvertes : c'est un compteur
    // inter-parties, pas un etat de la partie courante.
    persist(restartPreservingEndings(state, book.content))
  }

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16 sm:px-10 sm:py-20">
      <header>
        <p className="text-muted text-xs tracking-widest uppercase">{book.author}</p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{book.title}</h1>
      </header>

      {node.type === 'scene' ? (
        <SceneView
          text={node.text}
          onNext={() => persist(advanceScene(state, book.content))}
          disabled={isSaving}
        />
      ) : null}

      {node.type === 'choice' ? (
        <ChoiceView
          text={node.text}
          choices={availableChoices(node, state.variables)}
          onPick={(id) => persist(pickChoice(state, book.content, id))}
          disabled={isSaving}
        />
      ) : null}

      {node.type === 'ending' ? (
        <EndingView
          ending={book.content.endings[node.endingId]}
          totalEndings={Object.keys(book.content.endings).length}
          reachedEndings={state.reachedEndings.length}
          onRestart={handleRestart}
        />
      ) : null}
    </article>
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
    <section className="flex flex-col gap-8">
      <p className="font-serif text-xl leading-relaxed sm:text-2xl">{text}</p>
      <div>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="bg-foreground text-background rounded-md px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
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
    <section className="flex flex-col gap-8">
      <p className="font-serif text-xl leading-relaxed sm:text-2xl">{text}</p>
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
                className="border-border hover:border-foreground w-full rounded-md border bg-white px-5 py-4 text-left text-base transition-colors disabled:opacity-60"
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
      <p className="font-serif text-lg leading-relaxed sm:text-xl">{ending?.text ?? '…'}</p>
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

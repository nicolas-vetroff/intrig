import { describe, expect, it } from 'vitest'
import type { BookContent } from './types'
import {
  applyEffects,
  availableChoices,
  checkAllConditions,
  createInitialState,
  pickChoice,
  restartPreservingEndings,
} from './runtime'

const fixture: BookContent = {
  startNodeId: 'start',
  variablesSchema: [
    { name: 'courage', type: 'number', initial: 0 },
    { name: 'aClef', type: 'boolean', initial: false },
  ],
  nodes: {
    start: {
      id: 'start',
      type: 'choice',
      text: 'Prendre ou non la clef ?',
      choices: [
        {
          id: 'c1',
          label: 'Prendre la clef',
          nextNode: 'porte',
          effects: [
            { variable: 'aClef', op: 'set', value: true },
            { variable: 'courage', op: 'add', value: 1 },
          ],
        },
        {
          id: 'c2',
          label: 'Ignorer la clef',
          nextNode: 'porte',
        },
      ],
    },
    porte: {
      id: 'porte',
      type: 'choice',
      text: 'Devant la porte close.',
      choices: [
        {
          id: 'ouvrir',
          label: 'Ouvrir',
          nextNode: 'end-good',
          conditions: [{ variable: 'aClef', op: '==', value: true }],
        },
        {
          id: 'partir',
          label: 'Partir',
          nextNode: 'end-neutral',
        },
      ],
    },
    'end-good': { id: 'end-good', type: 'ending', endingId: 'e-success' },
    'end-neutral': { id: 'end-neutral', type: 'ending', endingId: 'e-abandon' },
  },
  endings: {
    'e-success': { id: 'e-success', type: 'good', title: 'Succès', text: '...' },
    'e-abandon': { id: 'e-abandon', type: 'neutral', title: 'Abandon', text: '...' },
  },
}

describe('createInitialState', () => {
  it('initialise les variables depuis le schema', () => {
    const s = createInitialState(fixture)
    expect(s.currentNodeId).toBe('start')
    expect(s.variables).toEqual({ courage: 0, aClef: false })
    expect(s.history).toEqual(['start'])
    expect(s.reachedEndings).toEqual([])
  })
})

describe('applyEffects', () => {
  it('gere set sur booleen', () => {
    const vars = applyEffects([{ variable: 'aClef', op: 'set', value: true }], {
      aClef: false,
    })
    expect(vars.aClef).toBe(true)
  })

  it('gere add sur nombre', () => {
    const vars = applyEffects([{ variable: 'courage', op: 'add', value: 2 }], {
      courage: 3,
    })
    expect(vars.courage).toBe(5)
  })

  it('gere sub sur nombre', () => {
    const vars = applyEffects([{ variable: 'courage', op: 'sub', value: 2 }], {
      courage: 5,
    })
    expect(vars.courage).toBe(3)
  })

  it("combine plusieurs effets dans l'ordre", () => {
    const vars = applyEffects(
      [
        { variable: 'courage', op: 'add', value: 1 },
        { variable: 'courage', op: 'add', value: 2 },
      ],
      { courage: 0 },
    )
    expect(vars.courage).toBe(3)
  })

  it("ne mute pas l'objet source", () => {
    const source = { courage: 0 }
    applyEffects([{ variable: 'courage', op: 'add', value: 1 }], source)
    expect(source.courage).toBe(0)
  })

  it("renvoie la reference d'origine sans effets", () => {
    const source = { courage: 0 }
    expect(applyEffects(undefined, source)).toBe(source)
    expect(applyEffects([], source)).toBe(source)
  })
})

describe('checkAllConditions', () => {
  it("est vrai quand il n'y a pas de conditions", () => {
    expect(checkAllConditions(undefined, {})).toBe(true)
    expect(checkAllConditions([], {})).toBe(true)
  })

  it('combine les conditions en AND', () => {
    expect(
      checkAllConditions(
        [
          { variable: 'courage', op: '>=', value: 1 },
          { variable: 'aClef', op: '==', value: true },
        ],
        { courage: 1, aClef: true },
      ),
    ).toBe(true)

    expect(
      checkAllConditions(
        [
          { variable: 'courage', op: '>=', value: 1 },
          { variable: 'aClef', op: '==', value: true },
        ],
        { courage: 1, aClef: false },
      ),
    ).toBe(false)
  })

  it('refuse les comparaisons ordinales entre types incompatibles', () => {
    expect(checkAllConditions([{ variable: 'aClef', op: '>', value: true }], { aClef: true })).toBe(
      false,
    )
  })

  it('est faux si la variable est inconnue', () => {
    expect(checkAllConditions([{ variable: 'fantome', op: '==', value: 1 }], {})).toBe(false)
  })
})

describe('availableChoices', () => {
  it('filtre les choix dont les conditions echouent', () => {
    const porte = fixture.nodes.porte
    if (!porte || porte.type !== 'choice') throw new Error('fixture cassee')

    const ids = (vars: Record<string, unknown>) =>
      availableChoices(porte, vars as never).map((c) => c.id)

    expect(ids({ aClef: true })).toEqual(['ouvrir', 'partir'])
    expect(ids({ aClef: false })).toEqual(['partir'])
  })

  it("renvoie une liste vide sur un node qui n'est pas un choix", () => {
    const ending = fixture.nodes['end-good']
    if (!ending) throw new Error('fixture cassee')
    expect(availableChoices(ending, {})).toEqual([])
  })
})

describe('pickChoice', () => {
  it('avance vers nextNode en appliquant les effets', () => {
    const state = createInitialState(fixture)
    const next = pickChoice(state, fixture, 'c1')
    expect(next.currentNodeId).toBe('porte')
    expect(next.variables.aClef).toBe(true)
    expect(next.variables.courage).toBe(1)
    expect(next.history).toEqual(['start', 'porte'])
  })

  it('throw sur un choix inconnu', () => {
    const state = createInitialState(fixture)
    expect(() => pickChoice(state, fixture, 'xxx')).toThrow()
  })

  it('throw sur un choix dont les conditions ne sont pas satisfaites', () => {
    const s0 = createInitialState(fixture)
    const atPorteSansClef = pickChoice(s0, fixture, 'c2')
    expect(() => pickChoice(atPorteSansClef, fixture, 'ouvrir')).toThrow()
  })

  it("enregistre l'ending atteint dans reachedEndings", () => {
    const s0 = createInitialState(fixture)
    const s1 = pickChoice(s0, fixture, 'c1')
    const s2 = pickChoice(s1, fixture, 'ouvrir')
    expect(s2.currentNodeId).toBe('end-good')
    expect(s2.reachedEndings).toEqual(['e-success'])
  })

  it('ne duplique pas un ending deja atteint', () => {
    const s0 = createInitialState(fixture)
    const s1 = pickChoice(s0, fixture, 'c1')
    const s2 = pickChoice(s1, fixture, 'ouvrir')
    // Simule un second run qui retombe sur le meme ending
    const replayed = pickChoice({ ...s2, currentNodeId: 'porte' }, fixture, 'ouvrir')
    expect(replayed.reachedEndings).toEqual(['e-success'])
  })
})

describe('restartPreservingEndings', () => {
  it('remet l\'etat courant a zero mais conserve les endings atteints', () => {
    const s0 = createInitialState(fixture)
    const atPorte = pickChoice(s0, fixture, 'c1')
    const afterGood = pickChoice(atPorte, fixture, 'ouvrir')
    expect(afterGood.reachedEndings).toEqual(['e-success'])

    const restarted = restartPreservingEndings(afterGood, fixture)
    expect(restarted.currentNodeId).toBe(fixture.startNodeId)
    expect(restarted.variables).toEqual({ courage: 0, aClef: false })
    expect(restarted.history).toEqual([fixture.startNodeId])
    expect(restarted.reachedEndings).toEqual(['e-success'])
  })

  it('cumule les endings a travers plusieurs parties', () => {
    const s0 = createInitialState(fixture)
    const afterGood = pickChoice(pickChoice(s0, fixture, 'c1'), fixture, 'ouvrir')

    const secondRun = restartPreservingEndings(afterGood, fixture)
    const afterAbandon = pickChoice(pickChoice(secondRun, fixture, 'c2'), fixture, 'partir')

    expect(afterAbandon.reachedEndings.sort()).toEqual(['e-abandon', 'e-success'])
  })
})

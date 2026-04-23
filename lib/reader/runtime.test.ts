import { describe, expect, it } from 'vitest'
import type { BookContent } from './types'
import {
  advanceScene,
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

describe('applyEffects (cas supplementaires)', () => {
  it('set remplace la valeur quel que soit le type initial', () => {
    const vars = applyEffects([{ variable: 'nom', op: 'set', value: 'Alice' }], { nom: 'Bob' })
    expect(vars.nom).toBe('Alice')
  })

  it("set cree la variable si elle n'existait pas", () => {
    const vars = applyEffects([{ variable: 'nouveau', op: 'set', value: 42 }], {})
    expect(vars.nouveau).toBe(42)
  })

  it('add et sub sont silencieux sur une variable inconnue', () => {
    // Contrat : seules les variables declarees dans variablesSchema peuvent etre
    // incrementees. Un add/sub sur une var absente = no-op, pas de crash.
    expect(applyEffects([{ variable: 'fantome', op: 'add', value: 1 }], {})).toEqual({})
    expect(applyEffects([{ variable: 'fantome', op: 'sub', value: 1 }], {})).toEqual({})
  })

  it('add/sub ne touchent pas les non-nombres', () => {
    const vars = applyEffects([{ variable: 'nom', op: 'add', value: 1 }], { nom: 'Alice' })
    expect(vars.nom).toBe('Alice')
  })

  it('applique des effets sur plusieurs variables differentes', () => {
    const vars = applyEffects(
      [
        { variable: 'aClef', op: 'set', value: true },
        { variable: 'courage', op: 'add', value: 2 },
        { variable: 'nom', op: 'set', value: 'Alice' },
      ],
      { aClef: false, courage: 3, nom: '' },
    )
    expect(vars).toEqual({ aClef: true, courage: 5, nom: 'Alice' })
  })
})

describe('checkAllConditions (tous les operateurs)', () => {
  const check = (op: string, current: unknown, value: unknown) =>
    checkAllConditions([{ variable: 'v', op: op as '==', value: value as number }], {
      v: current as number,
    })

  it.each([
    ['==', 5, 5, true],
    ['==', 5, 6, false],
    ['!=', 5, 5, false],
    ['!=', 5, 6, true],
    ['>', 5, 4, true],
    ['>', 5, 5, false],
    ['<', 4, 5, true],
    ['<', 5, 5, false],
    ['>=', 5, 5, true],
    ['>=', 4, 5, false],
    ['<=', 5, 5, true],
    ['<=', 6, 5, false],
  ])('%s : %i vs %i -> %s (nombres)', (op, current, value, expected) => {
    expect(check(op, current, value)).toBe(expected)
  })

  it.each([
    ['==', 'Alice', 'Alice', true],
    ['==', 'Alice', 'Bob', false],
    ['!=', 'Alice', 'Alice', false],
    ['!=', 'Alice', 'Bob', true],
  ])('%s : %s vs %s -> %s (strings)', (op, current, value, expected) => {
    expect(check(op, current, value)).toBe(expected)
  })

  it.each([
    ['==', true, true, true],
    ['==', true, false, false],
    ['!=', true, false, true],
  ])('%s : %s vs %s -> %s (booleens)', (op, current, value, expected) => {
    expect(check(op, current, value)).toBe(expected)
  })
})

describe('variables string (bout en bout)', () => {
  const stringBook: BookContent = {
    startNodeId: 'a',
    variablesSchema: [{ name: 'nom', type: 'string', initial: '' }],
    nodes: {
      a: {
        id: 'a',
        type: 'choice',
        text: 'Votre nom ?',
        choices: [
          {
            id: 'alice',
            label: 'Alice',
            nextNode: 'b',
            effects: [{ variable: 'nom', op: 'set', value: 'Alice' }],
          },
          {
            id: 'bob',
            label: 'Bob',
            nextNode: 'b',
            effects: [{ variable: 'nom', op: 'set', value: 'Bob' }],
          },
        ],
      },
      b: {
        id: 'b',
        type: 'choice',
        text: 'Qui etes-vous ?',
        choices: [
          {
            id: 'only-alice',
            label: 'Pour Alice',
            nextNode: 'fin-a',
            conditions: [{ variable: 'nom', op: '==', value: 'Alice' }],
          },
          {
            id: 'not-alice',
            label: 'Pour tous les autres',
            nextNode: 'fin-b',
            conditions: [{ variable: 'nom', op: '!=', value: 'Alice' }],
          },
        ],
      },
      'fin-a': { id: 'fin-a', type: 'ending', endingId: 'ea' },
      'fin-b': { id: 'fin-b', type: 'ending', endingId: 'eb' },
    },
    endings: {
      ea: { id: 'ea', type: 'good', title: 'A', text: '' },
      eb: { id: 'eb', type: 'neutral', title: 'B', text: '' },
    },
  }

  it('initialise, set et filtre les choix via une variable string', () => {
    const s0 = createInitialState(stringBook)
    expect(s0.variables.nom).toBe('')

    const chose = pickChoice(s0, stringBook, 'alice')
    expect(chose.variables.nom).toBe('Alice')

    const choixB = stringBook.nodes.b
    if (!choixB || choixB.type !== 'choice') throw new Error('fixture cassee')
    const visibles = availableChoices(choixB, chose.variables).map((c) => c.id)
    expect(visibles).toEqual(['only-alice'])
  })
})

describe('advanceScene', () => {
  const sceneBook: BookContent = {
    startNodeId: 's1',
    variablesSchema: [],
    nodes: {
      s1: { id: 's1', type: 'scene', text: 'Premiere scene', next: 's2' },
      s2: { id: 's2', type: 'scene', text: 'Deuxieme scene', next: 'fin' },
      fin: { id: 'fin', type: 'ending', endingId: 'e' },
    },
    endings: {
      e: { id: 'e', type: 'good', title: 'Fin', text: '' },
    },
  }

  it('avance sur le node suivant et alimente history', () => {
    const s0 = createInitialState(sceneBook)
    const s1 = advanceScene(s0, sceneBook)
    expect(s1.currentNodeId).toBe('s2')
    expect(s1.history).toEqual(['s1', 's2'])

    const s2 = advanceScene(s1, sceneBook)
    expect(s2.currentNodeId).toBe('fin')
    expect(s2.reachedEndings).toEqual(['e'])
  })

  it("throw si le node courant n'est pas une scene", () => {
    const atChoice = createInitialState(fixture)
    expect(() => advanceScene(atChoice, fixture)).toThrow(/scene/)
  })
})

describe('restartPreservingEndings', () => {
  it("remet l'etat courant a zero mais conserve les endings atteints", () => {
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

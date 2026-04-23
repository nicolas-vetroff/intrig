import { describe, expect, it } from 'vitest'
import { validateBookContent } from './validation'

// Helpers pour construire des fixtures concises.
const minimal = {
  startNodeId: 'a',
  variablesSchema: [],
  nodes: {
    a: { id: 'a', type: 'ending', endingId: 'e1' },
  },
  endings: {
    e1: { id: 'e1', type: 'good', title: 'Fin', text: 'Fin atteinte.' },
  },
}

describe('validateBookContent', () => {
  it('accepte un livre minimal valide', () => {
    const r = validateBookContent(minimal)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.startNodeId).toBe('a')
  })

  it('rejette les entrees non-objet avec une erreur Zod', () => {
    expect(validateBookContent(null).ok).toBe(false)
    expect(validateBookContent('hello').ok).toBe(false)
    expect(validateBookContent(42).ok).toBe(false)
    expect(validateBookContent([]).ok).toBe(false)
  })

  it('rejette un startNodeId qui ne matche aucun node', () => {
    const r = validateBookContent({ ...minimal, startNodeId: 'fantome' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('startNodeId'))).toBe(true)
  })

  it('rejette un scene.next qui pointe vers un node inexistant', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: { id: 'a', type: 'scene', text: 'Debut', next: 'fantome' },
      },
      endings: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('fantome'))).toBe(true)
  })

  it('rejette un choice.nextNode qui pointe vers un node inexistant', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: {
          id: 'a',
          type: 'choice',
          text: 'Choix ?',
          choices: [{ id: 'c', label: 'x', nextNode: 'fantome' }],
        },
      },
      endings: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('fantome'))).toBe(true)
  })

  it('rejette un ending node qui pointe vers un endingId inexistant', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: { a: { id: 'a', type: 'ending', endingId: 'fantome' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('fantome'))).toBe(true)
  })

  it('rejette une variable utilisee en condition mais non declaree dans variablesSchema', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: {
          id: 'a',
          type: 'choice',
          text: 't',
          choices: [
            {
              id: 'c',
              label: 'x',
              nextNode: 'b',
              conditions: [{ variable: 'fantome', op: '==', value: 1 }],
            },
          ],
        },
        b: { id: 'b', type: 'ending', endingId: 'e1' },
      },
      endings: { e1: { id: 'e1', type: 'good', title: 'Fin', text: '…' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('fantome'))).toBe(true)
  })

  it('rejette une variable utilisee en effect mais non declaree', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: {
          id: 'a',
          type: 'choice',
          text: 't',
          choices: [
            {
              id: 'c',
              label: 'x',
              nextNode: 'b',
              effects: [{ variable: 'fantome', op: 'set', value: 1 }],
            },
          ],
        },
        b: { id: 'b', type: 'ending', endingId: 'e1' },
      },
      endings: { e1: { id: 'e1', type: 'good', title: 'Fin', text: '…' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('fantome'))).toBe(true)
  })

  it('rejette un node dont l\'id interne ne matche pas la cle du Record', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: {
        a: { id: 'different', type: 'ending', endingId: 'e1' },
      },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.toLowerCase().includes('id'))).toBe(true)
  })

  it('rejette un type de node inconnu', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: { a: { id: 'a', type: 'wtf', text: 'x' } as unknown as object },
    })
    expect(r.ok).toBe(false)
  })

  it('rejette un champ manquant (scene.text)', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: { a: { id: 'a', type: 'scene', next: 'b' } },
      endings: {},
    })
    expect(r.ok).toBe(false)
  })

  it('accepte un graphe avec variables / conditions / effets coherents', () => {
    const r = validateBookContent({
      startNodeId: 'start',
      variablesSchema: [{ name: 'cle', type: 'boolean', initial: false }],
      nodes: {
        start: {
          id: 'start',
          type: 'choice',
          text: 'Prendre la cle ?',
          choices: [
            {
              id: 'oui',
              label: 'Oui',
              nextNode: 'porte',
              effects: [{ variable: 'cle', op: 'set', value: true }],
            },
          ],
        },
        porte: {
          id: 'porte',
          type: 'choice',
          text: 'Porte',
          choices: [
            {
              id: 'ouvrir',
              label: 'Ouvrir',
              nextNode: 'fin',
              conditions: [{ variable: 'cle', op: '==', value: true }],
            },
          ],
        },
        fin: { id: 'fin', type: 'ending', endingId: 'success' },
      },
      endings: { success: { id: 'success', type: 'good', title: 'Gagne', text: 'Bravo.' } },
    })
    expect(r.ok).toBe(true)
  })
})

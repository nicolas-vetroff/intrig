import { describe, expect, it } from 'vitest'
import { validateBookContent } from './validation'

// Helpers for concise fixtures.
const minimal = {
  startNodeId: 'a',
  variablesSchema: [],
  nodes: {
    a: { id: 'a', type: 'ending', endingId: 'e1' },
  },
  endings: {
    e1: { id: 'e1', type: 'good', title: 'End', text: 'Reached an ending.' },
  },
}

describe('validateBookContent', () => {
  it('accepts a minimal valid book', () => {
    const r = validateBookContent(minimal)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.startNodeId).toBe('a')
  })

  it('rejects non-object inputs with a Zod error', () => {
    expect(validateBookContent(null).ok).toBe(false)
    expect(validateBookContent('hello').ok).toBe(false)
    expect(validateBookContent(42).ok).toBe(false)
    expect(validateBookContent([]).ok).toBe(false)
  })

  it('rejects a startNodeId that matches no node', () => {
    const r = validateBookContent({ ...minimal, startNodeId: 'ghost' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('startNodeId'))).toBe(true)
  })

  it('rejects a scene.next pointing to a non-existent node', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: { id: 'a', type: 'scene', text: 'Start', next: 'ghost' },
      },
      endings: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('ghost'))).toBe(true)
  })

  it('rejects a choice.nextNode pointing to a non-existent node', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: {
        a: {
          id: 'a',
          type: 'choice',
          text: 'Choose?',
          choices: [{ id: 'c', label: 'x', nextNode: 'ghost' }],
        },
      },
      endings: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('ghost'))).toBe(true)
  })

  it('rejects an ending node pointing to a non-existent endingId', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: { a: { id: 'a', type: 'ending', endingId: 'ghost' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('ghost'))).toBe(true)
  })

  it('rejects a variable used in a condition but not declared in variablesSchema', () => {
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
              conditions: [{ variable: 'ghost', op: '==', value: 1 }],
            },
          ],
        },
        b: { id: 'b', type: 'ending', endingId: 'e1' },
      },
      endings: { e1: { id: 'e1', type: 'good', title: 'End', text: '…' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('ghost'))).toBe(true)
  })

  it('rejects a variable used in an effect but not declared', () => {
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
              effects: [{ variable: 'ghost', op: 'set', value: 1 }],
            },
          ],
        },
        b: { id: 'b', type: 'ending', endingId: 'e1' },
      },
      endings: { e1: { id: 'e1', type: 'good', title: 'End', text: '…' } },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.includes('ghost'))).toBe(true)
  })

  it('rejects a node whose internal id does not match the Record key', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: {
        a: { id: 'different', type: 'ending', endingId: 'e1' },
      },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.toLowerCase().includes('id'))).toBe(true)
  })

  it('rejects an unknown node type', () => {
    const r = validateBookContent({
      ...minimal,
      nodes: { a: { id: 'a', type: 'wtf', text: 'x' } as unknown as object },
    })
    expect(r.ok).toBe(false)
  })

  it('rejects a missing field (scene.text)', () => {
    const r = validateBookContent({
      startNodeId: 'a',
      variablesSchema: [],
      nodes: { a: { id: 'a', type: 'scene', next: 'b' } },
      endings: {},
    })
    expect(r.ok).toBe(false)
  })

  it('accepts a graph with consistent variables / conditions / effects', () => {
    const r = validateBookContent({
      startNodeId: 'start',
      variablesSchema: [{ name: 'key', type: 'boolean', initial: false }],
      nodes: {
        start: {
          id: 'start',
          type: 'choice',
          text: 'Take the key?',
          choices: [
            {
              id: 'yes',
              label: 'Yes',
              nextNode: 'door',
              effects: [{ variable: 'key', op: 'set', value: true }],
            },
          ],
        },
        door: {
          id: 'door',
          type: 'choice',
          text: 'Door',
          choices: [
            {
              id: 'open',
              label: 'Open',
              nextNode: 'end',
              conditions: [{ variable: 'key', op: '==', value: true }],
            },
          ],
        },
        end: { id: 'end', type: 'ending', endingId: 'success' },
      },
      endings: { success: { id: 'success', type: 'good', title: 'Won', text: 'Well done.' } },
    })
    expect(r.ok).toBe(true)
  })
})

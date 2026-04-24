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
    { name: 'hasKey', type: 'boolean', initial: false },
  ],
  nodes: {
    start: {
      id: 'start',
      type: 'choice',
      text: 'Take the key or not?',
      choices: [
        {
          id: 'c1',
          label: 'Take the key',
          nextNode: 'door',
          effects: [
            { variable: 'hasKey', op: 'set', value: true },
            { variable: 'courage', op: 'add', value: 1 },
          ],
        },
        {
          id: 'c2',
          label: 'Ignore the key',
          nextNode: 'door',
        },
      ],
    },
    door: {
      id: 'door',
      type: 'choice',
      text: 'In front of the locked door.',
      choices: [
        {
          id: 'open',
          label: 'Open',
          nextNode: 'end-good',
          conditions: [{ variable: 'hasKey', op: '==', value: true }],
        },
        {
          id: 'leave',
          label: 'Leave',
          nextNode: 'end-neutral',
        },
      ],
    },
    'end-good': { id: 'end-good', type: 'ending', endingId: 'e-success' },
    'end-neutral': { id: 'end-neutral', type: 'ending', endingId: 'e-abandon' },
  },
  endings: {
    'e-success': { id: 'e-success', type: 'good', title: 'Success', text: '...' },
    'e-abandon': { id: 'e-abandon', type: 'neutral', title: 'Abandon', text: '...' },
  },
}

describe('createInitialState', () => {
  it('initializes variables from the schema', () => {
    const s = createInitialState(fixture)
    expect(s.currentNodeId).toBe('start')
    expect(s.variables).toEqual({ courage: 0, hasKey: false })
    expect(s.history).toEqual(['start'])
    expect(s.reachedEndings).toEqual([])
  })
})

describe('applyEffects', () => {
  it('handles set on a boolean', () => {
    const vars = applyEffects([{ variable: 'hasKey', op: 'set', value: true }], {
      hasKey: false,
    })
    expect(vars.hasKey).toBe(true)
  })

  it('handles add on a number', () => {
    const vars = applyEffects([{ variable: 'courage', op: 'add', value: 2 }], {
      courage: 3,
    })
    expect(vars.courage).toBe(5)
  })

  it('handles sub on a number', () => {
    const vars = applyEffects([{ variable: 'courage', op: 'sub', value: 2 }], {
      courage: 5,
    })
    expect(vars.courage).toBe(3)
  })

  it('combines multiple effects in order', () => {
    const vars = applyEffects(
      [
        { variable: 'courage', op: 'add', value: 1 },
        { variable: 'courage', op: 'add', value: 2 },
      ],
      { courage: 0 },
    )
    expect(vars.courage).toBe(3)
  })

  it('does not mutate the source object', () => {
    const source = { courage: 0 }
    applyEffects([{ variable: 'courage', op: 'add', value: 1 }], source)
    expect(source.courage).toBe(0)
  })

  it('returns the original reference when there are no effects', () => {
    const source = { courage: 0 }
    expect(applyEffects(undefined, source)).toBe(source)
    expect(applyEffects([], source)).toBe(source)
  })
})

describe('checkAllConditions', () => {
  it('is true when there are no conditions', () => {
    expect(checkAllConditions(undefined, {})).toBe(true)
    expect(checkAllConditions([], {})).toBe(true)
  })

  it('combines conditions with AND', () => {
    expect(
      checkAllConditions(
        [
          { variable: 'courage', op: '>=', value: 1 },
          { variable: 'hasKey', op: '==', value: true },
        ],
        { courage: 1, hasKey: true },
      ),
    ).toBe(true)

    expect(
      checkAllConditions(
        [
          { variable: 'courage', op: '>=', value: 1 },
          { variable: 'hasKey', op: '==', value: true },
        ],
        { courage: 1, hasKey: false },
      ),
    ).toBe(false)
  })

  it('rejects ordinal comparisons between incompatible types', () => {
    expect(
      checkAllConditions([{ variable: 'hasKey', op: '>', value: true }], { hasKey: true }),
    ).toBe(false)
  })

  it('is false when the variable is unknown', () => {
    expect(checkAllConditions([{ variable: 'ghost', op: '==', value: 1 }], {})).toBe(false)
  })
})

describe('availableChoices', () => {
  it('filters out choices whose conditions fail', () => {
    const door = fixture.nodes.door
    if (!door || door.type !== 'choice') throw new Error('fixture broken')

    const ids = (vars: Record<string, unknown>) =>
      availableChoices(door, vars as never).map((c) => c.id)

    expect(ids({ hasKey: true })).toEqual(['open', 'leave'])
    expect(ids({ hasKey: false })).toEqual(['leave'])
  })

  it('returns an empty list when the node is not a choice', () => {
    const ending = fixture.nodes['end-good']
    if (!ending) throw new Error('fixture broken')
    expect(availableChoices(ending, {})).toEqual([])
  })
})

describe('pickChoice', () => {
  it('advances to nextNode and applies effects', () => {
    const state = createInitialState(fixture)
    const next = pickChoice(state, fixture, 'c1')
    expect(next.currentNodeId).toBe('door')
    expect(next.variables.hasKey).toBe(true)
    expect(next.variables.courage).toBe(1)
    expect(next.history).toEqual(['start', 'door'])
  })

  it('throws on an unknown choice', () => {
    const state = createInitialState(fixture)
    expect(() => pickChoice(state, fixture, 'xxx')).toThrow()
  })

  it('throws on a choice whose conditions are not met', () => {
    const s0 = createInitialState(fixture)
    const atDoorWithoutKey = pickChoice(s0, fixture, 'c2')
    expect(() => pickChoice(atDoorWithoutKey, fixture, 'open')).toThrow()
  })

  it('records the reached ending in reachedEndings', () => {
    const s0 = createInitialState(fixture)
    const s1 = pickChoice(s0, fixture, 'c1')
    const s2 = pickChoice(s1, fixture, 'open')
    expect(s2.currentNodeId).toBe('end-good')
    expect(s2.reachedEndings).toEqual(['e-success'])
  })

  it('does not duplicate an already-reached ending', () => {
    const s0 = createInitialState(fixture)
    const s1 = pickChoice(s0, fixture, 'c1')
    const s2 = pickChoice(s1, fixture, 'open')
    // Simulate a second run that lands on the same ending
    const replayed = pickChoice({ ...s2, currentNodeId: 'door' }, fixture, 'open')
    expect(replayed.reachedEndings).toEqual(['e-success'])
  })
})

describe('applyEffects (additional cases)', () => {
  it('set replaces the value regardless of initial type', () => {
    const vars = applyEffects([{ variable: 'name', op: 'set', value: 'Alice' }], { name: 'Bob' })
    expect(vars.name).toBe('Alice')
  })

  it('set creates the variable when it did not exist', () => {
    const vars = applyEffects([{ variable: 'new', op: 'set', value: 42 }], {})
    expect(vars.new).toBe(42)
  })

  it('add and sub are silent on an unknown variable', () => {
    // Contract: only variables declared in variablesSchema can be
    // incremented. An add/sub on an absent var is a no-op, not a crash.
    expect(applyEffects([{ variable: 'ghost', op: 'add', value: 1 }], {})).toEqual({})
    expect(applyEffects([{ variable: 'ghost', op: 'sub', value: 1 }], {})).toEqual({})
  })

  it('add/sub do not touch non-numbers', () => {
    const vars = applyEffects([{ variable: 'name', op: 'add', value: 1 }], { name: 'Alice' })
    expect(vars.name).toBe('Alice')
  })

  it('applies effects across multiple different variables', () => {
    const vars = applyEffects(
      [
        { variable: 'hasKey', op: 'set', value: true },
        { variable: 'courage', op: 'add', value: 2 },
        { variable: 'name', op: 'set', value: 'Alice' },
      ],
      { hasKey: false, courage: 3, name: '' },
    )
    expect(vars).toEqual({ hasKey: true, courage: 5, name: 'Alice' })
  })
})

describe('checkAllConditions (all operators)', () => {
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
  ])('%s : %i vs %i -> %s (numbers)', (op, current, value, expected) => {
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
  ])('%s : %s vs %s -> %s (booleans)', (op, current, value, expected) => {
    expect(check(op, current, value)).toBe(expected)
  })
})

describe('string variables (end to end)', () => {
  const stringBook: BookContent = {
    startNodeId: 'a',
    variablesSchema: [{ name: 'name', type: 'string', initial: '' }],
    nodes: {
      a: {
        id: 'a',
        type: 'choice',
        text: 'Your name?',
        choices: [
          {
            id: 'alice',
            label: 'Alice',
            nextNode: 'b',
            effects: [{ variable: 'name', op: 'set', value: 'Alice' }],
          },
          {
            id: 'bob',
            label: 'Bob',
            nextNode: 'b',
            effects: [{ variable: 'name', op: 'set', value: 'Bob' }],
          },
        ],
      },
      b: {
        id: 'b',
        type: 'choice',
        text: 'Who are you?',
        choices: [
          {
            id: 'only-alice',
            label: 'For Alice',
            nextNode: 'end-a',
            conditions: [{ variable: 'name', op: '==', value: 'Alice' }],
          },
          {
            id: 'not-alice',
            label: 'For everyone else',
            nextNode: 'end-b',
            conditions: [{ variable: 'name', op: '!=', value: 'Alice' }],
          },
        ],
      },
      'end-a': { id: 'end-a', type: 'ending', endingId: 'ea' },
      'end-b': { id: 'end-b', type: 'ending', endingId: 'eb' },
    },
    endings: {
      ea: { id: 'ea', type: 'good', title: 'A', text: '' },
      eb: { id: 'eb', type: 'neutral', title: 'B', text: '' },
    },
  }

  it('initializes, sets and filters choices via a string variable', () => {
    const s0 = createInitialState(stringBook)
    expect(s0.variables.name).toBe('')

    const picked = pickChoice(s0, stringBook, 'alice')
    expect(picked.variables.name).toBe('Alice')

    const choiceB = stringBook.nodes.b
    if (!choiceB || choiceB.type !== 'choice') throw new Error('fixture broken')
    const visible = availableChoices(choiceB, picked.variables).map((c) => c.id)
    expect(visible).toEqual(['only-alice'])
  })
})

describe('advanceScene', () => {
  const sceneBook: BookContent = {
    startNodeId: 's1',
    variablesSchema: [],
    nodes: {
      s1: { id: 's1', type: 'scene', text: 'First scene', next: 's2' },
      s2: { id: 's2', type: 'scene', text: 'Second scene', next: 'end' },
      end: { id: 'end', type: 'ending', endingId: 'e' },
    },
    endings: {
      e: { id: 'e', type: 'good', title: 'End', text: '' },
    },
  }

  it('advances to the next node and feeds history', () => {
    const s0 = createInitialState(sceneBook)
    const s1 = advanceScene(s0, sceneBook)
    expect(s1.currentNodeId).toBe('s2')
    expect(s1.history).toEqual(['s1', 's2'])

    const s2 = advanceScene(s1, sceneBook)
    expect(s2.currentNodeId).toBe('end')
    expect(s2.reachedEndings).toEqual(['e'])
  })

  it('throws when the current node is not a scene', () => {
    const atChoice = createInitialState(fixture)
    expect(() => advanceScene(atChoice, fixture)).toThrow(/scene/)
  })
})

describe('restartPreservingEndings', () => {
  it('resets the current state but preserves reached endings', () => {
    const s0 = createInitialState(fixture)
    const atDoor = pickChoice(s0, fixture, 'c1')
    const afterGood = pickChoice(atDoor, fixture, 'open')
    expect(afterGood.reachedEndings).toEqual(['e-success'])

    const restarted = restartPreservingEndings(afterGood, fixture)
    expect(restarted.currentNodeId).toBe(fixture.startNodeId)
    expect(restarted.variables).toEqual({ courage: 0, hasKey: false })
    expect(restarted.history).toEqual([fixture.startNodeId])
    expect(restarted.reachedEndings).toEqual(['e-success'])
  })

  it('accumulates endings across multiple playthroughs', () => {
    const s0 = createInitialState(fixture)
    const afterGood = pickChoice(pickChoice(s0, fixture, 'c1'), fixture, 'open')

    const secondRun = restartPreservingEndings(afterGood, fixture)
    const afterAbandon = pickChoice(pickChoice(secondRun, fixture, 'c2'), fixture, 'leave')

    expect(afterAbandon.reachedEndings.sort()).toEqual(['e-abandon', 'e-success'])
  })
})

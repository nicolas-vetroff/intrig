import type { BookContent, Choice, Condition, Effect, Node, VariableValue } from './types'

export type ReaderState = {
  currentNodeId: string
  variables: Record<string, VariableValue>
  history: string[]
  reachedEndings: string[]
}

export function createInitialState(book: BookContent): ReaderState {
  const variables: Record<string, VariableValue> = {}
  for (const def of book.variablesSchema) {
    variables[def.name] = def.initial
  }
  return {
    currentNodeId: book.startNodeId,
    variables,
    history: [book.startNodeId],
    reachedEndings: [],
  }
}

// Restart the book: variables / history / current node reset, but the
// already-discovered endings are kept (that's a cross-playthrough
// counter, not part of the current run's state).
export function restartPreservingEndings(state: ReaderState, book: BookContent): ReaderState {
  return {
    ...createInitialState(book),
    reachedEndings: state.reachedEndings,
  }
}

function checkCondition(condition: Condition, variables: Record<string, VariableValue>): boolean {
  if (!Object.prototype.hasOwnProperty.call(variables, condition.variable)) {
    return false
  }
  const current = variables[condition.variable]

  if (condition.op === '==') return current === condition.value
  if (condition.op === '!=') return current !== condition.value

  // Ordinal comparisons: only valid when both sides are numbers.
  if (typeof current !== 'number' || typeof condition.value !== 'number') {
    return false
  }
  switch (condition.op) {
    case '>':
      return current > condition.value
    case '<':
      return current < condition.value
    case '>=':
      return current >= condition.value
    case '<=':
      return current <= condition.value
  }
}

export function checkAllConditions(
  conditions: Condition[] | undefined,
  variables: Record<string, VariableValue>,
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => checkCondition(c, variables))
}

function applyEffect(
  effect: Effect,
  variables: Record<string, VariableValue>,
): Record<string, VariableValue> {
  const next = { ...variables }
  if (effect.op === 'set') {
    next[effect.variable] = effect.value
    return next
  }
  const current = next[effect.variable]
  if (typeof current !== 'number' || typeof effect.value !== 'number') {
    // add/sub only on numbers; silent no-op otherwise.
    return next
  }
  next[effect.variable] = effect.op === 'add' ? current + effect.value : current - effect.value
  return next
}

export function applyEffects(
  effects: Effect[] | undefined,
  variables: Record<string, VariableValue>,
): Record<string, VariableValue> {
  if (!effects || effects.length === 0) return variables
  return effects.reduce<Record<string, VariableValue>>(
    (acc, effect) => applyEffect(effect, acc),
    variables,
  )
}

export function availableChoices(node: Node, variables: Record<string, VariableValue>): Choice[] {
  if (node.type !== 'choice') return []
  return node.choices.filter((c) => checkAllConditions(c.conditions, variables))
}

export function pickChoice(state: ReaderState, book: BookContent, choiceId: string): ReaderState {
  const node = book.nodes[state.currentNodeId]
  if (!node) throw new Error(`Unknown node: ${state.currentNodeId}`)
  if (node.type !== 'choice') {
    throw new Error(`Node ${node.id} is not a choice`)
  }
  const choice = node.choices.find((c) => c.id === choiceId)
  if (!choice) throw new Error(`Unknown choice: ${choiceId}`)
  if (!checkAllConditions(choice.conditions, state.variables)) {
    throw new Error(`Unavailable choice: ${choiceId}`)
  }
  const variables = applyEffects(choice.effects, state.variables)
  return advance(state, book, choice.nextNode, variables)
}

export function advanceScene(state: ReaderState, book: BookContent): ReaderState {
  const node = book.nodes[state.currentNodeId]
  if (!node) throw new Error(`Unknown node: ${state.currentNodeId}`)
  if (node.type !== 'scene') {
    throw new Error(`Node ${node.id} is not a scene`)
  }
  return advance(state, book, node.next, state.variables)
}

function advance(
  state: ReaderState,
  book: BookContent,
  nextNodeId: string,
  variables: Record<string, VariableValue>,
): ReaderState {
  const nextNode = book.nodes[nextNodeId]
  if (!nextNode) throw new Error(`Unknown node: ${nextNodeId}`)

  let reachedEndings = state.reachedEndings
  if (nextNode.type === 'ending' && !state.reachedEndings.includes(nextNode.endingId)) {
    reachedEndings = [...state.reachedEndings, nextNode.endingId]
  }

  return {
    currentNodeId: nextNodeId,
    variables,
    history: [...state.history, nextNodeId],
    reachedEndings,
  }
}

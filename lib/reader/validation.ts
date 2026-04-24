import { z } from 'zod'
import type { BookContent } from './types'

// Zod schema that mirrors lib/reader/types.ts. Two validation passes:
//  1) shape (Zod): primitive types, required fields, discriminated unions
//  2) structural integrity (code): internal references (startNodeId,
//     choice.nextNode, scene.next, ending.endingId, referenced variables)
// Both passes are useful independently: Zod's first error helps diagnose
// an invalid JSON format; the second catches a "syntactically correct"
// but inconsistent book.

const VariableValueSchema = z.union([z.number(), z.boolean(), z.string()])

const VariableDefSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['number', 'boolean', 'string']),
  initial: VariableValueSchema,
})

const ConditionSchema = z.object({
  variable: z.string().min(1),
  op: z.enum(['==', '!=', '>', '<', '>=', '<=']),
  value: VariableValueSchema,
})

const EffectSchema = z.object({
  variable: z.string().min(1),
  op: z.enum(['set', 'add', 'sub']),
  value: VariableValueSchema,
})

const ChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  nextNode: z.string().min(1),
  conditions: z.array(ConditionSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  isPremium: z.boolean().optional(),
})

const NodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('scene'),
    text: z.string().min(1),
    illustration: z.string().optional(),
    next: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('choice'),
    text: z.string().min(1),
    illustration: z.string().optional(),
    choices: z.array(ChoiceSchema).min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('ending'),
    endingId: z.string().min(1),
  }),
])

const EndingSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['good', 'bad', 'neutral', 'secret']),
  title: z.string().min(1),
  text: z.string().min(1),
  illustration: z.string().optional(),
})

export const BookContentSchema = z.object({
  startNodeId: z.string().min(1),
  variablesSchema: z.array(VariableDefSchema),
  nodes: z.record(z.string(), NodeSchema),
  endings: z.record(z.string(), EndingSchema),
})

export type BookContentValidation =
  | { ok: true; value: BookContent }
  | { ok: false; errors: string[] }

export function validateBookContent(input: unknown): BookContentValidation {
  const parsed = BookContentSchema.safeParse(input)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => {
      const path = i.path.length ? i.path.join('.') : '<root>'
      return `${path} : ${i.message}`
    })
    return { ok: false, errors }
  }

  const book = parsed.data
  const errors: string[] = []
  const nodeIds = new Set(Object.keys(book.nodes))
  const endingIds = new Set(Object.keys(book.endings))
  const varNames = new Set(book.variablesSchema.map((v) => v.name))

  if (!nodeIds.has(book.startNodeId)) {
    errors.push(`startNodeId "${book.startNodeId}" does not match any node.`)
  }

  for (const [nodeKey, node] of Object.entries(book.nodes)) {
    if (node.id !== nodeKey) {
      errors.push(`Node "${nodeKey}": internal id "${node.id}" differs from the Record key.`)
    }

    if (node.type === 'scene') {
      if (!nodeIds.has(node.next)) {
        errors.push(`Scene "${nodeKey}": next "${node.next}" does not exist.`)
      }
    } else if (node.type === 'choice') {
      for (const choice of node.choices) {
        if (!nodeIds.has(choice.nextNode)) {
          errors.push(
            `Choice "${choice.id}" (in "${nodeKey}"): nextNode "${choice.nextNode}" does not exist.`,
          )
        }
        for (const cond of choice.conditions ?? []) {
          if (!varNames.has(cond.variable)) {
            errors.push(
              `Condition on "${cond.variable}" (choice "${choice.id}"): variable not declared.`,
            )
          }
        }
        for (const eff of choice.effects ?? []) {
          if (!varNames.has(eff.variable)) {
            errors.push(
              `Effect on "${eff.variable}" (choice "${choice.id}"): variable not declared.`,
            )
          }
        }
      }
    } else if (node.type === 'ending') {
      if (!endingIds.has(node.endingId)) {
        errors.push(`Ending node "${nodeKey}" references "${node.endingId}" which does not exist.`)
      }
    }
  }

  for (const [endingKey, ending] of Object.entries(book.endings)) {
    if (ending.id !== endingKey) {
      errors.push(`Ending "${endingKey}": internal id "${ending.id}" differs from the Record key.`)
    }
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: book as BookContent }
}

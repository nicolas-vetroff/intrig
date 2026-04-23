import { z } from 'zod'
import type { BookContent } from './types'

// Schema Zod qui reflete lib/reader/types.ts. Deux niveaux de validation :
//  1) shape (Zod) : types primitifs, champs requis, unions discriminees
//  2) integrite structurelle (code) : references internes (startNodeId,
//     choice.nextNode, scene.next, ending.endingId, variables referencees)
// Les deux passes sont utiles separemment : le premier message d'erreur
// Zod aide a diagnostiquer un format de JSON invalide, le second detecte
// un livre "syntaxiquement correct" mais incoherent.

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
      const path = i.path.length ? i.path.join('.') : '<racine>'
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
    errors.push(`startNodeId "${book.startNodeId}" ne correspond à aucun node.`)
  }

  for (const [nodeKey, node] of Object.entries(book.nodes)) {
    if (node.id !== nodeKey) {
      errors.push(`Node "${nodeKey}" : id interne "${node.id}" different de la clef du Record.`)
    }

    if (node.type === 'scene') {
      if (!nodeIds.has(node.next)) {
        errors.push(`Scene "${nodeKey}" : next "${node.next}" inexistant.`)
      }
    } else if (node.type === 'choice') {
      for (const choice of node.choices) {
        if (!nodeIds.has(choice.nextNode)) {
          errors.push(
            `Choice "${choice.id}" (dans "${nodeKey}") : nextNode "${choice.nextNode}" inexistant.`,
          )
        }
        for (const cond of choice.conditions ?? []) {
          if (!varNames.has(cond.variable)) {
            errors.push(
              `Condition sur "${cond.variable}" (choice "${choice.id}") : variable non declaree.`,
            )
          }
        }
        for (const eff of choice.effects ?? []) {
          if (!varNames.has(eff.variable)) {
            errors.push(
              `Effet sur "${eff.variable}" (choice "${choice.id}") : variable non declaree.`,
            )
          }
        }
      }
    } else if (node.type === 'ending') {
      if (!endingIds.has(node.endingId)) {
        errors.push(`Ending node "${nodeKey}" reference "${node.endingId}" inexistant.`)
      }
    }
  }

  for (const [endingKey, ending] of Object.entries(book.endings)) {
    if (ending.id !== endingKey) {
      errors.push(
        `Ending "${endingKey}" : id interne "${ending.id}" different de la clef du Record.`,
      )
    }
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: book as BookContent }
}

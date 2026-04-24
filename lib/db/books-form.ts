import { z } from 'zod'
import { validateBookContent, type BookContentValidation } from '@/lib/reader/validation'
import type { BookContent } from '@/lib/reader/types'

// Slug rules: lowercase / digits / hyphens, 1+ characters. No leading
// or trailing hyphen. Makes nice URLs and avoids collisions with the
// reserved segments `create`, `edit`, `read`.
const SLUG_RESERVED = new Set(['create', 'edit', 'read'])
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const BookMetadataSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug requis.')
    .max(64, 'Slug trop long (max 64).')
    .regex(SLUG_PATTERN, 'Slug invalide : minuscules, chiffres, tirets uniquement.')
    .refine((s) => !SLUG_RESERVED.has(s), {
      message: `Slug réservé : ${Array.from(SLUG_RESERVED).join(', ')}.`,
    }),
  title: z.string().min(1, 'Titre requis.').max(200),
  // `author` intentionally absent: it is derived from the admin profile
  // at creation time and immutable on edit. See _actions/admin.ts.
  synopsis: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
  genre: z
    .string()
    .max(80)
    .optional()
    .transform((v) => (v ? v : null)),
  tags: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null
      const arr = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return arr.length ? arr : null
    }),
  coverImage: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  estimatedMinutes: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return null
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Durée estimée doit être un nombre positif.',
        })
        return null
      }
      return Math.round(n)
    }),
  tier: z.enum(['free', 'premium']),
  publish: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
})

export type ParsedMetadata = z.infer<typeof BookMetadataSchema>

export type BookFormParseResult =
  | { ok: true; metadata: ParsedMetadata; content: BookContent; publishedAt: Date | null }
  | { ok: false; errors: string[] }

// Parse + validate FormData. A single error array so the UI can display
// them as a block (more useful than one error at a time on a form with
// many fields).
export function parseBookForm(formData: FormData): BookFormParseResult {
  const raw = {
    slug: String(formData.get('slug') ?? '')
      .trim()
      .toLowerCase(),
    title: String(formData.get('title') ?? '').trim(),
    synopsis: String(formData.get('synopsis') ?? '').trim(),
    genre: String(formData.get('genre') ?? '').trim(),
    tags: String(formData.get('tags') ?? '').trim(),
    coverImage: String(formData.get('coverImage') ?? '').trim(),
    estimatedMinutes: String(formData.get('estimatedMinutes') ?? '').trim(),
    tier: String(formData.get('tier') ?? 'free').trim(),
    publish: String(formData.get('publish') ?? ''),
  }

  const metaResult = BookMetadataSchema.safeParse(raw)
  const errors: string[] = []

  if (!metaResult.success) {
    for (const issue of metaResult.error.issues) {
      const field = issue.path.join('.')
      errors.push(field ? `${field} : ${issue.message}` : issue.message)
    }
  }

  let contentResult: BookContentValidation | null = null
  const contentRaw = String(formData.get('content') ?? '').trim()
  if (!contentRaw) {
    errors.push('content : champ requis (JSON du graphe narratif).')
  } else {
    let parsed: unknown
    try {
      parsed = JSON.parse(contentRaw)
    } catch (err) {
      errors.push(`content : JSON invalide (${(err as Error).message}).`)
    }
    if (parsed !== undefined) {
      contentResult = validateBookContent(parsed)
      if (!contentResult.ok) {
        for (const e of contentResult.errors) {
          errors.push(`content : ${e}`)
        }
      }
    }
  }

  if (errors.length || !metaResult.success || !contentResult?.ok) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    metadata: metaResult.data,
    content: contentResult.value,
    publishedAt: metaResult.data.publish ? new Date() : null,
  }
}

'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { books } from '@/lib/db/schema'
import { parseBookForm } from '@/lib/db/books-form'
import { requireAdmin } from '@/lib/supabase/admin'

export type BookFormResult =
  | { status: 'error'; errors: string[] }
  // "ok" est rarement observe : le redirect coupe avant de renvoyer au client.
  // Type present pour que useActionState ait la forme attendue.
  | { status: 'ok'; slug: string }

function isUniqueConstraintViolation(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes('duplicate') || msg.includes('unique')
}

export async function createBook(
  _prev: BookFormResult | null,
  formData: FormData,
): Promise<BookFormResult> {
  await requireAdmin('/livres/create')

  const parsed = parseBookForm(formData)
  if (!parsed.ok) return { status: 'error', errors: parsed.errors }

  try {
    await db.insert(books).values({
      slug: parsed.metadata.slug,
      title: parsed.metadata.title,
      author: parsed.metadata.author,
      coverImage: parsed.metadata.coverImage,
      synopsis: parsed.metadata.synopsis,
      genre: parsed.metadata.genre,
      tags: parsed.metadata.tags,
      estimatedMinutes: parsed.metadata.estimatedMinutes,
      tier: parsed.metadata.tier,
      publishedAt: parsed.publishedAt,
      content: parsed.content,
    })
  } catch (err) {
    if (isUniqueConstraintViolation(err)) {
      return {
        status: 'error',
        errors: [`Slug déjà pris : "${parsed.metadata.slug}". Choisir une autre valeur.`],
      }
    }
    throw err
  }

  redirect(`/livres/${parsed.metadata.slug}`)
}

export async function updateBook(
  _prev: BookFormResult | null,
  formData: FormData,
): Promise<BookFormResult> {
  await requireAdmin('/dashboard')

  const bookId = String(formData.get('bookId') ?? '').trim()
  if (!bookId) return { status: 'error', errors: ['ID du livre manquant.'] }

  const parsed = parseBookForm(formData)
  if (!parsed.ok) return { status: 'error', errors: parsed.errors }

  try {
    await db
      .update(books)
      .set({
        slug: parsed.metadata.slug,
        title: parsed.metadata.title,
        author: parsed.metadata.author,
        coverImage: parsed.metadata.coverImage,
        synopsis: parsed.metadata.synopsis,
        genre: parsed.metadata.genre,
        tags: parsed.metadata.tags,
        estimatedMinutes: parsed.metadata.estimatedMinutes,
        tier: parsed.metadata.tier,
        publishedAt: parsed.publishedAt,
        content: parsed.content,
      })
      .where(eq(books.id, bookId))
  } catch (err) {
    if (isUniqueConstraintViolation(err)) {
      return {
        status: 'error',
        errors: [`Slug déjà pris : "${parsed.metadata.slug}". Choisir une autre valeur.`],
      }
    }
    throw err
  }

  redirect(`/livres/${parsed.metadata.slug}`)
}

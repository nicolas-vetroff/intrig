'use server'

import { redirect } from 'next/navigation'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { books } from '@/lib/db/schema'
import { parseBookForm } from '@/lib/db/books-form'
import { requireAdmin } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/supabase/profile'

export type BookFormResult =
  | { status: 'error'; errors: string[] }
  // "ok" is rarely observed: the redirect cuts off before returning to
  // the client. Kept here so useActionState has the expected shape.
  | { status: 'ok'; slug: string }

function isUniqueConstraintViolation(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes('duplicate') || msg.includes('unique')
}

// UX check for slug availability. Called from BookForm as the user
// types in the slug field, to surface collisions early instead of
// waiting for a full form submission. The DB UNIQUE constraint remains
// the ultimate lock (see createBook).
//
// `excludeBookId` lets edit mode ignore the current book's own row
// (otherwise a book would conflict with itself).
export async function checkSlugAvailable(
  slug: string,
  excludeBookId?: string,
): Promise<{ available: boolean }> {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return { available: true }

  const whereClause = excludeBookId
    ? and(eq(books.slug, normalized), ne(books.id, excludeBookId))
    : eq(books.slug, normalized)

  const rows = await db.select({ id: books.id }).from(books).where(whereClause).limit(1)
  return { available: rows.length === 0 }
}

export async function createBook(
  _prev: BookFormResult | null,
  formData: FormData,
): Promise<BookFormResult> {
  await requireAdmin('/books/create')

  // Author = the connected admin's username. The username guard in
  // proxy.ts ensures a username exists before an admin can create.
  const profile = await getCurrentProfile()
  if (!profile?.username) {
    return {
      status: 'error',
      errors: ['Profil sans pseudo : choisis un pseudo avant de créer un livre.'],
    }
  }

  const parsed = parseBookForm(formData)
  if (!parsed.ok) return { status: 'error', errors: parsed.errors }

  try {
    await db.insert(books).values({
      slug: parsed.metadata.slug,
      title: parsed.metadata.title,
      // author (text) = frozen snapshot; authorId (FK) = canonical
      // source for display. See lib/db/books.ts resolveAuthor().
      author: profile.username,
      authorId: profile.id,
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

  redirect(`/books/${parsed.metadata.slug}`)
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
    // `author` is intentionally absent from .set(): we preserve the
    // original author so an admin editing another admin's book does
    // not accidentally claim it.
    await db
      .update(books)
      .set({
        slug: parsed.metadata.slug,
        title: parsed.metadata.title,
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

  redirect(`/books/${parsed.metadata.slug}`)
}

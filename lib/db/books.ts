import { desc, eq } from 'drizzle-orm'
import { db } from './client'
import { books } from './schema'
import type { Book } from '@/lib/reader/types'

// Le CHECK constraint en DB garantit tier in ('free','premium'). On caste
// a la lecture pour preserver l'union TS sans double validation applicative.
function rowToBook(row: typeof books.$inferSelect): Book {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    coverImage: row.coverImage,
    synopsis: row.synopsis,
    genre: row.genre,
    tags: row.tags,
    estimatedMinutes: row.estimatedMinutes,
    tier: row.tier as 'free' | 'premium',
    publishedAt: row.publishedAt,
    content: row.content,
  }
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const rows = await db.select().from(books).where(eq(books.slug, slug)).limit(1)
  return rows[0] ? rowToBook(rows[0]) : null
}

export type BookSummary = Omit<Book, 'content'>

function summariesQuery() {
  return db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      author: books.author,
      coverImage: books.coverImage,
      synopsis: books.synopsis,
      genre: books.genre,
      tags: books.tags,
      estimatedMinutes: books.estimatedMinutes,
      tier: books.tier,
      publishedAt: books.publishedAt,
    })
    .from(books)
}

// Catalogue public : uniquement les livres publies (publishedAt non null).
export async function listPublishedSummaries(): Promise<BookSummary[]> {
  const rows = await summariesQuery().orderBy(desc(books.publishedAt))
  return rows
    .filter((r) => r.publishedAt !== null)
    .map((r) => ({ ...r, tier: r.tier as 'free' | 'premium' }))
}

// Dashboard admin : toutes les rows, brouillons inclus, plus recentes en tete.
export async function listAllSummaries(): Promise<BookSummary[]> {
  const rows = await summariesQuery().orderBy(desc(books.createdAt))
  return rows.map((r) => ({ ...r, tier: r.tier as 'free' | 'premium' }))
}

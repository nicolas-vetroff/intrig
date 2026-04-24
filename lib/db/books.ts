import { desc, eq } from 'drizzle-orm'
import { db } from './client'
import { books, profiles } from './schema'
import type { Book } from '@/lib/reader/types'

// The CHECK constraint in the DB guarantees tier in ('free','premium').
// We cast on read to preserve the TS union without a second app-level
// validation pass.
//
// `author` display: we prefer `profiles.username` (LEFT JOIN via
// books.author_id) so username changes propagate automatically. If the
// FK is null (seed without user, deleted profile), we fall back to
// `books.author` (frozen text snapshot written at creation time).
function resolveAuthor(authorText: string, username: string | null): string {
  return username ?? authorText
}

function rowToBook(row: typeof books.$inferSelect, username: string | null): Book {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: resolveAuthor(row.author, username),
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
  const rows = await db
    .select({ book: books, username: profiles.username })
    .from(books)
    .leftJoin(profiles, eq(profiles.id, books.authorId))
    .where(eq(books.slug, slug))
    .limit(1)
  const row = rows[0]
  return row ? rowToBook(row.book, row.username) : null
}

export type BookSummary = Omit<Book, 'content'>

function summariesQuery() {
  return db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      author: books.author,
      authorUsername: profiles.username,
      coverImage: books.coverImage,
      synopsis: books.synopsis,
      genre: books.genre,
      tags: books.tags,
      estimatedMinutes: books.estimatedMinutes,
      tier: books.tier,
      publishedAt: books.publishedAt,
    })
    .from(books)
    .leftJoin(profiles, eq(profiles.id, books.authorId))
}

type SummaryRow = Awaited<ReturnType<ReturnType<typeof summariesQuery>['execute']>>[number]

function rowToSummary(row: SummaryRow): BookSummary {
  const { authorUsername, author, tier, ...rest } = row
  return {
    ...rest,
    author: resolveAuthor(author, authorUsername),
    tier: tier as 'free' | 'premium',
  }
}

// Public catalog: only published books (publishedAt not null).
export async function listPublishedSummaries(): Promise<BookSummary[]> {
  const rows = await summariesQuery().orderBy(desc(books.publishedAt))
  return rows.filter((r) => r.publishedAt !== null).map(rowToSummary)
}

// Admin dashboard: all rows including drafts, newest first.
export async function listAllSummaries(): Promise<BookSummary[]> {
  const rows = await summariesQuery().orderBy(desc(books.createdAt))
  return rows.map(rowToSummary)
}

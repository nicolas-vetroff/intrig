import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { BookContent, VariableValue } from '@/lib/reader/types'

// profiles.id references `auth.users(id)` (Supabase Auth schema). The
// cross-schema FK and the sync trigger live in migration
// 0002_profiles_sync.sql (out of Drizzle's scope). `username` is
// nullable: it must be picked on first login via /account/choose-username.
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey(),
  email: text().notNull(),
  username: text().unique(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const books = pgTable(
  'books',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text().notNull().unique(),
    title: text().notNull(),
    // `author`: frozen text snapshot of the author at creation time.
    // Used as a fallback when `authorId` is null (seed, import without
    // a user, deleted profile). For canonical display we JOIN on
    // profiles and prefer `profiles.username` when available.
    author: text().notNull(),
    // `authorId`: FK to profiles.id. NULL allowed (fallback case).
    // ON DELETE SET NULL preserves books even when the author deletes
    // their account — we fall back to the text snapshot.
    authorId: uuid().references(() => profiles.id, { onDelete: 'set null' }),
    coverImage: text(),
    synopsis: text(),
    genre: text(),
    tags: text().array(),
    estimatedMinutes: integer(),
    tier: text().notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    content: jsonb().notNull().$type<BookContent>(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check('books_tier_check', sql`${t.tier} in ('free', 'premium')`)],
)

export const userProgress = pgTable(
  'user_progress',
  {
    userId: uuid().notNull(),
    bookId: uuid()
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    currentNodeId: text().notNull(),
    variables: jsonb().notNull().$type<Record<string, VariableValue>>().default({}),
    history: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    reachedEndings: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bookId] })],
)

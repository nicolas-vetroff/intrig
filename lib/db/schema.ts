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

// profiles.id refere `auth.users(id)` (schema Supabase Auth). La FK
// inter-schema et le trigger de synchronisation sont poses dans la
// migration 0002_profiles_sync.sql (hors scope Drizzle). Nullable
// username : doit etre choisi au premier login via /compte/choisir-pseudo.
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey(),
  email: text().notNull(),
  username: text().unique(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const waitlist = pgTable('waitlist', {
  id: uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text().notNull().unique(),
  source: text(),
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
    author: text().notNull(),
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

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

// TODO: profiles.id refere `auth.users(id)` (schema Supabase Auth). La FK
// inter-schema ne peut pas etre declaree depuis Drizzle ; a ajouter via une
// migration SQL manuelle + trigger de creation automatique a l'inscription.
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey(),
  email: text().notNull(),
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
    // TODO: typer `content` avec BookContent depuis lib/reader/types.ts
    // des que le moteur est en place : .$type<BookContent>()
    content: jsonb().notNull(),
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
    variables: jsonb().notNull().default({}),
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

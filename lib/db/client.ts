import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquante dans l\'environnement')
}

// prepare: false est requis sur le pooler transactionnel Supabase (PgBouncer)
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false })

export const db = drizzle(queryClient, { schema, casing: 'snake_case' })

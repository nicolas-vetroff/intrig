import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

let cached: Database | null = null

function getClient(): Database {
  if (cached) return cached
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL manquante dans l\'environnement')
  }
  // prepare: false est requis sur le pooler transactionnel Supabase (PgBouncer).
  cached = drizzle(postgres(url, { prepare: false }), {
    schema,
    casing: 'snake_case',
  })
  return cached
}

// Proxy lazy : importer `db` ne touche pas a l'env tant qu'on n'appelle pas
// une methode (permet le prerender statique sans DATABASE_URL en CI/build).
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})

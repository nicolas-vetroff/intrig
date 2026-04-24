import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

let cached: Database | null = null

function getClient(): Database {
  if (cached) return cached
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL missing from the environment')
  }
  // prepare: false is required on Supabase's transaction pooler (PgBouncer).
  cached = drizzle(postgres(url, { prepare: false }), {
    schema,
    casing: 'snake_case',
  })
  return cached
}

// Lazy proxy: importing `db` does not touch the env until a method is
// called (lets the static prerender succeed without DATABASE_URL in CI/build).
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})

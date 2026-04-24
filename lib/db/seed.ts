// Run with DATABASE_URL in the env: `npm run db:seed`.
// Reads every `*.json` file under content/, validates it, and upserts
// it into the books table. Conflict target = slug (UNIQUE) so running
// the seed again refreshes the row in place.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateBookContent } from '@/lib/reader/validation'
import type { Book } from '@/lib/reader/types'
import { db } from './client'
import { books } from './schema'

const CONTENT_DIR = join(process.cwd(), 'content')

type RawBook = Omit<Book, 'id' | 'publishedAt' | 'content'> & {
  id?: string
  publishedAt: string | null
  content: unknown
}

async function loadBooks(): Promise<Book[]> {
  const entries = await readdir(CONTENT_DIR)
  const jsonFiles = entries.filter((f) => f.endsWith('.json'))
  const loaded: Book[] = []

  for (const file of jsonFiles) {
    const raw = await readFile(join(CONTENT_DIR, file), 'utf8')
    const parsed = JSON.parse(raw) as RawBook

    const contentResult = validateBookContent(parsed.content)
    if (!contentResult.ok) {
      throw new Error(`[seed] ${file}: invalid BookContent\n  - ${contentResult.errors.join('\n  - ')}`)
    }

    loaded.push({
      id: parsed.id ?? '',
      slug: parsed.slug,
      title: parsed.title,
      author: parsed.author,
      coverImage: parsed.coverImage,
      synopsis: parsed.synopsis,
      genre: parsed.genre,
      tags: parsed.tags,
      estimatedMinutes: parsed.estimatedMinutes,
      tier: parsed.tier,
      publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
      content: contentResult.value,
    })
  }

  return loaded
}

async function main() {
  const catalog = await loadBooks()
  if (catalog.length === 0) {
    console.log('[seed] no JSON files found in content/, nothing to seed')
    return
  }

  for (const book of catalog) {
    // Let the DB generate the id on first insert (gen_random_uuid()),
    // and use the slug UNIQUE constraint as the idempotency anchor so
    // re-runs refresh the row in place.
    const values = {
      slug: book.slug,
      title: book.title,
      author: book.author,
      coverImage: book.coverImage,
      synopsis: book.synopsis,
      genre: book.genre,
      tags: book.tags,
      estimatedMinutes: book.estimatedMinutes,
      tier: book.tier,
      publishedAt: book.publishedAt,
      content: book.content,
    }

    await db
      .insert(books)
      .values(values)
      .onConflictDoUpdate({ target: books.slug, set: values })

    console.log(`[seed] OK: ${book.slug}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] error:', err)
    process.exit(1)
  })

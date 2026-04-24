// Run with DATABASE_URL in the env (via docker compose or local shell).
import { laChambreSecrete } from '@/content/la-chambre-secrete'
import { db } from './client'
import { books } from './schema'

async function main() {
  const values = {
    id: laChambreSecrete.id,
    slug: laChambreSecrete.slug,
    title: laChambreSecrete.title,
    author: laChambreSecrete.author,
    coverImage: laChambreSecrete.coverImage,
    synopsis: laChambreSecrete.synopsis,
    genre: laChambreSecrete.genre,
    tags: laChambreSecrete.tags,
    estimatedMinutes: laChambreSecrete.estimatedMinutes,
    tier: laChambreSecrete.tier,
    publishedAt: laChambreSecrete.publishedAt,
    content: laChambreSecrete.content,
  }

  await db
    .insert(books)
    .values(values)
    .onConflictDoUpdate({
      target: books.id,
      set: {
        slug: values.slug,
        title: values.title,
        author: values.author,
        coverImage: values.coverImage,
        synopsis: values.synopsis,
        genre: values.genre,
        tags: values.tags,
        estimatedMinutes: values.estimatedMinutes,
        tier: values.tier,
        publishedAt: values.publishedAt,
        content: values.content,
      },
    })

  console.log(`[seed] OK: ${values.slug}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] error:', err)
    process.exit(1)
  })

'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { userProgress } from '@/lib/db/schema'
import type { ReaderState } from '@/lib/reader/runtime'
import { readSessionId, requireSessionId } from '@/lib/reader/session'

export async function loadProgress(bookId: string): Promise<ReaderState | null> {
  const userId = await readSessionId()
  if (!userId) return null

  const rows = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.bookId, bookId)))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    currentNodeId: row.currentNodeId,
    variables: row.variables,
    history: row.history,
    reachedEndings: row.reachedEndings,
  }
}

export async function saveProgress(bookId: string, state: ReaderState): Promise<void> {
  const userId = await requireSessionId()
  const now = new Date()

  await db
    .insert(userProgress)
    .values({
      userId,
      bookId,
      currentNodeId: state.currentNodeId,
      variables: state.variables,
      history: state.history,
      reachedEndings: state.reachedEndings,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.bookId],
      set: {
        currentNodeId: state.currentNodeId,
        variables: state.variables,
        history: state.history,
        reachedEndings: state.reachedEndings,
        updatedAt: now,
      },
    })
}

export async function resetProgress(bookId: string): Promise<void> {
  const userId = await readSessionId()
  if (!userId) return
  await db
    .delete(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.bookId, bookId)))
}

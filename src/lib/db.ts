import Dexie, { type EntityTable } from 'dexie'
import type { Verse, Attempt, ReviewState, Settings } from './types'

export class MemoryDB extends Dexie {
  verses!: EntityTable<Verse, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  reviews!: EntityTable<ReviewState, 'verseId'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('bible-memory')
    this.version(1).stores({
      verses: '++id, reference, translation, createdAt',
      attempts: '++id, verseId, mode, at',
      reviews: 'verseId, due',
      settings: 'id',
    })
  }
}

export const db = new MemoryDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  defaultTranslation: 'web',
  dailyGoal: 3,
  theme: 'system',
  speechEnabled: true,
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('settings')) ?? DEFAULT_SETTINGS
}

/** Ask the browser not to evict our data (helps on iOS/Safari). */
export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage?.persist) {
    try { return await navigator.storage.persist() } catch { return false }
  }
  return false
}

export async function exportAll() {
  const [verses, attempts, reviews, settings] = await Promise.all([
    db.verses.toArray(), db.attempts.toArray(), db.reviews.toArray(), db.settings.toArray(),
  ])
  return { version: 1, exportedAt: Date.now(), verses, attempts, reviews, settings }
}

export async function importAll(data: Awaited<ReturnType<typeof exportAll>>) {
  await db.transaction('rw', db.verses, db.attempts, db.reviews, db.settings, async () => {
    await db.verses.bulkPut(data.verses)
    await db.attempts.bulkPut(data.attempts)
    await db.reviews.bulkPut(data.reviews)
    await db.settings.bulkPut(data.settings)
  })
}

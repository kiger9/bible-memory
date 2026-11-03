/**
 * API.Bible's acceptable-use terms require cached text to be refreshed from the API at least every
 * 30 days. NASB verses remember when their text was fetched; on launch, stale ones are re-fetched
 * and updated in place if the publisher's text changed.
 */
import { db } from './db'
import { fetchPassage } from './bible'
import { BOOKS } from './books'
import { tokenize } from './text'
import { scheduleSync } from './sync'

const MAX_AGE = 30 * 24 * 60 * 60 * 1000

export async function refreshLicensedText() {
  const cutoff = Date.now() - MAX_AGE
  const stale = (await db.verses.where('translation').equals('nasb').toArray()).filter(v => (v.fetchedAt ?? 0) < cutoff)
  let changed = false
  for (const v of stale) {
    const book = BOOKS.find(b => b.id === v.bookId)
    if (!book) continue
    try {
      const fresh = await fetchPassage({ book, chapter: v.chapter, verseStart: v.verseStart, verseEnd: v.verseEnd, canonical: v.reference }, 'nasb')
      const same = fresh.text === v.text
      await db.verses.update(v.id!, same ? { fetchedAt: Date.now() } : { text: fresh.text, words: tokenize(fresh.text), chunks: undefined, fetchedAt: Date.now() })
      changed ||= !same
    } catch { /* offline or key missing; try again next launch */ }
  }
  if (changed) scheduleSync()
}

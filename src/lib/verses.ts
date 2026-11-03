/** Shared "memorize this passage" pipeline used by Add Verse and Study Plans. */
import { db, getSettings } from './db'
import { fetchPassage, getTranslation, type FetchedPassage } from './bible'
import type { ParsedRef } from './refs'
import { tokenize } from './text'
import { newReviewState } from './srs'
import { scheduleSync } from './sync'
import type { ThoughtChunk, TranslationId, Verse } from './types'

/** Ask Claude for thought-chunk hints. Optional: first-letter and reveal hints work without them. */
export async function fetchChunks(reference: string, translationLabel: string, words: string[]): Promise<ThoughtChunk[] | undefined> {
  try {
    const r = await fetch('/api/hints', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, translation: translationLabel, words }),
    })
    if (r.ok) return (await r.json()).chunks
  } catch { /* hints are optional */ }
  return undefined
}

/** A verse already saved for this passage and translation, if any (matched on canonical reference). */
export async function findExisting(canonical: string, translation: TranslationId): Promise<Verse | undefined> {
  const matches = await db.verses.where('reference').equals(canonical).toArray()
  return matches.find(v => v.translation === translation)
}

export interface AddOptions {
  /** Already-fetched text (Add Verse shows a preview first). Fetched here if omitted. */
  passage?: FetchedPassage
  /** For 'custom' text: the label the person typed, e.g. "NLT". */
  translationLabel?: string
  /** Remember this translation as the default for next time (true for Add Verse). */
  rememberTranslation?: boolean
}

/** Fetch (unless given), generate hints, save the verse with a fresh review card, and schedule a backup. Returns the new verse id. */
export async function addVerse(parsed: ParsedRef, translation: TranslationId, opts: AddOptions = {}): Promise<number> {
  const passage = opts.passage ?? await fetchPassage(parsed, translation)
  const words = tokenize(passage.text)
  const isManual = translation === 'custom'
  const label = isManual ? (opts.translationLabel?.trim() || 'Own') : getTranslation(translation).abbr
  // Our canonical spelling keeps references consistent across sources ("Psalm" vs "Psalms"); a whole-chapter
  // request keeps the source's reference because it carries the verse count ("Romans 8:1-39").
  const reference = parsed.verseEnd === 999 ? passage.reference : parsed.canonical
  const chunks = await fetchChunks(reference, label, words)
  const id = await db.verses.add({
    reference, bookId: parsed.book.id, chapter: parsed.chapter,
    verseStart: parsed.verseStart, verseEnd: passage.verseEnd,
    chapterEnd: parsed.chapterEnd !== parsed.chapter ? parsed.chapterEnd : undefined,
    translation, translationLabel: isManual ? label : undefined,
    text: passage.text, words, chunks, createdAt: Date.now(), fetchedAt: Date.now(),
  }) as number
  await db.reviews.put(newReviewState(id))
  if (opts.rememberTranslation) await db.settings.put({ ...(await getSettings()), defaultTranslation: translation })
  scheduleSync(1000)
  return id
}

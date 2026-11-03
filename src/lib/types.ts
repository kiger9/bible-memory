export type TranslationId = 'nasb' | 'niv' | 'nkjv' | 'web' | 'kjv' | 'asv' | 'bbe' | 'darby' | 'ylt' | 'esv' | 'lsb' | 'custom'

export interface Translation {
  id: TranslationId
  name: string
  abbr: string
  /** 'direct' = browser calls the public API; 'proxy' = goes through /api (needs a key) */
  source: 'direct' | 'proxy' | 'manual'
  attribution: string
  /** Text provider that requires its own visible credit (API.Bible Starter plan terms). */
  provider?: 'api.bible'
}

/** One contiguous passage the user wants to memorize. */
export interface Verse {
  id?: number
  reference: string          // canonical, e.g. "John 3:16" or "Psalm 23:1-3"
  bookId: string             // e.g. "JHN"
  chapter: number
  verseStart: number
  verseEnd: number
  translation: TranslationId
  translationLabel?: string   // e.g. "NIV" when translation === 'custom'
  text: string               // plain text, verse numbers stripped
  words: string[]            // tokenized text (display tokens, punctuation kept)
  chunks?: ThoughtChunk[]    // LLM-generated hint structure (optional until fetched)
  createdAt: number
  fetchedAt?: number         // when the text was last fetched from its provider (licensed text is refreshed every 30 days)
  tags?: string[]
}

/** A phrase-level unit used for "summary of the next thought" hints. */
export interface ThoughtChunk {
  startWord: number          // inclusive index into Verse.words
  endWord: number            // inclusive
  gist: string               // one-line plain-language summary of this phrase
  keyword?: string           // a single anchor word or image for the phrase
}

export type Mode = 'read' | 'type' | 'speak' | 'firstletter' | 'quiz'

export interface Attempt {
  id?: number
  verseId: number
  mode: Mode
  accuracy: number           // 0..1 word-level
  hintsUsed: number
  durationMs: number
  at: number
  details?: unknown
}

/** FSRS scheduling state, one row per verse. */
export interface ReviewState {
  verseId: number
  due: number
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  state: number              // ts-fsrs State enum value
  lastReview?: number
}

export interface Settings {
  id: 'settings'
  defaultTranslation: TranslationId
  dailyGoal: number
  theme: 'system' | 'light' | 'dark'
  speechEnabled: boolean
}

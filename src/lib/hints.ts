import type { Verse, ThoughtChunk } from './types'
import { firstLetters } from './text'

/** Hint ladder for the phrase containing word index `at`. Level 1 = gist, 2 = first letters, 3 = first word, 4 = reveal phrase. */
export function chunkAt(verse: Verse, at: number): ThoughtChunk {
  const c = verse.chunks?.find(c => at >= c.startWord && at <= c.endWord)
  if (c) return c
  // Fallback when no LLM chunks: a sliding window of ~6 words, no gist.
  const start = Math.max(0, at - (at % 6)), end = Math.min(verse.words.length - 1, start + 5)
  return { startWord: start, endWord: end, gist: '' }
}

export function hintText(verse: Verse, at: number, level: number): { label: string; text: string } {
  const c = chunkAt(verse, at)
  const words = verse.words.slice(at, c.endWord + 1)
  switch (level) {
    case 1: return { label: 'Next thought', text: c.gist || `About ${words.length} words to the next pause.` + (c.keyword ? ` Think: ${c.keyword}.` : '') }
    case 2: return { label: 'First letters', text: firstLetters(words) }
    case 3: return { label: 'First word', text: words[0] }
    default: return { label: 'The phrase', text: words.join(' ') }
  }
}

import { findBook, type Book } from './books'

export interface ParsedRef {
  book: Book
  chapter: number
  verseStart: number
  verseEnd: number
  canonical: string
}

/**
 * Parses references like "John 3:16", "Ps 23:1-3", "1 Cor 13:4–7", "Romans 8".
 * Single-chapter passages only (v1). Returns an error string on failure.
 */
export function parseReference(input: string): ParsedRef | { error: string } {
  const s = input.trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ')
  const m = s.match(/^((?:[1-3]|i{1,3})?\s*[a-z]+(?:\s+(?:of\s+)?[a-z]+)*)\.?\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/i)
  if (!m) return { error: 'Try a reference like "John 3:16" or "Psalm 23:1-3".' }
  const [, bookRaw, chapRaw, vsRaw, veRaw] = m
  const book = findBook(bookRaw)
  if (!book) return { error: `I don't recognize the book "${bookRaw}".` }
  const chapter = Number(chapRaw)
  if (chapter < 1 || chapter > book.chapters) return { error: `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? '' : 's'}.` }
  const verseStart = vsRaw ? Number(vsRaw) : 1
  const verseEnd = veRaw ? Number(veRaw) : vsRaw ? verseStart : 999
  if (verseEnd < verseStart) return { error: 'The verse range is backwards.' }
  const range = vsRaw ? `:${verseStart}${verseEnd !== verseStart ? `-${verseEnd}` : ''}` : ''
  return { book, chapter, verseStart, verseEnd, canonical: `${book.name} ${chapter}${range}` }
}

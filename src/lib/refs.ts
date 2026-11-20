import { findBook, BOOKS, type Book } from './books'

export interface ParsedRef {
  book: Book
  chapter: number
  verseStart: number
  verseEnd: number
  /** Last chapter of the passage; equals `chapter` unless the range crosses into a later chapter. */
  chapterEnd: number
  canonical: string
}

/**
 * Parses references like "John 3:16", "Ps 23:1-3", "1 Cor 13:4–7", "Romans 8", "2 Tim 3:16-4:5".
 * Returns an error string on failure.
 */
export function parseReference(input: string): ParsedRef | { error: string } {
  const s = input.trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ')
  const m = s.match(/^((?:[1-3]|i{1,3})?\s*[a-z]+(?:\s+(?:of\s+)?[a-z]+)*)\.?\s+(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?)?$/i)
  if (!m) return { error: 'Try a reference like "John 3:16" or "Psalm 23:1-3".' }
  const [, bookRaw, chapRaw, vsRaw, ceRaw, veRaw] = m
  const book = findBook(bookRaw)
  if (!book) return { error: `I don't recognize the book "${bookRaw}".` }
  const chapter = Number(chapRaw)
  if (chapter < 1 || chapter > book.chapters) return { error: `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? '' : 's'}.` }
  const verseStart = vsRaw ? Number(vsRaw) : 1
  const verseEnd = veRaw ? Number(veRaw) : vsRaw ? verseStart : 999
  const chapterEnd = ceRaw ? Number(ceRaw) : chapter
  if (chapterEnd < chapter) return { error: 'The chapter range is backwards.' }
  if (chapterEnd > book.chapters) return { error: `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? '' : 's'}.` }
  if (chapterEnd === chapter && verseEnd < verseStart) return { error: 'The verse range is backwards.' }
  const range = !vsRaw ? '' : chapterEnd !== chapter ? `:${verseStart}-${chapterEnd}:${verseEnd}` : `:${verseStart}${verseEnd !== verseStart ? `-${verseEnd}` : ''}`
  return { book, chapter, verseStart, verseEnd, chapterEnd, canonical: `${book.name} ${chapter}${range}` }
}

/** Rebuild a reference from a stored verse's fields (for refetching). */
export function refFromVerse(v: { bookId: string; chapter: number; verseStart: number; verseEnd: number; chapterEnd?: number }): ParsedRef | null {
  const book = BOOKS.find(b => b.id === v.bookId)
  if (!book) return null
  const chapterEnd = v.chapterEnd ?? v.chapter
  const range = chapterEnd !== v.chapter ? `:${v.verseStart}-${chapterEnd}:${v.verseEnd}` : `:${v.verseStart}${v.verseEnd !== v.verseStart ? `-${v.verseEnd}` : ''}`
  return { book, chapter: v.chapter, verseStart: v.verseStart, verseEnd: v.verseEnd, chapterEnd, canonical: `${book.name} ${v.chapter}${range}` }
}

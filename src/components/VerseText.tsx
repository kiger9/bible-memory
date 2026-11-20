import { tokenize } from '../lib/text'

interface Props { text: string; reference: string; verseStarts?: { n: number; word: number }[]; chapter?: number }

export default function VerseText({ text, reference, verseStarts, chapter }: Props) {
  return (
    <figure className="verse">
      <blockquote className="verse-text">
        {verseStarts?.length ? <NumberedWords words={tokenize(text)} verseStarts={verseStarts} chapter={chapter} /> : text}
      </blockquote>
      <figcaption className="verse-ref">{reference}</figcaption>
    </figure>
  )
}

/** Words with a small verse number before the first word of each verse. When numbering restarts, the passage has
 *  crossed into the next chapter, so that verse is labelled "chapter:verse". */
export function NumberedWords({ words, verseStarts, chapter }: { words: string[]; verseStarts: { n: number; word: number }[]; chapter?: number }) {
  const labels = new Map<number, string>()
  let c = chapter ?? 0, prev = -1
  for (const v of verseStarts) {
    const restart = prev >= 0 && v.n <= prev
    if (restart) c++
    labels.set(v.word, restart && chapter ? `${c}:${v.n}` : String(v.n))
    prev = v.n
  }
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          {labels.has(i) && <sup className="vnum">{labels.get(i)}</sup>}
          {w}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

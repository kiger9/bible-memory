import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { normalizeWord } from '../lib/text'
import type { Verse } from '../lib/types'
import Header from '../components/Header'

type Q =
  | { kind: 'ref'; verse: Verse; options: string[]; answer: string }
  | { kind: 'blank'; verse: Verse; blankIndex: number; options: string[]; answer: string }

function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }

function makeQuestions(verses: Verse[], n = 8): Q[] {
  const qs: Q[] = []
  const refs = verses.map(v => v.reference)
  for (let i = 0; i < n; i++) {
    const verse = pick(verses)
    if (verses.length >= 3 && Math.random() < 0.5) {
      const others = shuffle(refs.filter(r => r !== verse.reference)).slice(0, 3)
      qs.push({ kind: 'ref', verse, options: shuffle([verse.reference, ...others]), answer: verse.reference })
    } else {
      const candidates = verse.words.map((w, i) => [w, i] as const).filter(([w]) => normalizeWord(w).length >= 4)
      const [answer, blankIndex] = candidates.length ? pick(candidates) : [verse.words[0], 0]
      const pool = verses.flatMap(v => v.words).filter(w => normalizeWord(w).length >= 4 && normalizeWord(w) !== normalizeWord(answer))
      const distractors = shuffle([...new Set(pool.map(w => w.replace(/[^\w']/g, '')))]).slice(0, 3)
      qs.push({ kind: 'blank', verse, blankIndex, options: shuffle([answer.replace(/[^\w']/g, ''), ...distractors]), answer: answer.replace(/[^\w']/g, '') })
    }
  }
  return qs
}

export default function Quiz() {
  const verses = useLiveQuery(() => db.verses.toArray(), [])
  const [seed, setSeed] = useState(0)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const qs = useMemo(() => (verses?.length ? makeQuestions(verses) : []), [verses, seed])

  if (!verses) return null
  if (verses.length === 0) return (<><Header title="Pop quiz" /><p className="lede">Add a couple of verses first, then come back for a quiz.</p></>)
  if (i >= qs.length) return (
    <>
      <Header title="Pop quiz" />
      <section className="result">
        <p className="score">{score} / {qs.length}</p>
        <button className="button primary" onClick={() => { setSeed(s => s + 1); setI(0); setScore(0); setChosen(null) }}>Play again</button>
      </section>
    </>
  )
  const q = qs[i]
  function answer(opt: string) {
    if (chosen) return
    setChosen(opt)
    if (opt === q.answer) setScore(s => s + 1)
    setTimeout(() => { setChosen(null); setI(n => n + 1) }, 900)
  }
  return (
    <>
      <Header title="Pop quiz" />
      <p className="muted">Question {i + 1} of {qs.length}</p>
      {q.kind === 'ref' ? (
        <blockquote className="verse-text">{q.verse.text}</blockquote>
      ) : (
        <blockquote className="verse-text">
          {q.verse.words.map((w, k) => k === q.blankIndex ? <span key={k} className="blank">_____ </span> : w + ' ')}
        </blockquote>
      )}
      <p className="muted">{q.kind === 'ref' ? 'Where is this from?' : `Fill the blank · ${q.verse.reference}`}</p>
      <div className="options">
        {q.options.map(o => (
          <button key={o} className={'button option' + (chosen ? (o === q.answer ? ' right' : o === chosen ? ' wrong' : '') : '')} onClick={() => answer(o)}>{o}</button>
        ))}
      </div>
    </>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { tokenize, wordDiff, normalizeWord, type DiffOp } from '../lib/text'
import { hintText } from '../lib/hints'
import { gradeFromAccuracy, newReviewState, penalize, review } from '../lib/srs'
import { parseReference } from '../lib/refs'
import { speechMethod, startListening, startRecording } from '../lib/speech'
import { scheduleSync } from '../lib/sync'
import type { Mode, Verse } from '../lib/types'
import Header from '../components/Header'
import VerseText from '../components/VerseText'

const MODES: { id: Mode; label: string }[] = [
  { id: 'read', label: 'Read' }, { id: 'firstletter', label: 'Letters' }, { id: 'type', label: 'Type' }, { id: 'speak', label: 'Speak' }, { id: 'ref', label: 'Where?' },
]

/**
 * A review from Today (?review=1) has two steps: first say where the verse is from, with the full
 * text showing, then recite it. Missing the reference makes the recall grade one step harsher.
 */
export default function Practice() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const isReview = params.get('review') === '1'
  const [attribution, setAttribution] = useState<'hit' | 'miss' | null>(null)
  const mode = (params.get('mode') as Mode) || (isReview && attribution ? 'type' : 'read')
  const verse = useLiveQuery(() => db.verses.get(Number(id)), [id])
  const penalty = attribution === 'miss'
  if (!verse) return <Header title="…" back="/verses" />
  if (isReview && !attribution) {
    return (
      <>
        <Header title="Review" back="/" />
        <RefMode key={verse.id} verse={verse} onDone={hit => { setAttribution(hit ? 'hit' : 'miss'); setParams({ mode: 'type', review: '1' }, { replace: true }) }} />
      </>
    )
  }
  return (
    <>
      <Header title={verse.reference} back={isReview ? '/' : '/verses'} />
      <div className="segmented" role="tablist">
        {MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={'seg' + (mode === m.id ? ' active' : '')} onClick={() => setParams(isReview ? { mode: m.id, review: '1' } : { mode: m.id })}>{m.label}</button>
        ))}
      </div>
      {isReview && <p className="muted">{penalty ? 'The reference slipped; nail the words now.' : 'Reference right. Now the words.'}</p>}
      {mode === 'read' && <ReadMode verse={verse} />}
      {mode === 'firstletter' && <FirstLetterMode key={verse.id} verse={verse} penalty={penalty} />}
      {mode === 'type' && <TypeMode key={verse.id} verse={verse} penalty={penalty} />}
      {mode === 'speak' && <SpeakMode key={verse.id} verse={verse} penalty={penalty} />}
      {mode === 'ref' && <RefMode key={verse.id} verse={verse} />}
    </>
  )
}

/* ---------- helpers ---------- */

async function recordAttempt(verse: Verse, mode: Mode, accuracy: number, hintsUsed: number, startedAt: number, penalty = false) {
  await db.attempts.add({ verseId: verse.id!, mode, accuracy, hintsUsed, durationMs: Date.now() - startedAt, at: Date.now() })
  scheduleSync()
  if (mode === 'read' || mode === 'ref') return
  const state = (await db.reviews.get(verse.id!)) ?? newReviewState(verse.id!)
  const grade = gradeFromAccuracy(accuracy, hintsUsed)
  await db.reviews.put(review(state, penalty ? penalize(grade) : grade))
}

const sameRef = (a: string, b: string) => a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase()
function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

/** Attribution: the full text is shown; say where it is from. Multiple choice once the library has four references, typed before that. */
function RefMode({ verse, onDone }: { verse: Verse; onDone?: (hit: boolean) => void }) {
  const refs = useLiveQuery(async () => [...new Set((await db.verses.toArray()).map(v => v.reference))], [])
  const [typed, setTyped] = useState('')
  const [answer, setAnswer] = useState<{ given: string; hit: boolean } | null>(null)
  const started = useRef(Date.now())
  const options = useMemo(() => {
    if (!refs || refs.length < 4) return null
    return shuffle([verse.reference, ...shuffle(refs.filter(r => r !== verse.reference)).slice(0, 3)])
  }, [refs, verse.reference])
  if (!refs) return null

  function submit(given: string) {
    if (answer) return
    const parsed = parseReference(given)
    const hit = sameRef(given, verse.reference) || (!('error' in parsed) && sameRef(parsed.canonical, verse.reference))
    setAnswer({ given, hit })
    recordAttempt(verse, 'ref', hit ? 1 : 0, 0, started.current)
  }
  function again() { setAnswer(null); setTyped(''); started.current = Date.now() }

  return (
    <section>
      <VerseText text={verse.text} reference={verse.translationLabel ?? verse.translation.toUpperCase()} />
      <p className="muted">Where is this from?</p>
      {options ? (
        <div className="options">
          {options.map(o => (
            <button key={o} className={'button option' + (answer ? (o === verse.reference ? ' right' : o === answer.given ? ' wrong' : '') : '')} onClick={() => submit(o)} disabled={!!answer}>{o}</button>
          ))}
        </div>
      ) : (
        <form className="form" onSubmit={e => { e.preventDefault(); if (typed.trim()) submit(typed) }}>
          <label className="field"><span>Reference</span>
            <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="e.g. John 3:16" autoFocus autoCapitalize="words" autoCorrect="off" disabled={!!answer} />
          </label>
          {!answer && <button className="button primary" disabled={!typed.trim()}>Answer</button>}
        </form>
      )}
      {answer && (
        <div className="result">
          <p className={answer.hit ? 'muted' : 'error'}>{answer.hit ? 'Right.' : `It is ${verse.reference}.`}</p>
          {onDone
            ? <button className="button primary" onClick={() => onDone(answer.hit)}>Continue to the words</button>
            : <><button className="button primary" onClick={again}>Again</button><Link to="/" className="button ghost">Done</Link></>}
        </div>
      )}
    </section>
  )
}

function HintPanel({ verse, at, onUse }: { verse: Verse; at: number; onUse: () => void }) {
  const [level, setLevel] = useState(0)
  useEffect(() => { setLevel(0) }, [at])
  const h = level > 0 ? hintText(verse, at, level) : null
  return (
    <div className="hint">
      {h && <p className="hint-text"><span className="hint-label">{h.label}</span>{h.text}</p>}
      {level < 4 && <button className="button ghost" onClick={() => { setLevel(l => l + 1); onUse() }}>{level === 0 ? 'Hint' : 'More'}</button>}
    </div>
  )
}

function Result({ accuracy, ops, onAgain }: { accuracy: number; ops?: DiffOp[]; onAgain: () => void }) {
  return (
    <section className="result">
      <p className="score">{Math.round(accuracy * 100)}%</p>
      {ops && (
        <p className="diff">
          {ops.map((o, i) => (
            <span key={i} className={'w ' + o.type}>{o.type === 'extra' ? o.actual : o.expected}{' '}</span>
          ))}
        </p>
      )}
      <button className="button primary" onClick={onAgain}>Again</button>
      <Link to="/" className="button ghost">Done</Link>
    </section>
  )
}

/* ---------- modes ---------- */

function ReadMode({ verse }: { verse: Verse }) {
  const started = useRef(Date.now())
  useEffect(() => { return () => { recordAttempt(verse, 'read', 1, 0, started.current) } }, [verse])
  return (
    <section>
      <VerseText text={verse.text} reference={`${verse.reference} (${(verse.translationLabel ?? verse.translation.toUpperCase())})`} />
      {verse.chunks && (
        <ol className="chunks">
          {verse.chunks.map((c, i) => <li key={i}><strong>{c.keyword}</strong> — {c.gist}</li>)}
        </ol>
      )}
      <p className="muted">Read it aloud three times, then try <em>First letters</em>.</p>
    </section>
  )
}

/** Progressive recall: type each word; only the first letter must be right. Wrong first letter reveals the word. */
function FirstLetterMode({ verse, penalty }: { verse: Verse; penalty?: boolean }) {
  const [at, setAt] = useState(0)
  const [misses, setMisses] = useState(0)
  const [hints, setHints] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const started = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const done = at >= verse.words.length
  useEffect(() => { if (done) recordAttempt(verse, 'firstletter', Math.max(0, 1 - misses / verse.words.length), hints, started.current, penalty) }, [done])

  function onKey(e: React.ChangeEvent<HTMLInputElement>) {
    const ch = normalizeWord(e.target.value).slice(-1)
    e.target.value = ''
    if (!ch || done) return
    const want = normalizeWord(verse.words[at]).charAt(0)
    if (ch === want) { setFlash('ok'); setAt(a => a + 1) } else { setFlash('bad'); setMisses(m => m + 1) }
    setTimeout(() => setFlash(null), 150)
  }

  if (done) return <Result accuracy={Math.max(0, 1 - misses / verse.words.length)} onAgain={() => { setAt(0); setMisses(0); setHints(0); started.current = Date.now() }} />
  return (
    <section onClick={() => inputRef.current?.focus()}>
      <p className="verse-text progressive">
        {verse.words.map((w, i) => (
          <span key={i} className={'w ' + (i < at ? 'done' : i === at ? 'current ' + (flash ?? '') : 'todo')}>{i < at ? w : i === at && flash === 'bad' ? w : '•'}{' '}</span>
        ))}
      </p>
      <input ref={inputRef} className="ghost-input" autoFocus autoCapitalize="none" autoCorrect="off" onChange={onKey} aria-label="Type the first letter of the next word" />
      <HintPanel verse={verse} at={at} onUse={() => setHints(h => h + 1)} />
      <p className="muted">Type the first letter of each word. {misses > 0 && `${misses} miss${misses === 1 ? '' : 'es'}.`}</p>
    </section>
  )
}

function TypeMode({ verse, penalty }: { verse: Verse; penalty?: boolean }) {
  const [text, setText] = useState('')
  const [hints, setHints] = useState(0)
  const [result, setResult] = useState<{ accuracy: number; ops: DiffOp[] } | null>(null)
  const started = useRef(Date.now())
  const typedCount = useMemo(() => tokenize(text).length, [text])
  const at = Math.min(typedCount, verse.words.length - 1)

  function check() {
    const r = wordDiff(verse.words, tokenize(text))
    setResult(r)
    recordAttempt(verse, 'type', r.accuracy, hints, started.current, penalty)
  }
  if (result) return <Result accuracy={result.accuracy} ops={result.ops} onAgain={() => { setResult(null); setText(''); setHints(0); started.current = Date.now() }} />
  return (
    <section>
      <p className="muted">{verse.reference} · {verse.words.length} words</p>
      <textarea className="typing" value={text} onChange={e => setText(e.target.value)} rows={6} autoFocus autoCapitalize="sentences" placeholder="Type the verse from memory…" />
      <HintPanel verse={verse} at={at} onUse={() => setHints(h => h + 1)} />
      <button className="button primary" onClick={check} disabled={!text.trim()}>Check</button>
    </section>
  )
}

function SpeakMode({ verse, penalty }: { verse: Verse; penalty?: boolean }) {
  const method = useMemo(() => speechMethod(), [])
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [hints, setHints] = useState(0)
  const [result, setResult] = useState<{ accuracy: number; ops: DiffOp[] } | null>(null)
  const stopRef = useRef<() => void | Promise<void>>(() => {})
  const started = useRef(Date.now())
  const at = Math.min(tokenize(transcript).length, verse.words.length - 1)

  async function toggle() {
    if (listening) { await stopRef.current(); return }
    setError(''); setTranscript(''); setListening(true)
    if (method === 'webspeech') {
      stopRef.current = startListening(t => setTranscript(t), () => setListening(false), msg => { setError(msg); setListening(false) })
    } else {
      const stop = await startRecording(msg => { setError(msg); setListening(false) })
      stopRef.current = async () => {
        setListening(false); setTranscribing(true)
        try { setTranscript(await stop()) } finally { setTranscribing(false) }
      }
    }
  }
  function check() {
    const r = wordDiff(verse.words, tokenize(transcript))
    setResult(r)
    recordAttempt(verse, 'speak', r.accuracy, hints, started.current, penalty)
  }
  if (method === 'none') return <p className="lede">Speaking practice needs a microphone and a modern browser. Try Safari on iPhone or Chrome on Android.</p>
  if (result) return <Result accuracy={result.accuracy} ops={result.ops} onAgain={() => { setResult(null); setTranscript(''); setHints(0); started.current = Date.now() }} />
  const hasText = !!transcript.trim()
  return (
    <section>
      <p className="muted">{verse.reference} · {verse.words.length} words · say it aloud, then tap Stop.</p>
      <p className={'transcript' + (listening ? ' live' : '')}>
        {transcript || <span className="muted">{listening ? 'Listening…' : transcribing ? 'Transcribing…' : 'Your words will appear here.'}</span>}
      </p>
      {error && <p className="error">{error}</p>}
      <HintPanel verse={verse} at={at} onUse={() => setHints(h => h + 1)} />
      <div className="speak-controls">
        {listening ? (
          <button className="button mic live" onClick={toggle}>Stop</button>
        ) : hasText ? (
          <>
            <button className="button primary" onClick={check} disabled={transcribing}>Check</button>
            <button className="button ghost" onClick={toggle} disabled={transcribing}>Record again</button>
          </>
        ) : (
          <button className="button primary mic" onClick={toggle} disabled={transcribing}>{transcribing ? 'Transcribing…' : 'Start speaking'}</button>
        )}
      </div>
    </section>
  )
}

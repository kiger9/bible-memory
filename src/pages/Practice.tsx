import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { tokenize, wordDiff, normalizeWord, type DiffOp } from '../lib/text'
import { hintText } from '../lib/hints'
import { gradeFromAccuracy, newReviewState, review } from '../lib/srs'
import { speechMethod, startListening, startRecording } from '../lib/speech'
import type { Mode, Verse } from '../lib/types'
import Header from '../components/Header'
import VerseText from '../components/VerseText'

const MODES: { id: Mode; label: string }[] = [
  { id: 'read', label: 'Read' }, { id: 'firstletter', label: 'First letters' }, { id: 'type', label: 'Type' }, { id: 'speak', label: 'Speak' },
]

export default function Practice() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') as Mode) || 'read'
  const verse = useLiveQuery(() => db.verses.get(Number(id)), [id])
  if (!verse) return <Header title="…" back="/verses" />
  return (
    <>
      <Header title={verse.reference} back="/verses" />
      <div className="segmented" role="tablist">
        {MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={'seg' + (mode === m.id ? ' active' : '')} onClick={() => setParams({ mode: m.id })}>{m.label}</button>
        ))}
      </div>
      {mode === 'read' && <ReadMode verse={verse} />}
      {mode === 'firstletter' && <FirstLetterMode key={verse.id} verse={verse} />}
      {mode === 'type' && <TypeMode key={verse.id} verse={verse} />}
      {mode === 'speak' && <SpeakMode key={verse.id} verse={verse} />}
    </>
  )
}

/* ---------- helpers ---------- */

async function recordAttempt(verse: Verse, mode: Mode, accuracy: number, hintsUsed: number, startedAt: number) {
  await db.attempts.add({ verseId: verse.id!, mode, accuracy, hintsUsed, durationMs: Date.now() - startedAt, at: Date.now() })
  if (mode === 'read') return
  const state = (await db.reviews.get(verse.id!)) ?? newReviewState(verse.id!)
  await db.reviews.put(review(state, gradeFromAccuracy(accuracy, hintsUsed)))
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
function FirstLetterMode({ verse }: { verse: Verse }) {
  const [at, setAt] = useState(0)
  const [misses, setMisses] = useState(0)
  const [hints, setHints] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const started = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const done = at >= verse.words.length
  useEffect(() => { if (done) recordAttempt(verse, 'firstletter', Math.max(0, 1 - misses / verse.words.length), hints, started.current) }, [done])

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

function TypeMode({ verse }: { verse: Verse }) {
  const [text, setText] = useState('')
  const [hints, setHints] = useState(0)
  const [result, setResult] = useState<{ accuracy: number; ops: DiffOp[] } | null>(null)
  const started = useRef(Date.now())
  const typedCount = useMemo(() => tokenize(text).length, [text])
  const at = Math.min(typedCount, verse.words.length - 1)

  function check() {
    const r = wordDiff(verse.words, tokenize(text))
    setResult(r)
    recordAttempt(verse, 'type', r.accuracy, hints, started.current)
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

function SpeakMode({ verse }: { verse: Verse }) {
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
    recordAttempt(verse, 'speak', r.accuracy, hints, started.current)
  }
  if (method === 'none') return <p className="lede">Speaking practice needs a microphone and a modern browser. Try Safari on iPhone or Chrome on Android.</p>
  if (result) return <Result accuracy={result.accuracy} ops={result.ops} onAgain={() => { setResult(null); setTranscript(''); setHints(0); started.current = Date.now() }} />
  return (
    <section>
      <button className={'button mic' + (listening ? ' live' : '')} onClick={toggle} disabled={transcribing}>
        {listening ? 'Stop' : transcribing ? 'Transcribing…' : 'Start speaking'}
      </button>
      <p className="transcript">{transcript || <span className="muted">{listening ? 'Listening…' : 'Say the verse aloud, then tap Stop.'}</span>}</p>
      {error && <p className="error">{error}</p>}
      <HintPanel verse={verse} at={at} onUse={() => setHints(h => h + 1)} />
      <button className="button primary" onClick={check} disabled={!transcript.trim() || listening || transcribing}>Check</button>
    </section>
  )
}

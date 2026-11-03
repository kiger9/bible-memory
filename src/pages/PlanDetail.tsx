import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db, getSettings } from '../lib/db'
import { getPlan } from '../lib/plans'
import { parseReference } from '../lib/refs'
import type { ParsedRef } from '../lib/refs'
import { TRANSLATIONS, getTranslation } from '../lib/bible'
import { addVerse } from '../lib/verses'
import type { TranslationId } from '../lib/types'
import Header from '../components/Header'
import '../styles/plans.css'

const OPTIONS = TRANSLATIONS.filter(t => t.id !== 'custom')

export default function PlanDetail() {
  const { id } = useParams()
  const plan = id ? getPlan(id) : undefined
  const [translation, setTranslation] = useState<TranslationId>(OPTIONS[0].id)
  const [adding, setAdding] = useState<string | null>(null)      // canonical being added
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const verses = useLiveQuery(() => db.verses.toArray(), [])

  useEffect(() => {
    getSettings().then(s => { if (s.defaultTranslation !== 'custom') setTranslation(s.defaultTranslation) })
  }, [])

  const items = useMemo(() => (plan?.passages ?? []).flatMap(r => {
    const p = parseReference(r)
    return 'error' in p ? [] : [p as ParsedRef]
  }), [plan])

  if (!plan) return (<><Header title="Plan" back="/plans" /><p className="lede">That plan does not exist.</p></>)

  const t = getTranslation(translation)
  const existing = (c: string, tr: TranslationId) => verses?.find(v => v.reference === c && v.translation === tr)
  const missing = items.filter(p => !existing(p.canonical, translation))
  const busy = adding !== null

  async function add(p: ParsedRef) {
    setAdding(p.canonical)
    setErrors(e => { const { [p.canonical]: _, ...rest } = e; return rest })
    try { await addVerse(p, translation) }
    catch (e) { setErrors(x => ({ ...x, [p.canonical]: (e as Error).message })) }
    finally { setAdding(null) }
  }

  async function addAll() {
    const todo = [...missing]
    for (let i = 0; i < todo.length; i++) {
      setProgress({ n: i + 1, total: todo.length })
      await add(todo[i])
    }
    setProgress(null)
  }

  return (
    <>
      <Header title={plan.name} back="/plans" />
      <p className="muted plan-desc">{plan.description}</p>
      <label className="field">
        <span>Translation</span>
        <select value={translation} disabled={busy} onChange={e => setTranslation(e.target.value as TranslationId)}>
          {OPTIONS.map(o => <option key={o.id} value={o.id}>{o.abbr} — {o.name}</option>)}
        </select>
      </label>
      <button className="button primary plan-add-all" disabled={busy || missing.length === 0 || !verses} onClick={addAll}>
        {progress ? `Adding ${progress.n} of ${progress.total}…` : `Add all ${missing.length} remaining`}
      </button>
      {items.map(p => {
        const v = existing(p.canonical, translation)
        const other = !v ? verses?.find(x => x.reference === p.canonical) : undefined
        const err = errors[p.canonical]
        const body = (
          <div>
            <div className="row-title">{p.canonical}</div>
            {err ? <div className="row-sub error">{err}</div>
              : other ? <div className="row-sub">have it in {other.translationLabel ?? getTranslation(other.translation).abbr}</div> : null}
          </div>
        )
        if (v) return (
          <Link key={p.canonical} to={`/practice/${v.id}`} className="row">
            {body}<span className="plan-row-end muted">Added</span>
          </Link>
        )
        return (
          <div key={p.canonical} className="row">
            {body}
            {adding === p.canonical
              ? <span className="plan-row-end muted">Adding…</span>
              : <button className="button small plan-row-end" disabled={busy} onClick={() => add(p)}>Add</button>}
          </div>
        )
      })}
      <p className="attribution">{t.attribution}</p>
      {t.provider === 'api.bible' && <p className="attribution">Scripture text provided by <a href="https://api.bible" target="_blank" rel="noopener">API.Bible</a>.</p>}
    </>
  )
}

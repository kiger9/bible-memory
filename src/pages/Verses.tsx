import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, deleteVerse } from '../lib/db'
import { scheduleSync } from '../lib/sync'
import Header from '../components/Header'
import type { Verse } from '../lib/types'

export default function Verses() {
  const verses = useLiveQuery(() => db.verses.orderBy('createdAt').reverse().toArray(), [])
  const attempts = useLiveQuery(() => db.attempts.toArray(), [])
  const reviews = useLiveQuery(() => db.reviews.toArray(), [])
  const [editing, setEditing] = useState(false)
  const canEdit = (verses?.length ?? 0) > 0

  async function remove(v: Verse) {
    if (!confirm(`Delete ${v.reference} and its practice history?`)) return
    await deleteVerse(v.id!)
    scheduleSync(500)
    if ((await db.verses.count()) === 0) setEditing(false)
  }

  function stats(v: Verse) {
    if (!attempts || !reviews) return ' '
    const mine = attempts.filter(a => a.verseId === v.id && a.mode !== 'read' && a.mode !== 'ref')
    const best = mine.reduce((m, a) => Math.max(m, a.accuracy), 0)
    const r = reviews.find(r => r.verseId === v.id)
    if (mine.length === 0) return 'Not practised yet'
    const next = r && r.reps > 0 ? ` · next ${new Date(r.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''
    return `${mine.length} attempt${mine.length === 1 ? '' : 's'} · best ${Math.round(best * 100)}%${next}`
  }

  const action = editing
    ? <button className="button small" onClick={() => setEditing(false)}>Done</button>
    : <>
        {canEdit && <button className="button small ghost" onClick={() => setEditing(true)}>Edit</button>}
        <Link to="/verses/new" className="button small">Add</Link>
      </>

  return (
    <>
      <Header title="Verses" action={action} />
      <Link to="/plans" className="row">
        <div>
          <div className="row-title">Study plans</div>
          <div className="row-sub">Add a whole set of passages at once</div>
        </div>
        <span className="chev">›</span>
      </Link>
      {verses?.length === 0 && <p className="lede">No verses yet.</p>}
      {verses?.map(v => editing ? (
        <div key={v.id} className="row">
          <div>
            <div className="row-title">{v.reference}</div>
            <div className="row-sub">{v.text.slice(0, 70)}{v.text.length > 70 ? '…' : ''}</div>
          </div>
          <button className="button small danger" onClick={() => remove(v)}>Delete</button>
        </div>
      ) : (
        <Link key={v.id} to={`/practice/${v.id}`} className="row">
          <div>
            <div className="row-title">{v.reference} <span className="muted">{(v.translationLabel ?? v.translation.toUpperCase())}</span></div>
            <div className="row-sub">{stats(v)}</div>
          </div>
          <span className="chev">›</span>
        </Link>
      ))}
    </>
  )
}

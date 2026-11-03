import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, deleteVerse } from '../lib/db'
import { scheduleSync } from '../lib/sync'
import Header from '../components/Header'
import type { Verse } from '../lib/types'

export default function Verses() {
  const verses = useLiveQuery(() => db.verses.orderBy('createdAt').reverse().toArray(), [])
  const [editing, setEditing] = useState(false)
  const canEdit = (verses?.length ?? 0) > 0

  async function remove(v: Verse) {
    if (!confirm(`Delete ${v.reference} and its practice history?`)) return
    await deleteVerse(v.id!)
    scheduleSync(500)
    if ((await db.verses.count()) === 0) setEditing(false)
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
            <div className="row-title">{v.reference}</div>
            <div className="row-sub">{v.text.slice(0, 70)}{v.text.length > 70 ? '…' : ''}</div>
          </div>
          <span className="chev">›</span>
        </Link>
      ))}
    </>
  )
}

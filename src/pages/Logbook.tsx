import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, exportAll, importAll } from '../lib/db'
import Header from '../components/Header'
import { getCode, formatCode, lastSynced, restore, push, scheduleSync } from '../lib/sync'

export default function Logbook() {
  const verses = useLiveQuery(() => db.verses.orderBy('createdAt').toArray(), [])
  const attempts = useLiveQuery(() => db.attempts.toArray(), [])
  const reviews = useLiveQuery(() => db.reviews.toArray(), [])
  if (!verses || !attempts || !reviews) return null

  async function doExport() {
    const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `bible-memory-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  async function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    await importAll(JSON.parse(await f.text()))
    scheduleSync(500)
  }

  return (
    <>
      <Header title="Logbook" />
      <p className="muted">{verses.length} verse{verses.length === 1 ? '' : 's'} · {attempts.length} practice session{attempts.length === 1 ? '' : 's'}</p>
      {verses.map(v => {
        const mine = attempts.filter(a => a.verseId === v.id && a.mode !== 'read')
        const best = mine.reduce((m, a) => Math.max(m, a.accuracy), 0)
        const r = reviews.find(r => r.verseId === v.id)
        return (
          <Link key={v.id} to={`/practice/${v.id}`} className="row">
            <div>
              <div className="row-title">{v.reference} <span className="muted">{(v.translationLabel ?? v.translation.toUpperCase())}</span></div>
              <div className="row-sub">Added {new Date(v.createdAt).toLocaleDateString()} · {mine.length} attempts · best {Math.round(best * 100)}%{r && r.reps > 0 ? ` · next ${new Date(r.due).toLocaleDateString()}` : ''}</div>
            </div>
            <span className="chev">›</span>
          </Link>
        )
      })}
      <BackupPanel />
      <section className="actions">
        <button className="button ghost" onClick={doExport}>Export file</button>
        <label className="button ghost">Import file<input type="file" accept="application/json" onChange={doImport} hidden /></label>
      </section>
    </>
  )
}

function BackupPanel() {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [last, setLast] = useState(lastSynced())
  const code = formatCode(getCode())

  async function backupNow() {
    setBusy(true); setMsg('')
    try { await push(); setLast(lastSynced()); setMsg('Backed up just now.') }
    catch (err) { setMsg((err as Error).message) }
    finally { setBusy(false) }
  }
  async function doRestore(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    try { await restore(input); setInput(''); setLast(lastSynced()); setMsg('Restored. This phone now shares that backup.') }
    catch (err) { setMsg((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <section className="sync">
      <h2 className="section-title">Backup</h2>
      <p className="muted">Your verses and progress are backed up automatically after every change, encrypted so only this phone can read them.{last ? ` Last backup ${new Date(last).toLocaleString()}.` : ''}</p>
      <p className="muted">This phone’s backup code is <strong className="code">{code}</strong>. On a new phone, or after reinstalling the app, enter it below and everything comes back.</p>
      <div className="actions">
        <button className="button ghost" onClick={backupNow} disabled={busy}>{busy ? 'Working…' : 'Back up now'}</button>
      </div>
      <details className="restore">
        <summary>Restore from another phone</summary>
        <form className="form" onSubmit={doRestore}>
          <label className="field">
            <span>Backup code from the other phone</span>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="ABCD-EFGH-JKLM-NPQR" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          </label>
          <button className="button ghost" disabled={busy || input.trim().length < 16}>{busy ? 'Working…' : 'Restore'}</button>
        </form>
      </details>
      {msg && <p className="muted" role="status">{msg}</p>}
    </section>
  )
}

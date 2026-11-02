import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, exportAll, importAll } from '../lib/db'
import Header from '../components/Header'
import { getPhrase, lastSynced, enable, disable, push } from '../lib/sync'

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
      <SyncPanel />
      <section className="actions">
        <button className="button ghost" onClick={doExport}>Export file</button>
        <label className="button ghost">Import file<input type="file" accept="application/json" onChange={doImport} hidden /></label>
      </section>
    </>
  )
}

function SyncPanel() {
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [on, setOn] = useState(!!getPhrase())
  const last = lastSynced()

  async function turnOn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    try {
      const { restored } = await enable(phrase)
      setOn(true); setPhrase('')
      setMsg(restored ? 'Restored your verses and progress from this phrase. Sync is on.' : 'Sync is on. Keep your phrase somewhere safe.')
    } catch (err) { setMsg((err as Error).message) }
    finally { setBusy(false) }
  }
  async function syncNow() { setBusy(true); setMsg(''); try { await push(); setMsg('Backed up just now.') } catch (err) { setMsg((err as Error).message) } finally { setBusy(false) } }

  return (
    <section className="sync">
      <h2 className="section-title">Backup</h2>
      {on ? (
        <>
          <p className="muted">Sync is on. Your verses and progress are encrypted with your phrase and backed up after every practice.{last ? ` Last backup ${new Date(last).toLocaleString()}.` : ''}</p>
          <div className="actions">
            <button className="button ghost" onClick={syncNow} disabled={busy}>{busy ? 'Backing up…' : 'Back up now'}</button>
            <button className="button ghost" onClick={() => { disable(); setOn(false); setMsg('Sync is off. Your data stays on this phone.') }}>Turn off</button>
          </div>
        </>
      ) : (
        <form className="form" onSubmit={turnOn}>
          <p className="muted">Choose a sync phrase and keep it somewhere safe. If you delete or reinstall the app, enter the same phrase here and everything comes back.</p>
          <label className="field">
            <span>Sync phrase</span>
            <input value={phrase} onChange={e => setPhrase(e.target.value)} placeholder="e.g. hidden in my heart 119" autoCapitalize="none" autoComplete="off" />
          </label>
          <button className="button primary" disabled={busy || phrase.trim().length < 8}>{busy ? 'Working…' : 'Turn on sync'}</button>
        </form>
      )}
      {msg && <p className="muted" role="status">{msg}</p>}
    </section>
  )
}

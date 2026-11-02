import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, exportAll, importAll } from '../lib/db'
import Header from '../components/Header'

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
              <div className="row-title">{v.reference} <span className="muted">{v.translation.toUpperCase()}</span></div>
              <div className="row-sub">Added {new Date(v.createdAt).toLocaleDateString()} · {mine.length} attempts · best {Math.round(best * 100)}%{r && r.reps > 0 ? ` · next ${new Date(r.due).toLocaleDateString()}` : ''}</div>
            </div>
            <span className="chev">›</span>
          </Link>
        )
      })}
      <section className="actions">
        <button className="button ghost" onClick={doExport}>Export backup</button>
        <label className="button ghost">Import backup<input type="file" accept="application/json" onChange={doImport} hidden /></label>
      </section>
    </>
  )
}

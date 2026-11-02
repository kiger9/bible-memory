import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import Header from '../components/Header'
import Wordmark from '../components/Wordmark'

export default function Today() {
  const now = Date.now()
  const verses = useLiveQuery(() => db.verses.toArray(), [])
  const reviews = useLiveQuery(() => db.reviews.toArray(), [])
  const attemptsToday = useLiveQuery(() => db.attempts.where('at').above(startOfDay()).count(), [])
  if (!verses || !reviews) return null

  const dueIds = new Set(reviews.filter(r => r.due <= now).map(r => r.verseId))
  const due = verses.filter(v => dueIds.has(v.id!))
  const fresh = verses.filter(v => !reviews.some(r => r.verseId === v.id))

  return (
    <>
      <Header title="Today" action={<Wordmark size={20} />} />
      {verses.length === 0 && (
        <section className="empty">
          <p className="lede">Nothing here yet. Add a verse you want to carry with you.</p>
          <Link className="button primary" to="/verses/new">Add a verse</Link>
        </section>
      )}
      {verses.length > 0 && (
        <section>
          <p className="muted">{attemptsToday ?? 0} practice{attemptsToday === 1 ? '' : 's'} today · {due.length} due</p>
          {[...due, ...fresh].map(v => (
            <Link key={v.id} to={`/practice/${v.id}`} className="row">
              <div>
                <div className="row-title">{v.reference}</div>
                <div className="row-sub">{(v.translationLabel ?? v.translation.toUpperCase())} · {dueIds.has(v.id!) ? 'Due for review' : 'New'}</div>
              </div>
              <span className="chev">›</span>
            </Link>
          ))}
          {due.length === 0 && fresh.length === 0 && <p className="lede">All caught up. Come back tomorrow, or <Link to="/quiz">play a pop quiz</Link>.</p>}
        </section>
      )}
    </>
  )
}

function startOfDay() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }

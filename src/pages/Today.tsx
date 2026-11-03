import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import Header from '../components/Header'
import Wordmark from '../components/Wordmark'

/**
 * The daily queue. Reviews come first, most overdue at the top; then at most `dailyGoal` verses
 * that have never been practised, oldest added first, so a big study plan arrives a few at a time.
 */
export default function Today() {
  const now = Date.now()
  const verses = useLiveQuery(() => db.verses.toArray(), [])
  const reviews = useLiveQuery(() => db.reviews.toArray(), [])
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const attemptsToday = useLiveQuery(() => db.attempts.where('at').above(startOfDay()).count(), [])
  if (!verses || !reviews) return null

  const goal = settings?.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal
  const dueOf = new Map(reviews.filter(r => r.reps > 0 && r.due <= now).map(r => [r.verseId, r.due]))
  const due = verses.filter(v => dueOf.has(v.id!)).sort((a, b) => dueOf.get(a.id!)! - dueOf.get(b.id!)!)
  const fresh = verses.filter(v => { const r = reviews.find(r => r.verseId === v.id); return !r || r.reps === 0 }).sort((a, b) => a.createdAt - b.createdAt)
  const freshToday = fresh.slice(0, goal)
  const waiting = fresh.length - freshToday.length
  const scheduled = reviews.filter(r => r.reps > 0 && r.due > now).map(r => r.due)
  const next = scheduled.length ? Math.min(...scheduled) : null

  return (
    <>
      <Header title="Today" action={<Wordmark size={20} />} />
      {verses.length === 0 && (
        <section className="empty">
          <p className="lede">Nothing here yet. Add a verse you want to carry with you.</p>
          <div className="actions">
            <Link className="button primary" to="/verses/new">Add a verse</Link>
            <Link className="button ghost" to="/plans">Browse study plans</Link>
          </div>
        </section>
      )}
      {verses.length > 0 && (
        <section>
          <p className="muted">{attemptsToday ?? 0} practice{attemptsToday === 1 ? '' : 's'} today · {due.length} to review · {freshToday.length} new</p>
          {due.map(v => (
            <Link key={v.id} to={`/practice/${v.id}?review=1`} className="row">
              <div>
                <div className="row-title">{v.reference}</div>
                <div className="row-sub">{(v.translationLabel ?? v.translation.toUpperCase())} · {overdue(dueOf.get(v.id!)!, now)}</div>
              </div>
              <span className="chev">›</span>
            </Link>
          ))}
          {freshToday.map(v => (
            <Link key={v.id} to={`/practice/${v.id}`} className="row">
              <div>
                <div className="row-title">{v.reference}</div>
                <div className="row-sub">{(v.translationLabel ?? v.translation.toUpperCase())} · New</div>
              </div>
              <span className="chev">›</span>
            </Link>
          ))}
          {waiting > 0 && <p className="muted">{waiting} more new verse{waiting === 1 ? '' : 's'} waiting. They arrive {goal} a day; change that in <Link to="/settings">Settings</Link>.</p>}
          {due.length === 0 && freshToday.length === 0 && <p className="lede">All caught up. {next !== null ? <>Next review {fmtNext(next)}, or </> : <>Come back tomorrow, or </>}<Link to="/quiz">play a pop quiz</Link>.</p>}
        </section>
      )}
    </>
  )
}

function overdue(due: number, now: number) {
  const days = Math.floor((now - due) / 86_400_000)
  return days <= 0 ? 'Due today' : days === 1 ? 'A day overdue' : `${days} days overdue`
}
function fmtNext(t: number) { return new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') }
function startOfDay() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }

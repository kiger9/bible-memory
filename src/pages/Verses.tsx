import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import Header from '../components/Header'

export default function Verses() {
  const verses = useLiveQuery(() => db.verses.orderBy('createdAt').reverse().toArray(), [])
  return (
    <>
      <Header title="Verses" action={<Link to="/verses/new" className="button small">Add</Link>} />
      {verses?.length === 0 && <p className="lede">No verses yet.</p>}
      {verses?.map(v => (
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

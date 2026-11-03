import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { PLANS } from '../lib/plans'
import { parseReference } from '../lib/refs'
import Header from '../components/Header'
import '../styles/plans.css'

export default function Plans() {
  const refs = useLiveQuery(async () => new Set((await db.verses.toArray()).map(v => v.reference)), [])
  return (
    <>
      <Header title="Study plans" back="/verses" />
      {PLANS.map(p => {
        const added = refs ? p.passages.filter(r => { const x = parseReference(r); return !('error' in x) && refs.has(x.canonical) }).length : 0
        return (
          <Link key={p.id} to={`/plans/${p.id}`} className="row">
            <div>
              <div className="row-title">{p.name}</div>
              <div className="row-sub">{p.description}</div>
              <div className="plan-meta">{p.passages.length} passages · {added} added</div>
            </div>
            <span className="chev">›</span>
          </Link>
        )
      })}
    </>
  )
}

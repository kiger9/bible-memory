import { useEffect, useState } from 'react'
import Wordmark from './Wordmark'

const KEY = 'kept-splash-shown'

/** Brief launch screen: shown once per app session, dismissed by time or tap. */
export default function Splash() {
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>(() => {
    try { return sessionStorage.getItem(KEY) ? 'hidden' : 'in' } catch { return 'in' }
  })
  useEffect(() => {
    if (phase !== 'in') return
    try { sessionStorage.setItem(KEY, '1') } catch { /* ignore */ }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setPhase('out'), reduced ? 1200 : 2000)
    return () => clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (phase !== 'out') return
    const t = setTimeout(() => setPhase('hidden'), 360)
    return () => clearTimeout(t)
  }, [phase])
  if (phase === 'hidden') return null
  return (
    <div className={'splash' + (phase === 'out' ? ' out' : '')} onClick={() => setPhase('out')} role="presentation">
      <div className="splash-center">
        <i className="mark splash-mark" aria-hidden="true" />
        <Wordmark size={56} mark={false} />
        <blockquote className="splash-verse">
          <p>I have kept thy word.</p>
          <cite>Psalm 119:67</cite>
        </blockquote>
      </div>
      <p className="splash-legal">A devotional app for personal use.</p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, getSettings } from '../lib/db'
import { parseReference } from '../lib/refs'
import { TRANSLATIONS, fetchPassage, getTranslation } from '../lib/bible'
import { tokenize } from '../lib/text'
import { newReviewState } from '../lib/srs'
import type { TranslationId, ThoughtChunk } from '../lib/types'
import Header from '../components/Header'
import { scheduleSync } from '../lib/sync'
import VerseText from '../components/VerseText'

export default function AddVerse() {
  const nav = useNavigate()
  const [ref, setRef] = useState('')
  const [translation, setTranslation] = useState<TranslationId>('web')
  const [preview, setPreview] = useState<{ text: string; reference: string; verseEnd: number } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ownText, setOwnText] = useState('')
  const [ownLabel, setOwnLabel] = useState('NIV')
  const isManual = translation === 'custom'

  useEffect(() => { getSettings().then(s => setTranslation(s.defaultTranslation)) }, [])

  async function lookup() {
    setError(''); setPreview(null)
    const parsed = parseReference(ref)
    if ('error' in parsed) { setError(parsed.error); return }
    if (isManual) {
      const text = ownText.replace(/\s+/g, ' ').trim()
      if (!text) { setError('Paste the verse text from your Bible.'); return }
      setPreview({ text, reference: parsed.canonical, verseEnd: parsed.verseEnd === 999 ? parsed.verseStart : parsed.verseEnd })
      return
    }
    setBusy(true)
    try { setPreview(await fetchPassage(parsed, translation)) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function save() {
    const parsed = parseReference(ref)
    if ('error' in parsed || !preview) return
    setBusy(true)
    const words = tokenize(preview.text)
    let chunks: ThoughtChunk[] | undefined
    try {
      const r = await fetch('/api/hints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: preview.reference, translation: isManual ? ownLabel : getTranslation(translation).abbr, words }),
      })
      if (r.ok) chunks = (await r.json()).chunks
    } catch { /* hints are optional; first-letter hints still work */ }
    const id = await db.verses.add({
      reference: preview.reference, bookId: parsed.book.id, chapter: parsed.chapter,
      verseStart: parsed.verseStart, verseEnd: preview.verseEnd, translation, translationLabel: isManual ? ownLabel.trim() || 'Own' : undefined,
      text: preview.text, words, chunks, createdAt: Date.now(),
    })
    await db.reviews.put(newReviewState(id as number))
    await db.settings.put({ ...(await getSettings()), defaultTranslation: translation })
    scheduleSync(1000)
    nav(`/practice/${id}`, { replace: true })
  }

  return (
    <>
      <Header title="Add a verse" back="/verses" />
      <form className="form" onSubmit={e => { e.preventDefault(); lookup() }}>
        <label className="field">
          <span>Reference</span>
          <input value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. Philippians 4:6-7" autoFocus inputMode="text" autoCapitalize="words" />
        </label>
        <label className="field">
          <span>Translation</span>
          <select value={translation} onChange={e => setTranslation(e.target.value as TranslationId)}>
            {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.abbr} — {t.name}</option>)}
          </select>
        </label>
        {isManual && (
          <>
            <label className="field">
              <span>Translation name</span>
              <input value={ownLabel} onChange={e => setOwnLabel(e.target.value)} placeholder="NIV" />
            </label>
            <label className="field">
              <span>Verse text</span>
              <textarea value={ownText} onChange={e => setOwnText(e.target.value)} rows={5} placeholder="Paste or type the passage exactly as printed in your Bible." />
            </label>
          </>
        )}
        <button className="button primary" disabled={busy || !ref.trim()}>{busy ? 'Looking up…' : isManual ? 'Preview' : 'Look up'}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      {preview && (
        <section>
          <VerseText text={preview.text} reference={`${preview.reference} (${isManual ? ownLabel : getTranslation(translation).abbr})`} />
          <button className="button primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Memorize this'}</button>
          <p className="attribution">{getTranslation(translation).attribution}</p>
        </section>
      )}
    </>
  )
}

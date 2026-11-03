import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings } from '../lib/db'
import { parseReference } from '../lib/refs'
import { TRANSLATIONS, fetchPassage, getTranslation } from '../lib/bible'
import { addVerse } from '../lib/verses'
import type { TranslationId } from '../lib/types'
import Header from '../components/Header'
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
    try {
      const id = await addVerse(parsed, translation, { passage: preview, translationLabel: ownLabel, rememberTranslation: true })
      nav(`/practice/${id}`, { replace: true })
    } catch (e) { setError((e as Error).message); setBusy(false) }
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
          {getTranslation(translation).provider === 'api.bible' && <p className="attribution">Scripture text provided by <a href="https://api.bible" target="_blank" rel="noopener">API.Bible</a>.</p>}
        </section>
      )}
    </>
  )
}

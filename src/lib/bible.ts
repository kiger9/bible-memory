import type { Translation, TranslationId } from './types'
import type { ParsedRef } from './refs'

export const TRANSLATIONS: Translation[] = [
  { id: 'web',  name: 'World English Bible', abbr: 'WEB', source: 'direct', attribution: 'World English Bible, public domain.' },
  { id: 'kjv',  name: 'King James Version', abbr: 'KJV', source: 'direct', attribution: 'King James Version, public domain.' },
  { id: 'asv',  name: 'American Standard Version', abbr: 'ASV', source: 'direct', attribution: 'American Standard Version, public domain.' },
  { id: 'bbe',  name: 'Bible in Basic English', abbr: 'BBE', source: 'direct', attribution: 'Bible in Basic English, public domain.' },
  { id: 'darby', name: 'Darby Translation', abbr: 'DARBY', source: 'direct', attribution: 'Darby Translation, public domain.' },
  { id: 'ylt',  name: "Young's Literal Translation", abbr: 'YLT', source: 'direct', attribution: "Young's Literal Translation, public domain." },
  { id: 'esv',  name: 'English Standard Version', abbr: 'ESV', source: 'proxy', attribution: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway. Used by permission. All rights reserved.' },
  { id: 'custom', name: 'Paste my own text (NIV, NLT, NASB, CSB…)', abbr: 'Own text', source: 'manual', attribution: 'Text entered by you from your own Bible. Stored only on this device.' },
]

export function getTranslation(id: TranslationId): Translation {
  return TRANSLATIONS.find(t => t.id === id) ?? TRANSLATIONS[0]
}

export interface FetchedPassage { text: string; reference: string; verseEnd: number }

/** Fetch passage text. Public-domain translations go straight to bible-api.com; keyed ones via /api. */
export async function fetchPassage(ref: ParsedRef, translation: TranslationId): Promise<FetchedPassage> {
  const t = getTranslation(translation)
  const q = `${ref.book.name} ${ref.chapter}:${ref.verseStart}${ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd === 999 ? '' : ref.verseEnd}` : ''}`
  if (t.source === 'direct') {
    const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=${t.id}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(res.status === 404 ? 'That passage was not found.' : `Bible API error (${res.status}).`)
    const data = await res.json() as { verses: { verse: number; text: string }[]; reference: string }
    if (!data.verses?.length) throw new Error('That passage was not found.')
    const text = data.verses.map(v => v.text.replace(/\s+/g, ' ').trim()).join(' ')
    return { text, reference: data.reference, verseEnd: data.verses[data.verses.length - 1].verse }
  }
  const res = await fetch(`/api/passage?ref=${encodeURIComponent(q)}&translation=${t.id}`)
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Could not fetch ${t.abbr} (${res.status}). Is the API key configured?`)
  }
  return await res.json() as FetchedPassage
}

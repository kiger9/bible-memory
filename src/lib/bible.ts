import type { Translation, TranslationId } from './types'
import type { ParsedRef } from './refs'
import { BOOKS } from './books'

export const TRANSLATIONS: Translation[] = [
  { id: 'nasb', name: 'New American Standard Bible', abbr: 'NASB', source: 'proxy', attribution: 'Scripture quotations marked NASB © are taken from the New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved. The NASB text may not be quoted in any publication made available to the public by a Creative Commons license. The NASB may not be translated into any other language. Website: www.lockman.org', provider: 'api.bible' },
  { id: 'esv',  name: 'English Standard Version', abbr: 'ESV', source: 'proxy', attribution: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway. Used by permission. All rights reserved.' },
  { id: 'lsb',  name: 'Legacy Standard Bible', abbr: 'LSB', source: 'proxy', attribution: 'Scripture quotations taken from the (LSB®) Legacy Standard Bible®, Copyright © 2021 by The Lockman Foundation. Used by permission. All rights reserved. Managed in partnership with Three Sixteen Publishing Inc. LSBible.org' },
  { id: 'niv',  name: 'New International Version', abbr: 'NIV', source: 'proxy', attribution: 'Scripture quotations marked NIV © are taken from the Holy Bible, New International Version®, NIV®, Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide. The NIV text may not be quoted in any publication made available to the public by a Creative Commons license. The NIV may not be translated into any other language. Website: www.biblica.com', provider: 'api.bible' },
  { id: 'kjv',  name: 'King James Version', abbr: 'KJV', source: 'proxy', attribution: 'King James Version, public domain.', provider: 'api.bible' },
  { id: 'nkjv', name: 'New King James Version', abbr: 'NKJV', source: 'proxy', attribution: 'Scripture quotations marked NKJV © are taken from the New King James Version®, Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved. The NKJV text may not be quoted in any publication made available to the public by a Creative Commons license. The NKJV may not be translated into any other language. Website: www.thomasnelson.com', provider: 'api.bible' },
  { id: 'web',  name: 'World English Bible', abbr: 'WEB', source: 'direct', attribution: 'World English Bible, public domain.' },
  { id: 'asv',  name: 'American Standard Version', abbr: 'ASV', source: 'direct', attribution: 'American Standard Version, public domain.' },
  { id: 'bbe',  name: 'Bible in Basic English', abbr: 'BBE', source: 'direct', attribution: 'Bible in Basic English, public domain.' },
  { id: 'darby', name: 'Darby Translation', abbr: 'DARBY', source: 'direct', attribution: 'Darby Translation, public domain.' },
  { id: 'ylt',  name: "Young's Literal Translation", abbr: 'YLT', source: 'direct', attribution: "Young's Literal Translation, public domain." },
  { id: 'custom', name: 'Paste my own text (NLT, CSB, NRSV…)', abbr: 'Own text', source: 'manual', attribution: 'Text entered by you from your own Bible. Stored only on this device.' },
]

export function getTranslation(id: TranslationId): Translation {
  return TRANSLATIONS.find(t => t.id === id) ?? TRANSLATIONS[0]
}

export interface FetchedPassage { text: string; reference: string; verseEnd: number }

/** Fetch passage text. Public-domain translations go straight to bible-api.com; keyed ones via /api. */
export async function fetchPassage(ref: ParsedRef, translation: TranslationId): Promise<FetchedPassage> {
  const t = getTranslation(translation)
  const q = ref.canonical
  if (t.source === 'direct') {
    const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=${t.id}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(res.status === 404 ? 'That passage was not found.' : `Bible API error (${res.status}).`)
    const data = await res.json() as { verses: { verse: number; text: string }[]; reference: string }
    if (!data.verses?.length) throw new Error('That passage was not found.')
    const text = data.verses.map(v => v.text.replace(/\s+/g, ' ').trim()).join(' ')
    return { text, reference: data.reference, verseEnd: data.verses[data.verses.length - 1].verse }
  }
  const params = new URLSearchParams({
    ref: q, translation: t.id, book: ref.book.id, bn: String(BOOKS.findIndex(b => b.id === ref.book.id) + 1),
    ch: String(ref.chapter), vs: String(ref.verseStart), ve: String(ref.verseEnd), ce: String(ref.chapterEnd),
  })
  const res = await fetch(`/api/passage?${params}`)
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Could not fetch ${t.abbr} (${res.status}).`)
  }
  return await res.json() as FetchedPassage
}

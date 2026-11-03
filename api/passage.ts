// Vercel serverless function: fetches licensed translations server-side.
//   GET /api/passage?ref=John%203:16-17&translation=nasb|esv|lsb|niv|kjv|nkjv&book=JHN&bn=43&ch=3&vs=16&ve=17
//   (book = USFM book id, bn = 1-based book number Genesis..Revelation, ch/vs/ve = chapter and verse range; the browser parses the reference)
// NASB, NIV, KJV, NKJV: API.Bible (scripture.api.bible) with API_BIBLE_KEY; each Bible must be enabled on that key.
// ESV: official api.esv.org when ESV_API_KEY is set; otherwise the public reader page at
//      www.esv.org (interim, until the Crossway key arrives).
// LSB: the Next.js data route behind read.lsbible.org (unofficial; personal use).
type Req = { method?: string; query: Record<string, string | string[] | undefined> }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void; setHeader: (k: string, v: string) => void }

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

export interface Passage { text: string; reference: string; verseEnd: number; source: string }

export interface RefParams { ref: string; bookName: string; book: string; bn: number; ch: number; vs: number; ve: number }

export default async function handler(req: Req, res: Res) {
  const q = (k: string) => String(req.query[k] ?? '').trim()
  const ref = q('ref'), translation = q('translation')
  const params: RefParams = { ref, bookName: ref.replace(/\s+\d+(:\d+(-\d+)?)?$/, ''), book: q('book').toUpperCase(), bn: Number(q('bn')), ch: Number(q('ch')), vs: Number(q('vs')) || 1, ve: Number(q('ve')) || 999 }
  if (!ref) return res.status(400).send('Missing ref')
  try {
    const out = await fetchProxied(params, translation)
    if (!out) return res.status(400).send(`Unknown proxied translation "${translation}"`)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json(out)
  } catch (e) {
    return res.status(502).send((e as Error).message || 'Could not fetch that passage.')
  }
}

export async function fetchProxied(p: RefParams, translation: string): Promise<Passage | null> {
  if (translation === 'esv') return process.env.ESV_API_KEY ? fetchEsvApi(p.ref, process.env.ESV_API_KEY) : fetchEsvSite(p)
  if (translation === 'lsb') return fetchLsb(p.ref)
  const ab = API_BIBLES[translation]
  if (ab) return fetchApiBible(p, translation, ab)
  return null
}

/* ---------------- API.Bible (NASB, NIV, KJV, NKJV) ----------------
   Licensed texts via scripture.api.bible. Needs API_BIBLE_KEY, with each Bible enabled on that key
   (NASB and NIV need the publisher's approval in the api.bible dashboard). */

const API_BIBLE = 'https://api.scripture.api.bible/v1'

interface ApiBibleSpec { abbr: string; name: RegExp; exclude?: RegExp; label: string }
const API_BIBLES: Record<string, ApiBibleSpec> = {
  nasb: { abbr: 'NASB', name: /new american standard/i, label: 'NASB' },
  niv:  { abbr: 'NIV',  name: /new international version/i, exclude: /NIVUK|anglici[sz]ed|reader/i, label: 'NIV' },
  kjv:  { abbr: 'KJV',  name: /king james|authori[sz]ed version/i, exclude: /NKJV|new king james|21st century|KJ21|AKJV|american king james/i, label: 'KJV' },
  nkjv: { abbr: 'NKJV', name: /new king james/i, label: 'NKJV' },
}
const bibleIds: Record<string, string> = {}
const bibleNames: Record<string, string> = {}
let bibleList: { id: string; abbreviation?: string; name?: string; language?: { id?: string } }[] | null = null

async function listBibles(key: string) {
  if (bibleList) return bibleList
  const r = await fetch(`${API_BIBLE}/bibles?language=eng`, { headers: { 'api-key': key } })
  if (r.status === 401 || r.status === 403) throw new Error('The API.Bible key was rejected. Check API_BIBLE_KEY on the server.')
  if (!r.ok) throw new Error(`API.Bible returned ${r.status}`)
  bibleList = ((await r.json()) as { data?: typeof bibleList }).data ?? []
  return bibleList
}

async function getBibleId(key: string, translation: string, spec: ApiBibleSpec): Promise<string> {
  if (bibleIds[translation]) return bibleIds[translation]
  const abbr = (b: { abbreviation?: string }) => (b.abbreviation ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const data = (await listBibles(key)).filter(b => !spec.exclude || !(spec.exclude.test(b.name ?? '') || spec.exclude.test(b.abbreviation ?? '')))
  const pick = data.find(b => abbr(b) === spec.abbr)
    ?? data.find(b => abbr(b).startsWith(spec.abbr))
    ?? data.find(b => abbr(b).includes(spec.abbr))
    ?? data.find(b => spec.name.test(b.name ?? ''))
  if (!pick) throw new Error(`The ${spec.label} is not enabled on this API.Bible key. Request it under Bibles in your api.bible dashboard.`)
  bibleIds[translation] = pick.id
  bibleNames[translation] = `${pick.name ?? ''} (${pick.abbreviation ?? ''})`.trim()
  return pick.id
}

async function fetchApiBible(p: RefParams, translation: string, spec: ApiBibleSpec): Promise<Passage> {
  const key = process.env.API_BIBLE_KEY
  if (!key) throw new Error(`The ${spec.label} needs an API.Bible key on the server (API_BIBLE_KEY). Set it in Vercel and redeploy.`)
  if (!p.book || !p.ch) throw new Error(`Missing book/chapter for ${spec.label} lookup.`)
  const bibleId = await getBibleId(key, translation, spec)
  const whole = p.ve >= 999
  const passageId = whole ? `${p.book}.${p.ch}` : p.ve > p.vs ? `${p.book}.${p.ch}.${p.vs}-${p.book}.${p.ch}.${p.ve}` : `${p.book}.${p.ch}.${p.vs}`
  const params = new URLSearchParams({
    'content-type': 'text', 'include-notes': 'false', 'include-titles': 'false', 'include-chapter-numbers': 'false',
    'include-verse-numbers': 'false', 'include-verse-spans': 'false', 'use-org-id': 'false',
  })
  const r = await fetch(`${API_BIBLE}/bibles/${bibleId}/passages/${passageId}?${params}`, { headers: { 'api-key': key } })
  if (r.status === 404) throw new Error(`That passage was not found in the ${spec.label}.`)
  if (!r.ok) throw new Error(`API.Bible returned ${r.status}`)
  const { data } = await r.json() as { data?: { content?: string; reference?: string; verseCount?: number } }
  const text = clean((data?.content ?? '').replace(/\[\d+\]/g, ' ').replace(/¶/g, ' '))
  if (!text) throw new Error(`That passage was not found in the ${spec.label}.`)
  const verseCount = data?.verseCount ?? 1
  const verseEnd = whole ? verseCount : p.vs + verseCount - 1
  return { text, reference: data?.reference?.trim() || p.ref, verseEnd, source: `api.bible: ${bibleNames[translation] ?? bibleId}` }
}

/* ---------------- helpers ---------------- */

/** Returns the inner HTML of the element whose opening tag starts at `start`, honoring nesting of `tag`. */
function balanced(html: string, start: number, tag: string): string {
  const open = new RegExp(`<${tag}\\b`, 'gi'), close = new RegExp(`</${tag}>`, 'gi')
  let depth = 0, i = html.indexOf('>', start) + 1
  const innerStart = i
  while (i < html.length) {
    open.lastIndex = i; close.lastIndex = i
    const o = open.exec(html), c = close.exec(html)
    if (!c) break
    if (o && o.index < c.index) { depth++; i = o.index + 1; continue }
    if (depth === 0) return html.slice(innerStart, c.index)
    depth--; i = c.index + 1
  }
  return html.slice(innerStart)
}

function clean(s: string): string {
  return s.replace(/ /g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?”’)])/g, '$1').replace(/([“‘(])\s+/g, '$1').trim()
}

function decode(s: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…' }
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m)
}

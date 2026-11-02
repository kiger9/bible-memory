// Vercel serverless function: fetches licensed translations server-side.
//   GET /api/passage?ref=John%203:16-17&translation=esv|lsb&bn=43&ch=3&vs=16&ve=17
//   (bn = 1-based book number Genesis..Revelation, ch/vs/ve = chapter and verse range; the browser parses the reference)
// ESV: official api.esv.org when ESV_API_KEY is set; otherwise the public reader page at
//      www.esv.org (interim, until the Crossway key arrives).
// LSB: the Next.js data route behind read.lsbible.org (unofficial; personal use).
type Req = { method?: string; query: Record<string, string | string[] | undefined> }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void; setHeader: (k: string, v: string) => void }

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

export interface Passage { text: string; reference: string; verseEnd: number; source: string }

export interface RefParams { ref: string; bookName: string; bn: number; ch: number; vs: number; ve: number }

export default async function handler(req: Req, res: Res) {
  const q = (k: string) => String(req.query[k] ?? '').trim()
  const ref = q('ref'), translation = q('translation')
  const params: RefParams = { ref, bookName: ref.replace(/\s+\d+(:\d+(-\d+)?)?$/, ''), bn: Number(q('bn')), ch: Number(q('ch')), vs: Number(q('vs')) || 1, ve: Number(q('ve')) || 999 }
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
  return null
}

/* ---------------- ESV (official API) ---------------- */

async function fetchEsvApi(ref: string, key: string): Promise<Passage> {
  const params = new URLSearchParams({
    q: ref, 'include-headings': 'false', 'include-footnotes': 'false', 'include-verse-numbers': 'false',
    'include-short-copyright': 'false', 'include-passage-references': 'false', 'include-first-verse-numbers': 'false',
    'include-selahs': 'true', 'indent-paragraphs': '0', 'indent-poetry': 'false',
  })
  const r = await fetch(`https://api.esv.org/v3/passage/text/?${params}`, { headers: { Authorization: `Token ${key}` } })
  if (!r.ok) throw new Error(`ESV API error ${r.status}`)
  const data = await r.json() as { passages: string[]; canonical: string; passage_meta: { end: number[] }[] }
  const text = clean(data.passages?.[0] ?? '')
  if (!text) throw new Error('That passage was not found.')
  const endPacked = data.passage_meta?.[0]?.end?.[0] ?? 0
  return { text, reference: data.canonical, verseEnd: endPacked % 1000, source: 'api.esv.org' }
}

/* ---------------- ESV (reader page, interim) ----------------
   Markup: <span class="verse" data-ref="43003016" ...><b class="verse-num">16&nbsp;</b>
           <sup class="footnote">…</sup><sup class="crossref">…</sup><u data-offset="7">For</u><u> </u>…</span> */

async function fetchEsvSite(p: RefParams): Promise<Passage> {
  if (!p.bn || !p.ch) throw new Error('Missing book/chapter for ESV lookup.')
  const slug = `${p.bookName} ${p.ch}`.replace(/\s+/g, '+')
  const r = await fetch(`https://www.esv.org/${slug}/`, { headers: { 'User-Agent': UA, Accept: 'text/html' } })
  if (!r.ok) throw new Error(`esv.org returned ${r.status}`)
  const html = await r.text()
  const verses: { n: number; text: string }[] = []
  for (const m of html.matchAll(/<span class="verse" data-ref="(\d{2})(\d{3})(\d{3})"/g)) {
    const [bn, cn, vn] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (bn !== p.bn || cn !== p.ch || vn < p.vs || vn > p.ve) continue
    const inner = balanced(html, m.index!, 'span')
    const text = clean(decode(inner
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, ' ')
      .replace(/<b\b[^>]*class="[^"]*verse-num[^"]*"[^>]*>[\s\S]*?<\/b>/gi, ' ')
      .replace(/<[^>]*class="[^"]*(psalm-title|chapter-num)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ')
      .replace(/<[^>]+>/g, '')))
    if (text) verses.push({ n: vn, text })
  }
  if (!verses.length) throw new Error('That passage was not found on esv.org.')
  const verseEnd = verses[verses.length - 1].n
  const reference = `${p.bookName} ${p.ch}:${p.vs}${verseEnd !== p.vs ? `-${verseEnd}` : ''}`
  return { text: clean(verses.map(v => v.text).join(' ')), reference, verseEnd, source: 'www.esv.org' }
}

/* ---------------- LSB ----------------
   index.json?q=REF answers with a redirect to /book/chapter/verses; that path's .json carries
   pageProps.passages[].passageHtml with <span class="v" data-ref="43.3.16"><sup class="vn">16</sup>…</span>. */

let lsbBuildId: string | null = null

async function getLsbBuildId(force = false): Promise<string> {
  if (lsbBuildId && !force) return lsbBuildId
  const r = await fetch('https://read.lsbible.org/', { headers: { 'User-Agent': UA, Accept: 'text/html' } })
  if (!r.ok) throw new Error(`read.lsbible.org returned ${r.status}`)
  const html = await r.text()
  const id = html.match(/"buildId":"([^"]+)"/)?.[1] ?? html.match(/\/_next\/data\/([^/]+)\//)?.[1]
  if (!id) throw new Error('Could not find the LSB site build id.')
  lsbBuildId = id
  return id
}

async function lsbData(path: string, buildId: string) {
  return fetch(`https://read.lsbible.org/_next/data/${buildId}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json', referer: 'https://read.lsbible.org/', 'x-nextjs-data': '1' },
  })
}

async function fetchLsb(ref: string, retry = true): Promise<Passage> {
  const buildId = await getLsbBuildId()
  let r = await lsbData(`/index.json?q=${encodeURIComponent(ref)}`, buildId)
  if (r.status === 404 && retry) { await getLsbBuildId(true); return fetchLsb(ref, false) } // build id rotated
  if (!r.ok) throw new Error(`read.lsbible.org returned ${r.status}`)
  let data = await r.json() as { pageProps?: { __N_REDIRECT?: string; passages?: LsbPassage[] } }
  if (data.pageProps?.__N_REDIRECT) {
    r = await lsbData(`${data.pageProps.__N_REDIRECT}.json`, buildId)
    if (!r.ok) throw new Error(`read.lsbible.org returned ${r.status}`)
    data = await r.json()
  }
  const passages = data.pageProps?.passages ?? []
  if (!passages.length) throw new Error('That passage was not found in the LSB.')
  const verses: string[] = []
  let verseEnd = 0
  for (const p of passages) {
    const html = p.passageHtml ?? ''
    for (const m of html.matchAll(/<span class="v[ "][^>]*data-ref="(\d+)\.(\d+)\.(\d+)"/g)) {
      verseEnd = Number(m[3])
      const inner = balanced(html, m.index!, 'span')
      const text = clean(decode(inner
        .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, ' ')
        .replace(/<b\b[^>]*class="[^"]*chapnum[^"]*"[^>]*>[\s\S]*?<\/b>/gi, ' ')
        .replace(/<div\b[^>]*class="[^"]*psalm-title[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
        .replace(/<\/span>/g, ' ').replace(/<[^>]+>/g, '')))
      if (text) verses.push(text)
    }
    if (!verseEnd && p.to?.vn) verseEnd = p.to.vn
  }
  const text = clean(verses.join(' '))
  if (!text) throw new Error('Could not read the LSB passage.')
  return { text, reference: passages[0]?.title?.trim() || ref, verseEnd, source: 'read.lsbible.org' }
}

interface LsbPassage { title?: string; passageHtml?: string; from?: { bn: number; cn: number; vn: number }; to?: { bn: number; cn: number; vn: number } }

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

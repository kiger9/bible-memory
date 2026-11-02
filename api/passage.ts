// Vercel serverless function: fetches licensed translations server-side.
//   GET /api/passage?ref=John%203:16&translation=esv|lsb
// ESV: uses the official api.esv.org when ESV_API_KEY is set; otherwise reads the public
//      passage page at www.esv.org (interim, until the Crossway key arrives).
// LSB: reads the Next.js data route behind read.lsbible.org (unofficial; personal use).
type Req = { method?: string; query: Record<string, string | string[] | undefined> }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void; setHeader: (k: string, v: string) => void }

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

export default async function handler(req: Req, res: Res) {
  const ref = String(req.query.ref ?? '').trim()
  const translation = String(req.query.translation ?? '')
  if (!ref) return res.status(400).send('Missing ref')
  try {
    const out = translation === 'esv' ? await fetchEsv(ref) : translation === 'lsb' ? await fetchLsb(ref) : null
    if (!out) return res.status(400).send(`Unknown proxied translation "${translation}"`)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json(out)
  } catch (e) {
    return res.status(502).send((e as Error).message || 'Could not fetch that passage.')
  }
}

interface Passage { text: string; reference: string; verseEnd: number; source: string }

/* ---------------- ESV ---------------- */

async function fetchEsv(ref: string): Promise<Passage> {
  const key = process.env.ESV_API_KEY
  if (key) return fetchEsvApi(ref, key)
  return fetchEsvSite(ref)
}

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

/** Interim: parse the public reader page. Crossway's renderer marks verse numbers as
 *  <b class="verse-num" id="v43003016-1">16&nbsp;</b> (id = v + BB CCC VVV - n). */
async function fetchEsvSite(ref: string): Promise<Passage> {
  const slug = ref.replace(/\s+/g, '+')
  const r = await fetch(`https://www.esv.org/${encodeURIComponent(slug).replace(/%2B/g, '+')}/`, { headers: { 'User-Agent': UA, Accept: 'text/html' } })
  if (!r.ok) throw new Error(`esv.org returned ${r.status}`)
  const html = await r.text()
  // Narrow to the passage block if we can find it; otherwise work on the whole page.
  const start = html.search(/<div[^>]+(class="[^"]*passage[^"]*"|id="passage[^"]*")[^>]*>/i)
  let block = start >= 0 ? html.slice(start) : html
  const copyIdx = block.search(/class="[^"]*(copyright|footnotes|crossrefs)[^"]*"/i)
  if (copyIdx > 0) block = block.slice(0, copyIdx)
  const verseIds = [...block.matchAll(/id="v(\d{2})(\d{3})(\d{3})-\d+"/g)]
  if (!verseIds.length) throw new Error('Could not read the ESV passage page. Try another reference, or set ESV_API_KEY.')
  const last = verseIds[verseIds.length - 1]
  const verseEnd = Number(last[3])
  let text = block
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')                       // headings
    .replace(/<span[^>]*class="[^"]*(footnote|crossref|chapter-num)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ' ')                            // footnote markers
    .replace(/<b[^>]*class="[^"]*verse-num[^"]*"[^>]*>[\s\S]*?<\/b>/gi, ' ') // verse numbers
    .replace(/<[^>]+>/g, ' ')
  text = clean(decode(text))
  const canonical = decode((html.match(/<title>([^<|]+)/i)?.[1] ?? ref).replace(/\s*[-–|].*$/, '').trim()) || ref
  if (!text) throw new Error('Could not read the ESV passage text.')
  return { text, reference: canonical, verseEnd, source: 'www.esv.org' }
}

/* ---------------- LSB ---------------- */

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

async function fetchLsb(ref: string, retry = true): Promise<Passage> {
  const buildId = await getLsbBuildId()
  const url = `https://read.lsbible.org/_next/data/${buildId}/index.json?q=${encodeURIComponent(ref)}`
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', referer: 'https://read.lsbible.org/', 'x-nextjs-data': '1' } })
  if (r.status === 404 && retry) { await getLsbBuildId(true); return fetchLsb(ref, false) } // build id rotated
  if (!r.ok) throw new Error(`read.lsbible.org returned ${r.status}`)
  const data = await r.json() as { pageProps?: { passages?: { title?: string; passageHtml?: string; to?: { vn: number } }[] } }
  const passages = data.pageProps?.passages ?? []
  if (!passages.length) throw new Error('That passage was not found in the LSB.')
  const verses: string[] = []
  let verseEnd = 0
  for (const p of passages) {
    const html = p.passageHtml ?? ''
    for (const m of html.matchAll(/<span[^>]*class="[^"]*\bverse\b[^"]*"[^>]*data-key="(\d+)-(\d+)-(\d+)"[^>]*>([\s\S]*?)<\/span>(?=\s*(?:<span[^>]*class="[^"]*\bverse\b|<\/p>|<p|$))/g)) {
      verseEnd = Number(m[3])
      const inner = m[4]
        .replace(/<small[^>]*data-verse[^>]*>[\s\S]*?<\/small>/gi, ' ')
        .replace(/<[^>]*class="[^"]*(chapter-number|subhead)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
      verses.push(clean(decode(inner)))
    }
    if (!verseEnd && p.to?.vn) verseEnd = p.to.vn
  }
  const text = clean(verses.join(' '))
  if (!text) throw new Error('Could not read the LSB passage.')
  return { text, reference: passages[0]?.title?.trim() || ref, verseEnd, source: 'read.lsbible.org' }
}

/* ---------------- helpers ---------------- */

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

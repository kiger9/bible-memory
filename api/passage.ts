// Vercel serverless function: proxies licensed translations that need a server-side key.
// GET /api/passage?ref=John%203:16&translation=esv
type Req = { method?: string; query: Record<string, string | string[] | undefined> }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void; setHeader: (k: string, v: string) => void }

export default async function handler(req: Req, res: Res) {
  const ref = String(req.query.ref ?? '')
  const translation = String(req.query.translation ?? '')
  if (!ref) return res.status(400).send('Missing ref')

  if (translation === 'esv') {
    const key = process.env.ESV_API_KEY
    if (!key) return res.status(500).send('ESV_API_KEY is not configured on the server.')
    const params = new URLSearchParams({
      q: ref,
      'include-headings': 'false', 'include-footnotes': 'false', 'include-verse-numbers': 'false',
      'include-short-copyright': 'false', 'include-passage-references': 'false', 'include-first-verse-numbers': 'false',
      'include-selahs': 'true', 'indent-paragraphs': '0', 'indent-poetry': 'false',
    })
    const r = await fetch(`https://api.esv.org/v3/passage/text/?${params}`, { headers: { Authorization: `Token ${key}` } })
    if (!r.ok) return res.status(r.status).send(`ESV API error ${r.status}`)
    const data = await r.json() as { passages: string[]; canonical: string; passage_meta: { end: number[] }[] }
    const text = (data.passages?.[0] ?? '').replace(/\s+/g, ' ').trim()
    if (!text) return res.status(404).send('That passage was not found.')
    // passage_meta end = [book, chapter, verse] packed as BBCCCVVV
    const endPacked = data.passage_meta?.[0]?.end?.[0] ?? 0
    const verseEnd = endPacked % 1000
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json({ text, reference: data.canonical, verseEnd })
  }
  return res.status(400).send(`Unknown proxied translation "${translation}"`)
}

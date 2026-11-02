// TEMPORARY: returns raw HTML/JSON from the two publisher sites so the parsers can be written
// against the real markup. Deleted once api/passage.ts is finished.
type Req = { query: Record<string, string | string[] | undefined> }
type Res = { status: (n: number) => Res; send: (b: string) => void; setHeader: (k: string, v: string) => void }
const ALLOWED = ['www.esv.org', 'read.lsbible.org']
export default async function handler(req: Req, res: Res) {
  const url = String(req.query.url ?? '')
  let u: URL
  try { u = new URL(url) } catch { return res.status(400).send('bad url') }
  if (!ALLOWED.includes(u.hostname)) return res.status(403).send('host not allowed')
  const extra: Record<string, string> = {}
  if (req.query.nextdata) { extra['x-nextjs-data'] = '1'; extra['referer'] = `${u.origin}/` }
  const r = await fetch(u.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', Accept: 'text/html,application/json;q=0.9,*/*;q=0.8', ...extra } })
  const body = await r.text()
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return res.status(200).send(`STATUS ${r.status}\nCT ${r.headers.get('content-type')}\nLEN ${body.length}\n\n${body}`)
}

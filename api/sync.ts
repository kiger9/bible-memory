// Vercel serverless function: stores one encrypted backup blob per sync id in Upstash Redis.
//   GET  /api/sync?id=<hex>            -> { iv, data, updatedAt } or 404
//   PUT  /api/sync?id=<hex>  body JSON -> { ok: true }
// The blob is encrypted on the device with a key derived from the user's sync phrase; the server never sees plaintext.
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (Vercel Marketplace: Upstash Redis).
type Req = { method?: string; query: Record<string, string | string[] | undefined>; body?: unknown }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void; setHeader: (k: string, v: string) => void }

const MAX_BYTES = 2_000_000

async function redis(cmd: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Sync is not configured on the server yet (Upstash Redis).')
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) })
  if (!r.ok) throw new Error(`Storage error ${r.status}`)
  return (await r.json() as { result: unknown }).result
}

export default async function handler(req: Req, res: Res) {
  const id = String(req.query.id ?? '')
  if (!/^[0-9a-f]{48,64}$/.test(id)) return res.status(400).send('Bad sync id')
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', `kept:${id}`])
      if (!raw) return res.status(404).send('No backup yet')
      return res.status(200).json(JSON.parse(String(raw)))
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
      if (body.length > MAX_BYTES) return res.status(413).send('Backup too large')
      const parsed = JSON.parse(body) as { iv?: string; data?: string; updatedAt?: number }
      if (!parsed.iv || !parsed.data || !parsed.updatedAt) return res.status(400).send('Bad payload')
      await redis(['SET', `kept:${id}`, JSON.stringify(parsed)])
      return res.status(200).json({ ok: true })
    }
    return res.status(405).send('GET or PUT')
  } catch (e) {
    return res.status(503).send((e as Error).message)
  }
}

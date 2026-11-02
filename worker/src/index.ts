// Kept sync worker: one encrypted blob per sync id, stored in Workers KV.
//   GET  /?id=<hex>            -> { iv, data, updatedAt } or 404
//   PUT  /?id=<hex>  body JSON -> { ok: true }
// The blob is encrypted on the phone with a key derived from the user's sync phrase; this worker never sees plaintext.

export interface Env { KEPT_SYNC: KVNamespace; ALLOWED_ORIGINS: string }

const MAX_BYTES = 2_000_000

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const headers = cors(req, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    const id = new URL(req.url).searchParams.get('id') ?? ''
    if (!/^[0-9a-f]{48,64}$/.test(id)) return new Response('Bad sync id', { status: 400, headers })
    const key = `kept:${id}`

    if (req.method === 'GET') {
      const raw = await env.KEPT_SYNC.get(key)
      if (!raw) return new Response('No backup yet', { status: 404, headers })
      return new Response(raw, { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
    }
    if (req.method === 'PUT') {
      const body = await req.text()
      if (body.length > MAX_BYTES) return new Response('Backup too large', { status: 413, headers })
      let parsed: { iv?: string; data?: string; updatedAt?: number }
      try { parsed = JSON.parse(body) } catch { return new Response('Bad payload', { status: 400, headers }) }
      if (!parsed.iv || !parsed.data || !parsed.updatedAt) return new Response('Bad payload', { status: 400, headers })
      await env.KEPT_SYNC.put(key, JSON.stringify({ iv: parsed.iv, data: parsed.data, updatedAt: parsed.updatedAt }))
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
    }
    return new Response('GET or PUT', { status: 405, headers })
  },
}

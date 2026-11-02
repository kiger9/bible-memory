// Vercel serverless function: transcribes a short recorded recitation when the Web Speech API
// is unavailable (iOS Home Screen web apps). POST /api/transcribe { audio: base64, mime: string }
// Uses Groq's hosted Whisper (whisper-large-v3-turbo). Set GROQ_API_KEY in Vercel env vars.
type Req = { method?: string; body?: unknown }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).send('POST only')
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { audio?: string; mime?: string }
  if (!body?.audio) return res.status(400).send('Missing audio')
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(500).send('GROQ_API_KEY is not configured on the server.')

  const bytes = Buffer.from(body.audio, 'base64')
  if (bytes.length > 4_000_000) return res.status(413).send('Recording too long.')
  const mime = body.mime || 'audio/mp4'
  const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'm4a'
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mime }), `recitation.${ext}`)
  form.append('model', 'whisper-large-v3-turbo')
  form.append('language', 'en')
  form.append('response_format', 'json')
  // Deliberately no `prompt` bias toward the target verse: it would inflate scores.
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
  })
  if (!r.ok) return res.status(502).send(`Transcription failed (${r.status}).`)
  const data = await r.json() as { text?: string }
  return res.status(200).json({ text: (data.text ?? '').trim() })
}

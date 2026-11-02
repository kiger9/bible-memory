// Vercel serverless function: generates "thought chunk" hints for a verse, once, at add time.
// POST /api/hints { reference, translation, words: string[] }
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

type Req = { method?: string; body?: unknown }
type Res = { status: (n: number) => Res; json: (b: unknown) => void; send: (b: string) => void }

const ChunksSchema = z.object({
  chunks: z.array(z.object({
    startWord: z.number().int(),
    endWord: z.number().int(),
    gist: z.string(),
    keyword: z.string(),
  })),
})

const SYSTEM = `You segment Bible verses into memorization "thought chunks" for a scripture memory app.
Given a passage as an indexed word list, split it into 2-8 phrase-level chunks that each express one complete thought.
Chunks must cover every word exactly once, in order, with 0-based inclusive word indices.
For each chunk write:
- gist: a one-line plain-language summary of what that phrase says, that would jog someone's memory of the phrase WITHOUT quoting more than two consecutive words of it.
- keyword: one vivid anchor word or image for the phrase.
Keep gists short (under 12 words). Do not add commentary.`

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).send('POST only')
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { reference?: string; translation?: string; words?: string[] }
  if (!body?.words?.length || !body.reference) return res.status(400).send('Missing words/reference')
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).send('ANTHROPIC_API_KEY is not configured on the server.')

  const client = new Anthropic()
  const indexed = body.words.map((w, i) => `${i}:${w}`).join(' ')
  const response = await client.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Passage: ${body.reference} (${body.translation ?? ''})\nWords: ${indexed}` }],
    output_config: { format: zodOutputFormat(ChunksSchema) },
  })
  if (response.stop_reason === 'refusal' || !response.parsed_output) return res.status(502).send('Could not generate hints.')

  const n = body.words.length
  const chunks = response.parsed_output.chunks
    .filter(c => c.startWord >= 0 && c.endWord < n && c.startWord <= c.endWord)
    .sort((a, b) => a.startWord - b.startWord)
  return res.status(200).json({ chunks })
}

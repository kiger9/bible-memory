/**
 * Speech capability ladder:
 *  1. Web Speech API (SpeechRecognition) — Android Chrome, iOS Safari *tab*.
 *  2. MediaRecorder + /api/transcribe — iOS Home Screen web apps (SpeechRecognition is unavailable there).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SRCtor = new () => any
declare global { interface Window { webkitSpeechRecognition?: SRCtor; SpeechRecognition?: SRCtor } }

export type SpeechMethod = 'webspeech' | 'recorder' | 'none'

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export function speechMethod(): SpeechMethod {
  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent)
  if (hasSR && !(isIOS && isStandalone())) return 'webspeech'
  if (typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia) return 'recorder'
  return 'none'
}

/** Push-to-talk with the Web Speech API. Returns a stop function. */
export function startListening(onResult: (transcript: string, final: boolean) => void, onEnd: () => void, onError: (msg: string) => void) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) { onError('Speech recognition is not available in this browser.'); return () => {} }
  const rec = new Ctor()
  rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
  let finalText = ''
  rec.onresult = (ev: any) => {
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript
      if (ev.results[i].isFinal) finalText += ' ' + t; else interim += ' ' + t
    }
    onResult((finalText + ' ' + interim).trim(), false)
  }
  rec.onerror = (ev: any) => onError(ev.error === 'not-allowed' ? 'Microphone permission was denied.' : `Speech error: ${ev.error}`)
  rec.onend = () => { onResult(finalText.trim(), true); onEnd() }
  rec.start()
  return () => rec.stop()
}

/** Push-to-talk with MediaRecorder. Returns a stop function that resolves to the transcript via /api/transcribe. */
export async function startRecording(onError: (msg: string) => void): Promise<() => Promise<string>> {
  let stream: MediaStream
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) }
  catch { onError('Microphone permission was denied.'); return async () => '' }
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || ''
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
  const stopped = new Promise<void>(resolve => { rec.onstop = () => resolve() })
  rec.start()
  return async () => {
    rec.stop(); await stopped
    stream.getTracks().forEach(t => t.stop())
    const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' })
    const audio = await blobToBase64(blob)
    const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio, mime: blob.type }) })
    if (!r.ok) { onError(await r.text().catch(() => 'Transcription failed.')); return '' }
    return ((await r.json()) as { text: string }).text
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '')
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

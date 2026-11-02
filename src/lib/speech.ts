/** Thin wrapper over the Web Speech API (SpeechRecognition). Returns null if unsupported. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SRCtor = new () => any
declare global { interface Window { webkitSpeechRecognition?: SRCtor; SpeechRecognition?: SRCtor } }

export function speechSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

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

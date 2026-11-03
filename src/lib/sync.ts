/**
 * Automatic encrypted cloud backup. Nothing to turn on and nothing to remember.
 *
 * On first launch the app makes a random backup code and keeps it on the phone. The code derives
 * (a) a storage id and (b) an AES-GCM key; the whole database is encrypted and uploaded after every
 * change, so the server only ever sees ciphertext. A reinstall or a new phone loses the code with
 * everything else, so the Logbook shows it: enter it on the new phone and the backup is restored.
 */
import { db, exportAll, replaceAll } from './db'

/** Where backups live: a Cloudflare Worker (VITE_SYNC_URL, set at build time) or the Vercel function + Upstash fallback. */
const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '') || '/api/sync'

const CODE_KEY = 'kept-backup-code'
const LAST_KEY = 'kept-sync-last'
const enc = new TextEncoder(), dec = new TextDecoder()
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 symbols, no 0/O/1/I

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map(b => ALPHABET[b % 32]).join('')
}
/** Normalise what a person typed: uppercase, drop dashes and spaces, map lookalikes. */
export function cleanCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/[1I]/g, 'L')
}
export function isCode(s: string): boolean { return s.length === 16 && [...s].every(c => ALPHABET.includes(c)) }
/** Display form: ABCD-EFGH-JKLM-NPQR */
export function formatCode(s: string): string { return s.match(/.{1,4}/g)?.join('-') ?? s }

/** The device's backup code, created on first use. */
export function getCode(): string {
  let code: string | null = null
  try { code = localStorage.getItem(CODE_KEY) } catch { /* ignore */ }
  if (!code || !isCode(code)) {
    code = makeCode()
    try { localStorage.setItem(CODE_KEY, code) } catch { /* ignore */ }
  }
  return code
}
export function lastSynced(): number { try { return Number(localStorage.getItem(LAST_KEY) ?? 0) } catch { return 0 } }
function setLast(t: number) { try { localStorage.setItem(LAST_KEY, String(t)) } catch { /* ignore */ } }

async function sha256(s: string) { return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))) }

async function derive(code: string) {
  const id = Array.from(await sha256(`kept-id:${code}`)).map(b => b.toString(16).padStart(2, '0')).join('')
  const key = await crypto.subtle.importKey('raw', await sha256(`kept-key:${code}`), 'AES-GCM', false, ['encrypt', 'decrypt'])
  return { key, id }
}

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))

async function encrypt(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)))
  return { iv: b64(iv), data: b64(data) }
}
async function decrypt(key: CryptoKey, iv: string, data: string) {
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(data)))
}

type Remote = { iv: string; data: string; updatedAt: number }

async function fetchRemote(code: string): Promise<Remote | null> {
  const { id } = await derive(code)
  const r = await fetch(`${SYNC_URL}?id=${id}`)
  if (r.status === 404) return null
  if (!r.ok) throw new Error(await r.text().catch(() => 'Could not reach the backup server.'))
  return await r.json() as Remote
}

/** Upload the current database under this device's code. */
export async function push(): Promise<void> {
  const { key, id } = await derive(getCode())
  const snapshot = await exportAll()
  const updatedAt = Date.now()
  const payload = { ...(await encrypt(key, JSON.stringify(snapshot))), updatedAt }
  const r = await fetch(`${SYNC_URL}?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!r.ok) throw new Error(await r.text().catch(() => 'Backup failed.'))
  setLast(updatedAt)
}

/** Replace everything on this phone with the backup stored under `code`. Returns false if there is none. */
async function pull(code: string): Promise<boolean> {
  const remote = await fetchRemote(code)
  if (!remote) return false
  const { key } = await derive(code)
  let text: string
  try { text = await decrypt(key, remote.iv, remote.data) } catch { throw new Error('That backup could not be read.') }
  await replaceAll(JSON.parse(text))
  setLast(remote.updatedAt)
  return true
}

/** Adopt another phone's backup code: restore its data here and keep backing up under that code from now on. */
export async function restore(input: string): Promise<void> {
  const code = cleanCode(input)
  if (!isCode(code)) throw new Error('A backup code is 16 letters and numbers, like ABCD-EFGH-JKLM-NPQR.')
  if (code === getCode()) throw new Error('That is already this phone’s code.')
  const found = await pull(code)
  if (!found) throw new Error('No backup was found for that code.')
  try { localStorage.setItem(CODE_KEY, code) } catch { /* ignore */ }
  await push()
}

/* ---- automatic: debounced push after any write, pull on launch if the cloud copy is newer ---- */

let timer: ReturnType<typeof setTimeout> | undefined
export function scheduleSync(delayMs = 1500) {
  clearTimeout(timer)
  timer = setTimeout(() => { push().catch(() => { /* retried on next change or launch */ }) }, delayMs)
}

export async function syncOnLaunch() {
  try { localStorage.removeItem('kept-sync-phrase') } catch { /* old versions */ }
  try {
    const code = getCode()
    const remote = await fetchRemote(code)
    if (remote && remote.updatedAt > lastSynced()) await pull(code)
    else if ((await db.verses.count()) > 0 && !remote) await push()
  } catch { /* offline; try again next launch */ }
  document.addEventListener('visibilitychange', () => { if (document.hidden) push().catch(() => {}) })
}

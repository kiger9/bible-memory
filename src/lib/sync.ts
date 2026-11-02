/**
 * Encrypted cloud backup keyed by a passphrase the user chooses.
 * The phrase derives (a) a storage id and (b) an AES-GCM key via PBKDF2; the server only ever
 * stores ciphertext. Reinstall the app, enter the same phrase, and everything comes back.
 */
import { db, exportAll, importAll } from './db'

/** Where backups live: a Cloudflare Worker (VITE_SYNC_URL, set at build time) or the Vercel function + Upstash fallback. */
const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '') || '/api/sync'

const PHRASE_KEY = 'kept-sync-phrase'
const LAST_KEY = 'kept-sync-last'
const enc = new TextEncoder(), dec = new TextDecoder()

export function getPhrase(): string | null { try { return localStorage.getItem(PHRASE_KEY) } catch { return null } }
export function lastSynced(): number { try { return Number(localStorage.getItem(LAST_KEY) ?? 0) } catch { return 0 } }
function setLast(t: number) { try { localStorage.setItem(LAST_KEY, String(t)) } catch { /* ignore */ } }

async function derive(phrase: string) {
  const base = await crypto.subtle.importKey('raw', enc.encode(phrase.normalize('NFKC').trim().toLowerCase()), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('kept-sync-v1'), iterations: 200_000, hash: 'SHA-256' }, base, 512)
  const bytes = new Uint8Array(bits)
  const key = await crypto.subtle.importKey('raw', bytes.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt'])
  const id = Array.from(bytes.slice(32)).map(b => b.toString(16).padStart(2, '0')).join('')
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

/** Upload the current database. */
export async function push(phrase = getPhrase()): Promise<void> {
  if (!phrase) return
  const { key, id } = await derive(phrase)
  const snapshot = await exportAll()
  const updatedAt = Date.now()
  const payload = { ...(await encrypt(key, JSON.stringify(snapshot))), updatedAt }
  const r = await fetch(`${SYNC_URL}?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!r.ok) throw new Error(await r.text().catch(() => 'Backup failed.'))
  setLast(updatedAt)
}

/** Download and merge the backup stored under this phrase. Returns false if there is none. */
export async function pull(phrase = getPhrase()): Promise<boolean> {
  if (!phrase) return false
  const { key, id } = await derive(phrase)
  const r = await fetch(`${SYNC_URL}?id=${id}`)
  if (r.status === 404) return false
  if (!r.ok) throw new Error(await r.text().catch(() => 'Restore failed.'))
  const remote = await r.json() as { iv: string; data: string; updatedAt: number }
  let text: string
  try { text = await decrypt(key, remote.iv, remote.data) } catch { throw new Error('That phrase does not match the backup.') }
  await importAll(JSON.parse(text))
  setLast(remote.updatedAt)
  return true
}

/** Turn sync on: remember the phrase, restore anything already stored under it, then upload the merged result. */
export async function enable(phrase: string): Promise<{ restored: boolean }> {
  const clean = phrase.trim()
  if (clean.length < 8) throw new Error('Use a phrase of at least 8 characters.')
  const restored = await pull(clean)
  try { localStorage.setItem(PHRASE_KEY, clean) } catch { /* ignore */ }
  await push(clean)
  return { restored }
}

export function disable() { try { localStorage.removeItem(PHRASE_KEY); localStorage.removeItem(LAST_KEY) } catch { /* ignore */ } }

/* ---- automatic sync: debounced push after any write, pull once per launch ---- */

let timer: ReturnType<typeof setTimeout> | undefined
export function scheduleSync(delayMs = 4000) {
  if (!getPhrase()) return
  clearTimeout(timer)
  timer = setTimeout(() => { push().catch(() => { /* retried on next change */ }) }, delayMs)
}

export async function syncOnLaunch() {
  if (!getPhrase()) return
  try {
    // Pull first in case another device (or a fresh reinstall) has newer data, then push the merged state.
    const r = await fetch(`${SYNC_URL}?id=${(await derive(getPhrase()!)).id}`, { method: 'GET' })
    if (r.ok) {
      const remote = await r.json() as { updatedAt: number }
      if (remote.updatedAt > lastSynced()) await pull()
    }
    const count = await db.verses.count()
    if (count > 0) await push()
  } catch { /* offline; try again next launch */ }
  document.addEventListener('visibilitychange', () => { if (document.hidden) push().catch(() => {}) })
}

import { useEffect, useState } from 'react'
import { db, exportAll, importAll, getSettings } from '../lib/db'
import Header from '../components/Header'
import { TRANSLATIONS } from '../lib/bible'
import { getCode, formatCode, lastSynced, restore, push, scheduleSync } from '../lib/sync'
import type { Settings as SettingsRow } from '../lib/types'

export default function Settings() {
  const [settings, setSettings] = useState<SettingsRow | null>(null)
  useEffect(() => { getSettings().then(setSettings) }, [])

  async function update(patch: Partial<SettingsRow>) {
    if (!settings) return
    const next = { ...settings, ...patch }
    setSettings(next)
    await db.settings.put(next)
    scheduleSync(500)
  }
  async function doExport() {
    const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `bible-memory-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  async function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    await importAll(JSON.parse(await f.text()))
    scheduleSync(500)
  }

  return (
    <>
      <Header title="Settings" />
      <section className="prefs">
        <h2 className="section-title">Preferences</h2>
        {settings && (
          <label className="field">
            <span>Default translation</span>
            <select value={settings.defaultTranslation} onChange={e => update({ defaultTranslation: e.target.value as SettingsRow['defaultTranslation'] })}>
              {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.abbr} — {t.name}</option>)}
            </select>
          </label>
        )}
        {settings && (
          <label className="field">
            <span>New verses per day</span>
            <select value={settings.dailyGoal} onChange={e => update({ dailyGoal: Number(e.target.value) })}>
              {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="muted">Reviews always show on Today; this only paces verses you have not started.</span>
          </label>
        )}
      </section>
      <BackupPanel />
      <section className="actions">
        <button className="button ghost" onClick={doExport}>Export file</button>
        <label className="button ghost">Import file<input type="file" accept="application/json" onChange={doImport} hidden /></label>
      </section>
      <p className="muted build">Build {__BUILD__}</p>
    </>
  )
}

function BackupPanel() {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [last, setLast] = useState(lastSynced())
  const code = formatCode(getCode())

  async function backupNow() {
    setBusy(true); setMsg('')
    try { await push(); setLast(lastSynced()); setMsg('Backed up just now.') }
    catch (err) { setMsg((err as Error).message) }
    finally { setBusy(false) }
  }
  async function doRestore(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    try { await restore(input); setInput(''); setLast(lastSynced()); setMsg('Restored. This phone now shares that backup.') }
    catch (err) { setMsg((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <section className="sync">
      <h2 className="section-title">Backup</h2>
      <p className="muted">Your verses and progress are backed up automatically after every change, encrypted so only this phone can read them.{last ? ` Last backup ${new Date(last).toLocaleString()}.` : ''}</p>
      <p className="muted">This phone’s backup code is <strong className="code">{code}</strong>. On a new phone, or after reinstalling the app, enter it below and everything comes back.</p>
      <div className="actions">
        <button className="button ghost" onClick={backupNow} disabled={busy}>{busy ? 'Working…' : 'Back up now'}</button>
      </div>
      <details className="restore">
        <summary>Restore from another phone</summary>
        <form className="form" onSubmit={doRestore}>
          <label className="field">
            <span>Backup code from the other phone</span>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="ABCD-EFGH-JKLM-NPQR" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          </label>
          <button className="button ghost" disabled={busy || input.trim().length < 16}>{busy ? 'Working…' : 'Restore'}</button>
        </form>
      </details>
      {msg && <p className="muted" role="status">{msg}</p>}
    </section>
  )
}

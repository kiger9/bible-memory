# Kept — scripture by heart

A personal scripture-memorization web app that runs as a PWA on your phone. Add a verse, pick a translation, then practice by reading, first-letter recall, typing, or speaking aloud. Hints go beyond "next word": each verse is split into thought chunks with a one-line gist. Everything you practice lands in a logbook, and a pop quiz pulls from your verses.

## Stack

- Vite + React + TypeScript, `vite-plugin-pwa` (installable, offline shell)
- IndexedDB via Dexie (all data on-device; JSON export/import in Logbook)
- `ts-fsrs` spaced repetition for review scheduling
- Web Speech API for speak-aloud practice
- Vercel serverless functions in `api/` for keyed services:
  - `api/passage.ts` fetches licensed translations server-side. ESV uses the official api.esv.org when `ESV_API_KEY` is set and otherwise reads the public passage page at esv.org as an interim measure. LSB reads the data route behind read.lsbible.org (unofficial, personal use, within Lockman's 1,000-verse quotation permission)
  - `api/hints.ts` calls Claude once per verse to generate thought-chunk hints

Public-domain translations (WEB, ASV, BBE, Darby, YLT) are fetched from bible-api.com directly from the browser, no key needed. NASB, ESV, LSB, KJV and NIV go through the proxy. NASB, NIV and KJV come from API.Bible and need `API_BIBLE_KEY` with each Bible enabled on that key. Licensed translations without a hobby-friendly API (NLT, CSB, NKJV) can be pasted in by hand with the "Paste my own text" option; that text stays on the device.

## Local development

```bash
npm install
npm run dev
```

Open the printed URL on your phone (same Wi-Fi) to try it. The `/api` functions only run under Vercel, so locally the ESV option and the thought-chunk hints are unavailable; first-letter and reveal hints still work. To run the functions locally, use `npx vercel dev` after linking the project.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, "Add New Project", import the repo. Framework preset: Vite. Defaults are fine.
3. Project Settings, Environment Variables, add:
   - `ANTHROPIC_API_KEY` (console.anthropic.com) for hints
   - `ESV_API_KEY` (api.esv.org, free for non-commercial use) for the ESV
   - `API_BIBLE_KEY` (scripture.api.bible, free tier) for the NASB, NIV and KJV. After creating the key, request the NASB and NIV under Bibles in the api.bible dashboard; the publishers have to approve them on your key
   - `GROQ_API_KEY` (console.groq.com) for speak-aloud practice in the installed iOS app, where the Web Speech API is unavailable and the app records audio and transcribes it via `api/transcribe.ts`
   - `VITE_SYNC_URL` set to your Cloudflare Worker URL for cloud backup (see below). Without it the app falls back to `api/sync.ts`, which needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Vercel Storage tab (Upstash Redis).
4. Deploy. Open the URL on your phone, then Share, "Add to Home Screen".

## Backup and restore

Data lives on the phone in IndexedDB and is backed up to the cloud automatically: on first launch the app makes a random backup code, derives an AES-GCM key and a storage id from it, and uploads the encrypted database after every change (adding or deleting a verse, finishing a practice) and whenever the app goes to the background. The server only ever sees ciphertext. The code is shown in Logbook; on a new phone or after a reinstall, enter it under "Restore from another phone" and everything comes back. Export and import of a plain JSON file remain available as a manual fallback.

Backups are stored on Cloudflare Workers KV by the Worker in `worker/`. To deploy it on your Cloudflare account:

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create KEPT_SYNC
```

Paste the printed namespace id into `worker/wrangler.toml`, then:

```bash
npx wrangler deploy
```

Copy the Worker URL it prints (ending in `workers.dev`) into Vercel as `VITE_SYNC_URL` and redeploy the app. If you add a custom domain later, add it to `ALLOWED_ORIGINS` in `wrangler.toml` and redeploy the Worker.

## Project layout

```
api/            Vercel serverless functions (ESV proxy, hint generation)
docs/           Research, brand guide, feature plan, backlog
src/lib/        books, reference parser, bible fetch, text diff, FSRS, speech, hints, Dexie DB
src/pages/      Today, Verses, AddVerse, Practice, Quiz, Logbook
src/styles/     tokens.css (design tokens), base.css
```

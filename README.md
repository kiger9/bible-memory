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

Public-domain translations (WEB, KJV, ASV, BBE, Darby, YLT) are fetched from bible-api.com directly from the browser, no key needed. ESV and LSB go through the proxy. Licensed translations without a hobby-friendly API (NIV, NLT, NASB, CSB) can be pasted in by hand with the "Paste my own text" option; that text stays on the device.

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
   - `GROQ_API_KEY` (console.groq.com) for speak-aloud practice in the installed iOS app, where the Web Speech API is unavailable and the app records audio and transcribes it via `api/transcribe.ts`
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for cloud backup. Easiest: in the Vercel project, Storage tab, "Create Database", pick Upstash Redis (free tier). Vercel injects both variables automatically.
4. Deploy.

## Backup and restore

Data lives on the phone in IndexedDB. To survive deleting or reinstalling the app, open Logbook, choose a sync phrase (8+ characters) and turn on sync. The app derives an encryption key and a storage id from the phrase with PBKDF2, encrypts the whole database with AES-GCM, and uploads it through `api/sync.ts` to Upstash Redis after every practice and whenever the app goes to the background. The server only ever sees ciphertext. On a fresh install, enter the same phrase in Logbook and everything is restored. Export and import of a plain JSON file remain available as a manual fallback. Open the URL on your phone, then Share, "Add to Home Screen".

## Project layout

```
api/            Vercel serverless functions (ESV proxy, hint generation)
docs/           Research, brand guide, feature plan, backlog
src/lib/        books, reference parser, bible fetch, text diff, FSRS, speech, hints, Dexie DB
src/pages/      Today, Verses, AddVerse, Practice, Quiz, Logbook
src/styles/     tokens.css (design tokens), base.css
```

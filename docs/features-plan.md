# Bible Memory PWA — Features Plan

Status: research + product plan, written 2026-11-02. Every external claim below was checked against a live source on that date (URL cited inline). Items marked **UNVERIFIED** could not be confirmed because the host was blocked from this environment (`bible-api.com`, `api.esv.org`, `www.esv.org`, `scripture.api.bible`, `docs.api.bible`, `bolls.life`, `getbible.net`, `api.nlt.to`, `bugs.webkit.org`, `webkit.org`, `developer.mozilla.org`, `platform.openai.com`, `developers.openai.com`, `deepgram.com`, `groq.com`, `console.groq.com`, `vite-pwa-org.netlify.app`, `faith.tools`); for those I relied on search-engine excerpts of the official page or on GitHub mirrors and say so. Re-check them before relying on an exact number.

Stack (validated, see §0): Vite 8 + React 19 + TypeScript, `vite-plugin-pwa` 2.x, Dexie 4 (IndexedDB), Vercel with `api/` Node functions as a thin proxy to keyed Bible APIs, a speech-to-text API, and the Claude API (`claude-sonnet-5-5` default, `claude-haiku-5-5` as the cheap option) for one-time "thought chunk" generation per verse. No accounts in v1; data lives on-device with JSON export/import.

---

## 0. Stack validation (versions as of 2026-11-02, from `npm view`)

| Package | Latest | Notes |
|---|---|---|
| `vite` | 8.3.5 | engines `node ^20.19.0 \|\| >=22.12.0` |
| `vite-plugin-pwa` | 2.0.0 | peer `vite ^3..^8`, `workbox-* ^7.4.1`; engines node >=20.19 |
| `react` | 19.3.1 | |
| `dexie` | 4.4.7 | Apache-2.0 |
| `ts-fsrs` | 6.0.0 (beta tag 6.0.0-beta.15) | MIT; **engines node >=24.0.0** (build/dev requirement; runs in the browser) |
| `bible-passage-reference-parser` | 4.0.0 | MIT, TypeScript, ESM |
| `diff` (jsdiff) | 9.0.0 | BSD-3 |
| `diff-match-patch` / `fast-diff` | 1.0.5 / 1.3.0 | char-level; not needed if we use jsdiff |

- Vercel Functions: Node 24.x is the default for new projects; Node 20 was deprecated for Builds/Functions on 2026-10-01 ([Vercel changelog](https://vercel.com/changelog/node-js-20-is-being-deprecated), [Node versions doc](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)). Pin `"engines": {"node": "24.x"}` in `package.json`; this also satisfies `ts-fsrs`.
- Nothing in the stack is broken. One caution: `ts-fsrs` 6.0 is a brand-new major with a new API (`DefaultScheduler`, `newCard/preview/review`) and a monorepo layout; the old `fsrs()/createEmptyCard()/repeat()` examples on the web are for 5.x ([ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs), [packages/fsrs/README.md](https://raw.githubusercontent.com/open-spaced-repetition/ts-fsrs/main/packages/fsrs/README.md)).

---

## 1. Bible text sources

### 1.1 Findings per source

**bible-api.com** (open source: [seven1m/bible_api](https://github.com/seven1m/bible_api); data from [seven1m/open-bibles](https://github.com/seven1m/open-bibles))
- Translations: public-domain/open texts only. English set in open-bibles: **WEB** (default), **KJV**, **ASV**, **BSB**, **BBE**, **DARBY**, **DRA** (Douay-Rheims), **OEB-CW**, **OEB-US**, **WEBBE** (British), **YLT** (NT only). The live list is served at `GET https://bible-api.com/data` (**UNVERIFIED** this session — host blocked; confirm ids in M1).
- Key: none. Rate limit: not documented ("fair use"); cache aggressively.
- License: texts are public domain (BSB is CC0/public domain); no attribution required, but we show `translation_note` anyway.
- CORS: not stated in the README (**UNVERIFIED**); it is commonly called straight from browsers in tutorials. M1 task: test a browser `fetch` from the deployed origin; if it fails, route through `api/bible` (trivial).
- Request/response:
  ```http
  GET https://bible-api.com/John+3:16?translation=kjv
  ```
  ```json
  { "reference": "John 3:16",
    "verses": [ { "book_id": "JHN", "book_name": "John", "chapter": 3, "verse": 16, "text": "For God so loved..." } ],
    "text": "For God so loved...",
    "translation_id": "kjv", "translation_name": "King James Version", "translation_note": "Public Domain" }
  ```
  Ranges (`Psalm+23:1-3`) and comma lists are accepted; verse objects come back per verse, which is exactly what we store.

**Free Use Bible API (HelloAO)** — [github.com/HelloAOLab/bible-api](https://github.com/HelloAOLab/bible-api), `https://bible.helloao.org`
- "No usage limits, no API keys required." MIT code; BSB and Majority Bible are CC0. Chapter endpoint `GET /api/{translation}/{book}/{chapter}.json` (e.g. `/api/BSB/JHN/3.json`, USFM book codes). Also offers full-DB downloads. Translation ids and the chapter JSON item shape (`content[]` with `type:"verse"`, `number`, `content[]`) were not readable from the README (**UNVERIFIED**; check the API reference).
- Use: backup/secondary source for public-domain texts (BSB especially), and a candidate for bundling an offline public-domain translation later.

**ESV — api.esv.org** (Crossway) — [api.esv.org](https://api.esv.org/), [passage-text docs](https://api.esv.org/docs/passage-text/)
- Key: required (free, sign up at api.esv.org). Sent as `Authorization: Token <key>` — never expose in the browser; proxy it.
- Endpoint: `GET https://api.esv.org/v3/passage/text/?q=Psalm+23:1-3&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false`. Response JSON has `query`, `canonical` (normalized reference), `passages: string[]` (one string per query segment; verse numbers appear inline as `[1]` when `include-verse-numbers=true`), `parsed` (verse ids). Default for `include-headings`/`include-footnotes` is `true`, so turn them off. (Parameters confirmed from the indexed docs page; the `canonical` field is confirmed from a third-party client.)
- Limits (from api.esv.org terms as indexed): **5,000 queries/day, 1,000/hour, 60/minute**; max **500 verses** (or half a book, whichever is less) per query; local storage/cache capped at **500 verses or half a book**, and Crossway asks you to clear caches periodically. Non-commercial only; mobile/digital apps are permitted without formal permission if the conditions are met ([Crossway permissions](https://www.crossway.org/support/esv-bible-permissions/)).
- Attribution: show "ESV" with every quotation and the standard notice on an About/Copyright screen: *Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.* (Confirm exact wording on api.esv.org when you register; the API also returns a copyright string when `include-short-copyright=true`.)
- Implication for us: a personal memorization app stores a few dozen verses — far under 500 — so local storage of ESV verses is within terms. Do **not** bulk-download chapters for offline use.

**API.Bible / scripture.api.bible** (American Bible Society) — [api.bible](https://api.bible/), [FAQ](https://scripture.api.bible/faq), [rate limiting](https://docs.api.bible/getting-started/rate-limiting), [plan comparison](https://care.api.bible/article/378-comparing-api-bible-plans), [NIV licensing note](https://care.api.bible/article/394-commercial-licensing-for-the-niv), [accessing translations](https://care.api.bible/article/397-how-to-access-bible-translations-on-api-bible)
- Key: required (free Starter plan). **Starter: non-commercial, public-domain + Creative Commons Bibles plus up to 3 licensed Bibles, 5,000 API calls/month** (homepage + care article; an older docs page says 5,000/day — assume the stricter monthly figure). Overage $1 per 1,000 calls. Pro: 150,000 calls/month, copyrighted translations licensed individually.
- Max 500 consecutive verses per request.
- Attribution: Starter apps **must show a visible citation + hyperlink to https://api.bible** in the UI, plus the per-Bible copyright text from `GET /v1/bibles/{bibleId}` (`copyright` field). Web apps **must embed the FUMS JavaScript snippet** wherever Scripture is rendered. No sub-licensing; no AI training on the content.
- Translations: the homepage lists NLT, NASB and CSB among available Bibles; some translations require a separate agreement with the publisher before they can be activated on your key (which ones is not stated on the pages I could read — **UNVERIFIED**). **NIV: commercial use is not available through API.Bible** (Biblica's restriction); a feature-request page says NIV/NASB are in the DBL and you must get rights-holder permission.
- Endpoint shape: `GET https://api.scripture.api.bible/v1/bibles/{bibleId}/passages/{passageId}?content-type=text&include-verse-numbers=true` with header `api-key: <key>`; passage ids look like `PSA.23.1-PSA.23.3`. (Endpoint shape from memory/third-party clients — **UNVERIFIED** this session.)
- Implication: viable for a v1.1 "licensed extras" source (up to 3 of NASB/CSB/NKJV/NLT depending on activation), but FUMS + mandatory on-screen api.bible link add friction. Not needed for MVP.

**bolls.life** — [API.md on GitHub](https://github.com/Bolls-Bible/bain/blob/master/docs/API.md)
- Key: none. Endpoints: `GET https://bolls.life/get-text/<TRANSLATION>/<bookNumber>/<chapter>/` (chapter) and `.../<chapter>/<verse>/` (single verse); `get-books/<TRANSLATION>/`; full-translation JSON/ZIP under `/static/translations/`. Verse JSON: `{ pk, verse, text (HTML), comment? }`. Books are numbered 1–66.
- Translations named in the doc: YLT, UBIO, SYNOD, NKJV, KJV, WEB, HOM, WLCC, WLC, LXX, CUV, TB; third-party directories claim it also serves NIV, ESV, NLT, NASB.
- License: none stated. The maintainer says downloads may be used "however you want", but **bolls.life has no visible license from Crossway/Biblica/Tyndale/Lockman** for the copyrighted texts it mirrors. Pulling ESV/NIV/NLT/NASB from it would put *us* outside the publishers' terms. It is also hosted on a single-core server and asks users not to scrape.
- Decision: **not used in v1** (maybe as a dev-time sanity check only).

**getBible v2** — [github.com/getbible/v2](https://github.com/getbible/v2)
- Key: none. Static JSON, CDN-friendly: `https://api.getbible.net/v2/translations.json`, `https://api.getbible.net/v2/kjv/43/3.json` (book number + chapter), and a query service `https://query.getbible.net/v2/kjv/John 3:16` for verse-level references. English ids: `kjv`, `kjva`, `akjv`, `asv`, `basicenglish`, `darby`, `monkjv`. Repo GPL-3.0 (code); texts are public domain. Rate limit/CORS: not stated.
- Decision: optional second source for KJV/ASV; no unique translations over bible-api.com, so not in v1.

**NLT API — api.nlt.to** (Tyndale) — [api.nlt.to](https://api.nlt.to/), Dart client [arielmagbanua/nlt_bible](https://github.com/arielmagbanua/nlt_bible), [Tyndale permissions](https://www.tyndale.com/permissions)
- Key: required (register an application at api.nlt.to). Endpoints: passages (reference → text), search, reference parse, reading plans. Versions: NLT and KJV (NTV/NLTUK not confirmed).
- **Response is HTML, not JSON**: `div#bibletext`, `verse_export` elements with `bk`/`ch`/`vn` attributes, `span.vn` verse numbers, `span.red` words of Jesus, footnotes `a.a-tn`/`span.tn`, `p.subhead`. We must parse it server-side (drop headings/footnotes, split on `verse_export`).
- Terms/usage limits: not retrievable this session (**UNVERIFIED**). Tyndale's general policy: credit line required (*Scripture quotations are taken from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.*); commercial/monetized use needs a permission letter or license.
- Decision: **v1 via proxy** (NLT is popular, the API is free, HTML parsing is a contained task). Confirm limits when registering.

**Biblia API (Logos/Faithlife)** — [api.biblia.com/docs](https://api.biblia.com/docs)
- Key required (bibliaapi.com/docs/API_Keys). A Logos forum post says NIV and NRSV are *not* available through the API; translation list unverified (ASV/KJV/LEB likely). Nothing unique for us. **Skip.**

**NIV / other locked translations.** There is no key-based API that lets a hobby app pull NIV: API.Bible says NIV commercial use is unavailable and otherwise requires Biblica's permission; Biblia excludes it; bolls mirrors it without a license. Product answer: **"Paste your own text"** — the user may type/paste a verse from a Bible they own into the app for private study; it is stored only on their device, labelled with the translation name they choose, never sent anywhere except the hint generator. This also covers NASB, CSB, NKJV, NRSV, AMP, MSG without any licensing surface.

### 1.2 Recommended translation menu (v1)

| Menu label | Source | Path | Key | Cost/limits | Attribution shown |
|---|---|---|---|---|---|
| ESV (default) | api.esv.org | proxy `api/bible?src=esv` | yes (server env) | 5,000/day, 60/min, ≤500 verses stored | "ESV" tag + Crossway notice |
| NLT | api.nlt.to | proxy `api/bible?src=nlt` (HTML→verses) | yes | unknown — confirm on signup | Tyndale credit line |
| KJV | bible-api.com | direct (fallback proxy) | no | fair use | "Public domain" |
| WEB | bible-api.com | direct | no | fair use | "Public domain" |
| BSB | bible-api.com (or helloao) | direct | no | fair use | "Public domain (CC0)" |
| ASV | bible-api.com | direct | no | fair use | "Public domain" |
| Paste my own (NIV, NASB, CSB, NKJV…) | user | n/a | no | n/a | user-entered translation name |

v1.1 candidates: API.Bible Starter (up to 3 licensed Bibles such as NASB/CSB/NKJV, if activatable; requires FUMS + api.bible link), YLT/DARBY/BBE/OEB from bible-api.com (cheap to add; low demand).

### 1.3 Proxy design (`api/bible.ts`)
- `GET /api/bible?src=esv&ref=Psalm%2023:1-3` → `{ translationId, reference, verses: [{book, chapter, verse, text}], copyright }`. Same normalized shape for every source; the client never sees source-specific JSON/HTML.
- Server-side: per-IP token bucket (e.g. 30/min) so a leaked URL cannot burn the ESV daily quota; `Origin` allowlist; 10 s upstream timeout; strip headings/footnotes/verse numbers; `Cache-Control: public, max-age=86400` (Vercel edge cache) keyed by `src+ref` — this keeps us far under 5,000 ESV calls/day even if the app is re-installed.
- Public-domain sources are fetched directly from the browser first, with the proxy as a CORS fallback.

---

## 2. Speech recognition in PWAs

### 2.1 Findings
- **Safari on iOS (browser tab):** `webkitSpeechRecognition` has existed since Safari 14.5 / iOS 14.5 ([Addpipe 2026 article](https://blog.addpipe.com/apple-speechanalyzer-api/)). It is prefixed; Safari sends audio to Apple's recognizer (same backend as `SFSpeechRecognizer`; whether a given language runs on-device is not controllable from the web).
- **Safari on iOS, installed Home Screen web app (standalone):** `SpeechRecognition` is **not available** — WebKit bug 225298 "SpeechRecognition API is not available in SafariViewController and web apps added to Home Screen", filed 2021, with developers still asking for a fix through 2023 and no resolution in the thread ([bugs.webkit.org/225298](https://bugs.webkit.org/show_bug.cgi?id=225298)); a March 2024 Apple forum thread reports the same (works in Safari, dies after Add to Home Screen; zero replies) ([thread 748048](https://developer.apple.com/forums/thread/748048)); a 2026 compatibility table still carries the same note ([w3cub speech-recognition table](https://docs.w3cub.com/browser_support_tables/speech-recognition)). I found no iOS 17/18/26 release note claiming a fix. The object may exist (feature detection passes) but `start()` never yields results.
- **Safari iOS known bugs even in-browser:** duplicated interim/final transcripts and `isFinal` never flipping ([Apple forum 694847](https://developer.apple.com/forums/thread/694847), [775699](https://developer.apple.com/forums/thread/775699)); text before a 1.5–2 s pause dropped on iOS 18 ([731761](https://developer.apple.com/forums/thread/731761)); `continuous=true` unreliable. Community workarounds: push-to-talk, `continuous=false`, read only `isFinal` results, call `stop()` as soon as a result arrives, warm up the mic ([lilting.ch tips](https://lilting.ch/en/articles/ios-webspeech-api-tips), [webreflection](https://webreflection.medium.com/taming-the-web-speech-api-ef64f5a245e1)).
- **Chrome on iOS:** no Web Speech at all (WKWebView) ([Chromium issue 40836681](https://issues.chromium.org/issues/40836681)).
- **Chrome on Android:** works (prefixed `webkitSpeechRecognition`), including in installed PWAs; recognition is server-side (Google) and needs network. On-device recognition (`processLocally`, static `SpeechRecognition.available()`/`install()`) shipped for desktop Chrome 135 (Windows/Mac/Linux, ChromeOS later) per the Jan-2025 Intent to Ship ([blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM/m/TQpe9shjCgAJ), [MDN `available()`](https://developer.mozilla.org/docs/Web/API/SpeechRecognition/available_static)); **Android support for on-device mode is not confirmed** — treat Android as server-based.
- **Does on-device vs server matter for us?** Only for privacy/offline. For scoring a memorized verse, accuracy is what matters; both backends are fine for clear English. Offline practice uses typing/first-letter modes; speech mode requires network either way.

### 2.2 Verdict
Do **not** build the speech feature on the Web Speech API as the primary path. Use a capability ladder:

1. `useSpeechBackend()` picks, per session:
   - `webspeech` if `('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)` **and not** (iOS && `navigator.standalone === true`) **and** `navigator.onLine`. On iOS Safari-in-browser also force `continuous=false`, `interimResults=false`, push-to-talk, and a 12 s hard stop.
   - otherwise `recorder` (below).
   - otherwise (no mic permission / no MediaRecorder) hide speech mode and offer "Say it aloud, then self-grade" (honor mode: show the verse after a timer; user taps Got it / Missed some).
2. **Recorder fallback (primary on iOS standalone):** `getUserMedia({audio:true})` from a tap → `MediaRecorder` with `MediaRecorder.isTypeSupported('audio/mp4')` (Safari records AAC in MP4; Chrome gives `audio/webm;codecs=opus`) — supported since Safari 14.5 ([WebKit blog: MediaRecorder API](https://webkit.org/blog/11353/mediarecorder-api/)). Cap at 60 s / ~1 MB, POST the blob to `api/transcribe`, which forwards to the STT vendor and returns `{ text, words?: [{word,start,end}] }`.
3. STT vendor via proxy (prices as indexed on 2026-11-02; vendor pricing pages themselves were blocked, so re-check):
   - **Groq** `whisper-large-v3-turbo` **$0.04 per hour of audio** (= $0.0007/min), `distil-whisper-large-v3-en` $0.02/hr, `whisper-large-v3` $0.111/hr; a free tier exists ([groq.com/pricing](https://groq.com/pricing) as indexed; [third-party summary](https://www.morphllm.com/groq-pricing)). Whisper accepts m4a/mp4/webm. **Recommended primary.**
   - **OpenAI** `gpt-4o-mini-transcribe` ≈ $0.003/min, `gpt-4o-transcribe` ≈ $0.006/min; 25 MB limit; formats mp3, mp4, mpeg, mpga, m4a, wav, webm ([OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)). Note: the newer guide marks `gpt-4o-mini-transcribe` as deprecated with shutdown **2027-02-26** and points to `gpt-transcribe` (price ≈ $0.0045/min per a third-party tracker — **UNVERIFIED**). Good fallback.
   - Deepgram/AssemblyAI are in the same $0.0025–$0.01/min band; no advantage for 15-second clips.
   - A 20-second attempt on Groq turbo costs ≈ $0.0002; 100 attempts/day ≈ $0.02/day.
   - **Do not** pass the target verse as the STT `prompt`/bias text — it would make the recognizer "hear" the correct words and inflate scores. A neutral prompt like "Bible verse read aloud in English." is fine.
4. Scoring for both backends is identical (§6); the UI shows the transcript with word-level diff so the user can dispute ASR errors ("Mark as correct" → stored as `overrideCorrect` on the attempt).

---

## 3. PWA install on iOS

Sources: [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html), [vite-pwa minimal requirements](https://raw.githubusercontent.com/vite-pwa/docs/main/guide/pwa-minimal-requirements.md), [WebKit: full third-party cookie blocking and more (7-day cap)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) as summarized by [mjtsai](https://mjtsai.com/blog/2020/03/26/safari-13-1-third-party-cookie-blocking-and-7-day-script-writeable-storage/) and [WebKit bug 232302](https://bugs.webkit.org/show_bug.cgi?id=232302), [Apple forum 710157](https://developer.apple.com/forums/thread/710157).

- **Manifest** (via `VitePWA({ manifest })`): `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `theme_color` (must equal `<meta name="theme-color">`), `background_color`, `icons`: `pwa-192x192.png`, `pwa-512x512.png` with `purpose: "any"` and a separate `pwa-512x512-maskable.png` with `purpose: "maskable"` (separate entries preferred over `"any maskable"`). `scope` is derived from Vite `base`. Serve `manifest.webmanifest` as `application/manifest+json` over HTTPS (Vercel does).
- **iOS head tags** (iOS reads these, not the manifest, for several things): `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` (PNG, no transparency), `<meta name="apple-mobile-web-app-capable" content="yes">` (plus the standard `mobile-web-app-capable`), `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, `<meta name="apple-mobile-web-app-title" content="Verses">`, optional `apple-touch-startup-image`. Use `@vite-pwa/assets-generator` to emit all icons from one SVG.
- **Install flow:** iOS has no `beforeinstallprompt`. Show an in-app "Install" sheet when `isIOS && !navigator.standalone`: "Tap Share → Add to Home Screen". Detect standalone with `window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches`.
- **Storage eviction rule:** Safari deletes *all script-writable storage* (IndexedDB, localStorage, Cache API, service-worker registrations) for an origin after **7 days of Safari use without user interaction with the site**. Home Screen web apps keep their own usage counter and the web app's main domain is exempt from ITP, so an installed app that is opened occasionally is safe; a *browser-tab* user who doesn't visit for a week of Safari use loses everything. `navigator.storage.persist()` is reported (community, not Apple) to protect data but must be requested on every launch and its effect is undocumented on iOS.
- **Mitigations (all cheap, do all):**
  1. Push install hard on first run and again after the 3rd verse.
  2. Call `navigator.storage.persist()` on every launch; surface `persisted()` in Settings ("Storage: protected / not protected").
  3. Auto-backup: after every N changes write a JSON snapshot to the Cache API too (different store, same eviction — marginal) **and** nag for a manual export: "Last backup 9 days ago — Export now" (uses Web Share / download to Files app).
  4. Export/import JSON is a first-class Settings feature (M4), including the Claude-generated chunks so re-import costs nothing.
  5. Keep the data small: verse texts + attempts for a personal app are < 1 MB; no quota prompts.
  6. Later (v1.2): optional free sync target (e.g. paste a share link, or iCloud Drive via Files export) — out of scope for v1.

---

## 4. Verse reference parsing

- **Library:** `bible-passage-reference-parser` 4.0.0 (openbibleinfo; MIT; TypeScript; ESM) ([GitHub](https://github.com/openbibleinfo/Bible-Passage-Reference-Parser)). English-only build is ~125 KB min / 30 KB gz. It handles "Jn 3.16", "John 3:16-18", "Ps 23:1-3, 6", "1 Cor 13", "Philemon 6", abbreviations, ranges across chapters, and **validates chapter/verse existence** (`passage_existence_strategy`, default full `bcv` validation) against a chosen `versification_system` (`default` = ESV-style; also `kjv`, `nlt`, `csb`, `nrsv`, …). Output is OSIS: `bcv.parse("Psalm 23:1-3").osis()` → `"Ps.23.1-Ps.23.3"`; `parsed_entities()` exposes per-segment `start/end {b,c,v}` and validity messages.
  ```ts
  import { bcv_parser } from "bible-passage-reference-parser/esm/bcv_parser.js";
  import * as en from "bible-passage-reference-parser/esm/lang/en.js";
  const bcv = new bcv_parser(en);
  bcv.set_options({ osis_compaction_strategy: "bcv", consecutive_combination_strategy: "separate" });
  ```
- **Canonical data we ship (`src/data/books.json`)**: 66 books × { `osis` ("Ps"), `usfm` ("PSA"), `number` (19), `name`, `aliases`, `chapters: number[]` (verse count per chapter, Protestant/ESV versification) }. Derive it once at build time from the parser's own `en.js` book data plus a verse-count table (KJV/ESV counts; differences such as 3 John 14–15 or Rev 12:18 are handled by trusting whatever verses the API returns). Used for: offline validation, "next verse" suggestions, mapping OSIS → source ids (bible-api.com wants "Psalm 23:1-3", ESV wants free text, getBible/bolls want book numbers, HelloAO wants USFM codes), and quiz distractors (random references).
- Parsing flow: user types → parser → `ReferenceSelection[]` (book, chapter, startVerse, endVerse) → human-readable canonical string ("Psalm 23:1–3") → fetch. Reject >30 verses per Verse card (memorization unit; longer passages become multiple cards via "Split by verse/paragraph").

---

## 5. Hint system ("thought chunks")

### 5.1 Data structure (generated once per Verse at add time, stored with it)
```ts
interface ThoughtChunks {
  schemaVersion: 1;
  model: string;               // e.g. "claude-sonnet-5-5"
  generatedAt: string;         // ISO
  words: string[];             // canonical tokenization of the verse text (what everything indexes into)
  phrases: Phrase[];           // contiguous, in order, cover all words exactly once
  summary: string;             // one sentence, whole verse, no quoted text
  keywords: string[];          // 3–6 anchor words that appear in the verse, in order
}
interface Phrase {
  start: number;               // inclusive word index into `words`
  end: number;                 // exclusive
  gist: string;                // ≤ 12 words; paraphrase of the thought, must NOT quote ≥3 consecutive verse words
  image?: string;              // optional concrete mental image / mnemonic, ≤ 10 words
  firstLetters: string;        // derived client-side: "T L i m s" (first letter of each word, keeps capitalization)
  firstWord: string;           // derived client-side
}
```
The client tokenizes the verse (split on whitespace, keep punctuation attached) and sends the numbered word list; the model returns only `phrases[{start,end,gist,image}]`, `summary`, `keywords`. The client validates: phrases sorted, contiguous, `start_0 = 0`, `end_last = words.length`, 2–8 words per phrase typical (allow 1–14), gist does not contain any 3-gram of the phrase's words (case/punct-insensitive). If validation fails twice, fall back to a deterministic chunker (split on `,;:.` and conjunctions, max 7 words) with gist = "" (hint ladder then skips level 1).

### 5.2 Hint ladder (per phrase, during any practice mode)
| Level | Shown | Score penalty |
|---|---|---|
| 1 | Gist of the next phrase ("the shepherd meets every need") + optional image | −5 % of that phrase's words |
| 2 | First letters of each word in the phrase ("I s n w") | −25 % |
| 3 | First word of the phrase revealed in place | −50 % |
| 4 | Whole phrase revealed (greyed, must still be typed/spoken) | phrase counts as missed |

Hints are per phrase and cumulative; the practice session records `hintsUsed: {phraseIndex, maxLevel}[]`. "Hint" button always starts at level 1 for the *current* phrase (the first phrase containing an unmatched word).

### 5.3 Claude call (server, `api/chunks.ts`)
- Model: `claude-sonnet-5-5` (quality of segmentation matters; Haiku 5.5 is an env-var switch). Adaptive thinking is the default on these models (no `thinking` param needed); set `output_config.effort: "low"` — the task is small. Use **structured outputs** `output_config.format` with the JSON schema below (no `tool_choice` forcing — rejected on Sonnet 5.5). Include `betas: ["server-side-fallback-2026-07-01"], fallbacks: "default"` so a safety-classifier refusal is retried server-side, and still handle `stop_reason === "refusal"` by using the deterministic chunker. `max_tokens: 2048`. Put the system prompt first and stable (prompt cache); `max_retries` default.
- Cost per verse (pricing page, 2026-11-02: Sonnet 5.5 $2 in / $10 out per MTok; Haiku 5.5 $0.10 / $0.50 up to 100K-token prompts — [platform.claude.com pricing](https://platform.claude.com/docs/en/about-claude/pricing)): ≈ 700 input tokens (system + schema + numbered words) and ≈ 350 output tokens for a 2–3-verse passage → **≈ $0.005 per verse card on Sonnet 5.5, ≈ $0.0003 on Haiku 5.5**. Adding 200 verses costs about $1. Cache the result by `hash(translationId + text)` in IndexedDB and in the export, so re-import never re-calls.
- Abuse guard: same per-IP bucket + origin allowlist as `api/bible`; max 2,000 characters of verse text per call.

**System prompt (draft):**
```
You segment a short Bible passage into "thought chunks" to help a person memorize it.

You receive the passage as a numbered list of words (0-based). Return JSON only, matching the schema.

Rules:
- Split the passage into phrases: each phrase is a contiguous range of word indices [start, end) and the phrases must cover every word exactly once, in order. A phrase is one thought a person could hold in mind: usually 3–8 words, split at natural clause and breath boundaries (commas, conjunctions, "and", "but", "for", relative clauses). Never split inside a proper name or a number.
- For each phrase write "gist": a plain-language paraphrase of what the phrase means or does in the sentence, at most 12 words, written so it reminds the reader of the idea WITHOUT giving away the wording. Do not reuse three or more consecutive words from the phrase. Prefer function words like "who/what/why": e.g. for "The LORD is my shepherd;" write "who God is to me: a shepherd".
- Optionally add "image": a concrete, memorable mental picture or mnemonic for the phrase, at most 10 words. Omit it if nothing natural comes to mind.
- "summary": one sentence (max 25 words) stating what the whole passage says, without quoting it.
- "keywords": 3 to 6 words that appear verbatim in the passage, in passage order, that anchor its structure.
- Keep the passage's translation and theology neutral: describe, do not interpret beyond the text.
```
**User message:** `Reference: Psalm 23:1-2 (ESV)\nWords:\n0 The\n1 LORD\n2 is\n3 my\n4 shepherd;\n5 I\n...`

**JSON schema (`output_config.format`, type `json_schema`):**
```json
{
  "type": "object", "additionalProperties": false,
  "required": ["phrases", "summary", "keywords"],
  "properties": {
    "phrases": { "type": "array", "minItems": 1, "maxItems": 40,
      "items": { "type": "object", "additionalProperties": false,
        "required": ["start", "end", "gist"],
        "properties": {
          "start": { "type": "integer", "minimum": 0 },
          "end":   { "type": "integer", "minimum": 1 },
          "gist":  { "type": "string", "maxLength": 90 },
          "image": { "type": "string", "maxLength": 80 } } } },
    "summary":  { "type": "string", "maxLength": 200 },
    "keywords": { "type": "array", "minItems": 3, "maxItems": 6, "items": { "type": "string" } }
  }
}
```

---

## 6. Scoring for typing and speech

- **Algorithm:** word-level LCS/Myers diff via `diff` 9.x `diffArrays(expectedWords, actualWords, { comparator })` (same engine as `diffWords`, but on our own normalized tokens). Output runs of `added` (insertions), `removed` (missing/substituted) and equal. Derive WER-style counts: `missed = removed`, `extra = added`, `substitutions = min(adjacent removed, added)`. O(ND) on ≤ 300 tokens is instant on a phone. (`diff-match-patch`/`fast-diff` are character-based; not needed.)
- **Normalization (both sides, before diffing):** NFKD + strip combining marks; lowercase; `’`→`'`; remove all punctuation except intra-word apostrophes/hyphens (`Lord's`, `well-being`); collapse whitespace; `LORD`/`Lord`/`lord` equal; numerals: spell out digits ≤ 100 both ways via a small table (`"3"`↔`"three"`, `"3rd"`↔`"third"`); expand contractions both sides (`don't`→`do not`, `I'll`→`I will`); British/American spelling table (`saviour/savior`, `honour/honor`); small-word equivalence for archaic forms is **off** (if the user chose KJV, they memorize "thee").
- **Speech-only leniency (applied to the transcript side):** drop fillers (`um`, `uh`, `like` when isolated); homophone/ASR table (`o/oh`, `their/there/they're`, `to/too/two`, `thy/thigh`, `sheol/shale`, `hallowed/hollowed`, `ye/yee/yea`, `lord/laud`); fuzzy word match when Damerau-Levenshtein distance ≤ 1 for words ≥ 5 letters or ≤ 2 for ≥ 9 letters (`comparator` option); proper-noun table from `books.json` + a names list for common mis-hearings. Typing uses exact match after normalization (typos are what we are testing).
- **Scores:** `accuracy = (expectedWords − missed − substitutions) / expectedWords`; `hintPenalty` from §5.2; `score = max(0, accuracy − hintPenalty)` in 0–1; also store `durationMs`, `wpm` (typing), `backend` (`typed|firstLetter|webspeech|recorder|honor`).
- **Default thresholds (pedagogy lane may retune; these are the implementation constants in `scoring.ts`):** pass: typed ≥ 0.95 with 0 missed phrases, spoken ≥ 0.90; FSRS grade mapping: `Again < 0.70`, `Hard 0.70–0.89`, `Good 0.90–0.97`, `Easy ≥ 0.98 and no hints`; **Mastered** = 3 consecutive passing attempts on different days with no hint level > 1, *and* FSRS stability ≥ 21 days; "Mastered" is a derived badge, never a stored terminal state (a failed review returns it to "Reviewing").

---

## 7. Spaced repetition

- **Recommendation: FSRS via `ts-fsrs` 6.0.0** over SM-2. Reasons that are implementation-side: a maintained TypeScript library (MIT, browser-safe, FSRS-7 default with FSRS-3…7 selectable), immutable `review()` that returns both the new card and a `revlog` row (perfect for IndexedDB + export), configurable `desiredRetention`, `learningSteps`, `maximumInterval`, `enableFuzz`, and the ability to re-optimize weights later from exported revlogs. SM-2 would be ~40 lines, but its fixed intervals ignore the per-verse difficulty that FSRS tracks, and we would reimplement scheduling edge cases FSRS already handles ([README](https://github.com/open-spaced-repetition/ts-fsrs)).
- Usage: `const scheduler = await DefaultScheduler({ desiredRetention: 0.9, learningSteps: ['10m','1d'], relearningSteps: ['10m'], maximumInterval: 365, enableFuzz: true })`; `scheduler.newCard({ now })`; `scheduler.preview({ card, now })` to show the four next-due options; `scheduler.review({ card, grade, now })` → `{ card, revlog }`. Persist the **entire returned `card` object opaquely** (FSRS-7 adds `stabilityFast` beside `stability`/`difficulty`; don't hand-pick fields) plus every `revlog`. Store `fsrsModelVersion` and `desiredRetention` in Settings so a future re-optimization can replay logs.
- Daily queue ("Today" tab): cards with `card.due <= now`, ordered by overdue-ness, capped at a setting (default 10 reviews + 2 new). New verses start in Learning and are drilled with the ladder (read → first-letter → full type/speak) before their first FSRS review.
- Grade comes from the attempt score (§6) automatically, with a "Rate it yourself" override row (Again/Hard/Good/Easy) shown after each attempt.

---

## 8. Pop-quiz game modes

All modes pull only from the logbook (verses the user has added), run 60–120 s rounds, and record a `QuizResult`. Distractors come from other logbook verses or from `books.json`.

1. **Reference → first words.** Show "Psalm 23:1"; pick the correct opening 4 words from 4 options (3 distractors = other verses' openings). 10 pts per correct, streak ×1.5, −0 for wrong.
2. **First words → reference.** Reverse of #1: show the opening phrase, choose book/chapter/verse from 4 references (distractors are same-book neighbors). 10 pts; combo bonus for 5 in a row.
3. **Phrase scramble.** The verse's thought chunks are shuffled as draggable tiles; order them. 20 pts for correct on first try, −5 per wrong placement, timer bonus (remaining seconds / 2).
4. **Which word is wrong?** Verse shown with one word replaced by a plausible same-POS swap (from a swap table: shepherd→servant, want→need, fear→hear); tap the wrong word. 10 pts, −5 for wrong tap, 3 strikes per round.
5. **Finish the verse.** Verse displayed with the last phrase blank; type or speak it (uses §6 scoring on just that phrase). 15 pts × accuracy; speech gives a 1.2× multiplier.
6. **Lightning round.** 60 s: rapid first-letter prompts ("T L i m s") → type the full phrase; auto-advance. 5 pts per phrase; personal best tracked per day.
7. **Fill-the-blank (cloze).** 2–3 keywords (from `ThoughtChunks.keywords`) blanked; tap from a 6-word bank. 5 pts per blank, 10 bonus for a clean verse.
8. **Reference ladder.** Given a reference, say what comes *next* (the following verse in the same logbook passage) — only for multi-verse cards. 15 pts × accuracy.

Rounds mix modes weighted toward the user's weakest verses (lowest FSRS stability) and weakest modes; every quiz answer also writes a lightweight `Attempt` (mode `quiz`) so the logbook shows it, but quiz results do **not** change FSRS state (it would skew scheduling); instead a quiz miss adds the verse to a "Shaky" list surfaced on Today.

---

## 9. Data model (TypeScript)

```ts
export type TranslationId = 'esv' | 'nlt' | 'kjv' | 'web' | 'bsb' | 'asv' | `custom:${string}`;

export interface Translation {
  id: TranslationId;
  name: string;                         // "English Standard Version"
  abbrev: string;                       // "ESV"
  source: 'esv-api' | 'nlt-api' | 'bible-api' | 'helloao' | 'user';
  viaProxy: boolean;
  copyright: string;                    // notice to show in About and on cards
  versification: 'default' | 'kjv' | 'nlt';   // for the reference parser
}

export interface VerseRef {              // one contiguous range
  bookOsis: string;                      // "Ps"
  bookNumber: number;                    // 19
  chapter: number;
  startVerse: number;
  endVerse: number;                      // inclusive
}

export interface VerseLine { verse: number; text: string }

export interface Verse {                 // a memorization card
  id: string;                            // uuid
  refs: VerseRef[];                      // usually 1; "Ps 23:1-3, 6" = 2
  displayRef: string;                    // "Psalm 23:1–3"
  translationId: TranslationId;
  lines: VerseLine[];                    // fetched text, per verse number
  text: string;                          // lines joined with " "
  words: string[];                       // canonical tokenization used by chunks/scoring
  chunks?: ThoughtChunks;                // §5.1; undefined until generated / if offline
  chunksStatus: 'pending' | 'ready' | 'fallback' | 'failed';
  tags: string[];
  note?: string;
  addedAt: string; archivedAt?: string;
  textHash: string;                      // sha-256(translationId + text) for chunk cache + dedupe
}

export interface Attempt {
  id: string; verseId: string;
  at: string; durationMs: number;
  mode: 'read' | 'firstLetter' | 'typed' | 'cloze' | 'spoken' | 'honor' | 'quiz';
  backend?: 'webspeech' | 'recorder' | null;
  input: string;                         // what the user typed / transcript
  diff: Array<{ op: 'eq' | 'miss' | 'extra' | 'sub'; expected?: string; actual?: string; wordIndex?: number }>;
  accuracy: number; hintPenalty: number; score: number;
  hintsUsed: Array<{ phraseIndex: number; maxLevel: 1 | 2 | 3 | 4 }>;
  passed: boolean; overrideCorrect?: boolean;
  grade?: 1 | 2 | 3 | 4;                 // FSRS Rating actually applied (if this attempt was a review)
  quizMode?: string;
}

export interface ReviewState {           // one per Verse
  verseId: string;
  card: unknown;                         // ts-fsrs Card object, stored opaquely (fields differ per FSRS model version)
  due: string;                           // denormalized card.due for indexing
  stage: 'new' | 'learning' | 'reviewing' | 'relearning';
  mastered: boolean;                     // derived badge (§6), recomputed on write
  consecutivePasses: number;
  lastReviewedAt?: string;
}

export interface RevLog {                // ts-fsrs revlog rows, append-only
  id: string; verseId: string; at: string; grade: number; log: unknown;
}

export interface LogbookEntry {          // view model, not a table: Verse + ReviewState + stats
  verse: Verse; review: ReviewState;
  attempts: number; bestScore: number; lastScore?: number; lastAttemptAt?: string;
  history: Array<{ day: string; bestScore: number }>;   // for sparkline
}

export interface QuizResult { id: string; at: string; mode: string; score: number; items: number; correct: number; verseIds: string[] }

export interface Settings {
  schemaVersion: number;
  defaultTranslationId: TranslationId;
  speech: { enabled: boolean; preferredBackend: 'auto' | 'webspeech' | 'recorder'; pushToTalk: boolean };
  typing: { showPunctuation: boolean; caseSensitive: false };
  srs: { desiredRetention: number; newPerDay: number; reviewsPerDay: number; fsrsModelVersion: string };
  hints: { enabled: boolean; startLevel: 1 };
  thresholds: { typedPass: number; spokenPass: number; easyMin: number };
  backup: { lastExportAt?: string; remindAfterDays: number; persisted?: boolean };
  install: { dismissedAt?: string };
  theme: 'system' | 'light' | 'dark';
}

// Dexie: db.version(1).stores({
//   verses: 'id, translationId, textHash, addedAt, archivedAt, *tags',
//   attempts: 'id, verseId, at, mode',
//   reviews: 'verseId, due, stage, mastered',
//   revlogs: 'id, verseId, at',
//   quizResults: 'id, at, mode',
//   settings: 'id'  // single row id='app'
// })
// Export file: { schemaVersion, exportedAt, settings, verses, reviews, revlogs, attempts, quizResults }
```

---

## 10. Screens and navigation

Bottom tabs: **Today · Verses · Quiz · Logbook**, plus modal flows **Add Verse** and **Practice**. Settings lives behind a gear icon on Today.

| Screen | Contents / actions |
|---|---|
| **Today** | Due reviews count + "Start reviews"; new verses in learning; streak + minutes; "Shaky from quiz" list; install banner (iOS, not standalone); backup nag; gear → Settings |
| **Verses** | List of active cards (ref, translation chip, stage/mastered badge, due-in). Search/filter by tag, translation, stage. Swipe: archive. FAB → Add Verse. Tap → Verse detail |
| Verse detail | Full text, chunk view (phrases with gists toggle), copyright line, stats, buttons: Practice (mode picker), Regenerate hints, Edit tags/note, Archive |
| **Add Verse** (flow) | 1 Reference input with live parse ("Psalm 23:1–3 ✓", invalid → inline error) + recent/next-verse suggestions → 2 Translation picker (default from Settings; "Paste my own" option) → 3 Preview fetched text (per-verse lines; split-into-cards toggle for >1 verse) → 4 Save (chunks generated in background; card usable immediately) |
| **Practice** (flow) | Mode picker: Read & repeat (ladder: full → first letters → blank) · Type it · First letters · Cloze · Say it (speech) · Honor mode. Session screen: progress dots, current phrase highlight, Hint button (level pill), submit; Result screen: diff view (green/red words), score, hint penalty, FSRS self-rate row (preview of next due per grade), Next |
| **Quiz** | Mode tiles (8 modes) + "Mixed 2-minute round"; round screen with timer/score/streak; results with per-verse misses → "Practice these" |
| **Logbook** | Chronological list of every verse ever added (incl. archived) with added date, attempts, best/last score, sparkline; filters; tap → Verse detail with attempt history (each attempt expandable to its diff). Header: totals (verses, mastered, attempts, days active). |
| Settings | Default translation; speech backend + mic test; SRS limits/retention; thresholds; hints on/off; theme; Storage (persisted?), **Export JSON / Import JSON**, Clear data; About & copyright notices (ESV/NLT/api sources) |

Navigation: React Router with tab routes `/today`, `/verses`, `/quiz`, `/logbook`; flows as nested routes `/add`, `/practice/:verseId/:mode`, `/verses/:id`. Deep links work in standalone mode because `start_url` is `/` and the SW serves the app shell offline.

---

## 11. Cuts and risks

**MVP (M0–M2 + minimal M4):** scaffold/deploy/PWA shell; Add Verse with ESV/NLT (proxy) + KJV/WEB/BSB/ASV (direct) + paste-own; Verse list/detail; typing practice (full + first-letter) with the hint ladder from Claude chunks (fallback chunker when offline); FSRS scheduling + Today queue; export/import JSON; logbook list (basic).
**v1.1:** speech mode (recorder fallback via Groq + Web Speech opportunistic), cloze mode, quiz (modes 1–4 first), logbook sparklines, API.Bible licensed extras (if FUMS acceptable), install/backup nags polish, Web Push reminders (iOS 16.4+ home-screen apps).
**Later:** quiz modes 5–8, FSRS weight optimization from revlogs, audio playback (TTS of the verse) for listen-and-repeat, multi-device sync, bundling an offline public-domain translation, chapter-level passages, Android TWA.

**Risks**
| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| iOS standalone PWA cannot use Web Speech API (WebKit 225298, open since 2021) | Certain / high for "speech" feature | Recorder → STT proxy is the primary iOS path; Web Speech only opportunistic; honor mode as last resort |
| iOS 7-day storage purge (browser-tab users) | Medium / high (data loss) | Push install; `persist()` each launch; export nags; auto-snapshot; small data |
| ESV/NLT licence terms (non-commercial, 500-verse cap, attribution, cache clearing) | Low if followed / high if breached | Proxy enforces per-verse fetch only; attribution in About and on cards; chunk cache keyed by text, verse text itself re-fetchable; no bulk download |
| NIV/NASB etc. unavailable via any sanctioned API | Certain / medium (user expectation) | "Paste my own" path; menu copy explains why |
| API.Bible FUMS script + mandatory link | Medium (UX/privacy) | Defer to v1.1; decide after reading the FUMS doc |
| NLT API returns HTML; parsing may break on markup changes | Medium / low | Parser with fixture tests; fall back to "paste" with a warning |
| Claude call fails/offline at add time | Medium / low | Card usable immediately; chunks generated lazily with retry; deterministic fallback chunker |
| Claude refusal/safety classifier on scripture text | Low / low | `fallbacks: "default"`, then fallback chunker |
| ASR mis-hearing archaic words (KJV) | High / medium (frustration) | Homophone table + fuzzy match + "mark as correct" override; speech pass threshold 0.90 |
| Key leakage / proxy abuse burning ESV quota | Low / medium | Origin allowlist, per-IP bucket, edge caching, monthly usage alarm in Vercel |
| `ts-fsrs` 6.0 is new; API may shift | Low / low | Wrap it in `srs.ts`; store cards opaquely; pin the version |
| bible-api.com CORS/limits unverified | Medium / low | M1 test; proxy fallback already exists |

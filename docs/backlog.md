# Backlog — build order

Each box is one commit-sized task. Milestones map to `features-plan.md` (§ references). Check items off as they land.

## M0 — Scaffold & deploy
- [ ] `npm create vite@latest` (React + TS), pin `"engines": {"node": "24.x"}`, add `.nvmrc` = 24
- [ ] Add ESLint + Prettier + `tsc --noEmit` script; CI-free for now (Vercel builds)
- [ ] Install `vite-plugin-pwa@2` + `workbox-*@7.4`; configure `VitePWA({ registerType: 'autoUpdate', manifest })` with name/short_name/theme_color/background_color/display standalone (§3)
- [ ] Generate icons with `@vite-pwa/assets-generator` from `public/logo.svg` (192, 512, 512-maskable, apple-touch-icon 180)
- [ ] Add iOS head tags in `index.html` (`apple-mobile-web-app-capable`, status-bar-style, app-title, theme-color) and `robots.txt`
- [ ] Install Dexie 4; create `src/db/db.ts` with the v1 stores from §9 and a `settings` singleton with defaults
- [ ] Add React Router with bottom tab shell (`/today`, `/verses`, `/quiz`, `/logbook`) and placeholder screens
- [ ] Mobile layout baseline: safe-area insets, 16px gutters, dark/light via `prefers-color-scheme`
- [ ] Create `api/health.ts` Vercel function returning `{ ok: true, node: process.version }`; add `vercel.json` (functions runtime, headers)
- [ ] Deploy to Vercel (preview + production); verify manifest served as `application/manifest+json`, SW registers, Lighthouse PWA pass
- [ ] Add `src/lib/platform.ts`: `isIOS`, `isStandalone` (`navigator.standalone || display-mode`), `hasWebSpeech`, `hasMediaRecorder`

## M1 — Add verse + fetch text
- [ ] Add `bible-passage-reference-parser@4`; `src/lib/refs.ts` wrapping `bcv_parser` (en) → `VerseRef[]` + `displayRef` with en-dash ranges
- [ ] Build `src/data/books.json` (66 books: osis, usfm, number, name, aliases, verse counts per chapter) via a `scripts/build-books.ts` script; unit-test a few spot values
- [ ] `refs.ts`: reject invalid chapters/verses with friendly messages; cap at 30 verses per card; helper `nextVerse(ref)`
- [ ] Define `Translation` registry `src/data/translations.ts` (esv, nlt, kjv, web, bsb, asv, custom) with source, copyright string, versification (§1.2)
- [ ] `src/lib/sources/bibleApiCom.ts`: fetch `https://bible-api.com/{ref}?translation={id}` → `VerseLine[]`; map OSIS→"Book c:v-v"; test from the deployed origin to confirm CORS (fall back to proxy if blocked)
- [ ] `api/bible.ts` proxy skeleton: `?src=&ref=`, origin allowlist, per-IP token bucket (in-memory per instance + `Cache-Control` 1 day), normalized response shape, 10 s upstream timeout
- [ ] `api/bible.ts` ESV adapter: `/v3/passage/text/` with `Authorization: Token`, headings/footnotes/short-copyright off, verse numbers on → split `[n]` markers into `VerseLine[]`; env `ESV_API_KEY`
- [ ] `api/bible.ts` NLT adapter: `api.nlt.to` passages → HTML parse (`verse_export` bk/ch/vn, strip `span.vn`, footnotes, subheads) with fixture tests; env `NLT_API_KEY`
- [ ] Client `src/lib/sources/index.ts`: `fetchPassage(translationId, refs)` choosing direct vs proxy; retry once; typed errors (network, not-found, quota)
- [ ] Add Verse flow step 1: reference input with live parse feedback + recent references
- [ ] Add Verse flow step 2: translation picker (default from Settings) incl. "Paste my own" textarea + translation-name field
- [ ] Add Verse flow step 3: preview lines, "split into one card per verse" toggle, copyright line
- [ ] Save: tokenize words (`src/lib/tokenize.ts`), compute `textHash` (SubtleCrypto sha-256), dedupe on same hash, write `Verse` + `ReviewState{stage:'new'}`
- [ ] Verses tab: list with ref/translation chip/stage; FAB → Add; swipe to archive; empty state
- [ ] Verse detail screen: text, copyright, tags/note editing, archive/restore
- [ ] About screen with ESV + NLT + public-domain attribution notices and source links

## M2 — Typing practice + hints
- [ ] `src/lib/normalize.ts`: NFKD/diacritics, case, punctuation (keep intra-word `'`/`-`), contractions, numerals ≤100, UK/US spelling table; unit tests
- [ ] `src/lib/score.ts`: `diffArrays` from `diff@9` with comparator → `Attempt.diff[]`, accuracy, missed/extra/sub counts; tests on 10 fixture pairs
- [ ] Hint penalty + pass thresholds constants in `src/lib/scoring-config.ts` (typed 0.95, spoken 0.90, grade mapping) read from Settings overrides
- [ ] Deterministic fallback chunker `src/lib/chunks/fallback.ts` (split on `,;:.` and conjunctions, max 7 words) → `ThoughtChunks` with empty gists
- [ ] `api/chunks.ts`: Anthropic SDK (`@anthropic-ai/sdk`), model from env (`claude-sonnet-5-5` default), system prompt + numbered words, `output_config.format` JSON schema (§5.3), `effort: 'low'`, `fallbacks: 'default'` beta, `max_tokens: 2048`; handle `stop_reason === 'refusal'` → 422
- [ ] `api/chunks.ts` guards: origin allowlist, per-IP bucket, 2,000-char cap, 20 s timeout
- [ ] Client `src/lib/chunks/validate.ts`: contiguity/coverage/no-3-gram-leak validation; derive `firstLetters`/`firstWord`; retry once then fallback chunker; set `chunksStatus`
- [ ] Background chunk generation queue after Save (and "Regenerate hints" button on detail); offline → stays `pending`, retried on `online` event
- [ ] Verse detail: chunk view (phrase cards with gist/image toggle, keywords, summary)
- [ ] Practice session scaffolding: route `/practice/:verseId/:mode`, progress dots, current-phrase tracker, result screen with diff rendering (green/red/strike)
- [ ] Mode "Type it": full textarea with live phrase highlight, submit → score → save `Attempt`
- [ ] Mode "First letters": input accepts only first letters per word, auto-advances, scores by letter match
- [ ] Mode "Read & repeat" ladder: full text → first letters → blank, three passes in one session
- [ ] Hint button + level pill: per-phrase ladder (gist → first letters → first word → reveal), records `hintsUsed`, applies penalty
- [ ] Attempt history on Verse detail (expandable diffs)

## M3 — Speech
- [ ] `src/lib/speech/backend.ts`: capability ladder (§2.2) choosing `webspeech` / `recorder` / `honor`; Settings override
- [ ] `webspeech.ts`: `(window.SpeechRecognition||webkitSpeechRecognition)`, `continuous=false`, `interimResults=false` on iOS, push-to-talk start/stop, 12 s hard stop, collect only `isFinal` results, error mapping (not-allowed, network, no-speech)
- [ ] `recorder.ts`: `getUserMedia` on tap, `MediaRecorder` with `isTypeSupported` probe (`audio/mp4` → `audio/webm;codecs=opus`), 60 s / 1 MB cap, returns Blob + mime
- [ ] `api/transcribe.ts`: multipart in → Groq `whisper-large-v3-turbo` (env `GROQ_API_KEY`), neutral prompt, fallback to OpenAI transcribe (env `OPENAI_API_KEY`) on 5xx; origin allowlist, per-IP bucket, 2 MB cap
- [ ] Speech normalization extras: filler removal, homophone/ASR table (`src/data/homophones.json`), fuzzy comparator (DL ≤1 for ≥5 letters, ≤2 for ≥9), proper-noun list from `books.json`
- [ ] Mode "Say it": mic button (hold or tap-to-toggle per Settings), waveform/level meter, transcript shown, diff result, "Mark as correct" override stored on Attempt
- [ ] Mode "Honor": timer, reveal, self-grade buttons (used when no speech backend)
- [ ] Settings → Speech: backend picker, mic test, explanation copy for iOS standalone limitation
- [ ] Manual device test matrix doc comment: iOS Safari tab, iOS standalone, Android Chrome tab, Android installed

## M4 — SRS + logbook + backup
- [ ] Install `ts-fsrs@6`; `src/lib/srs.ts` wrapper: `getScheduler(settings)`, `newCard`, `preview`, `review` → persist opaque `card` + `RevLog`; pin version
- [ ] Score → grade mapping + self-rate override row on result screen (shows next-due preview per grade via `preview()`)
- [ ] `ReviewState` updates on each graded attempt: due, stage, consecutivePasses, derived `mastered` (§6)
- [ ] Today tab: due queue (limit per Settings), new-in-learning section, "Start reviews" session runner (mode chosen per verse: typed by default, spoken if enabled)
- [ ] Streak + minutes-practiced counters (derived from attempts, computed on load)
- [ ] Logbook tab: all verses incl. archived, added date, attempt count, best/last score, filters, header totals
- [ ] Logbook sparkline (daily best score, last 30 days) per entry — tiny inline SVG
- [ ] Export JSON (`src/lib/backup.ts`): dump all stores + settings; share via Web Share API / download; stamp `backup.lastExportAt`
- [ ] Import JSON: schema version check, merge-by-id with "replace / keep newer" choice, re-attach chunks by `textHash`
- [ ] `navigator.storage.persist()` on launch; show `persisted()` status in Settings → Storage
- [ ] Backup nag on Today when `now - lastExportAt > remindAfterDays` (default 7) or ≥ 5 new verses since last export
- [ ] Settings screen: default translation, SRS limits/retention, thresholds, hints toggle, theme, Clear data (with confirm)

## M5 — Pop quiz
- [ ] `src/quiz/engine.ts`: round runner (timer, score, streak, item generator interface), weighting toward low-stability verses, writes `QuizResult` + lightweight `Attempt{mode:'quiz'}`
- [ ] Distractor helpers: random references from `books.json`, other-verse openings, same-POS word swap table `src/data/swaps.json`
- [ ] Mode 1: Reference → first words (4 options)
- [ ] Mode 2: First words → reference (4 options)
- [ ] Mode 3: Phrase scramble (drag/tap-to-order tiles from chunks)
- [ ] Mode 4: Which word is wrong? (tap the swapped word; 3 strikes)
- [ ] Quiz tab: mode tiles + "Mixed 2-minute round"; results screen with misses → "Practice these"; "Shaky" list surfaced on Today
- [ ] Mode 5: Finish the verse (typed/spoken last phrase, reuses score.ts)
- [ ] Mode 6: Lightning round (first-letter prompts, 60 s, personal best)
- [ ] Mode 7: Fill-the-blank cloze from keywords with word bank
- [ ] Mode 8: Reference ladder (what comes next) for multi-verse cards
- [ ] Sound/haptic feedback (Vibration API where available) + mute setting

## M6 — Polish / PWA install
- [ ] iOS install sheet ("Share → Add to Home Screen") when `isIOS && !isStandalone`, dismissible with 7-day snooze; Android `beforeinstallprompt` button
- [ ] Offline UX: app shell precached; "offline" banner; Add Verse disabled for network sources but "Paste my own" allowed; chunk queue retries on reconnect
- [ ] SW update toast ("New version — reload") via `registerSW` `onNeedRefresh`
- [ ] Runtime caching rule for `bible-api.com` GETs (StaleWhileRevalidate, 30 days) — public-domain only; never cache ESV/NLT proxy responses beyond the per-verse store
- [ ] Web Push (optional, iOS 16.4+ home-screen): daily review reminder — only if a push endpoint is worth adding; otherwise local "Today" badge via `navigator.setAppBadge`
- [ ] Accessibility pass: focus order in practice screens, `aria-live` for results, 44px targets, reduced-motion
- [ ] Performance pass: lazy-load parser (`bible-passage-reference-parser` ~30 KB gz) and quiz routes; bundle size budget check
- [ ] Error reporting: minimal `window.onerror` → console + optional Vercel log endpoint; no PII
- [ ] Copy/UX review of attribution screens vs ESV/NLT/api.bible requirements before public URL is shared
- [ ] Usage alarm: Vercel function logging of upstream calls per day; warn in Settings when ESV usage > 4,000/day
- [ ] README: setup, env vars (`ESV_API_KEY`, `NLT_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`), licensing notes, device test matrix

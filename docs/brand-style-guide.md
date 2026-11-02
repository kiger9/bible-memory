# Kept — Brand & UI Style Guide

A personal Bible verse memorization app. Mobile-first PWA, lives on the home screen, used for a few quiet minutes a day. This guide covers the name and wordmark, type, color, spacing, components, screens, voice, icons, motion, and the rules that keep it from looking like every other generated app.

Companion files:

- `brand-style-guide.html` — visual demonstration of everything below (wordmarks, specimens, swatches, components, six phone mockups; light and dark).
- `tokens.css` — the CSS custom properties the app imports directly.

---

## 1. The idea

**A study, not a dashboard.** The app should feel like a well-kept notebook on a desk under a lamp: paper, ink, one colored ribbon. Scripture is the content; everything else recedes. Typography carries the hierarchy. Boxes and borders are used only where something genuinely needs to be set apart (an input, a sheet that slides up, the one verse you're working on).

Three words to design by: **unhurried, dignified, quiet.**

---

## 2. Name candidates and wordmarks

All three were checked against the App Store and the obvious search results (November 2026). None is a well-known app in this category. "Verso" (several apps), "By Heart" (Memorize By Heart), "Abide" and "Lectio" were considered and dropped because they are taken.

### Candidate 1 — Kept  (recommended)

- **Why:** From Psalm 119 ("I have kept thy word", v. 67; "Thy word have I hid in mine heart", v. 11). One syllable. Past-tense and settled: the verse is already yours. Reads well as a home-screen label under an icon, where long names truncate.
- **Wordmark:** a decorative initial. The K is the Cinzel Decorative capital (Google Fonts, SIL Open Font License), a Renaissance-inscriptional letter with a long swash leg that tucks under the e, set in the accent color. "ept" follows in Newsreader 500, sentence case, letterspacing −0.012em. The K outline is embedded as SVG (`src/components/kGlyph.ts`) so the wordmark, favicon and app icons share one drawing and never depend on a font load. A small **ribbon mark** sits to the left: a bookmark ribbon drawn in CSS (a 10×16 rectangle with a notch cut from the bottom edge). The ribbon says "your place is held."
- **Lockups:** mark + word (header), word alone (splash), mark alone (app icon badge, tab-bar brand).
- **App icon:** vestry-green ground, the decorative K in paper with the ribbon tucked at the top edge. No gradient, no gloss. Shipped as `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` (180) and `favicon.svg` (64, 12px radius).
- **Launch splash:** ribbon, wordmark at 56px, then *I have kept thy word.* with the reference Psalm 119:67 beneath, and the line "A devotional app for personal use." at the foot. Shows for two seconds or until tapped, once per app session; shorter under reduced motion.

### Candidate 2 — Verbatim

- **Why:** "Word for word." Honest about what the app trains. Latin, dignified, slightly scholarly.
- **Wordmark:** Newsreader 400, all caps, letterspacing +0.14em, with a pair of thin vertical rules either side (an open-quote feel). Strong at header size; weaker as a 12px home-screen label (eight letters).
- **Risk:** "Verbatim" is a storage-media brand in another category. Not a conflict for an app store, but the name is not uniquely ours.

### Candidate 3 — Lamp

- **Why:** Psalm 119:105, "Thy word is a lamp unto my feet." Warm, short, suits the lamp-lit dark mode exactly.
- **Wordmark:** Newsreader 500 italic, sentence case. Mark: a small circle with a dot offset above it (a flame), two CSS shapes.
- **Risk:** "Lamp" is a generic word; many unrelated utility apps use it. Discoverability is poor.

**Recommendation: Kept.** Shortest, most specific to scripture memory, best home-screen label, and the ribbon mark gives it a signature that works at 12px and 512px.

### Wordmark sizes (Kept)

| Context | Size | Treatment |
|---|---|---|
| Tab bar / brand badge | 12px ribbon mark only, or 14px word | Mark in accent; word in ink-2 |
| Screen header | 22px word + 10×16 ribbon | Newsreader 500, −0.012em |
| Splash | 48px word, ribbon 20×32 | Newsreader 500, −0.02em |
| App icon (512px) | "K" at ~300px on accent ground | Ribbon at top edge, 56×96 |

Clear space around the wordmark: the height of the ribbon on every side. Never stretch, outline, add a shadow, or set the word in the sans.

---

## 3. Typography

### The pairing

- **Newsreader** (Google Fonts, Production Type). Wordmark, scripture, screen titles, big numbers. An optical-size axis (6–72) means the 19px verse setting gets sturdier serifs and looser spacing than the 48px splash setting, so it reads comfortably on a phone without looking like a display face shrunk down. It has true italics for emphasis and references. It was designed for on-screen long-form reading, which is exactly what a verse is.
- **Instrument Sans** (Google Fonts). Everything else: buttons, inputs, labels, tab bar, logbook rows. A quiet humanist grotesk with slightly narrow proportions (more words per line at 15px), real tabular numerals (streak counts, dates, scores line up), and enough character that it doesn't read as a system default.

Why not Inter/Roboto/system-ui: they are what every generated app uses, and they bring none of the "notebook" feeling. Why not Cormorant: beautiful but too thin at 19px on an OLED phone. Why not Fraunces: too much personality for scripture; it would compete with the text.

### Scale

| Token | Size / line-height | Face | Use |
|---|---|---|---|
| display | 48 / 1.15 | Newsreader 500 | Splash wordmark |
| h1 | 36 / 1.15 | Newsreader 500 | Big numbers (streak, score) |
| h2 | 28 / 1.2 | Newsreader 500 | Screen titles |
| h3 | 22 / 1.25 | Newsreader 500 | Section heads, header wordmark |
| verse | 19 / 1.6 | Newsreader 400, opsz 19 | Scripture body |
| body | 17 / 1.5 | Instrument Sans 400 | App prose |
| ui | 15 / 1.35 | Instrument Sans 500 | Buttons, inputs, rows |
| caption | 13 / 1.35 | Instrument Sans 400 | References, meta |
| micro | 12 / 1.2 | Instrument Sans 500, +0.08em caps | Tab labels, eyebrows |

Rules:
- Verse text: 19px, line-height 1.6, max measure ~65 characters (`max-width: 34em`), never justified, never centered for more than two lines. Paragraph breaks between verses, not blank lines.
- The reference ("Psalm 119:11 · ESV") sits under the verse in Instrument Sans 13px, ink-3, with a middle dot separating reference and translation.
- Uppercase only at 12–13px, always with +0.08em tracking. Never uppercase a verse.
- Numbers that line up (dates, counts, percentages) use `font-variant-numeric: tabular-nums`.

---

## 4. Color

One accent. Warm neutrals. No gradients.

### Light ("paper")

| Token | Hex | Role |
|---|---|---|
| `--paper` | #F5F3EE | Page ground |
| `--surface` | #FBFAF7 | Inputs, cards, sheets |
| `--sunk` | #ECE8DF | Wells, progress tracks |
| `--rule` | #D9D3C7 | Hairlines only |
| `--ink` | #1C1A17 | Verse text, headings |
| `--ink-2` | #5A554D | Body, secondary |
| `--ink-3` | #6B655C | Meta, labels |
| `--accent` | #2E5A45 | Vestry green: actions, progress, the ribbon |
| `--accent-soft` | #DCE7DF | Tinted fill behind accent text |
| `--on-accent` | #F5F3EE | Text on solid accent |
| `--miss` | #8A2E2B | Oxblood: a wrong word, delete |
| `--note` | #8A5A12 | Amber: due today, gentle warning |

### Dark ("lamp-lit study")

Warm near-black, never #000. The green lightens rather than brightens so it stays calm on a dark ground.

| Token | Hex |
|---|---|
| `--paper` | #1F1B16 |
| `--surface` | #2A251F |
| `--sunk` | #171411 |
| `--rule` | #3B342C |
| `--ink` | #ECE5D8 |
| `--ink-2` | #B5AB9B |
| `--ink-3` | #9A9182 |
| `--accent` | #9FC6AB |
| `--accent-soft` | #2C3A31 |
| `--on-accent` | #15241B |
| `--miss` | #E4998F |
| `--note` | #E0B36A |

### Contrast (WCAG 2.1, computed)

All text pairs meet AA (4.5:1 for normal text). Most meet AAA.

| Pair | Light | Dark |
|---|---|---|
| ink on paper | 15.66 | 13.67 |
| ink-2 on paper | 6.67 | 7.55 |
| ink-3 on paper | 5.20 | 5.50 |
| ink on surface | 16.63 | 12.12 |
| ink-2 on surface | 7.08 | 6.70 |
| ink-3 on surface | 5.53 | 4.88 |
| ink on sunk | 14.20 | 14.65 |
| ink-3 on sunk | 4.72 | 5.89 |
| accent on paper | 7.11 | 9.08 |
| accent on surface | 7.55 | 8.06 |
| on-accent on accent | 7.11 | 8.57 |
| accent on accent-soft | 6.21 | 6.34 |
| miss on paper | 7.56 | 7.54 |
| note on paper | 5.33 | 8.83 |
| rule on paper (decorative, not text) | 1.34 | 1.40 |

Rules:
- The accent is for things you can act on and for progress. It is never a background for a whole screen or a large block.
- `--miss` appears only on a wrong word in practice, and on a destructive action. Never for "0 day streak" or empty states.
- `--rule` hairlines are 1px and used sparingly: under a header, between logbook rows. Not around cards.
- No color is used purely decoratively. If you remove it and nothing is lost, remove it.

---

## 5. Spacing, radii, elevation

- Base 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Side gutter: `max(16px, env(safe-area-inset-left))`. Verse screens use 24px for a book-page feel.
- Vertical rhythm: 24px between groups, 12px within a group, 8px between a label and its control.
- Tap targets: 44px minimum, including every tab, every hint-ladder step, every logbook row.
- Radii: 3px (chips, checkboxes), 6px (inputs, buttons), 10px (sheets, the verse card). No pill-shaped buttons; the pill radius is reserved for progress tracks and the translation picker.
- Elevation: two shadows exist. `--shadow-sheet` on the bottom sheet (hint panel, translation picker). `--shadow-float` on nothing yet; reserve it for a future floating control. Cards on the page do not cast shadows.

---

## 6. Layout

- **Content first.** A screen opens with its content, not with a title bar full of controls. The screen title is a Newsreader h2 at the top of the scroll area, not a fixed bar.
- **Bottom tab bar:** four tabs — Today, Verses, Quiz, Logbook. 56px tall plus the bottom safe-area inset. Each tab is a 24px Lucide icon over a 12px label; the active tab is `--ink` with an accent icon, inactive tabs are `--ink-3`. A 1px `--rule` on top. The bar never scrolls away and never hides on scroll.
- **Verse card:** the one place a bordered surface is allowed on the Today screen. 1px `--rule`, 10px radius, `--surface` fill, 24px padding. It holds the verse, the reference, and a single primary action.
- **Hierarchy by type, not by box.** Section heads are Newsreader 22px with 32px above and 12px below. No divider lines between sections; the space is the divider.
- **Lists:** logbook rows are full-bleed with a 1px hairline between rows, 56px minimum height, date in tabular caption on the right.
- **Bottom sheets:** translation picker and hint panel slide up from the bottom, 10px top radius, `--shadow-sheet`, a 4×36 grab handle in `--rule`.

---

## 7. Components

Demonstrated in the HTML. Summary of states:

- **Primary button:** `--accent` fill, `--on-accent` text, 15px Instrument Sans 600, 48px tall, 6px radius. Press: fill darkens 8% (light) or lightens 8% (dark), 120ms. Disabled: `--sunk` fill, `--ink-3` text, no opacity tricks.
- **Secondary button:** transparent, 1px `--rule`, `--ink` text. Same height.
- **Quiet button:** text-only, `--accent`, used inside cards ("Skip for today").
- **Text input / textarea:** `--surface` fill, 1px `--rule`, 6px radius, 48px tall (textarea 120px, Newsreader 19px for verse entry so you see it the way you'll read it). Focus: 2px `--accent` outline, 2px offset. Error: 1px `--miss` border and a 13px message below in `--miss`.
- **Translation picker:** a row of pills in a sheet (ESV, NIV, KJV, NASB, NLT, CSB). Selected: `--accent` fill. Unselected: `--sunk` fill, `--ink-2` text.
- **Progress indicator:** a 4px track in `--sunk` with an `--accent` fill, pill radius. Label to the left ("3 of 7 reviewed"), percentage not shown unless it is the point. Verse mastery uses a row of five 6px dots instead (learning → kept).
- **Hint ladder:** a vertical list of four rungs, each 44px tall, revealing progressively more: *First letters* → *First words of each line* → *Every other word* → *Show the verse*. Rungs you've used this session are `--accent-soft` with a small check; the next rung is outlined; later rungs are `--ink-3`. Using a rung costs nothing visible; the logbook records it quietly.
- **Logbook row:** reference (Instrument Sans 500, ink) · mode icon (keyboard / mic / quiz, 16px, ink-3) · result ("Word-perfect", "2 slips", "Needed hints") · date (tabular caption, right-aligned).
- **Quiz card:** reference shown large in Newsreader 28px; the verse hidden; three options: Type it, Say it, Reveal. A thin 4px timer bar in `--note` runs along the top if the quiz is timed; otherwise none.

---

## 8. Screens (see HTML for drawn mockups)

1. **Today:** greeting line in caption ("Sunday · 2 November"), the day's verse in the verse card, mastery dots, primary action "Practice", then "Also due" list of two or three references, then streak as a small line, not a badge.
2. **Add Verse:** reference field, translation picker pill row, verse textarea in Newsreader, "Save to Verses". A note below: "Paste the text as printed. Punctuation counts."
3. **Practice – Typing:** reference at top, the verse rendered as a flowing line of word slots; typed words fill in ink, the current word has a 2px accent underline, a slip is shown in `--miss` for 200ms then corrected text replaces it. Keyboard-aware: the hint rung button sits above the keyboard.
4. **Practice – Speak, hint open:** mic button (64px, accent ring), transcript appears as you speak in Newsreader; the hint ladder slides up as a sheet with the second rung active.
5. **Logbook:** month heading, rows grouped by day, a small monthly summary line at top ("31 sessions · 12 verses kept").
6. **Pop Quiz:** a single reference on a quiet screen; "Say it" and "Type it" buttons; a "Not now" quiet link. Result screen: "Word-perfect." in Newsreader h2 and one line of what's next.

---

## 9. Voice & tone

Encouraging, unhurried, never cutesy. Second person, present tense, plain words. No exclamation marks except in a quoted verse. No emoji. Scripture is quoted exactly and attributed.

| Moment | Copy |
|---|---|
| Empty Verses | "Nothing here yet. Add a verse you want to keep." |
| Empty Logbook | "Your practice will be recorded here, one session at a time." |
| Empty Today | "Nothing is due today. Add a verse, or review one you already keep." |
| Hint prompt (rung 1) | "Show the first letters." |
| Hint prompt (rung 2) | "Show how each line begins." |
| Hint prompt (rung 3) | "Show every other word." |
| Hint prompt (rung 4) | "Show the whole verse. Then try again." |
| After a slip | "Close. The word is *strength*." |
| Word-perfect | "Word-perfect." / "Kept. It will come round again on Thursday." |
| Needed hints | "You needed two hints. That's how it goes in. Again tomorrow." |
| Quiz result (pass) | "Right. Psalm 46:1 is yours." |
| Quiz result (miss) | "Not yet. Read it once more, then we'll try again later today." |
| Streak, day 1 | "First day." |
| Streak, ongoing | "Seven days in a row." |
| Streak, broken | "A gap. Nothing is lost; the verses are still here." |
| Mic permission | "Kept needs the microphone to hear you recite. Nothing is recorded or sent anywhere." |
| Delete confirm | "Remove Romans 8:28 from your verses? Your logbook keeps its history." |

Avoid: "Awesome!", "You crushed it", "Streak on fire", "Oops", gamified badges, confetti language, and anything that treats scripture as content to be consumed.

---

## 10. Iconography

- **Set:** Lucide (ISC license, consistent 24px grid, available as SVG strings or a web component). Stroke width **1.5px** at 24px; **1.75px** at 16–20px so small icons do not go thin.
- Round line caps and joins (Lucide default). Never fill an icon; never mix with Material or Phosphor.
- Tab bar: `sun` (Today), `book-open` (Verses), `help-circle` (Quiz), `notebook-pen` or `list` (Logbook). Practice: `keyboard`, `mic`, `eye` (reveal), `chevron-left`. Logbook results: `check` (word-perfect), `minus` (slips), `life-buoy` (hints). Add: `plus`.
- Icons are `--ink-3` at rest, `--ink` when active, `--accent` only for the active tab and the mic in its listening state.
- No emoji anywhere in the interface. No "sparkle" or "magic" icons.
- The ribbon mark is the only brand glyph; it never appears as an icon in the tab bar.

---

## 11. Motion

- **Durations:** 120ms (press, toggle), 200ms (a word revealing, a chip selecting, a fade), 320ms (a sheet sliding up, a screen transition). Nothing longer.
- **Easing:** `cubic-bezier(0.2, 0.7, 0.2, 1)` for things entering; `cubic-bezier(0.45, 0, 0.2, 1)` for things leaving or moving in place.
- **What animates:** sheets (translate up, 320ms), the hint ladder rung becoming active (background 200ms), a typed word settling into place (opacity 200ms), the progress fill width (320ms), the mic ring while listening (a slow 1.6s opacity pulse, 0.6 → 1, the one ambient animation permitted).
- **What never animates:** scripture text (no typewriter, no fade-in word by word on Today), the tab bar, the wordmark, streak numbers (no count-up), confetti or particle effects, color of the page background on theme change.
- `prefers-reduced-motion: reduce` sets every duration to 0 and stops the mic pulse. The app must be fully usable with no motion at all.

---

## 12. Do / Don't

**Do**
- Set scripture in Newsreader at 19px, 1.6 line-height, max 65 characters per line.
- Let whitespace separate sections.
- Keep one accent color and use it for actions and progress only.
- Use real references and real verse text in every mockup and every empty-state example.
- Keep every tap target at 44px or larger.
- Make the dark theme warm.
- Write copy a thoughtful person would say out loud.

**Don't**
- Don't use Inter, Roboto, SF/system-ui, or Space Grotesk as a primary face.
- Don't use gradients, glass blur, lavender or indigo, or a second accent hue.
- Don't stack rounded cards with shadows; one bordered verse card per screen at most.
- Don't use emoji or sparkle icons anywhere.
- Don't center long verse text or justify it.
- Don't animate scripture, numbers, or the tab bar.
- Don't put a gamified badge, trophy, or fire anywhere in the app.
- Don't write "Great job!", "Oops!", or anything with an exclamation mark.
- Don't show percentages when a plain count ("3 of 7") says it better.
- Don't use pure black (#000) or pure white (#FFF) as a page ground.

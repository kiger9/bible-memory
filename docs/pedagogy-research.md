# Pedagogy Research: Verbatim Text Memorization for a Bible Memory PWA

*Research compiled 2026-11-02. Scope: what the cognitive-science literature, practitioner traditions (actors, huffaz, long-form scripture memorizers) and existing apps tell us about memorizing text word-for-word, and how that should shape this app's drills, hints, scheduling, scoring, speech grading and pop quiz.*

**A note on evidence quality.** Retrieval practice, spacing and the production effect have deep, replicated literatures. Research *specific* to verbatim passage memorization is much thinner: the best material comes from actors (Noice & Noice), oral-tradition research (Rubin), small hifz case studies, and a handful of prose-memorization experiments from the 1960s. Where a claim rests on a practitioner guide or a vendor blog rather than a study, that is flagged.

---

## 1. The cognitive science

### 1.1 Retrieval practice (the testing effect)

The single most robust finding: trying to recall beats re-reading. In Roediger & Karpicke's 2006 experiments, repeated testing beat repeated rereading on a one-week test, 61% vs 40%, even though rereading *looked* better immediately after study ([Wikipedia summary](https://en.wikipedia.org/wiki/Testing_effect); [original paper](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf)). Karpicke & Roediger's 2008 *Science* paper is even more pointed for app design: once an item was recalled correctly, **continuing to study it had no measurable effect on delayed recall, while continuing to test it had a large effect** — and students' predictions of their own performance were uncorrelated with reality ([Science 319:966](https://www.brucehayes.org/Teaching/papers/2008_Roediger_Karpicke_Science.pdf); [WashU summary](https://source.washu.edu/2008/02/practicing-information-retrieval-is-key-to-memory-retention/)). A 2011 Karpicke & Blunt study found the retrieval group also won on *verbatim* questions a week later; a preregistered replication argues much of that came from extra memorization time, but the verbatim advantage survived even in the critical re-analysis ([PMC10783554](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10783554/)).

The **bifurcation model** (Kornell, Bjork & Garcia 2011) explains a subtlety that matters for hint design: a test strengthens items that are *successfully retrieved* a lot, while items that fail retrieval gain little unless feedback follows ([paper](https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Kornell.Bjork.Garcia.2011.pdf); [feedback follow-up](https://link.springer.com/article/10.3758/s13415-016-0407-6)). So a drill must be hard enough to count as retrieval, but calibrated so the learner usually succeeds — or fails and is immediately shown the answer.

**Successive relearning** (Rawson & Dunlosky) is the applied form: practice retrieval with feedback until each item hits a criterion (originally three correct recalls), then relearn to criterion again in roughly three widely spaced sessions. In a real course this moved exam performance about a letter grade; one relearning session already produces a significant lift ([retrievalpractice.org](https://www.retrievalpractice.org/archive/2018/successive-relearning); [Dunlosky et al. ITOW](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-successive-relearning-dunlosky-greve-badali-wissman-rawson.pdf); [Rawson & Dunlosky 2022 review](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)). This is the correct mental model for a verse: *learn to criterion on day 1, relearn to criterion on a schedule*, not "review once per interval."

### 1.2 Spaced repetition: SM-2, Leitner, FSRS, and what intervals mean for verbatim text

- **Leitner (1972)**: cards graduate one box per correct answer and drop on failure; the original schedule came from compartment sizes 1/2/5/8/14 cm ([Wikipedia](https://en.wikipedia.org/wiki/Leitner_system)). Simple, transparent, harsh on single failures.
- **SM-2 (1987)**: first intervals 1 and 6 days, then multiply by an easiness factor starting at 2.5 (floor 1.3), updated by a 0–5 grade; a grade under 3 restarts the sequence ([Wozniak's archived description](https://www-v1.supermemo.com/archives1990-2015/english/ol/sm2); [Wikipedia](https://en.wikipedia.org/wiki/SuperMemo)).
- **FSRS**: models each item as Difficulty / Stability / Retrievability with a power-law forgetting curve, fit to real review logs. On the open benchmark of ~10k Anki collections, FSRS-5 beats SM-2 for ~90% of users with default parameters and ~98% with optimized ones ([Anki forum summary](https://forums.ankiweb.net/t/has-anyone-done-a-live-comparison-of-fsrs-and-sm2-as-implemented-in-anki-it-looks-like-no-so-can-anyone-help-me-set-it-up/34996); [DEV explainer](https://dev.to/palachdigital_20fd679f5fe/why-fsrs-is-better-than-sm-2-2m17)). The scheduling lever is *desired retention*; 0.90 is the documented starting point, workload has a minimum near it, and pushing to 0.95 roughly doubles reviews ([FSRS optimal retention wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention); [guide](https://jiten.moe/guides/tuning-fsrs)). TypeScript port: [ts-fsrs](https://cdn.jsdelivr.net/npm/ts-fsrs@5.4.1/README_CN.md).

**What intervals work?** Cepeda et al. (2008, n>1,350) found an inverted-U: for a given retention goal there is an optimal gap, and it is proportionally *smaller* for longer goals — ~20–40% of a one-week goal, ~5–10% of a one-year goal ([PubMed](https://pubmed.ncbi.nlm.nih.gov/19076480/); [PDF](https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf)). For lifetime retention of scripture, that implies gaps measured in weeks-to-months once a verse is stable, which is roughly what FSRS produces.

**Expanding vs equal spacing.** The intuitive "1 day, 3 days, 1 week…" expanding ladder is not clearly better than equal spacing for long-term retention. Karpicke & Roediger (2007) found expanding helped short-term and equal spacing helped long-term; their 2010 follow-up found spacing pattern did not matter as long as retrieval was repeated; Logan & Balota and Kang et al. (2014) found no expanding advantage at delays of a day or more; Storm, Bjork & Storm found expanding wins only when forgetting is rapid ([Karpicke & Roediger 2007](https://Www.Gwern.net/doc/psychology/spaced-repetition/2007-karpicke.pdf); [2010](https://www.Gwern.net/doc/psychology/spaced-repetition/2010-karpicke.pdf); [Kang et al. 2014](https://home.cs.colorado.edu/~mozer/Research/Selected%20Publications/reprints/KangLindseyMozerPashler2014.pdf)). Takeaway: the *number of successful retrievals* and the *absolute gap* matter more than the shape of the ladder, so a per-item adaptive scheduler (FSRS) is preferable to a hard-coded sequence.

**Verbatim vs facts.** No study directly compares optimal intervals for a 30-word verse against a single fact. The Cepeda review of 254 studies found spacing helps "words, sentences, facts, and passages" alike ([Thalheimer review](https://www.worklearning.com/wp-content/uploads/2017/10/Spacing_Learning_Over_Time__March2009v1_.pdf)). Practically, a verse behaves like a chain of linked items: one weak link fails the whole chain, so retention per verse is lower than per fact at the same interval. That argues for a slightly higher desired retention (0.90–0.92) and for scoring that tracks *which part* failed.

### 1.3 Desirable difficulties, generation, and errorful learning

Bjork's framing: conditions that make learning feel harder (spacing, testing, interleaving, generation) tend to produce better long-term retention, and a difficulty is only "desirable" if the learner can eventually succeed ([Wikipedia](https://en.wikipedia.org/wiki/Desirable_difficulty); [Learning Scientists digest](https://www.learningscientists.org/blog/2017/7/16/weekly-digest-68)). Kornell, Hays & Bjork (2009) showed that guessing *wrong* before seeing the answer improves later recall versus just studying — provided corrective feedback follows; learners rate this as *less* effective even when it is better ([Journal of Cognition](https://journalofcognition.org/articles/455); [UCL replication](https://discovery-pp.ucl.ac.uk/id/eprint/1399515/1/RPottsLastRevision.pdf)). Seabrooke et al. (2019) caution the benefit is for items more than associations ([Bristol PDF](https://research-information.bris.ac.uk/ws/files/170233459/Seabrooke_et_al_2018.pdf)). Design implication: do not fear blank-attempts on a new verse; require an attempt, then show the text immediately.

### 1.4 Overlearning: stop when you hit criterion, then space

Rohrer et al. (2005) found that continuing to drill within a session after one perfect recital helped at 1–4 weeks but the benefit faded; they call overlearning "an inefficient strategy for learning material for meaningfully long periods" and recommend stopping at mastery and spacing instead ([USF repository](https://digitalcommons.usf.edu/psy_facpub/1772/); [APS press](https://www.psychologicalscience.org/news/releases/back-to-school-cramming-doesnt-work-in-the-long-run.html)). This is in tension with hifz "10×10" routines and Andrew Davis's "ten times aloud, ten times from memory" (see 1.9). The reconciliation: a *small* amount of day-1 overlearning buys robustness until the first spaced review; large amounts are wasted time better spent on the next session.

### 1.5 Chunking and meaningful phrase units

Anglin & Miller (1968) found rote memorization of prose was faster when passages were presented in segments aligned to the sentence's phrase structure ([Springer](https://link.springer.com/article/10.3758/BF03331552)). A 1964 study of 63 students memorizing a 180-word passage found the best method began by analyzing the passage's content and structure, and the worst was sentence-by-sentence ([Acta Psychologica Sinica](https://journal.psych.ac.cn/acps/EN/Y1964/V8/I04/40)). Prosody-syntax congruence aids processing of spoken text ([Ditcheva & Dommergues 2017](https://ntffpu.uni-plovdiv.bg/wp-content/uploads/2025/03/035_Malina-Ditcheva.pdf)). The serial-position curve predicts the *middle* of a passage is weakest ([Wikipedia](https://en.wikipedia.org/wiki/Serial-position_effect)). Implication: the app should segment every verse into thought-units (clauses/phrases, roughly 3–8 words), drill and hint at that grain, and track error position so middles get extra reps.

### 1.6 Meaning-based encoding: what actors teach us

Noice & Noice found professional actors do *not* memorize by rote; they analyze the motivation behind each line ("active experiencing") and get verbatim retention as a by-product — some recalled lines verbatim three years later ([Current Directions review](https://homepage.villanova.edu/diego.fernandezduque/Teaching/CognitivePsychology/Lectures_and_Labs/sssAppliedIssues/CurrDirActing.pdf); [Noice 1992](https://onlinelibrary.wiley.com/doi/10.1002/acp.2350060506)). In experiments with non-actors, reading a script aloud while moving according to a director's instructions retained more than deliberate memorization ([Learning dialogue with and without movement](https://link.springer.com/article/10.3758/BF03196411)). Emotional nuance also increases verbatim retention of written material ([PMC8236806](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8236806/)). Rubin's oral-tradition work converges: counting-out rhymes and ballads are transmitted verbatim not by rote but by stacking constraints — meaning, causal chain, rhythm, rhyme, imagery; verses with concrete imageable actions are recalled better ([Memory in Oral Traditions](https://academic.oup.com/book/53811); [ballads study](https://dukespace.lib.duke.edu/items/3f395fed-4458-4ad3-a246-8eefafa49a33)). The huffaz literature says the same: a five-hafiz case study lists "reflecting on meaning" alongside chunking and accumulative revision ([IIUM thesis](https://studentrepo.iium.edu.my/entities/publication/22201f5b-2af1-4af3-b321-4d471dc73083)).

**Why this matters for the hint feature:** a "gist of the next phrase" hint is not merely a crutch — it is a deliberate attempt to install the *meaning scaffold* actors and huffaz rely on. Encoding specificity (Tulving & Thomson) says a cue helps when it matches what was encoded ([Wikipedia](https://en.wikipedia.org/wiki/Encoding_specificity_principle)), so meaning-cues help only if the learner encoded meaning on day 1. That is why the day-1 drill must include a meaning pass (section 6).

### 1.7 Dual coding, imagery and melody

Concrete, imageable text is recalled better than abstract text (Paivio; Sadoski et al. 1993) ([Wikipedia](https://en.wikipedia.org/wiki/Dual-coding_theory); [UCSB 2025](https://imagine.sa.ucsb.edu/issue/54/2025/effects-visual-imagery-recall-memory-dual-coding-or-depth-processing)); in ballads, imagery boosts recall but *scrambles order*, which causal structure then repairs ([Rubin ballads](https://dukespace.lib.duke.edu/items/3f395fed-4458-4ad3-a246-8eefafa49a33)). Wallace (1994) found sung text produced more verbatim recall than spoken text when the melody was simple and repeated across verses, but the advantage disappears with hard or varied melodies ([summary](https://link.springer.com/article/10.3758/BF03193445)). Fighter Verses ships a song per passage for this reason ([App Store](https://apps.apple.com/us/app/fighter-verses-memorize-bible/id411711646)). Verdict: imagery is a cheap win for the hint ladder (one concrete image per phrase); melody is high-effort and only works with good tunes — a later feature at most.

### 1.8 Production effect, read-aloud and oral rehearsal

Reading aloud beats silent reading, hearing another person, and hearing a recording of yourself (Forrin & MacLeod 2017, n=95) ([Waterloo](https://uwaterloo.ca/news/news/study-finds-reading-information-aloud-yourself-improves)). The effect extends to paragraphs: cued recall a day later was better for paragraphs read aloud ([JIBS](https://press.palni.org/ojs/index.php/jibs/article/view/335/281)), though the benefit is strongest when *some* material is aloud and some silent (distinctiveness), and a 2025 JML paper found reading aloud raised false memories for related lures — i.e., it may strengthen gist more than exact wording ([Waterloo MACL](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/documents/jml2025.pdf)). So: speak-aloud drills are valuable but must be *graded* for verbatim accuracy, not just performed. Actors' and huffaz' practice is almost entirely oral and the systematic review of Quran memorization lists "repeated pronunciation" as the dominant technique ([PMC9470760](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9470760/)).

### 1.9 The first-letter method and progressive cloze/fading

Nelson & Archer (1972) found first-letter codes significantly improved serial recall, mainly by preserving word *order* rather than making words more available ([ERIC](https://eric.ed.gov/?id=EJ066918)). Carney, Levin & Levin (1994) argued first-letter cues are weak retrieval cues unless the material is already familiar ([ResearchGate](https://www.researchgate.net/publication/232418525_The_first_letter_mnemonic)). That fits: first-letters are an excellent *late-stage* scaffold (verse mostly known, order needs locking) and a poor *early-stage* one.

The strongest direct evidence for fading is **diminishing-cues retrieval practice**: Finley, Benjamin, Hays, Bjork & Kornell (2011) started with the whole target word and removed one letter per trial; this beat accumulating cues and standard testing on final cued recall, because it keeps retrieval *successful* while making it progressively more effortful ([JML paper](https://sites.williams.edu/nk2/files/2011/08/Finley.Benjamin.Hays_.Bjork_.Kornell.2011.pdf); [PubMed](https://pubmed.ncbi.nlm.nih.gov/21499516/)). Fiechter & Benjamin (2017) showed it also works under conditions where ordinary testing fails ([PDF](https://labs.psychology.illinois.edu/~asbenjam/pubs/FiechterBenjamin2017.pdf)). Progressive retrieval practice likewise beat standard retrieval for image-word pairs ([Memory 2021](https://www.tandfonline.com/doi/full/10.1080/09658211.2021.1990963)). Nearly every scripture app implements some version of this (full text → hidden words → first letters → nothing) — Remember Me, Memverse's "round after round" blanks, Scripture Typer's rotating hidden words — but none I found adapts the fading rate to the user's actual performance.

### 1.10 Interleaving

Mixing verses within a session rather than blocking one verse prevents the "illusion of knowledge" ([Bjork & Bjork via LSE](https://www.learningscientists.org/blog/2017/7/16/weekly-digest-68)). For verbatim text there is an added hazard: similar verses (parallel Gospel passages, repeated Psalm refrains) interfere. Interleave *dissimilar* verses in review; introduce a confusable pair deliberately only once both are stable.

### 1.11 Sleep

Mazza et al. (2016): relearning a word list 12 h later after sleep took ~3 trials vs ~6 after a waking day, and the sleep group retained ~15/16 pairs at one week vs ~11, with the advantage still visible at six months ([PDF](https://Www.Gwern.net/doc/psychology/spaced-repetition/2016-mazza.pdf); [APS](https://psychologicalscience.org/?p=125549)). Implication: the day-1 criterion session and the day-2 relearning session should straddle a night; an evening learn / morning relearn pairing is the single cheapest scheduling win.

### 1.12 Practitioner traditions

- **Andrew Davis (extended scripture memorization):** new verse: read aloud 10×, recite from memory 10×, always saying the reference; next day "yesterday's verse first," then recite *all* verses learned so far, then the new verse; after a book is finished, recite the whole book daily for 100 days then "kiss it goodbye" ([SBTS](https://equip.sbts.edu/article/hes-memorized-42-books-bible-can/); [TGC](https://thegospelcoalition.org/article/skip-the-verse-memorize)). This is a cumulative-review, non-spaced system — effective but linear in cost; it is what FSRS replaces.
- **Hifz:** practitioner guides describe 7×3 (seven reads looking, three from memory), 10×10, a single consistent reciter and mushaf layout, and a 30/70 new-to-revision split ([IQRA](https://iqranetwork.com/blog/top-10-proven-techniques-for-effective-quran-memorization-a-practical-guide-for-all-ages/); [Mubarak Academy](https://mubarakacademy.online/en/quran-memorization-techniques/)). Academic work is thin: a five-hafiz case study found testing-by-graded-assessment, chunking, meaning reflection and daily *muraja'ah* (revision) ([IIUM](https://studentrepo.iium.edu.my/entities/publication/22201f5b-2af1-4af3-b321-4d471dc73083)); a Terengganu study describes Sabak/Para Sabak/Dauri cycles (new / recent / old review) ([Richtmann](https://richtmann.org/journal/index.php/mjss/article/download/6163/5908/23841)). The tiered new/recent/old review structure is worth copying as the UI's mental model.
- **Anki verse decks:** the community converges on Cloze Overlapper (each card shows the previous line(s) as context, hides the next) ([Anki forum](https://forums.ankiweb.net/t/memorise-poems-effectively/47053); [ocloze](https://github.com/krmanik/ocloze)). The LPCG author's warning is important: line-by-line cards make *initial acquisition* harder because you never see the whole; learn the passage first, then use cards for review ([LPCG theory](https://ankilpcg.readthedocs.io/en/latest/theory.html)). Memdora (2026) formalizes a "By Heart" card type with three retrieval modes where difficulty increases left to right, on FSRS-6 ([arXiv](https://arxiv.org/abs/2607.25096)).

---

## 2. Hint design

**Cue strength trades off against learning.** Vaughn et al. (2022, *Applied Cognitive Psychology*) gave consonants-only, vowels-only or no hints during retrieval practice. Consonant hints produced the fastest retrieval, were rated most effective and most fun — and produced the *worst* final test ([Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.3929); [summary](https://tipsforteachers.co.uk/research-the-effect-of-hint-strength-on-the-benefits-of-retrieval-practice/)). Learners will over-use strong hints if allowed. A related finding: orthographic hints *after* a failed attempt did not help delayed recall unless the same hints were present at test ([ResearchGate](https://www.researchgate.net/publication/358554355_The_effect_of_hint_strength_on_the_benefits_of_retrieval_practice)).

**Diminishing cues are the right shape.** Start generous, remove support each successful pass ([Finley et al. 2011](https://sites.williams.edu/nk2/files/2011/08/Finley.Benjamin.Hays_.Bjork_.Kornell.2011.pdf)); the explicit trade-off is "successful retrieval at the cost of potency" vs "potent retrieval at the cost of success," and diminishing cues won on final recall.

**Semantic vs lexical cues.** No study directly compares a gist-of-next-phrase cue to a first-letter cue for verbatim recall. Combining the pieces:

- Encoding specificity: a cue works when it was present at encoding; novel weak-associate cues at retrieval can *impair* recall vs no cue ([self-generated cues review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5664228/)). A meaning hint must therefore reuse the *same* phrase summary the learner saw during day-1 encoding, not a freshly worded one.
- First letters preserve order, not availability ([Nelson & Archer](https://eric.ed.gov/?id=EJ066918)) — they rescue "I know the words but not the sequence."
- Gist cues rescue "I lost the thread" — they act on the causal/thematic constraint Rubin identifies as the backbone of verbatim oral recall.
- Risk of gist cues: the learner reconstructs a *paraphrase* that satisfies the gist (the production-effect lure finding is a warning that gist can crowd out wording). So a gist hint must be followed by verbatim grading, and a paraphrase must count as a miss with immediate feedback.

**When to escalate.** The bifurcation model says an unretrieved item gains little without feedback, so hints should escalate *quickly* (seconds, not minutes) through weak → strong, and the terminal rung must be "show the phrase" so every attempt ends in a successful retrieval or a corrective exposure. Diminishing-cue logic runs the other direction across *sessions*: the hint level available at the start of a session should drop as the verse's stability rises. Hints should cost score (section 6) so the Vaughn over-use effect is priced.

---

## 3. What existing apps do

| App | Core loop | Worth borrowing | Complaints |
|---|---|---|---|
| **Bible Memory App (ex-Scripture Typer)** | Type It → Memorize It → Master It; mastered at ≥90% accuracy; review schedule ~1d/3d/1w/2w/1mo, extending to annual; a missed review shortens the interval; hidden words rotate each pass ([2014 review](https://zachwcarpenter.com/2014/03/scripture-typer-app-review/); [Jean Wilund](https://jeanwilund.com/memorizing-bible-verses-just-got-easier-the-best-free-bible-verse-memory-apps/)) | First-letter typing is fast on mobile; mastery gate; interval contraction on lapse | Desktop demands exact keys; mobile forgives adjacent keys; "better for reviewing than memorizing"; 50-verse free cap ([App Store](https://apps.apple.com/us/app/the-bible-memory-app/id496790833); [youth pastor roundup](https://lifeofayouthpastor.com/best-bible-memory-apps/)) |
| **Verses** | Tap-to-reveal one phrase at a time; reorder phrase tiles; word-bank blanks; first-letter typing; levels unlock more of the verse; collections shared with friends ([ChurchMag](https://churchm.ag/verses-app/); [review](https://learnofchrist.com/resources/verses-app)) | *Phrase-level* reveal and reorder — the only app that treats thought-units as the atom; "levels unlock more of the verse" is progressive fading made visible | iOS-only, NIV missing, old reports of unreliable voice recognition ([App Store reviews](https://apps.apple.com/us/app/verses-bible-memory/id939461663?see-all=reviews&platform=iphone)) |
| **Remember Me** | Full → key words hidden → first letters → nothing; typing, fill-blank, flashcards, images, audio; SRS; streaks; free, offline ([Google Play](https://play.google.com/store/apps/details?id=org.bible.remember_me&hl=en); [review](https://learnofchrist.com/resources/remember-me)) | The four-rung fading ladder; image attachment per verse (dual coding) | Reviewer calls scheduling "less aggressive" than paid rivals |
| **Fighter Verses** | Curated 5-year plan, six quiz types (word bank, typing, first-letter, trivia, recite-aloud recording), spaced review, song + commentary per passage ([App Store](https://apps.apple.com/us/app/fighter-verses-memorize-bible/id411711646); [review](https://learnofchrist.com/resources/fighter-verses)) | Reference-matching quiz kept *outside* the scheduler; commentary = meaning encoding; song | Typing-quiz glitches ([apprview](http://www.apprview.com/reference/fighter-verses/)) |
| **Memverse** | Self-rate after recall updates SRS (1d → 3d → 1w → 1mo); "Learn" mode blanks more words round after round ([blog](https://www.memverse.com/blog/); [review](https://www.micahcobb.com/p/memverse-com-my-review-of-the-bible-memorization-site)) | Self-rating as FSRS grade input | Web-first, dated |
| **Recite / ReciteWell / Versify** | On-device speech recognition; each word marked right / close / missed with a score ([Recite](https://learnofchrist.com/resources/recite-bible-verse-memory); [Versify](https://learnofchrist.com/resources/versify)) | Three-state per-word speech grading ("close" bucket) | — |
| **Anki + Cloze Overlapper** | Previous line as context, next line hidden; FSRS available | Context-window cards for long passages; FSRS | Hard to review in order; poor for initial acquisition ([LPCG](https://ankilpcg.readthedocs.io/en/latest/theory.html)) |
| **Quizlet Learn** | Adaptive within-session weighting; true cross-day spacing only in paid "Long-Term Learning" ([THE Journal](https://thejournal.com/articles/2017/03/09/quizlet-debuts-study-feature-that-helps-students-study-efficiently.aspx); [critique](https://www.notelyn.com/blog/quizlet-spaced-repetition)) | Mixing question formats within one session | Not real SRS unless paid |
| **Duolingo** | Daily streak, streak freeze, leagues, XP | Streak *with* freeze; "7-day streak → 3.6× course completion" is Duolingo's own correlational claim ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)) | Streak anxiety; users maintaining streak without learning ([Oulu thesis](https://oulurepo.oulu.fi/bitstream/handle/10024/54117/nbnfioulu-202502121605.pdf?sequence=1&isAllowed=y); [IJMAT case study](https://www.wr-publishing.org/index.php/ijmat/article/view/908)) |

Pattern across the category: every app has the fading ladder; almost none adapt it per-user, grade speech beyond binary, hint at the *phrase* level, or separate "learn" from "review" scheduling cleanly. Those are the openings.

---

## 4. Gamification and motivation

- **Effects are real but small and depend on design.** Sailer & Homner's 2021 meta-analysis found small positive effects on cognitive, motivational and behavioral outcomes ([PMC8037535](https://pmc.ncbi.nlm.nih.gov/articles/PMC8037535)). A programming-education meta-analysis (d = 0.4 overall) found the effect came mainly from *levels*; badges, points, avatars and leaderboards alone had no significant learning effect ([ISCTE PDF](https://repositorio.iscte-iul.pt/bitstream/10071/29213/1/article_95533.pdf)). A 2026 meta-analysis found narrative-based gamification outperforms points/badges/leaderboards ([OLJ](https://olj.onlinelearningconsortium.org/index.php/olj/article/view/5188)).
- **Tangible rewards can undermine intrinsic motivation** (Deci, Koestner & Ryan 1999, 128 experiments) ([PDF](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf)); a 2023 re-meta-analysis finds the undermining shows up in free-choice behavior but not in self-reported enjoyment ([Lehtivuori](https://utupub.fi/handle/10024/173853)). For an app whose users are already intrinsically motivated (devotional practice), heavy extrinsic reward is a risk, not a free lunch.
- **Streaks:** Wharton work (Sharif) shows streak-structured incentives get more work done than flat rewards via commitment ([Knowledge@Wharton](https://knowledge.wharton.upenn.edu/podcast/ripple-effect/easy-as-1-2-3-the-motivating-power-of-streaks-marissa-sharif/)). But independent studies of Duolingo find streaks foster "app dependency rather than autonomous habit formation" ([IJMAT](https://www.wr-publishing.org/index.php/ijmat/article/view/908)) and users who keep going only to protect the number ([Oulu](https://oulurepo.oulu.fi/handle/10024/54117)); anecdotal reports of users deliberately breaking a 650-day streak to escape the stress ([AOL/Independent](https://www.aol.com/m-duolingo-addict-language-app-063000890.html)).
- **Habit formation:** Lally et al. (2010): median ~66 days to automaticity, range 18–254; missing *one* day did not hurt habit formation, a week's gap did; early repetitions produce the biggest automaticity gains; a fixed cue ("after X, I will Y") is essential ([BPS digest](https://bps.org.uk/research-digest/how-form-habit); [Spring](https://www.spring.org.uk/2023/01/form-a-habit.php)).
- **Variable rewards** have classic operant support for response persistence but no rigorous learning-outcome evidence in apps; sources warn of compulsive loops and "app fatigue" ([Appcues](https://www.appcues.com/blog/variable-rewards)). Use sparingly and only tied to *effortful* events.

---

## 5. Speech-based recitation grading

**Platform reality.** Web Speech API continuous mode is workable on Chrome/Android (results accumulate and need de-duplication) and poor on iOS Safari: stops on its own, buffers clog, duplicate transcripts, first attempt fails; practitioners recommend push-to-talk with `continuous=false` and manual restart on iOS ([Lilting iOS tips](https://lilting.ch/en/articles/ios-webspeech-api-tips); [Apple forums](https://developer.apple.com/forums/thread/694847); [WebReflection](https://webreflection.medium.com/taming-the-web-speech-api-ef64f5a245e1)). Plan phrase-at-a-time push-to-talk as the baseline and continuous full-verse recitation as a progressive enhancement.

**Scoring.** Word error rate is the standard, computed by Levenshtein alignment over words, but it penalizes "their/there" as much as a wrong word ([Soniox WER](https://soniox.com/wiki/word-error-rate)). Fuzzy string matching against a target sentence has been validated as a practical automated scorer for listener transcripts ([PMC8516752](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8516752/)). Phonetically-oriented WER (POWER) and homophone-aware alignment penalize homophone substitutions less than unrelated words ([arXiv 1904.11024](https://arxiv.org/pdf/1904.11024)). Double Metaphone yields two phonetic keys per word and treats words sharing a key as matches ([Dr Dobb's](https://drdobbs.com/184401251?pgno=2)) — a coarse but cheap homophone forgiver. Normalization dominates scores: re-scoring under different conventions moved a WER from 10.18% to 6.43% with nothing else changed ([Kili](https://kili-technology.com/blog/asr-models-guide-word-error-rate-benchmarks-and-failure-modes-2026)). OpenAI's Whisper English normalizer is the reference design: lowercase, strip punctuation, expand/collapse contractions ("you're" ≡ "you are"), spell out or digitize numbers, British→American spellings, ~1,700-entry spelling map ([Whisper paper](https://arxiv.org/pdf/2212.04356); [standalone port](https://pypi.org/project/whisper-normalization/)).

**What recitation research adds.** Oral production is the native modality of every verbatim tradition (actors, huffaz, Davis); the production effect gives a memory boost, but with a gist-over-wording risk ([JML 2025](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/documents/jml2025.pdf)). Therefore speech drills must be graded word-by-word and a paraphrase must be visibly flagged — lenient on *recognizer* errors, strict on *memory* errors.

---

## 6. Recommendations for this app

Prioritized. Items 1–5 are the core; 6–10 are differentiators.

### 1. Segment every verse into thought-units at import (foundation for everything else)
Split on punctuation and conjunctions into phrases of ~3–8 words; store for each phrase: text, first letters, a 3–6 word *gist label* ("God's motive: love for the world"), and optionally one concrete image noun. Generate the gist labels once (LLM at import, user-editable) and *never reword them* — encoding specificity requires the same cue at encoding and retrieval. This is the Verses app's phrase atom plus Noice's meaning layer.

### 2. Day-1 "learn to criterion" sequence for a new verse (~6–9 minutes)
1. **Read aloud 2×** with phrase boundaries visually marked and gist labels shown beside each phrase (production effect + meaning encoding; Davis/hifz read-first).
2. **Meaning pass (30 s):** show gist labels alone, user taps each to reveal its phrase. One tap-through only — this installs the cue.
3. **Blind attempt** (generation/errorful learning): type or speak the verse with nothing shown; expect failure; show full text with diff immediately.
4. **Phrase build-up:** present phrases in order with diminishing cues: full phrase → key words hidden → first letters → blank. Advance a phrase one rung per correct response; drop one rung on error with immediate correction. Previous phrases remain visible as context (Cloze Overlapper pattern).
5. **Full-verse recall ×2 from blank**, one typed and one spoken; reference said/typed each time (Davis).
6. **Stop** at two consecutive clean full recalls — no further drilling that day (Rohrer). Schedule first review for the next morning if learned in the evening, otherwise ~12 h later (Mazza).

### 3. Scheduling: FSRS per verse, three review tiers in the UI
Use ts-fsrs with desired retention 0.90 (expose 0.85–0.95 in settings). Grade input = drill result (see §5). Do *not* hard-code 1/3/7/30 ladders; the expanding-vs-equal literature says the shape doesn't matter, the gaps and successful retrievals do. Present the queue hifz-style as **New / Recent (stability < 2 weeks) / Long-term**, with a soft 30/70 new-to-review split. Cap daily sessions at ~5–8 minutes; show "done for today" rather than more.

**Lapse policy:** on a failed review, relearn to criterion *that session* with the phrase build-up (successive relearning), then let FSRS shrink the interval. A missed day does not reset anything (Lally).

### 4. Hint ladder (per phrase, in-drill)
Escalate on tap or after ~6 s of inactivity; each rung costs score; the terminal rung always shows the answer (bifurcation model: no attempt should end unresolved).

| Level | Cue | Rescues |
|---|---|---|
| 0 | nothing | — |
| 1 | **Gist label** of the next phrase (the exact day-1 label) | lost the thread |
| 2 | Gist + **first letters** of the phrase | know the words, lost the order |
| 3 | Gist + first letters + **first word spelled out** | stuck on entry point |
| 4 | **Show the phrase**; user retypes/repeats it, then continues | failed retrieval → corrective feedback |

Across sessions, cap the *starting* availability of hints by stability: new verse → all levels; Recent → levels 1–2 then jump to 4; Long-term → level 1 or 4 only. This encodes Vaughn's finding (learners over-pick strong hints) and Finley's (diminish cues over time).

### 5. Scoring and FSRS grade mapping
- Per phrase: correct unaided = 1.0; with hint L1 = 0.8; L2 = 0.6; L3 = 0.4; L4 (shown) = 0.
- Typing: ignore case, punctuation, whitespace; forgive adjacent-key single-character slips (Levenshtein ≤1 on words ≥5 letters) — the mobile Scripture Typer complaint — but count wrong *words* and omitted words fully.
- Verse score = mean of phrases. Map to FSRS: ≥0.95 unaided → **Easy**; ≥0.85 → **Good**; ≥0.6 → **Hard**; else **Again**.
- Track error position per phrase; a phrase with ≥2 misses in its last 3 appearances gets an extra phrase-level cloze card (serial-position middle weakness).

### 6. Speech recitation grading
- Normalize both sides Whisper-style: lowercase, strip punctuation, expand contractions, numerals ↔ words, a translation-aware map for archaic forms ("thee/the", "saith/sayeth", proper-noun variants).
- Align with word-level Levenshtein; mark each reference word **right / close / missed** (the Recite app's three-state model). "Close" = Double Metaphone key match or Levenshtein ≤2 on the word, scored 0.9; a *different real word* that the recognizer heard is scored as a miss but shown as "did you say X?" so the user can re-record that phrase.
- Grade phrase-by-phrase with push-to-talk; allow continuous full-verse mode on Android only, with duplicate-result de-duplication.
- Never auto-pass a paraphrase: if ≥2 content words in a phrase are substituted, flag the phrase and show the exact wording.

### 7. Pop quiz design
Make it a *retrieval* event the scheduler can use, not recognition. Favor: reference → recite first phrase; first phrase → reference; gist label → phrase; "which phrase comes next" by reorder tiles (Verses). Avoid multiple-choice with plausible verbatim lures — Roediger & Marsh (2005) show lure exposure creates false knowledge and the effect persists a week; if MC is used at all, always give immediate feedback (Butler & Roediger 2008) ([WUSTL](https://profiles.wustl.edu/en/publications/the-positive-and-negative-consequences-of-multiple-choice-testing/); [feedback PDF](https://mrbartonmaths.com/resourcesnew/8.%20Research/Formative%20Assessment/Feedback%20enhances%20the%20positive%20effects%20and%20reduces.pdf)). Draw quiz items only from Long-term verses, interleaved and dissimilar; feed a miss back into FSRS as "Hard" (not "Again" — quiz conditions are noisier). Keep reference-matching *out* of the main schedule, as Fighter Verses does, but weight it in the quiz because reference recall is the weakest link in practice.

### 8. Motivation: streak with a freeze, levels, no leaderboards
- **Streak** counts days with *any completed review*, auto-awards one freeze per 7-day run, never resets to zero on a single miss (Lally: one day doesn't matter; Duolingo: freezes prevent abandonment). Show "best streak" alongside current.
- **Per-verse mastery levels** (Learning → Recent → Known → Rock-solid at stability > 90 d) — levels were the one element with a measured learning effect.
- **No global leaderboards, no XP store, no paid rewards** (undermining risk with intrinsically motivated users). Optional small-group collections à la Verses if social is wanted later.
- **Implementation-intention prompt** at onboarding: "When will you review? after ___" and a single daily notification at that time; nothing else.
- A tiny *variable* delight (a rare verse-related illustration on a clean unaided recall) is acceptable; tie it to effort, never to opening the app.

### 9. Logbook as the "Long-term" tier
Each verse shows stability, last/next review, unaided-recall streak, weakest phrase, and a "recite now" button that counts as an extra retrieval (never penalized). Offer a Davis-style "recite everything" marathon mode for users who want it, logged but not required.

### 10. Later features, in order of expected payoff
(a) Auto-interleave confusable verses only after both are Rock-solid; (b) user-attached image per phrase (dual coding, cheap); (c) evening-learn / morning-review nudge; (d) melody only if licensed tunes are available — the evidence requires simple, repeated melodies to see a gain.

---

### Appendix: items where evidence is weak or missing
- No controlled comparison of gist-cue vs first-letter cue for verbatim text; the ladder above is an inference from encoding specificity, Nelson & Archer, and diminishing-cues work.
- No RCTs on hifz routines; 7×3 and 10×10 are tradition, not findings.
- Duolingo retention numbers (14% from streak wagers, 3.6× completion) are company-reported correlations.
- The Memdora paper is a design paper with no user study.
- Fetching full texts from arxiv.org, springer.com and labs.psychology.illinois.edu was blocked in this environment; claims from those sources rely on abstracts and secondary summaries.

import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import type { ReviewState } from './types'

const f = fsrs(generatorParameters({ enable_fuzz: true }))

export function newReviewState(verseId: number): ReviewState {
  const c = createEmptyCard(new Date())
  return toState(verseId, c)
}

function toState(verseId: number, c: Card): ReviewState {
  return {
    verseId,
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review?.getTime(),
  }
}

function toCard(s: ReviewState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.lastReview ? new Date(s.lastReview) : undefined,
  }
}

/** Map a practice accuracy (0..1) and hint usage to an FSRS grade. */
export function gradeFromAccuracy(accuracy: number, hintsUsed: number): Grade {
  if (accuracy >= 0.98 && hintsUsed === 0) return Rating.Easy
  if (accuracy >= 0.9) return Rating.Good
  if (accuracy >= 0.7) return Rating.Hard
  return Rating.Again
}

export function review(state: ReviewState, grade: Grade, now = new Date()): ReviewState {
  const result = f.next(toCard(state), now, grade)
  return toState(state.verseId, result.card)
}

/** One step harsher, used when the person could not say where the verse is from. */
export function penalize(grade: Grade): Grade {
  if (grade === Rating.Easy) return Rating.Good
  if (grade === Rating.Good) return Rating.Hard
  return Rating.Again
}

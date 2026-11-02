/** Tokenize display text into words (punctuation kept attached for display). */
export function tokenize(text: string): string[] {
  return text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
}

/** Normalize a word for comparison: lowercase, strip punctuation/quotes, unify numerals. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[“”"]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function normalizeText(text: string): string[] {
  return tokenize(text).map(normalizeWord).filter(Boolean)
}

export function firstLetters(words: string[]): string {
  return words.map(w => normalizeWord(w).charAt(0).toUpperCase()).join(' ')
}

export type DiffOp = { type: 'match' | 'wrong' | 'missing' | 'extra'; expected?: string; actual?: string }

/** Word-level LCS diff: expected vs. actual. Returns ops in expected order plus accuracy. */
export function wordDiff(expected: string[], actual: string[]): { ops: DiffOp[]; accuracy: number } {
  const e = expected.map(normalizeWord), a = actual.map(normalizeWord)
  const n = e.length, m = a.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = e[i] === a[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops: DiffOp[] = []
  let i = 0, j = 0, matches = 0
  while (i < n && j < m) {
    if (e[i] === a[j]) { ops.push({ type: 'match', expected: expected[i], actual: actual[j] }); i++; j++; matches++ }
    else if (dp[i + 1][j + 1] >= Math.max(dp[i + 1][j], dp[i][j + 1]) && e[i + 1] !== a[j] && e[i] !== a[j + 1]) {
      ops.push({ type: 'wrong', expected: expected[i], actual: actual[j] }); i++; j++
    }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'missing', expected: expected[i] }); i++ }
    else { ops.push({ type: 'extra', actual: actual[j] }); j++ }
  }
  while (i < n) { ops.push({ type: 'missing', expected: expected[i++] }) }
  while (j < m) { ops.push({ type: 'extra', actual: actual[j++] }) }
  return { ops, accuracy: n === 0 ? 1 : matches / n }
}

/** Lenient check for speech: ignores small words and homophone-ish differences. */
export function speechAccuracy(expected: string[], spoken: string): number {
  const { accuracy } = wordDiff(expected, tokenize(spoken))
  return accuracy
}

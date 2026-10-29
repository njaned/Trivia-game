/**
 * Pure helpers shared by the quiz engine, the console UI, and the tests.
 * Nothing in this module touches the terminal or the file system.
 */

/** Base points awarded for a correct answer, by question difficulty. */
export const DIFFICULTY_POINTS = Object.freeze({
  Easy: 100,
  Medium: 150,
  Hard: 200,
});

/** Maximum extra points awarded for answering quickly. */
export const SPEED_BONUS_MAX = 50;

/**
 * Return a shuffled copy of an array using the Fisher-Yates algorithm.
 * The original array is never mutated.
 */
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffle a question's answer options while keeping `answer` pointing at
 * the correct text. Works with duplicate option labels because the original
 * positions are tracked until the new order is known.
 */
export function shuffleOptions(question, random = Math.random) {
  const mixed = shuffle(
    question.options.map((text, position) => ({ text, position })),
    random,
  );

  return {
    ...question,
    options: mixed.map((option) => option.text),
    answer: mixed.findIndex((option) => option.position === question.answer),
  };
}

/**
 * Pick `count` questions from the bank, optionally filtered by category.
 * Every returned question has its options shuffled.
 */
export function selectQuestions(
  bank,
  { count = 10, category = 'All', random = Math.random } = {},
) {
  const pool = bank.filter(
    (question) => category === 'All' || question.category === category,
  );
  const safeCount = Math.max(0, Math.min(count, pool.length));

  return shuffle(pool, random)
    .slice(0, safeCount)
    .map((question) => shuffleOptions(question, random));
}

/**
 * Parse a player's typed answer into a zero-based option index.
 * Accepts "2" or "B" (case-insensitive) for the second option.
 * Returns null when the input is not a valid choice.
 */
export function parseChoice(input, optionCount) {
  const value = String(input ?? '').trim().toLowerCase();
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    const number = Number(value);
    return number >= 1 && number <= optionCount ? number - 1 : null;
  }

  if (/^[a-z]$/.test(value)) {
    const index = value.charCodeAt(0) - 'a'.charCodeAt(0);
    return index >= 0 && index < optionCount ? index : null;
  }

  return null;
}

/**
 * Score one answer. Correct answers earn the difficulty base plus a speed
 * bonus proportional to the time left on the clock.
 */
export function scoreAnswer({
  correct,
  millisecondsLeft = 0,
  timeLimitMs = 0,
  difficulty = 'Medium',
}) {
  if (!correct) {
    return { points: 0, base: 0, speedBonus: 0 };
  }

  const base = DIFFICULTY_POINTS[difficulty] ?? DIFFICULTY_POINTS.Medium;
  const ratio =
    timeLimitMs > 0
      ? Math.min(1, Math.max(0, millisecondsLeft / timeLimitMs))
      : 0;
  const speedBonus = Math.round(ratio * SPEED_BONUS_MAX);

  return { points: base + speedBonus, base, speedBonus };
}

/**
 * Build the end-of-game report from the per-question results.
 * Uses filter, reduce, map, and sort so the summary stays easy to extend.
 */
export function summarize(results, { elapsedMs = 0 } = {}) {
  const total = results.length;
  const correct = results.filter((result) => result.correct).length;
  const timeouts = results.filter((result) => result.timedOut).length;
  const points = results.reduce((sum, result) => sum + result.points, 0);

  const streak = results.reduce(
    (state, result) => {
      const current = result.correct ? state.current + 1 : 0;
      return { current, best: Math.max(state.best, current) };
    },
    { current: 0, best: 0 },
  );

  const categoryTotals = results.reduce((totals, result) => {
    const { category } = result.question;
    const entry = totals[category] ?? { category, correct: 0, total: 0 };
    entry.total += 1;
    if (result.correct) entry.correct += 1;
    totals[category] = entry;
    return totals;
  }, {});

  const totalQuestionMs = results.reduce(
    (sum, result) => sum + result.elapsedMs,
    0,
  );

  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
    points,
    elapsedMs,
    averageMs: total > 0 ? totalQuestionMs / total : 0,
    bestStreak: streak.best,
    timeouts,
    categories: Object.values(categoryTotals).sort((a, b) =>
      a.category.localeCompare(b.category),
    ),
    missed: results.filter((result) => !result.correct),
  };
}

/** Format milliseconds as "9.4s" or "1m 42s". */
export function formatDuration(milliseconds) {
  const safeMs = Math.max(0, Number(milliseconds) || 0);
  const tenths = Math.round(safeMs / 100);

  if (tenths < 600) {
    return `${(tenths / 10).toFixed(1)}s`;
  }

  const totalSeconds = Math.round(tenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** Format a 0-1 ratio as a whole percentage, e.g. 0.667 -> "67%". */
export function formatAccuracy(ratio) {
  return `${Math.round((Number(ratio) || 0) * 100)}%`;
}

/** Add thousands separators without depending on the host locale. */
export function formatNumber(value) {
  return String(Math.trunc(Number(value) || 0)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );
}

/** Pluralize a count: pluralize(1, 'question') -> "1 question". */
export function pluralize(count, singular, plural = `${singular}s`) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

/** Describe an option as the player sees it, e.g. "2) Mars". */
export function formatChoice(question, index) {
  if (!Number.isInteger(index) || index < 0 || index >= question.options.length) {
    return 'No answer';
  }
  return `${index + 1}) ${question.options[index]}`;
}

/** Wrap text on word boundaries so long questions fit the terminal. */
export function wordWrap(text, width = 60) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

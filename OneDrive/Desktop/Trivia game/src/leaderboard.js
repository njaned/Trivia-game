import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** How many high scores are kept on disk. */
export const MAX_ENTRIES = 5;

function isValidEntry(entry) {
  return (
    entry &&
    typeof entry.name === 'string' &&
    Number.isFinite(entry.points) &&
    Number.isFinite(entry.correct) &&
    Number.isFinite(entry.total)
  );
}

/** Higher scores first; ties go to the earlier round. */
function compareScores(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  const aTime = Date.parse(a.date);
  const bTime = Date.parse(b.date);
  const safeA = Number.isNaN(aTime) ? Number.POSITIVE_INFINITY : aTime;
  const safeB = Number.isNaN(bTime) ? Number.POSITIVE_INFINITY : bTime;
  return safeA - safeB;
}

/**
 * Load the leaderboard. A missing or unreadable file is treated as an empty
 * board so a corrupt save never blocks someone from playing.
 */
export async function loadScores(filePath) {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidEntry)
      .map(({ name, points, correct, total, date }) => ({
        name,
        points,
        correct,
        total,
        date,
      }))
      .sort(compareScores)
      .slice(0, MAX_ENTRIES);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return [];
    throw error;
  }
}

/** Does this score make the top five? Assumes `scores` is already sorted. */
export function qualifies(scores, points) {
  if (scores.length < MAX_ENTRIES) return true;
  return points > scores[scores.length - 1].points;
}

/** Return a new, sorted leaderboard with `entry` included (max five rows). */
export function addScore(scores, entry) {
  const name = String(entry.name ?? '').trim().slice(0, 20) || 'Player';
  const normalized = {
    name,
    points: Math.max(0, Math.trunc(Number(entry.points) || 0)),
    correct: Math.max(0, Math.trunc(Number(entry.correct) || 0)),
    total: Math.max(0, Math.trunc(Number(entry.total) || 0)),
    date: entry.date ?? new Date().toISOString(),
  };

  return [...scores, normalized].sort(compareScores).slice(0, MAX_ENTRIES);
}

/** Persist the leaderboard, creating the data directory if needed. */
export async function saveScores(filePath, scores) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(scores, null, 2)}\n`, 'utf8');
}

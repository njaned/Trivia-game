import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  MAX_ENTRIES,
  addScore,
  loadScores,
  qualifies,
  saveScores,
} from '../src/leaderboard.js';

function entry(name, points, date = '2026-01-01T00:00:00.000Z') {
  return { name, points, correct: 5, total: 10, date };
}

const board = [
  entry('First', 1000, '2026-01-01T00:00:00.000Z'),
  entry('Second', 800, '2026-01-02T00:00:00.000Z'),
  entry('Third', 600, '2026-01-03T00:00:00.000Z'),
  entry('Fourth', 400, '2026-01-04T00:00:00.000Z'),
  entry('Fifth', 200, '2026-01-05T00:00:00.000Z'),
];

test('addScore inserts, sorts, caps, and leaves the old board alone', () => {
  const updated = addScore(board, entry('Newcomer', 500));

  assert.deepEqual(
    updated.map((row) => row.points),
    [1000, 800, 600, 500, 400],
  );
  assert.equal(updated.length, MAX_ENTRIES);
  assert.equal(board.length, MAX_ENTRIES, 'input board is not mutated');
  assert.ok(!board.some((row) => row.name === 'Newcomer'));
});

test('addScore drops scores that miss the top five', () => {
  const updated = addScore(board, entry('Low', 100));
  assert.equal(updated.length, MAX_ENTRIES);
  assert.ok(!updated.some((row) => row.name === 'Low'));
});

test('ties are broken by the earlier round', () => {
  const tied = addScore(board, entry('Tie', 600, '2025-12-31T00:00:00.000Z'));
  assert.deepEqual(
    tied.map((row) => row.name),
    ['First', 'Second', 'Tie', 'Third', 'Fourth'],
  );
});

test('addScore normalizes names and numbers', () => {
  const updated = addScore([], {
    name: '   A very long player name that gets shortened   ',
    points: '1250',
    correct: '7',
    total: '10',
  });

  assert.equal(updated[0].name.length, 20);
  assert.match(updated[0].name, /^A very long player/);
  assert.equal(updated[0].points, 1250);
  assert.equal(updated[0].correct, 7);
  assert.equal(updated[0].total, 10);
  assert.ok(!Number.isNaN(Date.parse(updated[0].date)));

  const blank = addScore([], { name: '   ', points: -50 });
  assert.equal(blank[0].name, 'Player');
  assert.equal(blank[0].points, 0);
});

test('qualifies only accepts scores that improve the board', () => {
  assert.equal(qualifies([], 1), true);
  assert.equal(qualifies(board.slice(0, 2), 0), true);
  assert.equal(qualifies(board, 200), false, 'ties do not qualify');
  assert.equal(qualifies(board, 201), true);
  assert.equal(qualifies(board, 5000), true);
});

test('saveScores and loadScores round-trip through disk', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-scores-'));
  try {
    const file = path.join(dir, 'nested', 'scores.json');
    await saveScores(file, board);

    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(saved.length, MAX_ENTRIES);

    const loaded = await loadScores(file);
    assert.deepEqual(loaded, board);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadScores treats a missing file as an empty board', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-scores-'));
  try {
    const loaded = await loadScores(path.join(dir, 'does-not-exist.json'));
    assert.deepEqual(loaded, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadScores ignores corrupt files and bad rows', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-scores-'));
  try {
    const corrupt = path.join(dir, 'corrupt.json');
    await writeFile(corrupt, '{ not json', 'utf8');
    assert.deepEqual(await loadScores(corrupt), []);

    const messy = path.join(dir, 'messy.json');
    await writeFile(
      messy,
      JSON.stringify([
        ...board.map((row) => ({ ...row, points: row.points - 300 })),
        { name: 'Broken', points: 'not-a-number' },
        null,
      ]),
      'utf8',
    );

    const loaded = await loadScores(messy);
    assert.equal(loaded.length, 5);
    assert.ok(loaded.every((row) => Number.isFinite(row.points)));
    assert.deepEqual(
      loaded.map((row) => row.points),
      [700, 500, 300, 100, -100],
      'rows are sorted by points',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

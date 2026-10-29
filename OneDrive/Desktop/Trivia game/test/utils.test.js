import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIFFICULTY_POINTS,
  formatAccuracy,
  formatChoice,
  formatDuration,
  formatNumber,
  parseChoice,
  pluralize,
  scoreAnswer,
  selectQuestions,
  shuffle,
  shuffleOptions,
  summarize,
  wordWrap,
} from '../src/utils.js';

/** Small deterministic RNG so shuffle tests are repeatable. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const sampleQuestion = {
  id: 'sci-test',
  category: 'Science',
  difficulty: 'Medium',
  question: 'Which planet is known as the Red Planet?',
  options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
  answer: 1,
  explanation: 'Mars appears red because of iron oxide on its surface.',
};

test('shuffle returns a permutation without mutating the input', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const output = shuffle(input, seededRandom(11));

  assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...output].sort((a, b) => a - b), input);
  assert.notEqual(output, input);
});

test('shuffleOptions keeps the correct answer text at the new index', () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    const shuffled = shuffleOptions(sampleQuestion, seededRandom(seed));

    assert.deepEqual(
      [...shuffled.options].sort(),
      [...sampleQuestion.options].sort(),
      'all options are preserved',
    );
    assert.equal(
      shuffled.options[shuffled.answer],
      'Mars',
      `seed ${seed} points at the correct text`,
    );
    assert.equal(shuffled.id, sampleQuestion.id);
    assert.equal(shuffled.answer, shuffled.options.indexOf('Mars'));
  }
});

test('selectQuestions filters by category, respects count, and shuffles options', () => {
  const bank = [
    sampleQuestion,
    { ...sampleQuestion, id: 'sci-2', options: ['A', 'B', 'C', 'D'], answer: 0 },
    {
      ...sampleQuestion,
      id: 'his-1',
      category: 'History',
      options: ['W', 'X', 'Y', 'Z'],
      answer: 3,
    },
  ];

  const picked = selectQuestions(bank, {
    count: 2,
    category: 'Science',
    random: seededRandom(5),
  });

  assert.equal(picked.length, 2);
  assert.ok(picked.every((question) => question.category === 'Science'));

  for (const question of picked) {
    const original = bank.find((entry) => entry.id === question.id);
    assert.ok(original);
    assert.equal(
      question.options[question.answer],
      original.options[original.answer],
      'shuffling never changes which answer is correct',
    );
  }

  const everything = selectQuestions(bank, { count: 99, random: seededRandom(2) });
  assert.equal(everything.length, 3, 'count is capped at the pool size');

  const none = selectQuestions(bank, {
    count: 2,
    category: 'Music',
    random: seededRandom(2),
  });
  assert.deepEqual(none, []);
});

test('parseChoice accepts numbers and letters, rejects everything else', () => {
  assert.equal(parseChoice('1', 4), 0);
  assert.equal(parseChoice('2', 4), 1);
  assert.equal(parseChoice(' 4 ', 4), 3);
  assert.equal(parseChoice('b', 4), 1);
  assert.equal(parseChoice('D', 4), 3);
  assert.equal(parseChoice('a', 4), 0);

  assert.equal(parseChoice('0', 4), null);
  assert.equal(parseChoice('5', 4), null);
  assert.equal(parseChoice('-2', 4), null);
  assert.equal(parseChoice('1.5', 4), null);
  assert.equal(parseChoice('e', 4), null);
  assert.equal(parseChoice('abc', 4), null);
  assert.equal(parseChoice('', 4), null);
  assert.equal(parseChoice('   ', 4), null);
  assert.equal(parseChoice(undefined, 4), null);
});

test('scoreAnswer applies difficulty base points and a capped speed bonus', () => {
  assert.deepEqual(
    scoreAnswer({
      correct: false,
      millisecondsLeft: 15000,
      timeLimitMs: 15000,
      difficulty: 'Hard',
    }),
    { points: 0, base: 0, speedBonus: 0 },
  );

  assert.deepEqual(
    scoreAnswer({
      correct: true,
      millisecondsLeft: 15000,
      timeLimitMs: 15000,
      difficulty: 'Easy',
    }),
    { points: 150, base: 100, speedBonus: 50 },
  );

  assert.deepEqual(
    scoreAnswer({
      correct: true,
      millisecondsLeft: 7500,
      timeLimitMs: 15000,
      difficulty: 'Medium',
    }),
    { points: 175, base: 150, speedBonus: 25 },
  );

  assert.deepEqual(
    scoreAnswer({
      correct: true,
      millisecondsLeft: 0,
      timeLimitMs: 15000,
      difficulty: 'Hard',
    }),
    { points: 200, base: 200, speedBonus: 0 },
  );

  assert.equal(
    scoreAnswer({
      correct: true,
      millisecondsLeft: 99999,
      timeLimitMs: 15000,
      difficulty: 'Medium',
    }).speedBonus,
    50,
    'bonus never exceeds the maximum',
  );

  assert.equal(
    scoreAnswer({ correct: true, timeLimitMs: 15000, difficulty: 'Unknown' }).base,
    DIFFICULTY_POINTS.Medium,
    'unknown difficulties fall back to Medium',
  );
});

test('summarize totals answers, streaks, categories, and misses', () => {
  const science = { ...sampleQuestion };
  const history = { ...sampleQuestion, id: 'his', category: 'History' };

  const results = [
    {
      index: 0,
      question: science,
      correct: true,
      timedOut: false,
      choice: 1,
      points: 200,
      elapsedMs: 1000,
    },
    {
      index: 1,
      question: science,
      correct: true,
      timedOut: false,
      choice: 1,
      points: 150,
      elapsedMs: 2000,
    },
    {
      index: 2,
      question: history,
      correct: false,
      timedOut: false,
      choice: 0,
      points: 0,
      elapsedMs: 3000,
    },
    {
      index: 3,
      question: history,
      correct: false,
      timedOut: true,
      choice: null,
      points: 0,
      elapsedMs: 4000,
    },
  ];

  const summary = summarize(results, { elapsedMs: 60000 });

  assert.equal(summary.total, 4);
  assert.equal(summary.correct, 2);
  assert.equal(summary.accuracy, 0.5);
  assert.equal(summary.points, 350);
  assert.equal(summary.bestStreak, 2);
  assert.equal(summary.timeouts, 1);
  assert.equal(summary.elapsedMs, 60000);
  assert.equal(summary.averageMs, 2500);
  assert.equal(summary.missed.length, 2);
  assert.deepEqual(summary.missed.map((result) => result.index), [2, 3]);
  assert.deepEqual(summary.categories, [
    { category: 'History', correct: 0, total: 2 },
    { category: 'Science', correct: 2, total: 2 },
  ]);
});

test('formatDuration switches from seconds to minutes cleanly', () => {
  assert.equal(formatDuration(0), '0.0s');
  assert.equal(formatDuration(9400), '9.4s');
  assert.equal(formatDuration(59960), '1m 00s');
  assert.equal(formatDuration(96000), '1m 36s');
  assert.equal(formatDuration(-100), '0.0s');
  assert.equal(formatDuration(undefined), '0.0s');
});

test('formatAccuracy and formatNumber produce display strings', () => {
  assert.equal(formatAccuracy(0.666), '67%');
  assert.equal(formatAccuracy(1), '100%');
  assert.equal(formatAccuracy(0.5), '50%');
  assert.equal(formatAccuracy(undefined), '0%');

  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(999), '999');
  assert.equal(formatNumber(1240), '1,240');
  assert.equal(formatNumber(1234567), '1,234,567');
});

test('formatChoice labels options the way the player sees them', () => {
  assert.equal(formatChoice(sampleQuestion, 1), '2) Mars');
  assert.equal(formatChoice(sampleQuestion, null), 'No answer');
  assert.equal(formatChoice(sampleQuestion, 9), 'No answer');
});

test('pluralize handles singular and plural counts', () => {
  assert.equal(pluralize(1, 'question'), '1 question');
  assert.equal(pluralize(0, 'question'), '0 questions');
  assert.equal(pluralize(7, 'category', 'categories'), '7 categories');
  assert.equal(pluralize(1, 'category', 'categories'), '1 category');
});

test('wordWrap respects the width and preserves the words', () => {
  const text =
    'The Pacific Ocean is the largest and deepest of the world ocean basins.';
  const lines = wordWrap(text, 20);

  assert.ok(lines.every((line) => line.length <= 20));
  assert.equal(lines.join(' '), text);
  assert.deepEqual(wordWrap('', 20), []);
});

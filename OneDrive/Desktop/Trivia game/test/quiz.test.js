import test from 'node:test';
import assert from 'node:assert/strict';

import { runQuiz } from '../src/quiz.js';

function makeQuestion(id, answer, difficulty = 'Medium', category = 'Science') {
  return {
    id,
    category,
    difficulty,
    question: `Question ${id}?`,
    options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    answer,
    explanation: `Explanation for ${id}.`,
  };
}

/** Fake IO that replays a script of answers and records every render call. */
function createScriptedIo(script) {
  const rendered = [];
  const feedback = [];
  const summaries = [];
  let cursor = 0;

  return {
    rendered,
    feedback,
    summaries,
    io: {
      renderQuestion: (context) => rendered.push(context),
      readAnswer: async () => {
        assert.ok(cursor < script.length, 'the answer script ran out');
        const next = script[cursor];
        cursor += 1;
        return next;
      },
      renderFeedback: (result) => feedback.push(result),
      renderSummary: (summary) => summaries.push(summary),
    },
  };
}

const timeLimitMs = 15000;

test('runQuiz scores a perfect round and reports a summary', async () => {
  const questions = [
    makeQuestion('easy', 0, 'Easy'),
    makeQuestion('medium', 1, 'Medium'),
    makeQuestion('hard', 2, 'Hard'),
  ];
  const { io, rendered, feedback, summaries } = createScriptedIo([
    { choice: 0, timedOut: false, elapsedMs: 0 },
    { choice: 1, timedOut: false, elapsedMs: 0 },
    { choice: 2, timedOut: false, elapsedMs: 0 },
  ]);

  let clock = 0;
  const { summary, results } = await runQuiz({
    questions,
    timeLimitMs,
    io,
    now: () => {
      clock += 1;
      return clock === 1 ? 1000 : 61000;
    },
  });

  assert.equal(rendered.length, 3);
  assert.deepEqual(
    rendered.map((context) => context.index),
    [0, 1, 2],
    'questions are shown sequentially',
  );
  assert.deepEqual(
    rendered.map((context) => context.total),
    [3, 3, 3],
  );

  assert.equal(feedback.length, 3);
  assert.ok(feedback.every((result) => result.correct));

  assert.equal(results.length, 3);
  assert.deepEqual(
    results.map((result) => result.points),
    [150, 200, 250],
    'base points plus full speed bonus',
  );

  assert.equal(summary.correct, 3);
  assert.equal(summary.accuracy, 1);
  assert.equal(summary.points, 600);
  assert.equal(summary.bestStreak, 3);
  assert.equal(summary.elapsedMs, 60000);
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0], summary);
});

test('runQuiz handles wrong answers, timeouts, and streaks', async () => {
  const questions = [
    makeQuestion('q1', 0),
    makeQuestion('q2', 1),
    makeQuestion('q3', 2, 'Easy'),
  ];
  const { io, feedback } = createScriptedIo([
    { choice: 0, timedOut: false, elapsedMs: 0 },
    { choice: 0, timedOut: false, elapsedMs: 5000 },
    { choice: null, timedOut: true, elapsedMs: timeLimitMs },
  ]);

  const { results, summary } = await runQuiz({
    questions,
    timeLimitMs,
    io,
    now: () => 0,
  });

  assert.equal(results[0].correct, true);
  assert.equal(results[0].points, 200);
  assert.equal(results[1].correct, false);
  assert.equal(results[1].choice, 0);
  assert.equal(results[1].points, 0);
  assert.equal(results[1].millisecondsLeft, 10000);
  assert.equal(results[2].timedOut, true);
  assert.equal(results[2].correct, false);
  assert.equal(results[2].points, 0);

  assert.equal(results[2].question, questions[2]);
  assert.equal(summary.correct, 1);
  assert.equal(summary.timeouts, 1);
  assert.equal(summary.bestStreak, 1);
  assert.equal(summary.missed.length, 2);
  assert.equal(feedback[2].timedOut, true);
});

test('a timeout is never counted correct, even with a matching choice', async () => {
  const questions = [makeQuestion('q1', 2)];
  const { io } = createScriptedIo([
    { choice: 2, timedOut: true, elapsedMs: timeLimitMs },
  ]);

  const { results, summary } = await runQuiz({
    questions,
    timeLimitMs,
    io,
    now: () => 0,
  });

  assert.equal(results[0].correct, false);
  assert.equal(results[0].points, 0);
  assert.equal(summary.correct, 0);
});

test('elapsed time is clamped to the question limit', async () => {
  const questions = [makeQuestion('q1', 0, 'Easy')];
  const { io } = createScriptedIo([
    { choice: 0, timedOut: false, elapsedMs: timeLimitMs + 9999 },
  ]);

  const { results } = await runQuiz({
    questions,
    timeLimitMs,
    io,
    now: () => 0,
  });

  assert.equal(results[0].elapsedMs, timeLimitMs);
  assert.equal(results[0].millisecondsLeft, 0);
  assert.equal(results[0].speedBonus, 0);
  assert.equal(results[0].points, 100);
});

test('the current score and streak are passed to the renderer', async () => {
  const questions = [
    makeQuestion('q1', 0, 'Easy'),
    makeQuestion('q2', 1, 'Easy'),
  ];
  const { io, rendered } = createScriptedIo([
    { choice: 0, timedOut: false, elapsedMs: 15000 },
    { choice: 1, timedOut: false, elapsedMs: 15000 },
  ]);

  await runQuiz({ questions, timeLimitMs, io, now: () => 0 });

  assert.equal(rendered[0].points, 0);
  assert.equal(rendered[0].streak, 0);
  assert.equal(rendered[1].points, 100);
  assert.equal(rendered[1].streak, 1);
});

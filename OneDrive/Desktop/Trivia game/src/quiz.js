import { scoreAnswer, summarize } from './utils.js';

/**
 * Play one quiz round.
 *
 * The engine owns the game flow (question order, scoring, streaks, feedback,
 * summary) while the injected `io` owns everything that touches the terminal.
 * That split keeps the flow easy to test with a scripted fake IO.
 *
 * @param {object} options
 * @param {Array<object>} options.questions  Questions with shuffled options.
 * @param {number} options.timeLimitMs       Time allowed per question.
 * @param {object} options.io                { renderQuestion, readAnswer, renderFeedback, renderSummary }
 * @param {() => number} [options.now]       Clock, injectable for tests.
 * @returns {Promise<{ results: Array<object>, summary: object }>}
 */
export async function runQuiz({
  questions,
  timeLimitMs,
  io,
  now = Date.now,
}) {
  const startedAt = now();
  const results = [];
  let streak = 0;
  let points = 0;

  for (const [index, question] of questions.entries()) {
    io.renderQuestion({
      question,
      index,
      total: questions.length,
      timeLimitMs,
      streak,
      points,
    });

    const answer = await io.readAnswer(question, timeLimitMs);

    const elapsedMs = Math.max(
      0,
      Math.min(timeLimitMs, Number(answer.elapsedMs) || 0),
    );
    const millisecondsLeft = Math.max(0, timeLimitMs - elapsedMs);
    const correct = !answer.timedOut && answer.choice === question.answer;
    const scoring = scoreAnswer({
      correct,
      millisecondsLeft,
      timeLimitMs,
      difficulty: question.difficulty,
    });

    points += scoring.points;
    streak = correct ? streak + 1 : 0;

    const result = {
      index,
      question,
      choice: answer.choice,
      timedOut: Boolean(answer.timedOut),
      elapsedMs,
      correct,
      points: scoring.points,
      base: scoring.base,
      speedBonus: scoring.speedBonus,
      millisecondsLeft,
    };
    results.push(result);

    io.renderFeedback(result, { streak, points });
  }

  const summary = summarize(results, {
    elapsedMs: Math.max(0, now() - startedAt),
  });
  io.renderSummary(summary);

  return { results, summary };
}

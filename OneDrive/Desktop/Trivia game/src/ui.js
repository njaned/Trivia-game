import {
  DIFFICULTY_POINTS,
  SPEED_BONUS_MAX,
  formatAccuracy,
  formatChoice,
  formatDuration,
  formatNumber,
  pluralize,
  wordWrap,
} from './utils.js';

const WIDTH = 62;
const RULE = '-'.repeat(WIDTH);
const DOUBLE_RULE = '='.repeat(WIDTH);

/**
 * Console presentation layer. Every method writes to `output` and nothing
 * else, so the UI can be swapped for a fake in tests.
 */
export function createConsoleUI({ theme, output = process.stdout } = {}) {
  const write = (text = '') => output.write(`${text}\n`);

  const center = (text) =>
    `${' '.repeat(Math.max(0, Math.floor((WIDTH - text.length) / 2)))}${text}`;

  const twoColumns = (left, right, width = WIDTH) =>
    `${left}${' '.repeat(Math.max(2, width - left.length - right.length))}${right}`;

  function wrapped(text, indent = '', width = WIDTH) {
    return wordWrap(text, Math.max(20, width - indent.length)).map(
      (line) => `${indent}${line}`,
    );
  }

  function renderBanner({ questionCount, categoryCount }) {
    write(DOUBLE_RULE);
    write(theme.cyan(theme.bold(center('TRIVIA CHALLENGE'))));
    write(
      theme.dim(
        center(
          `${pluralize(questionCount, 'question')} | ${pluralize(categoryCount, 'category', 'categories')} | beat the clock`,
        ),
      ),
    );
    write(DOUBLE_RULE);
  }

  function renderMenu({ questionCount, timeLimitSeconds }) {
    write('');
    write(theme.bold(theme.cyan('MAIN MENU')));
    write(`  1. Quick play (${pluralize(questionCount, 'mixed question')}, ${timeLimitSeconds}s each)`);
    write('  2. Play by category');
    write('  3. Leaderboard');
    write('  4. How to play');
    write('  5. Quit');
    write('');
  }

  function renderCategoryMenu(counts, total) {
    const entries = [['All categories', total], ...Object.entries(counts)];
    write('');
    write(theme.bold(theme.cyan('CHOOSE A CATEGORY')));
    entries.forEach(([name, count], index) => {
      write(`  ${index + 1}. ${name} (${pluralize(count, 'question')})`);
    });
    write('');
    return entries.map(([name]) => name);
  }

  function renderQuestion({ question, index, total, streak, points }) {
    write('');
    write(RULE);
    const left = `Question ${index + 1}/${total}  |  ${question.category}  |  ${question.difficulty}`;
    write(theme.cyan(twoColumns(left, `${formatNumber(points)} pts`)));
    write(RULE);
    for (const line of wrapped(question.question, '  ')) {
      write(theme.bold(line));
    }
    write('');
    question.options.forEach((option, optionIndex) => {
      const prefix = `  ${optionIndex + 1}) `;
      const [first, ...rest] = wordWrap(option, WIDTH - prefix.length);
      write(`${prefix}${first}`);
      rest.forEach((line) => write(`${' '.repeat(prefix.length)}${line}`));
    });
    if (streak >= 3) {
      write(theme.yellow(`\n  Streak: ${streak} correct in a row`));
    }
    write('');
  }

  function renderFeedback(result, { streak }) {
    const { question, timedOut, correct } = result;
    const correctLabel = formatChoice(question, question.answer);

    if (timedOut) {
      write(
        `  ${theme.red(theme.bold("TIME'S UP"))}  Correct answer: ${theme.green(correctLabel)}.`,
      );
    } else if (correct) {
      const breakdown =
        result.speedBonus > 0
          ? ` (${result.base} base + ${result.speedBonus} speed)`
          : ` (${result.base} base)`;
      write(
        `  ${theme.green(theme.bold('CORRECT'))}  +${result.points} pts${breakdown}`,
      );
    } else {
      const indent = ' '.repeat(2 + 'INCORRECT'.length + 2);
      const chosen = wordWrap(
        `You chose ${formatChoice(question, result.choice)}.`,
        WIDTH - indent.length,
      );
      write(`  ${theme.red(theme.bold('INCORRECT'))}  ${chosen[0]}`);
      chosen.slice(1).forEach((line) => write(`${indent}${line}`));

      const answer = wordWrap(
        `Correct answer: ${correctLabel}.`,
        WIDTH - indent.length,
      );
      answer.forEach((line) => write(theme.green(`${indent}${line}`)));
    }

    for (const line of wrapped(question.explanation, '  ')) {
      write(theme.dim(line));
    }
    if (correct && streak >= 3) {
      write(theme.yellow(`  Streak: ${streak} correct in a row!`));
    }
    write('');
  }

  function renderSummary(summary, { playerName = 'Player' } = {}) {
    write('');
    write(DOUBLE_RULE);
    write(theme.cyan(theme.bold(center('QUIZ COMPLETE'))));
    write(DOUBLE_RULE);
    write(`  Player: ${playerName}`);
    write(
      `  ${twoColumns(
        `Score: ${summary.correct}/${summary.total} (${formatAccuracy(summary.accuracy)})`,
        `Points: ${formatNumber(summary.points)}`,
        WIDTH - 2,
      )}`,
    );
    write(
      `  ${twoColumns(
        `Total time: ${formatDuration(summary.elapsedMs)}`,
        `Average: ${formatDuration(summary.averageMs)}`,
        WIDTH - 2,
      )}`,
    );
    write(
      `  ${twoColumns(
        `Best streak: ${summary.bestStreak}`,
        `Timed out: ${summary.timeouts}`,
        WIDTH - 2,
      )}`,
    );
    write('');

    if (summary.total > 0 && summary.correct === summary.total) {
      write(theme.green('  Perfect round! Every answer was correct.'));
      write('');
    }

    write(theme.bold('  By category'));
    for (const entry of summary.categories) {
      write(`    ${entry.category.padEnd(22)} ${entry.correct}/${entry.total}`);
    }

    if (summary.missed.length > 0) {
      write('');
      write(theme.bold('  Questions to review'));
      summary.missed.forEach((result, position) => {
        const { question } = result;
        const lines = wordWrap(question.question, WIDTH - 8);
        write(`    ${result.index + 1}. ${lines[0]}`);
        lines.slice(1).forEach((line) => write(`       ${line}`));

        const yours = result.timedOut
          ? 'no answer (timed out)'
          : formatChoice(question, result.choice);
        wordWrap(`Your answer: ${yours}`, WIDTH - 7).forEach((line) =>
          write(theme.dim(`       ${line}`)),
        );
        wordWrap(
          `Correct: ${formatChoice(question, question.answer)}`,
          WIDTH - 7,
        ).forEach((line) => write(theme.dim(`       ${line}`)));

        if (position < summary.missed.length - 1) write('');
      });
    }
    write('');
  }

  function renderLeaderboard(scores) {
    write('');
    write(theme.cyan(theme.bold('LEADERBOARD')));
    write(RULE);
    if (scores.length === 0) {
      write('  No scores yet. Play a round to set the first record.');
      write('');
      return;
    }
    write(theme.bold('  Rank  Player                Points   Score'));
    scores.forEach((entry, index) => {
      const name = String(entry.name).slice(0, 18).padEnd(18);
      write(
        `  ${String(index + 1).padEnd(4)}  ${name}  ${formatNumber(entry.points).padStart(7)}   ${entry.correct}/${entry.total}`,
      );
    });
    write('');
  }

  function renderHelp({ questionCount, timeLimitSeconds }) {
    write('');
    write(theme.cyan(theme.bold('HOW TO PLAY')));
    write(RULE);
    const notes = [
      `Quick play deals ${pluralize(questionCount, 'mixed question')}. Category rounds use every question in the chosen category.`,
      `You get ${timeLimitSeconds} seconds per question. The clock starts when the question appears.`,
      'Answer with the option number (1-4) or its letter (A-D), then press Enter.',
      `Correct answers score ${DIFFICULTY_POINTS.Easy} points on Easy, ${DIFFICULTY_POINTS.Medium} on Medium, and ${DIFFICULTY_POINTS.Hard} on Hard.`,
      `A speed bonus of up to ${SPEED_BONUS_MAX} points is added for fast correct answers.`,
      'Wrong answers and timeouts score zero and reset your streak.',
      'Your five best rounds are saved locally in data/scores.json.',
      'Press Ctrl+C at any time to quit.',
    ];
    notes.forEach((note) => {
      const prefix = '  - ';
      const lines = wordWrap(note, WIDTH - prefix.length);
      write(`${prefix}${lines[0]}`);
      lines
        .slice(1)
        .forEach((line) => write(`${' '.repeat(prefix.length)}${line}`));
    });
    write('');
  }

  function message(text = '') {
    write(text);
  }

  return {
    renderBanner,
    renderMenu,
    renderCategoryMenu,
    renderQuestion,
    renderFeedback,
    renderSummary,
    renderLeaderboard,
    renderHelp,
    message,
  };
}

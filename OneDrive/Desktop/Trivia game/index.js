#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, QUESTION_BANK, countByCategory } from './src/questions.js';
import { createConsoleInput } from './src/input.js';
import { createConsoleUI } from './src/ui.js';
import { createTheme } from './src/theme.js';
import { runQuiz } from './src/quiz.js';
import { selectQuestions, parseChoice, pluralize } from './src/utils.js';
import {
  addScore,
  loadScores,
  qualifies,
  saveScores,
} from './src/leaderboard.js';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCORES_PATH = process.env.TRIVIA_SCORES_PATH
  ? path.resolve(process.env.TRIVIA_SCORES_PATH)
  : path.join(PROJECT_ROOT, 'data', 'scores.json');

const DEFAULT_QUESTIONS = 10;
const DEFAULT_TIME_LIMIT_SECONDS = 15;
const MIN_TIME_LIMIT_SECONDS = 5;
const MAX_TIME_LIMIT_SECONDS = 120;

const USAGE = `
TRIVIA CLI
A timed, multiple-choice quiz for your terminal.

Usage:
  node index.js [options]
  npm start

Options:
  -q, --questions <n>   Questions per quick-play round (1-${QUESTION_BANK.length}, default ${DEFAULT_QUESTIONS})
  -t, --time <seconds>  Seconds allowed per question (${MIN_TIME_LIMIT_SECONDS}-${MAX_TIME_LIMIT_SECONDS}, default ${DEFAULT_TIME_LIMIT_SECONDS})
  -h, --help            Show this help and exit

Examples:
  npm start
  node index.js --questions 5 --time 10
`;

function parseWholeNumber(value, name, min, max) {
  if (!/^\d+$/.test(String(value))) {
    throw new Error(`--${name} must be a whole number.`);
  }
  const number = Number(value);
  if (number < min || number > max) {
    throw new Error(`--${name} must be between ${min} and ${max}.`);
  }
  return number;
}

function parseOptions(argv) {
  const options = {
    help: false,
    questions: DEFAULT_QUESTIONS,
    timeLimitSeconds: DEFAULT_TIME_LIMIT_SECONDS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '-h' || argument === '--help') {
      options.help = true;
    } else if (argument === '-q' || argument === '--questions') {
      if (argv[index + 1] === undefined) {
        throw new Error('Missing value for --questions.');
      }
      options.questions = parseWholeNumber(
        argv[index + 1],
        'questions',
        1,
        QUESTION_BANK.length,
      );
      index += 1;
    } else if (argument === '-t' || argument === '--time') {
      if (argv[index + 1] === undefined) {
        throw new Error('Missing value for --time.');
      }
      options.timeLimitSeconds = parseWholeNumber(
        argv[index + 1],
        'time',
        MIN_TIME_LIMIT_SECONDS,
        MAX_TIME_LIMIT_SECONDS,
      );
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return options;
}

function isClosedInputError(error) {
  const message = String(error?.message ?? '');
  return (
    error?.code === 'ERR_USE_AFTER_CLOSE' ||
    /readline was closed|input stream.*closed/i.test(message)
  );
}

/** Ask for a menu number, repeating the prompt until the answer is valid. */
async function readMenuChoice(input, ui, theme, max, label = 'Choose an option') {
  for (;;) {
    const raw = await input.askLine(theme.cyan(`${label} (1-${max}): `));
    const choice = parseChoice(raw, max);
    if (choice !== null) return choice + 1;
    ui.message(theme.yellow(`  Please enter a number from 1 to ${max}.`));
  }
}

async function askPlayerName(input, theme) {
  const answer = await input.askLine(
    theme.cyan('Your name (Enter for "Player"): '),
  );
  return answer.trim().slice(0, 20) || 'Player';
}

async function recordScore({ summary, playerName, ui, theme, scoresPath }) {
  if (summary.points <= 0) return;

  try {
    const scores = await loadScores(scoresPath);
    if (!qualifies(scores, summary.points)) return;

    await saveScores(
      scoresPath,
      addScore(scores, {
        name: playerName,
        points: summary.points,
        correct: summary.correct,
        total: summary.total,
        date: new Date().toISOString(),
      }),
    );
    ui.message(theme.green('  High score saved to the leaderboard!'));
  } catch (error) {
    ui.message(theme.yellow(`  Could not save your score: ${error.message}`));
  }
}

/** Play rounds for one category until the player declines a rematch. */
async function playSession({
  category,
  options,
  playerName,
  input,
  ui,
  theme,
  scoresPath,
}) {
  for (;;) {
    const questions = selectQuestions(QUESTION_BANK, {
      count: options.questions,
      category,
    });

    if (questions.length === 0) {
      ui.message(theme.yellow(`No questions found for "${category}".`));
      return;
    }

    if (questions.length < options.questions) {
      ui.message(
        theme.dim(
          `Using all ${pluralize(questions.length, 'available question')} in this category.`,
        ),
      );
    }

    ui.message(
      theme.dim(
        `\nRound: ${category} | ${pluralize(questions.length, 'question')} | ${options.timeLimitSeconds}s per question`,
      ),
    );

    const io = {
      renderQuestion: ui.renderQuestion,
      readAnswer: (question, timeLimitMs) =>
        input.readAnswer(question, timeLimitMs),
      renderFeedback: ui.renderFeedback,
      renderSummary: (summary) => ui.renderSummary(summary, { playerName }),
    };

    const { summary } = await runQuiz({
      questions,
      timeLimitMs: options.timeLimitSeconds * 1000,
      io,
    });

    await recordScore({ summary, playerName, ui, theme, scoresPath });

    const again = await input.askLine(theme.cyan('Play again? (y/N): '));
    if (!/^y(es)?$/i.test(again.trim())) return;
  }
}

async function main() {
  let options;
  try {
    options = parseOptions(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${USAGE}`);
    return 1;
  }

  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  const theme = createTheme();
  const ui = createConsoleUI({ theme });
  const input = createConsoleInput({ theme });

  input.onInterrupt(() => {
    process.stdout.write('\n');
    process.stdout.write(`${theme.yellow('Thanks for playing. Goodbye!')}\n`);
    process.exit(0);
  });

  ui.renderBanner({
    questionCount: QUESTION_BANK.length,
    categoryCount: CATEGORIES.length,
  });

  let playerName = null;
  let running = true;

  try {
    while (running) {
      ui.renderMenu({
        questionCount: options.questions,
        timeLimitSeconds: options.timeLimitSeconds,
      });

      const choice = await readMenuChoice(input, ui, theme, 5);

      switch (choice) {
        case 1: {
          playerName ??= await askPlayerName(input, theme);
          await playSession({
            category: 'All',
            options,
            playerName,
            input,
            ui,
            theme,
            scoresPath: SCORES_PATH,
          });
          break;
        }
        case 2: {
          const categories = ui.renderCategoryMenu(
            countByCategory(),
            QUESTION_BANK.length,
          );
          const categoryIndex = await readMenuChoice(
            input,
            ui,
            theme,
            categories.length,
            'Choose a category',
          );
          playerName ??= await askPlayerName(input, theme);
          await playSession({
            category: categories[categoryIndex - 1],
            options,
            playerName,
            input,
            ui,
            theme,
            scoresPath: SCORES_PATH,
          });
          break;
        }
        case 3:
          ui.renderLeaderboard(await loadScores(SCORES_PATH));
          break;
        case 4:
          ui.renderHelp({
            questionCount: options.questions,
            timeLimitSeconds: options.timeLimitSeconds,
          });
          break;
        default:
          running = false;
          break;
      }
    }
  } catch (error) {
    if (!isClosedInputError(error)) throw error;
    // Input ended (for example, piped answers ran out); exit quietly.
    ui.message('');
  } finally {
    input.close();
  }

  ui.message(theme.green('Thanks for playing. Goodbye!'));
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stderr.write(`\nUnexpected error: ${error.message}\n`);
    process.exitCode = 1;
  });

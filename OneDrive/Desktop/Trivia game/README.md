# Trivia CLI

A timed, multiple-choice trivia game that runs entirely in the terminal. Built with
Node.js for the **Summative Lab: Trivia CLI**, this project turns a plain command
line into a small quiz application: pick a category, race the clock, see instant
feedback with explanations, and track your best rounds on a local leaderboard.

```
==============================================================
                       TRIVIA CHALLENGE
         43 questions | 7 categories | beat the clock
==============================================================
```

## Highlights

- **43 questions** across 7 categories and 3 difficulty levels, each with an explanation.
- **Timed rounds** with a live per-question countdown and automatic timeout handling.
- **Two ways to play:** 10-question quick play or a full category round.
- **Instant feedback** after every answer, plus a final report with a category
  breakdown and a review of the questions you missed.
- **Scoring with a speed bonus** and streak tracking.
- **Local leaderboard** that keeps the five best rounds in `data/scores.json`.
- **Zero dependencies** — only Node.js built-in modules.
- **42 automated tests** covering the engine, input/timers, scoring, question data,
  and full CLI sessions.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (developed and tested on Node 26).
- A terminal. Windows Terminal, PowerShell, VS Code's integrated terminal, macOS
  Terminal, and Linux terminals all work.

## Getting started

```bash
git clone https://github.com/<your-username>/trivia-cli.git
cd trivia-cli
npm start
```

There is nothing to install: the project has no third-party dependencies.

### Command-line options

```bash
npm start                                  # 10 mixed questions, 15s each
node index.js --questions 5 --time 10      # shorter, faster round
node index.js --help                       # usage summary
```

| Option | Description | Default |
| --- | --- | --- |
| `-q`, `--questions <n>` | Questions per quick-play round (1–43) | `10` |
| `-t`, `--time <seconds>` | Seconds allowed per question (5–120) | `15` |
| `-h`, `--help` | Print usage and exit | — |

### Running the tests

```bash
npm test
```

## How to play

1. Choose **Quick play** for a mixed round, or **Play by category** and pick a topic.
2. Enter a display name (or press Enter to play as `Player`).
3. Type the number of your answer (`1`–`4`) or its letter (`A`–`D`), then press Enter.
4. Answer before the countdown reaches zero. Timeouts count as wrong answers.
5. After the final question, review your score, category breakdown, and any
   questions you missed. You can replay immediately or return to the menu.

### Scoring

| Result | Points |
| --- | --- |
| Correct on Easy | 100 base |
| Correct on Medium | 150 base |
| Correct on Hard | 200 base |
| Speed bonus | up to 50, scaled by time remaining |
| Wrong answer or timeout | 0 |

A correct answer with most of the clock left is worth up to **250 points** on a
Hard question. Correct answers build a streak; wrong answers and timeouts reset it.
The five highest-scoring rounds are saved to `data/scores.json` and shown on the
leaderboard. Delete that file to reset the board.

## Example session

Abridged from a real round (`node index.js --questions 5 --time 20`):

```text
--------------------------------------------------------------
Question 1/5  |  Technology  |  Easy                     0 pts
--------------------------------------------------------------
  What does HTML stand for?

  1) Hyperlink and Text Management Language
  2) Home Tool Markup Language
  3) HyperText Markup Language
  4) High-Level Text Machine Language

[20s] Your answer (1-4): 3
  CORRECT  +148 pts (100 base + 48 speed)
  HTML stands for HyperText Markup Language. It describes the
  structure of web pages.

...

==============================================================
                        QUIZ COMPLETE
==============================================================
  Player: Demo Player
  Score: 5/5 (100%)                                Points: 840
  Total time: 4.6s                               Average: 0.9s
  Best streak: 5                                  Timed out: 0

  Perfect round! Every answer was correct.

  By category
    Geography              1/1
    History                1/1
    Music                  1/1
    Technology             2/2

  High score saved to the leaderboard!
Play again? (y/N): n
```

When a question is missed, the final report includes the correct answer and what
the player chose. For example:

```text
  Questions to review
    2. What is the capital of Australia?
       Your answer: no answer (timed out)
       Correct: 4) Canberra
```

## Project structure

```text
trivia-cli/
├── index.js              # entry point: arguments, menus, rounds, leaderboard I/O
├── package.json
├── src/
│   ├── questions.js      # question bank + category helpers
│   ├── quiz.js           # round engine: order, scoring, streaks, summary
│   ├── input.js          # readline prompts, countdown timer, timeout handling
│   ├── ui.js             # all console rendering
│   ├── utils.js          # pure helpers: shuffle, parse, score, summarize, format
│   ├── leaderboard.js    # load/save/rank the top five scores
│   └── theme.js          # ANSI colour palette (respects NO_COLOR)
├── test/
│   ├── utils.test.js
│   ├── questions.test.js
│   ├── quiz.test.js
│   ├── input.test.js
│   ├── leaderboard.test.js
│   └── cli.test.js
└── data/
    └── scores.json       # created automatically after a high score
```

## Design and implementation notes

### Separation of concerns

The quiz engine (`src/quiz.js`) owns the game flow but knows nothing about the
terminal: it receives `renderQuestion`, `readAnswer`, `renderFeedback`, and
`renderSummary` through an injected `io` object. The console implementation lives
in `src/ui.js` and `src/input.js`. This makes the engine testable with a scripted
fake, and it means a future web or GUI front end could reuse the same logic.

Pure helpers in `src/utils.js` (shuffling, parsing, scoring, summarizing) have no
side effects and are covered directly by unit tests.

### Timing

Each question gets a deadline. `src/input.js` creates an `AbortController` and a
`setTimeout` that aborts the pending readline question when time runs out. The
countdown is drawn by updating the readline prompt once per second only when the
player's input line is empty, so a half-typed answer is never erased. On timeout,
any partially typed text is discarded before the next question.

Interactive terminals use readline's line editor. When input is piped (tests,
CI, demos), a small queue is used instead, because readline can drop buffered
lines while no question is pending.

### Answer integrity

Every question stores `answer` as an index into `options`. At the start of a round
the options are shuffled and the index is remapped by tracking each option's
original position. A unit test verifies across 30 seeds that the shuffled index
still points at the same answer text.

### Reliability

- Missing, unreadable, or corrupt `scores.json` files are treated as an empty
  leaderboard rather than crashing.
- Running out of piped input exits cleanly instead of hanging.
- Ctrl+C exits gracefully at any prompt.
- Invalid input re-prompts without stopping the clock.
- `NO_COLOR` disables ANSI colours, and colours are automatically off when
  output is redirected.

## Lab write-up

### Task 1: Define the problem

The task is a command-line trivia game for an online quiz application. The player
must be able to start a quiz, see one question at a time, answer it, get feedback,
race a timer, and receive a result at the end. The program needs loops, functions,
arrays and array iteration methods, asynchronous timers, and a friendly CLI.

**User stories**

- As a player, I want to start a quiz from a clear menu so I know how to begin.
- As a player, I want to see one question at a time with numbered choices so I can
  answer without guessing the format.
- As a player, I want feedback after each answer, including the correct answer and
  a short explanation, so I can learn while playing.
- As a player, I want a visible time limit so I can manage my pace.
- As a player, I want a final score, accuracy, time, and a review of my mistakes.
- As a player, I want to replay or switch categories without restarting the program.
- As a returning player, I want my best scores remembered on my machine.

**Scope**

In scope: single-player local play, multiple-choice questions, per-question timer,
scoring, leaderboard, replay. Out of scope: online accounts, multiplayer,
network sync, question editing inside the app.

### Task 2: Determine the design

**Data model.** A question is a plain object:

```js
{
  id: 'geo-01',
  category: 'Geography',
  difficulty: 'Easy',
  question: 'Which is the largest ocean on Earth?',
  options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
  answer: 2, // index into options
  explanation: 'The Pacific Ocean is the largest and deepest...'
}
```

**Game flow.**

```text
menu
  └─ start round (category + question count)
       └─ build deck: filter → shuffle → slice → shuffle each question's options
            └─ for each question:
                 render question
                 wait for answer or timeout
                 evaluate + score + streak
                 render feedback + explanation
            └─ summarize: totals, accuracy, time, categories, missed questions
            └─ save score if it makes the top five
            └─ play again? → new deck, or back to the menu
```

**Module plan.** `index.js` handles the menu and session; `quiz.js` runs a round;
`input.js` owns interactive input and timers; `ui.js` owns presentation;
`utils.js` holds pure functions; `questions.js` is the data; `leaderboard.js`
handles persistence; `theme.js` centralizes colours.

**Timing design.** A per-question deadline is calculated from the time limit. An
`AbortController` cancels the pending prompt at the deadline, and a `setInterval`
updates the visible countdown. The total round time is measured around the whole
loop so feedback reading time is reflected in the report.

**Scoring design.** Base points are tied to difficulty so harder questions matter
more. A speed bonus rewards quick answers without letting speed dominate: at most
50 points, or one third of an Easy question's base value.

**Interface design.** The layout is fixed-width (62 columns) with simple ASCII
rules, numbered answers, and a compact prompt. Colour is used only for status
(correct, incorrect, time, headings) and can be disabled.

### Task 3: Develop the code

The project uses ES modules and only Node built-ins: `node:readline/promises` for
input, `node:fs/promises` for the leaderboard, and `node:process` for streams.
`readline.Interface.question()` accepts an `AbortSignal`, which makes the timeout
implementation straightforward.

Key pieces:

- **Round loop** (`src/quiz.js`): a `for...of` over `questions.entries()` keeps the
  order sequential. Each answer is evaluated, scored, and pushed into `results`;
  the loop then renders feedback before moving on.
- **Scoring** (`src/utils.js`): `scoreAnswer` returns `{ points, base, speedBonus }`
  so the UI can explain where the points came from.
- **Summaries** (`src/utils.js`): `summarize` uses `filter` for correct answers and
  misses, `reduce` for points, time, streaks, and category totals, and `sort` for a
  stable category listing.
- **Deck building** (`src/utils.js`): `selectQuestions` filters by category,
  shuffles, slices to the requested count, and maps each question through
  `shuffleOptions`.
- **Menu loop** (`index.js`): a `while` loop keeps the app running across rounds
  until the player quits; Ctrl+C and end-of-input are handled gracefully.

### Task 4: Test and refine

Automated tests use Node's built-in test runner (`node --test`) and `node:assert/strict`:

- `utils.test.js` — shuffling, answer remapping across 30 seeds, category filtering,
  input parsing, scoring boundaries, summary math, formatting.
- `questions.test.js` — every question has a unique id, four distinct options, an
  in-range answer, a valid category/difficulty, and a useful explanation.
- `quiz.test.js` — perfect rounds, wrong answers, timeouts, streak breaks, elapsed
  time clamping, renderer payloads, sequential order.
- `input.test.js` — piped lines, numeric/letter answers, invalid-input retries,
  timeouts, no input bleed after a timeout, closed-stream rejection.
- `leaderboard.test.js` — sorting, capping at five, tie-breaking, normalization,
  disk round-trips, missing and corrupt files.
- `cli.test.js` — help, argument errors, a complete round, category rounds,
  replay, short categories, empty leaderboard, and end-of-input behavior.

All 42 tests pass (`npm test`).

**Manual verification** in a real pseudo-terminal confirmed: the countdown redraws
each second, typing is preserved during countdown updates, a timeout shows the
correct answer and is recorded in the summary, replay starts a fresh deck, Ctrl+C
exits cleanly, and the leaderboard renders saved scores.

**Issues found and fixed during testing**

1. Piping a full script of answers caused readline to drop buffered lines between
   questions and left the process hanging. Fixed with a queue-based input path for
   non-interactive streams plus close-event handling.
2. The first version ended silently when piped input ran out. The CLI now treats
   end-of-input as a clean exit.
3. Redrawing the prompt while the player was typing could erase their input.
   Countdown updates now run only when the input line is empty.
4. A timeout could leave partial text in the buffer for the next question. The
   buffer is cleared on timeout, with a regression test.
5. `formatDuration` displayed `60.0s` for values just under a minute. The rounding
   boundary is now handled.
6. Help text repeated the bullet marker on wrapped lines. It now uses a hanging
   indent.
7. A test initially asserted the wrong truncated name length; the test was corrected
   to check the intended behavior rather than the implementation accident.

**Known limitations**

- The question bank is static; adding questions is a code change.
- A round interrupted with Ctrl+C is not saved.
- The countdown refreshes at 500 ms, so the displayed second can lag by up to half a
  second; scoring uses the precise deadline, not the display.

### Task 5: Document and maintain

This README documents setup, controls, scoring, architecture, testing, and the lab
tasks. Source files include JSDoc comments for public functions and explain
non-obvious decisions (prompt redraw rules, piped-input queue, answer remapping).
Tests act as living documentation of expected behavior.

Maintenance notes:

- **Add questions** by appending objects to `QUESTION_BANK` in `src/questions.js`.
  The category menu and counts update automatically. Run `npm test` afterward.
- **Change scoring** in `src/utils.js` (`DIFFICULTY_POINTS`, `SPEED_BONUS_MAX`);
  the help screen reads the same constants.
- **Adjust the timer** from the menu? Not available; use `--time`.
- **Reset the leaderboard** by deleting `data/scores.json`.
- **Point tests at a temporary board** with `TRIVIA_SCORES_PATH=/path/to/scores.json`.
- **Change the look** in `src/ui.js` (layout width, labels) and `src/theme.js`
  (colours). Keep output free of colour when `NO_COLOR` is set.

## Rubric checklist

| Criterion | How this project satisfies it |
| --- | --- |
| **Quiz display and user input (25)** | Fixed-width question layout, numbered and lettered choices, validated prompts, countdown badge, menu and category screens. Piped and interactive input paths are both tested. |
| **Answer accuracy (25)** | Questions store an explicit answer index; options are shuffled with the index remapped and verified by tests. Only matching answers score; summaries and reviews use the same data. |
| **Code syntax (25)** | ES modules, `const`/`let`, strict equality, early returns, small focused functions, JSDoc, handled promise rejections, no unused globals. `node --check` and 42 tests pass. |
| **Functions and array iteration (15)** | Functions for deck building, scoring, summarization, rendering, persistence. Uses `map`, `filter`, `reduce`, `forEach`, `sort`, `findIndex`, `find`, plus `for...of` and `while` loops. |
| **JavaScript best practices (10)** | Layered modules, pure utilities, dependency injection for testability, comprehensive tests, README, `.editorconfig`, `.gitignore`, graceful error handling. |

## Troubleshooting

- **Colours look garbled:** use Windows Terminal or VS Code's terminal, or run with
  `NO_COLOR=1`. Redirected output disables colour automatically.
- **The timer is not visible:** piped output cannot redraw a live countdown; the
  prompt shows the starting limit and the round still enforces it.
- **Leaderboard will not save:** the game writes to `data/scores.json` next to
  `index.js`; make sure that folder is writable.

## Future improvements

- A settings screen for question count and time limit inside the app.
- True/false and multi-select question types.
- Per-category statistics across sessions.
- More questions and a JSON question loader.
- Optional sound or a persistent player profile.

## License

MIT

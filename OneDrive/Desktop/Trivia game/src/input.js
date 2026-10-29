import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { parseChoice } from './utils.js';

function closedError() {
  const error = new Error('Input stream closed');
  error.code = 'ERR_USE_AFTER_CLOSE';
  return error;
}

/**
 * Console input with a per-question countdown.
 *
 * Interactive terminals use readline's line editor and redraw the prompt once
 * per second to show the time remaining (skipped while the player is typing).
 * Piped input uses a queue instead, because readline drops buffered lines when
 * no question is pending, which breaks scripted sessions.
 */
export function createConsoleInput({
  input = stdin,
  output = stdout,
  theme,
} = {}) {
  const interactive = Boolean(input.isTTY && output.isTTY);
  const rl = createInterface({ input, output, terminal: interactive });

  const queuedLines = [];
  const waiting = [];
  let closed = false;
  let rejectOnClose = null;
  const closeSignal = new Promise((_, reject) => {
    rejectOnClose = reject;
  });
  closeSignal.catch(() => {});

  rl.on('close', () => {
    closed = true;
    rejectOnClose?.(closedError());
    while (waiting.length > 0) {
      waiting.shift().reject(closedError());
    }
  });

  if (!interactive) {
    rl.on('line', (line) => {
      const next = waiting.shift();
      if (next) next.resolve(line);
      else queuedLines.push(line);
    });
  }

  function readQueuedLine() {
    if (queuedLines.length > 0) return Promise.resolve(queuedLines.shift());
    if (closed) return Promise.reject(closedError());
    return new Promise((resolve, reject) => {
      waiting.push({ resolve, reject });
    });
  }

  /** Ask readline a question, but reject if the stream closes first. */
  function questionInteractive(promptText, options) {
    if (closed) return Promise.reject(closedError());
    const pending = rl.question(promptText, options);
    pending.catch(() => {});
    return Promise.race([pending, closeSignal]);
  }

  async function askLine(promptText) {
    if (interactive) return questionInteractive(promptText);

    if (closed && queuedLines.length === 0) throw closedError();
    output.write(promptText);
    const line = await readQueuedLine();
    output.write(`${line}\n`);
    return line;
  }

  function buildPrompt(label, deadline) {
    const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const badge = theme.yellow(`[${String(secondsLeft).padStart(2, ' ')}s]`);
    return `${badge} ${label} `;
  }

  /** Interactive: wait for a line while readline owns the prompt. */
  async function askOnceInteractive(label, deadline) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.max(0, deadline - Date.now()),
    );

    const countdown = setInterval(() => {
      if (rl.line.length === 0) {
        rl.setPrompt(buildPrompt(label, deadline));
        rl.prompt(true);
      }
    }, 500);

    try {
      const text = await questionInteractive(buildPrompt(label, deadline), {
        signal: controller.signal,
      });
      return { text, timedOut: false };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { text: '', timedOut: true };
      }
      throw error;
    } finally {
      clearTimeout(timer);
      clearInterval(countdown);
    }
  }

  /** Piped: wait for a queued line, but never past the deadline. */
  async function askOnceQueued(label, deadline) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { text: '', timedOut: true };

    output.write(buildPrompt(label, deadline));

    let waiter = null;
    const linePromise = new Promise((resolve, reject) => {
      if (queuedLines.length > 0) {
        resolve(queuedLines.shift());
        return;
      }
      if (closed) {
        reject(closedError());
        return;
      }
      waiter = { resolve, reject };
      waiting.push(waiter);
    });

    let timer = null;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), remaining);
    });

    try {
      const text = await Promise.race([linePromise, timeout]);
      if (text === null) {
        if (waiter) {
          const index = waiting.indexOf(waiter);
          if (index !== -1) waiting.splice(index, 1);
        }
        return { text: '', timedOut: true };
      }
      output.write(`${text}\n`);
      return { text, timedOut: false };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Read a valid choice for a question before its deadline. Invalid or empty
   * input re-prompts without pausing the clock.
   */
  async function readAnswer(question, timeLimitMs) {
    const startedAt = Date.now();
    const deadline = startedAt + timeLimitMs;
    const optionCount = question.options.length;
    const lastLetter = String.fromCharCode(
      'a'.charCodeAt(0) + optionCount - 1,
    ).toUpperCase();
    const label = `Your answer (1-${optionCount}):`;
    let attempts = 0;

    while (Date.now() < deadline) {
      const { text, timedOut } = interactive
        ? await askOnceInteractive(label, deadline)
        : await askOnceQueued(label, deadline);

      if (timedOut) {
        if (interactive && rl.line.length > 0) {
          rl.write(null, { ctrl: true, name: 'u' });
        }
        output.write('\n');
        return {
          choice: null,
          timedOut: true,
          elapsedMs: timeLimitMs,
          attempts,
        };
      }

      if (text.trim() === '') {
        attempts += 1;
        output.write(
          theme.yellow(`Please type a number from 1 to ${optionCount}.\n`),
        );
        continue;
      }

      const choice = parseChoice(text, optionCount);
      if (choice !== null) {
        return {
          choice,
          timedOut: false,
          elapsedMs: Math.min(timeLimitMs, Date.now() - startedAt),
          attempts,
        };
      }

      attempts += 1;
      output.write(
        theme.yellow(
          `"${text.trim()}" is not a valid choice. Enter 1-${optionCount} or A-${lastLetter}.\n`,
        ),
      );
    }

    output.write('\n');
    return {
      choice: null,
      timedOut: true,
      elapsedMs: timeLimitMs,
      attempts,
    };
  }

  /** Register a Ctrl+C handler. */
  function onInterrupt(handler) {
    rl.on('SIGINT', handler);
  }

  function close() {
    if (!closed) rl.close();
  }

  return {
    askLine,
    readAnswer,
    onInterrupt,
    close,
    isInteractive: interactive,
  };
}

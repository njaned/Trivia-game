import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';

import { createConsoleInput } from '../src/input.js';
import { createTheme } from '../src/theme.js';

const theme = createTheme({ color: false });
const question = {
  question: 'Pick one',
  options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  answer: 1,
};

function createHarness() {
  const input = new PassThrough();
  const output = new PassThrough();
  let written = '';
  output.setEncoding('utf8');
  output.on('data', (chunk) => {
    written += chunk;
  });

  const io = createConsoleInput({ input, output, theme });
  return {
    input,
    io,
    getWritten: () => written,
  };
}

test('askLine returns piped lines in order', async () => {
  const { input, io } = createHarness();
  try {
    input.write('Alice\nsecond answer\n');
    assert.equal(await io.askLine('Name: '), 'Alice');
    assert.equal(await io.askLine('Again: '), 'second answer');
  } finally {
    io.close();
  }
});

test('readAnswer accepts numbers and letters', async () => {
  const { input, io } = createHarness();
  try {
    input.write('2\n');
    const byNumber = await io.readAnswer(question, 1000);
    assert.equal(byNumber.choice, 1);
    assert.equal(byNumber.timedOut, false);
    assert.equal(byNumber.attempts, 0);
    assert.ok(byNumber.elapsedMs < 1000);

    input.write('c\n');
    const byLetter = await io.readAnswer(question, 1000);
    assert.equal(byLetter.choice, 2);
    assert.equal(byLetter.timedOut, false);
  } finally {
    io.close();
  }
});

test('readAnswer re-prompts after invalid input and keeps the clock running', async () => {
  const { input, io, getWritten } = createHarness();
  try {
    input.write('9\nB\n');
    const result = await io.readAnswer(question, 1000);

    assert.equal(result.choice, 1);
    assert.equal(result.attempts, 1);
    assert.match(getWritten(), /not a valid choice/);
  } finally {
    io.close();
  }
});

test('readAnswer times out when no answer arrives', async () => {
  const { io } = createHarness();
  try {
    const result = await io.readAnswer(question, 60);

    assert.equal(result.choice, null);
    assert.equal(result.timedOut, true);
    assert.equal(result.elapsedMs, 60);
    assert.equal(result.attempts, 0);
  } finally {
    io.close();
  }
});

test('a timed-out prompt does not swallow the next line', async () => {
  const { input, io } = createHarness();
  try {
    const expired = await io.readAnswer(question, 40);
    assert.equal(expired.timedOut, true);

    input.write('3\n');
    const next = await io.readAnswer(question, 1000);

    assert.equal(next.timedOut, false);
    assert.equal(next.choice, 2);
  } finally {
    io.close();
  }
});

test('closed input rejects instead of hanging', async () => {
  const { io } = createHarness();
  io.close();

  await assert.rejects(io.askLine('Name: '), (error) => {
    assert.equal(error.code, 'ERR_USE_AFTER_CLOSE');
    return true;
  });
  await assert.rejects(io.readAnswer(question, 1000), (error) => {
    assert.equal(error.code, 'ERR_USE_AFTER_CLOSE');
    return true;
  });
});

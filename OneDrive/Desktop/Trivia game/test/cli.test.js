import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Run the CLI with piped answers and capture everything it prints.
 * A hard timeout keeps a broken build from hanging the test run.
 */
function runCli(args, inputText, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['index.js', ...args], {
      cwd: ROOT,
      env: { ...process.env, NO_COLOR: '1', ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI timed out.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 10000);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });

    child.stdin.end(inputText);
  });
}

test('the CLI prints help and exits successfully', async () => {
  const { code, stdout } = await runCli(['--help'], '');
  assert.equal(code, 0);
  assert.match(stdout, /TRIVIA CLI/);
  assert.match(stdout, /--questions/);
  assert.match(stdout, /--time/);
});

test('invalid arguments exit with a clear error', async () => {
  const { code, stderr } = await runCli(['--time', '1'], '');
  assert.equal(code, 1);
  assert.match(stderr, /--time must be between 5 and 120/);
});

test('a scripted round runs from menu to summary to goodbye', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout, stderr } = await runCli(
    ['--questions', '3', '--time', '10'],
    '1\nTester\n1\n1\n1\nn\n5\n',
    { TRIVIA_SCORES_PATH: path.join(dir, 'scores.json') },
  );

  assert.equal(code, 0, stderr);
  assert.match(stdout, /TRIVIA CHALLENGE/);
  assert.match(stdout, /Question 1\/3/);
  assert.match(stdout, /Question 3\/3/);
  assert.match(stdout, /QUIZ COMPLETE/);
  assert.match(stdout, /Player: Tester/);
  assert.match(stdout, /Score: \d\/3/);
  assert.match(stdout, /Play again\?/);
  assert.match(stdout, /Thanks for playing/);
});

test('a category round only shows that category', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout, stderr } = await runCli(
    ['--questions', '2', '--time', '10'],
    '2\n3\nSam\n1\n1\nn\n5\n',
    { TRIVIA_SCORES_PATH: path.join(dir, 'scores.json') },
  );

  assert.equal(code, 0, stderr);
  assert.match(stdout, /CHOOSE A CATEGORY/);
  assert.match(stdout, /Round: History/);
  assert.match(stdout, /Question 2\/2/);
  assert.match(stdout, /QUIZ COMPLETE/);
});

test('the leaderboard starts empty', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout } = await runCli([], '3\n5\n', {
    TRIVIA_SCORES_PATH: path.join(dir, 'scores.json'),
  });

  assert.equal(code, 0);
  assert.match(stdout, /LEADERBOARD/);
  assert.match(stdout, /No scores yet/);
});

test('replaying starts a fresh round', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout, stderr } = await runCli(
    ['--questions', '1', '--time', '10'],
    '1\nAlex\n1\ny\n1\nn\n5\n',
    { TRIVIA_SCORES_PATH: path.join(dir, 'scores.json') },
  );

  assert.equal(code, 0, stderr);
  const rounds = stdout.match(/QUIZ COMPLETE/g) ?? [];
  assert.equal(rounds.length, 2, 'two rounds should be played');
  assert.match(stdout, /Thanks for playing/);
});

test('a category with fewer questions than requested uses them all', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout } = await runCli(
    ['--questions', '5', '--time', '10'],
    '2\n8\nSam\n1\n1\n1\nn\n5\n',
    { TRIVIA_SCORES_PATH: path.join(dir, 'scores.json') },
  );

  assert.equal(code, 0);
  assert.match(stdout, /Using all 3 available questions/);
  assert.match(stdout, /Question 3\/3/);
});

test('running out of input exits cleanly instead of hanging', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trivia-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const { code, stdout, stderr } = await runCli(
    ['--questions', '2', '--time', '10'],
    '1\nAlex\n',
    { TRIVIA_SCORES_PATH: path.join(dir, 'scores.json') },
  );

  assert.equal(code, 0, stderr);
  assert.match(stdout, /Round: All/);
  assert.match(stdout, /Thanks for playing/);
});

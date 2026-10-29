import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORIES,
  DIFFICULTIES,
  QUESTION_BANK,
  countByCategory,
} from '../src/questions.js';
import { DIFFICULTY_POINTS } from '../src/utils.js';

test('the question bank has enough material for varied rounds', () => {
  assert.ok(QUESTION_BANK.length >= 20, 'at least 20 questions');
  assert.ok(CATEGORIES.length >= 5, 'at least five categories');
});

test('every question has a unique id', () => {
  const ids = QUESTION_BANK.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
});

test('every question is well formed and scorable', () => {
  for (const question of QUESTION_BANK) {
    const label = question.id ?? 'unknown question';

    assert.equal(typeof question.id, 'string', `${label}: id`);
    assert.ok(CATEGORIES.includes(question.category), `${label}: category`);
    assert.ok(DIFFICULTIES.includes(question.difficulty), `${label}: difficulty`);
    assert.ok(DIFFICULTY_POINTS[question.difficulty] > 0, `${label}: points`);

    assert.equal(question.options.length, 4, `${label}: four options`);
    assert.equal(
      new Set(question.options).size,
      4,
      `${label}: options are distinct`,
    );

    assert.ok(Number.isInteger(question.answer), `${label}: answer is a number`);
    assert.ok(question.answer >= 0 && question.answer < 4, `${label}: in range`);

    assert.ok(question.question.trim().length > 5, `${label}: prompt text`);
    assert.ok(
      question.explanation.trim().length > 20,
      `${label}: explanation teaches something`,
    );
  }
});

test('category counts add up to the bank size', () => {
  const counts = countByCategory();
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  assert.equal(total, QUESTION_BANK.length);
  assert.ok(Object.keys(counts).every((name) => CATEGORIES.includes(name)));
});

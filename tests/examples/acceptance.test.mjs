import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimate, validateContact, revenue } from '../../examples/acceptance-app/src/model.mjs';

test('pricing calculator preserves plan, seat and annual-billing behavior', () => {
  assert.equal(estimate('studio', 2, false), 98);
  assert.equal(estimate('studio', 2, true), 78.4);
  assert.equal(estimate('starter', 1, false), 19);
  assert.throws(() => estimate('missing', 1, false), /Choose/u);
  assert.throws(() => estimate('studio', 1, 'yes'), /Choose/u);
  for (const seats of [0, 101, 1.5, NaN]) assert.throws(() => estimate('studio', seats, false), /Choose/u);
});
test('contact validation identifies the invalid field and accepts valid input', () => {
  assert.equal(validateContact('', '')?.field, 'name');
  assert.equal(validateContact('An', 'invalid')?.field, 'email');
  assert.equal(validateContact('An', 'an@example.test'), null);
  assert.equal(revenue.length, 3); assert.equal(revenue[2].customers, 410);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wheel } from './draw.js';

const digits = (v, n) => Array.from({ length: n }, (_, k) => Math.floor(wheel(v, n - 1 - k)) % 10).join('');

test('odometer at rest shows the rounded value exactly', () => {
  assert.equal(digits(15945, 5), '15945');
  assert.equal(digits(15944.98, 5), '15945');
  assert.equal(digits(11199.76, 5), '11200');
  assert.equal(digits(10000.2, 5), '10000');
});

test('only the wheels above a run of 9s turn during a carry', () => {
  const v = 10999.4; // rounds across 10999 → 11000: ones wheel inside its carry window
  assert.ok(wheel(v, 0) % 1 > 0);
  assert.ok(wheel(v, 3) % 1 > 0);
  assert.equal(wheel(15945.4, 3) % 1, 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spring, track, indicator, swapAlpha, rng, hash, SPRINGS, beatGrid } from './motion.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} !≈ ${b}`);

test('spring starts at 0 and settles at 1 for every preset', () => {
  for (const name of Object.keys(SPRINGS)) {
    assert.equal(spring(0, name), 0);
    assert.equal(spring(-1, name), 0);
    close(spring(5, name), 1);
  }
});

test('spring starts with zero velocity (no jump on the first frame)', () => {
  for (const name of Object.keys(SPRINGS)) {
    assert.ok(spring(1 / 240, name) < 0.02, name);
  }
});

test('heavy and soft presets never overshoot; pop does', () => {
  const peak = (p) => Math.max(...Array.from({ length: 600 }, (_, i) => spring(i / 120, p)));
  assert.ok(peak('heavy') <= 1 + 1e-9);
  assert.ok(peak('soft') <= 1.001);
  assert.ok(peak('snappy') < 1.05);
  assert.ok(peak('pop') > 1.1);
});

test('track is continuous across target changes and lands on the last value', () => {
  const keys = [[0, 0], [1, 100], [1.5, 40]];
  let prev = track(0, keys);
  for (let i = 1; i < 600; i++) {
    const v = track(i / 120, keys);
    assert.ok(Math.abs(v - prev) < 15, `jump at ${i / 120}`);
    prev = v;
  }
  close(track(10, keys), 40);
});

test('indicator keeps left <= right and settles on the last stop', () => {
  const stops = [[0, 0, 100], [1, 300, 420]];
  for (let i = 0; i < 300; i++) {
    const { left, right } = indicator(i / 120, stops);
    assert.ok(left <= right);
  }
  const end = indicator(10, stops);
  close(end.left, 300);
  close(end.right, 420);
});

test('swapAlpha is 0 outside and 1 inside the window', () => {
  assert.equal(swapAlpha(0, 1, 3), 0);
  assert.equal(swapAlpha(2, 1, 3), 1);
  assert.equal(swapAlpha(4, 1, 3), 0);
});

test('rng and hash are deterministic and in [0, 1)', () => {
  const a = rng(7), b = rng(7);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
    const h = hash(i, 3);
    assert.equal(h, hash(i, 3));
    assert.ok(h >= 0 && h < 1);
  }
});

test('beat grid at 120 BPM', () => {
  const g = beatGrid(120);
  assert.equal(g.beat, 0.5);
  assert.equal(g.BAR(30), 60);
});

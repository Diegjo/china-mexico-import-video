// Closed-form motion primitives. Everything here is a pure function of time, so any frame can be
// rendered without simulating the frames before it (the seek(t) contract in CLAUDE.md).

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const remap = (x, a, b, c, d) => lerp(c, d, invLerp(a, b, x));

// Spring presets: stiffness k, damping d (unit mass). Damping ratio z = d / (2 * sqrt(k)).
export const SPRINGS = {
  snappy: { k: 380, d: 30 }, // z ≈ 0.77: UI, chips, toggles, leading edges (~2% overshoot)
  soft: { k: 150, d: 24 },   // z ≈ 0.98: cards, containers, camera
  heavy: { k: 110, d: 21 },  // z = 1.00: big type and numbers, no overshoot
  pop: { k: 300, d: 15 },    // z ≈ 0.43: stamps and checkmarks (visible overshoot)
  whip: { k: 220, d: 30 },   // z ≈ 1.01: fast camera pans
};

const resolve = (p) => (typeof p === 'string' ? SPRINGS[p] : p ?? SPRINGS.soft);

// Damped spring from 0 to 1, starting at t = 0 with zero velocity.
export function spring(t, preset = 'soft') {
  if (t <= 0) return 0;
  const { k, d } = resolve(preset);
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (z < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z <= 1 + 1e-6) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// Spring that starts at `start` and goes from `from` to `to`.
export const sp = (t, start, from = 0, to = 1, preset = 'soft') =>
  from + (to - from) * spring(t - start, preset);

// A value with several targets: keys = [[time, value], ...] sorted by time.
// One spring per change, summed, so motion stays continuous without restarting anything.
export function track(t, keys, preset = 'soft') {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], keys[i][2] ?? preset);
  }
  return v;
}

// A pill/indicator that stretches: the leading edge is stiffer than the trailing edge.
// stops = [[time, left, right], ...]
export function indicator(t, stops, lead = 'snappy', trail = 'soft') {
  const l = stops.map(([tt, a]) => [tt, a]);
  const r = stops.map(([tt, , b]) => [tt, b]);
  const lFast = track(t, l, lead), lSlow = track(t, l, trail);
  const rFast = track(t, r, lead), rSlow = track(t, r, trail);
  return { left: Math.min(lFast, lSlow), right: Math.max(rFast, rSlow) };
}

// Visibility window for content inside a moving container: in after tIn, out before tOut.
export function swapAlpha(t, tIn, tOut = Infinity, ramp = 0.12) {
  return Math.min(clamp((t - tIn) / ramp), clamp((tOut - t) / ramp));
}

// Stagger helper: start time of item i.
export const stagger = (start, i, step) => start + i * step;

// Seeded PRNG (mulberry32). Never Math.random: renders must be identical every run.
export function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless hash of integers to [0, 1). Use for per-index or per-frame variation.
export function hash(a, b = 0) {
  let x = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35);
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 13;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// Beat grid helpers (120 BPM unless told otherwise).
export const beatGrid = (bpm = 120) => {
  const beat = 60 / bpm;
  return { bpm, beat, bar: beat * 4, B: (n) => n * beat, BAR: (n) => n * beat * 4 };
};

// Drawing helpers shared by every scene. Stateless: each call reads (g, time, options) only.
import { clamp, spring } from '../lib/motion.js';
import { C, F } from './theme.js';

export function font(g, fam, size, ls = 0) {
  g.font = `${size}px ${fam}`;
  g.letterSpacing = `${ls}px`;
}

const advCache = new Map();
// Cumulative advance of every prefix of `str` (keeps kerning when glyphs are drawn one by one).
function advances(g, str) {
  const key = `${g.font}|${g.letterSpacing}|${str}`;
  let a = advCache.get(key);
  if (!a) {
    a = [];
    for (let i = 0; i <= str.length; i++) a.push(g.measureText(str.slice(0, i)).width);
    advCache.set(key, a);
  }
  return a;
}

export function measure(g, str, fam, size, ls = 0) {
  font(g, fam, size, ls);
  return g.measureText(str).width;
}

// Largest size (≤ max) at which `str` fits in `width`.
export function fit(g, str, fam, max, width, ls = 0) {
  const w = measure(g, str, fam, max, ls);
  return w <= width ? max : Math.floor((max * width) / w);
}

const RISE = 1.32; // slot travel in ems: enough to hide accents above caps and descenders below

function units(str, by) {
  if (by === 'line') return [{ s: str, i: 0 }];
  if (by === 'glyph') return [...str].map((s, i) => ({ s, i }));
  const out = [];
  let i = 0;
  for (const w of str.split(' ')) {
    if (w) out.push({ s: w, i });
    i += w.length + 1;
  }
  return out;
}

// Slot reveal: each glyph/word rises out of a mask on its own spring. `out` (local time) sends
// them up and out of the same mask. Returns the text width.
export function slot(g, str, x, y, lt, o = {}) {
  const {
    fam = F.xcond, size = 160, color = C.ink, ls = 0, step = 0.03, preset = 'heavy',
    align = 'left', out = null, by = 'glyph', outPreset = 'whip',
  } = o;
  font(g, fam, size, ls);
  const adv = advances(g, str);
  const w = adv[str.length];
  const x0 = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  if (lt <= 0) return w;
  g.save();
  g.beginPath();
  g.rect(x0 - size, y - size * 1.02, w + size * 2, size * 1.3);
  g.clip();
  g.fillStyle = color;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  units(str, by).forEach((u, k) => {
    const p = spring(lt - k * step, preset);
    let dy = (1 - p) * size * RISE;
    if (out != null) dy -= spring(lt - out - k * step * 0.5, outPreset) * size * RISE;
    if (Math.abs(dy) < size * RISE * 0.995) g.fillText(u.s, x0 + adv[u.i], y + dy);
  });
  g.restore();
  return w;
}

// Several lines of slotted text, each line starting `lineStep` after the previous one.
export function lines(g, arr, x, y, lh, lt, o = {}) {
  const { lineStep = 0.12, ...rest } = o;
  arr.forEach((s, i) => slot(g, s, x, y + i * lh, lt - i * lineStep, { by: 'word', step: 0.035, ...rest }));
}

// Body caption: word slots, auto-fit to the content width.
export function caption(g, str, x, y, lt, o = {}) {
  const { width = 888, max = 56, min = 44, ...rest } = o;
  const size = Math.max(min, fit(g, str, F.med, max, width));
  return slot(g, str, x, y, lt, { fam: F.med, size, by: 'word', step: 0.035, preset: 'soft', ...rest });
}

// Mono label with a left-to-right wipe and a short trailing rule.
export function label(g, str, x, y, lt, o = {}) {
  const { size = 40, color = C.ink, fam = F.mono, ls = 3, align = 'left', out = null } = o;
  font(g, fam, size, ls);
  const w = g.measureText(str).width;
  const p = spring(lt, 'snappy');
  const q = out == null ? 0 : spring(lt - out, 'snappy');
  if (p <= 0.001 || q >= 0.999) return w;
  const x0 = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  g.save();
  g.beginPath();
  g.rect(x0 + w * q - 4, y - size, (w + 8) * (p - q), size * 1.4);
  g.clip();
  g.fillStyle = color;
  g.textAlign = 'left';
  g.fillText(str, x0 + (1 - p) * -24, y);
  g.restore();
  return w;
}

// Chapter kicker: accent number + mono label + short rule that draws after it.
export function kicker(g, num, text, x, y, lt, o = {}) {
  const { out = null } = o;
  const nw = label(g, num, x, y, lt, { fam: F.monoB, color: C.accent, out });
  const tw = label(g, '· ' + text, x + nw + 14, y, lt - 0.08, { out });
  const p = spring(lt - 0.2, 'soft') - (out == null ? 0 : spring(lt - out, 'snappy'));
  if (p > 0.001) {
    g.fillStyle = C.ink;
    g.fillRect(x + nw + tw + 32, y - 13, 90 * clamp(p, 0, 1.2), 3);
  }
}

// Mechanical odometer wheel position for digit k (k = 0 is the ones digit). The display rounds
// to the nearest integer; a wheel turns only while every wheel below it reads 9 and the ones
// wheel is inside its `carry` window, so a value at rest always shows exact digits.
export function wheel(v, k, carry = 0.2) {
  const vr = v + 0.5;
  const p = 10 ** k;
  const base = Math.floor(vr / p);
  const lower = vr - base * p;
  const roll = clamp((vr - Math.floor(vr) - (1 - carry)) / carry);
  return base + (Math.floor(lower) === p - 1 ? roll : 0);
}

// Rolling number. `v` is continuous; wheels roll, they never crossfade.
export function odometer(g, v, x, y, o = {}) {
  const {
    fam = F.xcond, size = 300, color = C.ink, digits = 5, prefix = '', suffix = '',
    group = true, carry = 0.2, align = 'left', reveal = 1, wheels = null,
  } = o;
  const rev = typeof reveal === 'function' ? reveal : () => reveal;
  font(g, fam, size);
  const dw = Math.max(...'0123456789'.split('').map((d) => g.measureText(d).width));
  const chars = [];
  if (prefix) chars.push({ s: prefix });
  for (let k = digits - 1; k >= 0; k--) {
    chars.push({ k });
    if (group && k > 0 && k % 3 === 0) chars.push({ s: ',' });
  }
  if (suffix) chars.push({ s: suffix });
  const widths = chars.map((c) => (c.k != null ? dw : g.measureText(c.s).width));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
  const top = y - size * 0.86;
  g.save();
  g.beginPath();
  g.rect(cx - size, top, total + size * 2, size * 1.0);
  g.clip();
  g.fillStyle = color;
  g.textAlign = 'left';
  chars.forEach((c, i) => {
    const rise = (1 - rev(i)) * size * RISE;
    if (Math.abs(rise) >= size * RISE * 0.995) {
      cx += widths[i];
      return;
    }
    if (c.k == null) {
      g.fillText(c.s, cx, y + rise);
    } else {
      const pos = wheels ? wheels(c.k) : wheel(v, c.k, carry);
      const d0 = Math.floor(pos);
      const f = pos - d0;
      const a = ((d0 % 10) + 10) % 10;
      const b = (a + 1) % 10;
      const wa = g.measureText(String(a)).width;
      const wb = g.measureText(String(b)).width;
      g.fillText(String(a), cx + (dw - wa) / 2, y + rise - f * size);
      if (f > 0.001) g.fillText(String(b), cx + (dw - wb) / 2, y + rise + (1 - f) * size);
    }
    cx += widths[i];
  });
  g.restore();
  return total;
}

// ---------- shapes ----------

export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

// Stroke the first fraction p of a polyline.
export function polyline(g, pts, p) {
  if (p <= 0) return;
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let left = total * clamp(p);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const f = Math.min(1, left / seg[i - 1]);
    g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
    left -= seg[i - 1];
  }
  g.stroke();
}

export function check(g, x, y, s, p, color = C.ink, lw = 8) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  polyline(g, [[x, y], [x + s * 0.36, y + s * 0.34], [x + s, y - s * 0.42]], p);
  g.restore();
}

// Point and tangent angle on a quadratic Bézier.
export function quad(p0, c, p1, t) {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
  const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
  const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
  const dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
  return { x, y, a: Math.atan2(dy, dx) };
}

export function quadPts(p0, c, p1, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const q = quad(p0, c, p1, i / n);
    return [q.x, q.y];
  });
}

// Shipping carton seen from the front: kraft face, darker lid band, tape stripe.
export function carton(g, x, y, w, h, o = {}) {
  const { fill = C.kraft, ink = C.ink, lw = 4 } = o;
  rr(g, x, y, w, h, 6);
  g.fillStyle = fill;
  g.fill();
  g.fillStyle = 'rgba(26,24,20,0.12)';
  g.fillRect(x, y, w, h * 0.22);
  g.fillStyle = 'rgba(26,24,20,0.18)';
  g.fillRect(x + w * 0.42, y, w * 0.16, h * 0.5);
  rr(g, x, y, w, h, 6);
  g.lineWidth = lw;
  g.strokeStyle = ink;
  g.stroke();
}

// Side view of a container ship, origin at the waterline centre, length ~ 2 * s.
export function ship(g, x, y, s, color = C.ink) {
  g.save();
  g.translate(x, y);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(-s, -s * 0.28);
  g.lineTo(s * 1.05, -s * 0.28);
  g.lineTo(s * 0.82, s * 0.12);
  g.lineTo(-s * 0.86, s * 0.12);
  g.closePath();
  g.fill();
  const cw = s * 0.27, ch = s * 0.17;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 1 && (c === 0 || c === 4)) continue;
      g.fillStyle = (r + c) % 2 ? C.ink3 : C.ink4;
      g.fillRect(-s * 0.62 + c * (cw + 3), -s * 0.3 - (r + 1) * (ch + 3), cw, ch);
    }
  }
  g.fillStyle = color;
  g.fillRect(s * 0.78, -s * 0.78, s * 0.16, s * 0.5);
  g.restore();
}

// Top view of a cargo plane pointing along +x, origin at its centre, length ~ 2 * s.
export function plane(g, x, y, s, angle = 0, color = C.ink) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, 0, s, s * 0.13, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(s * 0.18, 0);
  g.lineTo(-s * 0.22, -s * 0.95);
  g.lineTo(-s * 0.4, -s * 0.95);
  g.lineTo(-s * 0.2, 0);
  g.lineTo(-s * 0.4, s * 0.95);
  g.lineTo(-s * 0.22, s * 0.95);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-s * 0.7, 0);
  g.lineTo(-s * 0.92, -s * 0.36);
  g.lineTo(-s * 1.0, -s * 0.36);
  g.lineTo(-s * 0.9, 0);
  g.lineTo(-s * 1.0, s * 0.36);
  g.lineTo(-s * 0.92, s * 0.36);
  g.closePath();
  g.fill();
  g.restore();
}

// "≠" built from shapes (no glyph dependency). s = bar length.
export function neq(g, cx, cy, s, color = C.accent) {
  const th = s * 0.13, gap = s * 0.26;
  g.save();
  g.translate(cx, cy);
  g.fillStyle = color;
  g.fillRect(-s / 2, -gap / 2 - th, s, th);
  g.fillRect(-s / 2, gap / 2, s, th);
  g.rotate(-1.05);
  g.fillRect(-s * 0.55, -th / 2, s * 1.1, th);
  g.restore();
}

// Pill chip with mono text. Scales from its left edge with `p` (use the pop spring).
export function chip(g, str, x, y, p, o = {}) {
  const { size = 36, fill = C.ink, color = C.bg, fam = F.monoB, padX = 22, h = size * 1.6 } = o;
  if (p <= 0.001) return 0;
  font(g, fam, size, 2);
  const w = g.measureText(str).width + padX * 2;
  g.save();
  g.translate(x, y);
  g.scale(p, p);
  rr(g, 0, -h / 2, w, h, h / 2);
  g.fillStyle = fill;
  g.fill();
  g.fillStyle = color;
  g.textBaseline = 'middle';
  g.fillText(str, padX, 2);
  g.restore();
  return w;
}

// Horizontal arrow from (x1, y) to (x2, y), drawn to fraction p.
export function arrow(g, x1, y, x2, p, color = C.ink, lw = 6) {
  if (p <= 0) return;
  const xe = x1 + (x2 - x1) * clamp(p);
  g.save();
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y);
  g.lineTo(xe, y);
  g.stroke();
  const h = lw * 3.2 * clamp(p * 3);
  g.beginPath();
  g.moveTo(xe + lw * 0.6, y);
  g.lineTo(xe - h, y - h * 0.75);
  g.lineTo(xe - h, y + h * 0.75);
  g.closePath();
  g.fill();
  g.restore();
}

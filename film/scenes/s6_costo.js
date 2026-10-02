// S6 · Costo total (0:46–0:54): the stack that answers the hook. Illustrative USD example.
import { spring } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, label, kicker, odometer, chip, fit, polyline } from '../draw.js';

const IN = -0.4, T_PCT = 4.0, OUT = 7.5;
// [name, amount, fill, value text] — bottom to top. See docs/shotlist.md for the arithmetic.
export const LAYERS = [
  ['Mercancía (FOB)', 10000, C.ink, '$10,000'],
  ['Flete + seguro', 1200, C.ink2, '$1,200'],
  ['IGI · ej. 15%', 1680, C.ink3, '$1,680'],
  ['DTA · ~0.8%', 90, C.ink4, '$90'],
  ['IVA · 16%', 2075, 'hatch', '$2,075 · ACREDITABLE'],
  ['Agente + gastos locales', 900, '#B3A995', '$900'],
];
export const TOTAL = LAYERS.reduce((a, l) => a + l[1], 0);
const LAYER_T = [-2, 0.5, 1.0, 1.5, 2.0, 2.5]; // the product layer is already there
const STACK = { x: M, w: 240, base: 1450, h: 760 };
const LABEL_Y = (i) => 1440 - i * 146;
const LX = M + 330;

function hatch(g, x, y, w, h) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = C.paper;
  g.fillRect(x, y, w, h);
  g.strokeStyle = C.ink3;
  g.lineWidth = 5;
  g.beginPath();
  for (let d = -h; d < w + h; d += 16) {
    g.moveTo(x + d, y + h);
    g.lineTo(x + d + h, y);
  }
  g.stroke();
  g.restore();
}

export default {
  id: 's6_costo',
  start: 46,
  end: 54,
  pre: 0.4,
  post: 0.45,
  cues: [
    ...LAYER_T.slice(1).map((t) => [t, 'tick']),
    ...LAYER_T.slice(1).map((t) => [t + 0.05, 'roll', 0.35]),
    [T_PCT, 'thump'], [T_PCT + 0.1, 'pop', 0.7], [OUT, 'whoosh'],
  ],
  draw(g, lt) {
    g.translate(0, -H * (1 - spring(lt - IN, 'whip')));
    const squash = spring(lt - OUT, 'whip');
    if (squash > 0) {
      g.translate(0, STACK.base);
      g.scale(1, Math.max(0.002, 1 - squash));
      g.translate(0, -STACK.base);
    }

    kicker(g, '05', 'COSTO TOTAL · EJEMPLO', M, 290, lt + 0.5);
    let v = 0;
    LAYERS.forEach(([, amt], i) => (v += amt * spring(lt - LAYER_T[i] - 0.08, 'heavy')));
    const ow = odometer(g, v, M - 6, 530, {
      size: 230, prefix: '$', color: C.accent, reveal: (k) => spring(lt + 0.45 - k * 0.03, 'heavy'),
    });
    label(g, 'USD', M + ow + 14, 530, lt + 0.3, { color: C.muted });

    const cw = chip(g, '+59%', M, 618, spring(lt - T_PCT, 'pop'), { size: 40, fill: C.accent, color: C.paper });
    slot(g, '≈1.6× el precio FOB', M + Math.max(cw, 150) + 20, 636, lt - T_PCT - 0.12, { fam: F.bold, size: 52, by: 'word', step: 0.05, preset: 'soft' });

    // Stack, masked so layers drop in from under the headline area.
    const k = STACK.h / TOTAL;
    g.fillStyle = C.ink;
    g.fillRect(M - 24, STACK.base, (STACK.w + 48) * spring(lt + 0.5, 'soft'), 5);
    g.save();
    g.beginPath();
    g.rect(0, 660, W, STACK.base - 660);
    g.clip();
    let bottom = STACK.base;
    const centers = [];
    LAYERS.forEach(([, amt, fill], i) => {
      const hgt = amt * k;
      const p = spring(lt - LAYER_T[i], 'snappy');
      const y = bottom - hgt - (1 - p) * 520;
      centers.push(bottom - hgt / 2);
      if (p > 0) {
        if (fill === 'hatch') hatch(g, STACK.x, y, STACK.w, hgt);
        else {
          g.fillStyle = fill;
          g.fillRect(STACK.x, y, STACK.w, Math.max(hgt, 3));
        }
      }
      bottom -= hgt;
    });
    g.restore();

    // Accent bracket over everything that is not the product.
    const top = STACK.base - STACK.h, prodTop = STACK.base - LAYERS[0][1] * k;
    const br = spring(lt - T_PCT, 'snappy');
    if (br > 0) {
      g.fillStyle = C.accent;
      g.fillRect(M - 26, prodTop - (prodTop - top) * br, 7, (prodTop - top) * br);
      g.fillRect(M - 26, prodTop - 3, 20, 6);
      g.fillRect(M - 26, prodTop - (prodTop - top) * br - 3, 20, 6);
    }

    // Labels with elbow leaders.
    LAYERS.forEach(([name, , , val], i) => {
      const t0 = LAYER_T[i] + 0.05, y = LABEL_Y(i);
      const lp = spring(lt - t0, 'soft');
      if (lp > 0) {
        g.save();
        g.strokeStyle = C.ink4;
        g.lineWidth = 2;
        const x0 = STACK.x + STACK.w + 8, xm = LX - 40;
        polyline(g, [[x0, centers[i]], [xm - 20, centers[i]], [xm, y - 16], [LX - 14, y - 16]], lp);
        g.restore();
      }
      const size = Math.min(48, fit(g, name, F.med, 48, W - M - LX));
      slot(g, name, LX, y, lt - t0, { fam: F.med, size, by: 'word', step: 0.035, preset: 'soft' });
      label(g, val, LX + 2, y + 46, lt - t0 - 0.1, { size: 34, color: i === 4 ? C.ink : C.muted });
    });

    label(g, 'EJEMPLO EN USD · IGI SEGÚN FRACCIÓN', M, 1560, lt - 5.0, { size: 34, color: C.muted });
    label(g, 'IVA SE PAGA AL IMPORTAR Y SE ACREDITA', M, 1610, lt - 5.3, { size: 34, color: C.muted });
  },
};

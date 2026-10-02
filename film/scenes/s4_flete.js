// S4 · Flete (0:22–0:34): sea vs air, volumetric weight, rule of thumb, iris into customs.
import { spring, clamp, lerp } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, label, kicker, caption, odometer, polyline, quad, quadPts, ship, plane, arrow, fit } from '../draw.js';

const IN = -0.4;
const T_VOL = 5.0, T_RULE = 9.0, T_IRIS = 11.5;
const SEA = { p0: [180, 800], c: [540, 600], p1: [900, 800] };
const AIR = { p0: [180, 1460], c: [540, 1250], p1: [900, 1460] };
const SHIP_SPRING = { k: 4, d: 4 };
const PLANE_SPRING = { k: 20, d: 8.95 };
const IRIS = [M + 170, 1215]; // tip of the AIRE arrow
const START = 22;

// Iris circle in global time; S5 clips its first frames to it.
export const irisAt = (t) => ({ x: IRIS[0], y: IRIS[1], r: 2400 * spring(t - START - T_IRIS, 'whip') });

function route(g, r, lt, t0, travelled) {
  const pts = quadPts(r.p0, r.c, r.p1);
  g.save();
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.strokeStyle = C.ink4;
  g.setLineDash([2, 16]);
  polyline(g, pts, spring(lt - t0, 'soft'));
  g.setLineDash([]);
  g.strokeStyle = C.ink;
  g.lineWidth = 6;
  polyline(g, pts, travelled);
  g.restore();
  for (const [p, i] of [[r.p0, 0], [r.p1, 1]]) {
    const s = spring(lt - t0 - i * 0.25, 'pop');
    if (s <= 0) continue;
    g.beginPath();
    g.arc(p[0], p[1], 14 * s, 0, Math.PI * 2);
    g.fillStyle = C.ink;
    g.fill();
  }
  label(g, 'CHINA', r.p0[0], r.p0[1] + 66, lt - t0, { size: 34, align: 'center', color: C.muted });
  label(g, 'MÉXICO', r.p1[0], r.p1[1] + 66, lt - t0 - 0.25, { size: 34, align: 'center', color: C.muted });
}

// Isometric carton, front-bottom corner at (fx, fy); dims in px; hgt can animate.
function isoBox(g, fx, fy, L, D, Hh) {
  const ex = [0.866, -0.5], ez = [-0.866, -0.5];
  const P = (a, b, c) => [fx + ex[0] * a + ez[0] * b, fy + ex[1] * a + ez[1] * b - c];
  const face = (pts, fill) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.stroke();
  };
  g.save();
  g.lineWidth = 4;
  g.lineJoin = 'round';
  g.strokeStyle = C.ink;
  face([P(0, 0, 0), P(L, 0, 0), P(L, 0, Hh), P(0, 0, Hh)], '#CFC3AE');
  face([P(0, 0, 0), P(0, D, 0), P(0, D, Hh), P(0, 0, Hh)], '#BCAF97');
  face([P(0, 0, Hh), P(L, 0, Hh), P(L, D, Hh), P(0, D, Hh)], C.kraft);
  g.lineWidth = 10;
  g.strokeStyle = 'rgba(26,24,20,0.18)';
  g.beginPath();
  const a = P(L / 2, 0, Hh), b = P(L / 2, D, Hh);
  g.moveTo(a[0], a[1]);
  g.lineTo(b[0], b[1]);
  g.stroke();
  g.restore();
  return P;
}

function dimLine(g, a, b, off, text, p, lt) {
  if (p <= 0) return;
  const ax = a[0] + off[0], ay = a[1] + off[1], bx = b[0] + off[0], by = b[1] + off[1];
  g.save();
  g.strokeStyle = C.ink;
  g.lineWidth = 3;
  polyline(g, [[ax, ay], [bx, by]], p);
  g.restore();
  label(g, text, (ax + bx) / 2 + off[0] * 1.2, (ay + by) / 2 + off[1] * 1.2 + 12, lt, { size: 36, align: 'center' });
}

export default {
  id: 's4_flete',
  start: START,
  end: 34,
  pre: 0.4,
  post: 0.5,
  cues: [
    [0.3, 'whoosh', 0.6], [1.4, 'pop', 0.6], [2.7, 'thump', 0.5],
    [T_VOL, 'whoosh', 0.7], [5.3, 'pop', 0.6], [5.6, 'tick'], [5.8, 'tick'], [6.0, 'tick'],
    [6.4, 'roll', 0.5], [6.9, 'pop'], [7.3, 'tick'], [7.5, 'tick'],
    [T_RULE, 'whoosh', 0.7], [9.6, 'pop', 0.6], [10.2, 'pop', 0.6], [T_IRIS, 'whoosh'],
  ],
  draw(g, lt) {
    g.translate(W * (1 - spring(lt - IN, 'whip')), 0);
    kicker(g, '03', 'FLETE', M, 290, lt + 0.5);

    const vol = spring(lt - T_VOL, 'soft');
    const rule = spring(lt - T_RULE, 'soft');

    g.save();
    g.beginPath();
    g.rect(0, 330, W, H);
    g.clip();

    // Phase A · sea (top) and air (bottom) side by side in time.
    const pShip = spring(lt - 0.3, SHIP_SPRING);
    const pPlane = spring(lt - 0.3, PLANE_SPRING);
    if (vol < 0.999) {
      g.save();
      g.translate(0, -1100 * vol);
      slot(g, 'MAR', M, 520, lt + 0.5, { size: 170 });
      odometer(g, pShip * 30, W - M - 150, 520, { size: 150, digits: 2, align: 'right', reveal: (k) => spring(lt + 0.45 - k * 0.04, 'heavy') });
      slot(g, 'días', W - M - 136, 520, lt + 0.4, { fam: F.med, size: 56, step: 0.02, preset: 'soft' });
      route(g, SEA, lt, -0.3, clamp(pShip));
      const s = quad(SEA.p0, SEA.c, SEA.p1, clamp(pShip));
      if (lt > -0.1) {
        g.save();
        g.translate(s.x, s.y - 8);
        g.rotate(s.a * 0.5);
        ship(g, 0, 0, 52 * spring(lt + 0.1, 'pop'));
        g.restore();
      }
      label(g, '~25–35 DÍAS', M, 920, lt - 2.6, { fam: F.monoB, size: 38, color: C.accent });
      label(g, 'SHENZHEN → MANZANILLO', M + 300, 920, lt - 2.7, { size: 36 });
      label(g, 'FCL CONTENEDOR · LCL CONSOLIDADO', M, 975, lt - 2.85, { size: 36, color: C.muted });
      g.fillStyle = C.rule;
      g.fillRect(M, 1040, (W - 2 * M) * spring(lt + 0.5, 'soft'), 3);
      g.restore();
    }

    // Air panel: moves up to become the volumetric-weight board.
    if (rule < 0.999) {
      g.save();
      g.translate(0, -670 * vol - 1300 * rule);
      slot(g, 'AIRE', M, 1190, lt + 0.45, { size: 170 });
      const pd = clamp(1 - spring(lt - T_VOL + 0.1, 'whip'));
      g.save();
      g.globalAlpha = pd;
      odometer(g, pPlane * 7, W - M - 150, 1190, { size: 150, digits: 2, align: 'right', reveal: (k) => spring(lt + 0.4 - k * 0.04, 'heavy') });
      slot(g, 'días', W - M - 136, 1190, lt + 0.35, { fam: F.med, size: 56, step: 0.02, preset: 'soft' });
      g.restore();
      if (vol < 0.5) {
        route(g, AIR, lt, -0.25, clamp(pPlane) * (1 - clamp(vol * 3)));
        const a = quad(AIR.p0, AIR.c, AIR.p1, clamp(pPlane));
        const off = spring(lt - T_VOL + 0.2, 'whip');
        if (lt > -0.2) plane(g, a.x + off * 900, a.y - off * 500, 50 * spring(lt + 0.2, 'pop'), a.a - off * 0.5);
        label(g, '~5–10 DÍAS', M, 1580, lt - 1.4, { fam: F.monoB, size: 38, color: C.accent, out: T_VOL - 1.4 });
        label(g, 'COBRA POR KG', M + 270, 1580, lt - 1.5, { size: 36, out: T_VOL - 1.5 });
      }

      // Phase B · volumetric weight (coordinates are pre-translation: +670).
      if (lt > T_VOL) {
        const oy = 670;
        const hp = spring(lt - 5.3, 'pop');
        const S = 5.2;
        const fx = 470, fy = 1010 + oy;
        const P = isoBox(g, fx, fy, 50 * S * clamp(spring(lt - 5.2, 'snappy')), 40 * S * clamp(spring(lt - 5.25, 'snappy')), 30 * S * clamp(hp, 0, 1.15));
        dimLine(g, P(0, 0, 0), P(50 * S, 0, 0), [22, 38], '50 cm', spring(lt - 5.6, 'soft'), lt - 5.6);
        dimLine(g, P(0, 0, 0), P(0, 40 * S, 0), [-22, 38], '40 cm', spring(lt - 5.8, 'soft'), lt - 5.8);
        dimLine(g, P(50 * S, 0, 0), P(50 * S, 0, 30 * S), [70, 0], '30 cm', spring(lt - 6.0, 'soft'), lt - 6.0);

        const fs = Math.min(fit(g, '50 × 40 × 30 ÷ 6000', F.xcond, 120, 888), fit(g, '= 10 KG VOLUMÉTRICOS', F.xcond, 120, 888));
        slot(g, '50 × 40 × 30 ÷ 6000', M, 1180 + oy, lt - 6.3, { size: fs, step: 0.025 });
        const w1 = slot(g, '= ', M, 1300 + oy, lt - 6.8, { size: fs });
        const w2 = slot(g, '10 KG', M + w1, 1300 + oy, lt - 6.85, { size: fs, color: C.accent, step: 0.03 });
        slot(g, ' VOLUMÉTRICOS', M + w1 + w2, 1300 + oy, lt - 6.95, { size: fs, step: 0.02 });

        const bars = [['PESO REAL · 6 KG', 6, C.ink, 7.3], ['VOLUMÉTRICO · 10 KG', 10, C.accent, 7.5]];
        bars.forEach(([txt, kg, col, t0], i) => {
          const y = 1390 + i * 95 + oy;
          label(g, txt, M, y, lt - t0, { size: 36 });
          g.fillStyle = col;
          g.fillRect(M, y + 18, kg * 62 * spring(lt - t0 - 0.05, 'snappy'), 26);
        });
        caption(g, 'Te cobran el mayor de los dos.', M, 1615 + oy, lt - 7.8, { max: 56 });
      }
      g.restore();
    }

    // Phase C · rule of thumb.
    if (lt > T_RULE - 0.1) {
      g.save();
      g.translate(0, 1300 * (1 - rule));
      slot(g, '¿CUÁL CONVIENE?', M, 500, lt - T_RULE - 0.1, { size: fit(g, '¿CUÁL CONVIENE?', F.xcond, 150, 888), by: 'word', step: 0.06 });
      const rows = [['Pesado o voluminoso', 'MAR', 760, 9.4], ['Urgente o de alto valor', 'AIRE', 1110, 10.0]];
      rows.forEach(([q, a, y, t0], i) => {
        caption(g, q, M, y, lt - t0, { max: 60 });
        arrow(g, M + 4, y + 105, M + 170, spring(lt - t0 - 0.2, 'snappy'), C.accent, 9);
        slot(g, a, M + 210, y + 165, lt - t0 - 0.3, { size: 170 });
        const ic = spring(lt - t0 - 0.4, 'pop');
        if (ic > 0) {
          if (i === 0) ship(g, 820, y + 120, 80 * ic);
          else plane(g, 840, y + 100, 84 * ic, -0.35);
        }
      });
      g.fillStyle = C.rule;
      g.fillRect(M, 1000, (W - 2 * M) * spring(lt - 9.8, 'soft'), 3);
      g.restore();
    }
    g.restore();

    // Iris into S5.
    const ir = irisAt(lt + START);
    if (ir.r > 0) {
      g.beginPath();
      g.arc(ir.x, ir.y, ir.r, 0, Math.PI * 2);
      g.fillStyle = C.ink;
      g.fill();
    }
  },
};

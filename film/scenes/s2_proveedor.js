// S2 · Proveedor (0:04–0:12): MOQ cartons → pick a sample → carton morphs into the proforma.
import { spring, lerp, clamp } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, label, kicker, odometer, caption, carton, check, rr } from '../draw.js';

const IN = -0.4; // whip from S1 starts 0.4 s before the bar line
const COLS = 5, ROWS = 4, CW = 156, CH = 120, GAP = 17;
const GRID_BOTTOM = 1090;
const PICK = { r: 2, c: 3 };
const T_PICK = 2.0, T_MORPH = 4.0, T_MARK = 7.0, T_WIPE = 7.5;
const DOC = { x: M, y: 540, w: 888, h: 760 };
const ROWS_PI = [
  ['CANTIDAD', '500 pzas'],
  ['PRECIO UNIT.', 'USD 20.00'],
  ['TOTAL', 'USD 10,000'],
  ['INCOTERM', 'FOB Shenzhen'],
  ['PAGO', '30% / 70%'],
];
const ROW_Y = (i) => 740 + i * 118;
const ROW_T = (i) => 4.5 + i * 0.5;

const landT = (i) => -0.15 + i * 0.05;
const cell = (r, c) => ({ x: M + c * (CW + GAP), y: GRID_BOTTOM - (r + 1) * CH - r * 14 });

function mix(a, b, p) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(p)))).join(',')})`;
}

export default {
  id: 's2_proveedor',
  start: 4,
  end: 12,
  pre: 0.4,
  cues: [
    ...Array.from({ length: 10 }, (_, k) => [landT(k * 2) + 0.18, 'tick', 0.35]),
    [T_PICK, 'pop'], [T_PICK + 0.3, 'pop', 0.7], [T_MORPH, 'whoosh', 0.6],
    ...ROWS_PI.map((_, i) => [ROW_T(i), 'tick', 0.8]),
    [T_MARK, 'swish', 0.8], [T_WIPE, 'whoosh'],
  ],
  draw(g, lt) {
    g.translate(0, H * (1 - spring(lt - IN, 'whip')));

    kicker(g, '01', 'PROVEEDOR', M, 290, lt + 0.5);
    slot(g, 'PEDIDO MÍNIMO', M, 460, lt + 0.5, { size: 150, by: 'word', step: 0.07, out: T_MORPH - 0.3 + 0.5 });
    slot(g, 'PROFORMA', M, 460, lt - T_MORPH - 0.1, { size: 150, step: 0.03 });

    // Carton grid stacked on a pallet line, masked below the headline.
    const pick = spring(lt - T_PICK, 'pop');
    const recede = spring(lt - T_PICK, 'soft');
    const palette = spring(lt + 0.4, 'soft') * (1 - spring(lt - T_MORPH + 0.1, 'snappy'));
    if (palette > 0.001) {
      g.fillStyle = C.ink;
      g.fillRect(M, GRID_BOTTOM + 10, (COLS * CW + (COLS - 1) * GAP) * palette, 6);
    }
    g.save();
    g.beginPath();
    g.rect(0, 500, W, GRID_BOTTOM - 500 + 8);
    g.clip();
    for (let i = 0; i < COLS * ROWS; i++) {
      const r = Math.floor(i / COLS), c = i % COLS;
      if (r === PICK.r && c === PICK.c) continue;
      const p = spring(lt - landT(i), 'snappy');
      if (p <= 0) continue;
      const exit = spring(lt - T_MORPH + 0.2 - (COLS * ROWS - i) * 0.012, 'whip');
      const { x, y } = cell(r, c);
      const yy = y - (1 - p) * 300 + exit * 700;
      g.globalAlpha = 1 - 0.55 * recede;
      carton(g, x, yy, CW, CH);
      g.globalAlpha = 1;
    }
    g.restore();

    // The picked carton: lands, lifts as the sample, then morphs into the proforma sheet.
    const pi = PICK.r * COLS + PICK.c;
    const land = spring(lt - landT(pi), 'snappy');
    const morph = spring(lt - T_MORPH, 'soft');
    if (land > 0) {
      const { x, y } = cell(PICK.r, PICK.c);
      const cx = x + CW / 2, cy = y + CH / 2 - (1 - land) * 300 - 80 * pick;
      const sc = 1 + 0.35 * pick;
      const bx = cx - (CW * sc) / 2, by = cy - (CH * sc) / 2;
      const rx = lerp(bx, DOC.x, morph), ry = lerp(by, DOC.y, morph);
      const rw = lerp(CW * sc, DOC.w, morph), rh = lerp(CH * sc, DOC.h, morph);
      const fill = morph > 0 ? mix(C.accent, C.paper, morph * 1.4) : mix(C.kraft, C.accent, recede);
      g.save();
      if (lt < T_MORPH) {
        g.beginPath();
        g.rect(0, 500, W, GRID_BOTTOM - 500 + 8);
        g.clip();
        carton(g, rx, ry, rw, rh, { fill });
      } else {
        rr(g, rx, ry, rw, rh, lerp(6, 22, morph));
        g.fillStyle = fill;
        g.fill();
        g.lineWidth = 4;
        g.strokeStyle = C.ink;
        g.stroke();
      }
      g.restore();
      const ck = spring(lt - T_PICK - 0.3, 'pop') * (1 - spring(lt - T_MORPH + 0.15, 'whip'));
      if (ck > 0.01) check(g, cx - 34, cy + 6, 70, clamp(ck), C.paper, 11);
    }

    // MOQ counter (follows the cartons that have landed).
    let v = 0;
    for (let i = 0; i < COLS * ROWS; i++) v += 25 * spring(lt - landT(i) - 0.12, 'heavy');
    const outQ = spring(lt - T_MORPH + 0.3, 'whip');
    label(g, 'MOQ · CANTIDAD MÍNIMA', M, 1200, lt, { out: T_MORPH - 0.3 });
    if (outQ < 0.999) {
      g.save();
      g.translate(0, outQ * 400);
      const ow = odometer(g, v, M - 6, 1365, { size: 170, digits: 3, reveal: (k) => spring(lt - 0.05 - k * 0.04, 'heavy') });
      slot(g, 'pzas', M + ow + 18, 1365, lt - 0.25, { fam: F.med, size: 64, preset: 'soft', step: 0.02 });
      g.restore();
    }
    caption(g, 'Mínimo de piezas por pedido.', M, 1470, lt - 0.6, { out: T_PICK - 0.6 - 0.15 });
    caption(g, 'Pide muestras y verifica la fábrica.', M, 1470, lt - T_PICK - 0.15, { out: T_MORPH - T_PICK - 0.15 - 0.35 });

    // Proforma rows: mono label left, value right, hairline under each.
    if (lt > T_MORPH) {
      label(g, 'PROFORMA INVOICE · USD', DOC.x + 48, DOC.y + 80, lt - T_MORPH - 0.35, { color: C.muted, size: 34 });
      ROWS_PI.forEach(([k, val], i) => {
        const y = ROW_Y(i), t0 = ROW_T(i);
        const isInco = i === 3;
        if (isInco) {
          const mk = spring(lt - T_MARK, 'snappy');
          const ex = spring(lt - T_WIPE, 'whip');
          if (mk > 0 && ex <= 0) {
            g.fillStyle = C.accent;
            g.fillRect(DOC.x + 20, y - 66, (DOC.w - 40) * mk, 96);
          }
        }
        const out = isInco ? T_WIPE + 0.05 - t0 : null;
        label(g, k, DOC.x + 48, y, lt - t0, { size: 36, color: isInco && lt > T_MARK ? C.ink : C.muted, out });
        slot(g, val, DOC.x + DOC.w - 48, y + 4, lt - t0 - 0.05, { fam: F.cond, size: 60, align: 'right', step: 0.012, out });
        const hl = spring(lt - t0 - 0.1, 'soft');
        if (!isInco && hl > 0) {
          g.fillStyle = C.rule;
          g.fillRect(DOC.x + 48, y + 38, (DOC.w - 96) * hl, 3);
        }
      });
      caption(g, 'Todo por escrito antes del anticipo.', M, 1420, lt - 5.6);
    }

    // Marker expands into the full-bleed accent that opens S3.
    const ex = spring(lt - T_WIPE, 'whip');
    if (ex > 0) {
      const y = ROW_Y(3);
      const x0 = lerp(DOC.x + 20, -80, ex), y0 = lerp(y - 66, -80, ex);
      const x1 = lerp(DOC.x + DOC.w - 20, W + 80, ex), y1 = lerp(y + 30, H + 80, ex);
      g.fillStyle = C.accent;
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  },
};

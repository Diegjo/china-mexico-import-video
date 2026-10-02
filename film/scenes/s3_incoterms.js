// S3 · Incoterms (0:12–0:22): who pays which leg, FOB vs DDP on one vertical route.
import { spring, track, indicator, clamp } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, label, kicker, caption, chip, rr, fit } from '../draw.js';

const T_OPEN = 1.0, T_FOB = 2.0, T_DDP = 6.0, OUT = 9.6;
const SEG = ['EXW', 'FOB', 'CIF', 'DDP'];
const TOG = { x: M, y: 352, w: 888, h: 96 };
const segX = (i) => TOG.x + (i * TOG.w) / 4;
const RX = 180;
const NODE_Y = (i) => 560 + i * 160;
const NODES = [
  ['Fábrica', 'CHINA'],
  ['A bordo', 'PUERTO DE ORIGEN'],
  ['Flete internacional', 'MAR O AIRE'],
  ['Aduana', 'MÉXICO · IMPUESTOS'],
  ['Tu bodega', 'ENTREGA FINAL'],
];

export default {
  id: 's3_incoterms',
  start: 12,
  end: 22,
  post: 0.6,
  cues: [
    [0, 'thump'], [T_OPEN, 'whoosh', 0.7],
    ...NODES.map((_, i) => [1.05 + i * 0.1, 'tick', 0.4]),
    [T_FOB, 'click'], [T_FOB + 0.05, 'pop', 0.5], [T_DDP, 'click'], [T_DDP + 0.05, 'whoosh', 0.5],
    [8.4, 'pop', 0.8], [OUT, 'whoosh'],
  ],
  draw(g, lt) {
    g.translate(-W * spring(lt - OUT, 'whip'), 0);

    if (lt >= T_OPEN - 0.2) diagram(g, lt);

    // Accent title card, retracting upward like a blind.
    const open = spring(lt - T_OPEN, 'whip');
    const panelBottom = H * (1 - open);
    if (panelBottom > 0.5) {
      g.fillStyle = C.accent;
      g.fillRect(-10, -10, W + 20, panelBottom + 10);
      g.save();
      g.beginPath();
      g.rect(0, 0, W, panelBottom);
      g.clip();
      const dy = panelBottom - H;
      const size = Math.min(300, fit(g, 'INCOTERMS', F.xcond, 300, 888));
      slot(g, 'INCOTERMS', M - 4, 930 + dy, lt - 0.02, { size, color: C.paper, step: 0.035 });
      caption(g, '¿Quién paga cada tramo?', M, 1040 + dy, lt - 0.3, { color: C.paper, max: 64 });
      g.restore();
    }
  },
};

// Route diagram: drawn first so the accent panel can retract over it.
function diagram(g, lt) {
  kicker(g, '02', 'INCOTERMS', M, 290, lt - 0.85);

  // Segmented toggle with a stretching indicator.
  const tw = spring(lt - 0.9, 'soft');
  rr(g, TOG.x, TOG.y, TOG.w * tw, TOG.h, TOG.h / 2);
  g.fillStyle = C.rule;
  g.fill();
  const ind = indicator(lt, [[T_FOB, segX(1), segX(2)], [T_DDP, segX(3), segX(4)]]);
  const ip = spring(lt - T_FOB, 'pop');
  let pill = null;
  if (ip > 0) {
    const cx = (ind.left + ind.right) / 2, hw = ((ind.right - ind.left) / 2 - 6) * clamp(ip, 0, 1.1);
    const hh = (TOG.h / 2 - 6) * clamp(ip, 0, 1.1);
    pill = [cx - hw, TOG.y + TOG.h / 2 - hh, hw * 2, hh * 2];
    rr(g, ...pill, hh);
    g.fillStyle = C.ink;
    g.fill();
  }
  const segLabels = (color) => SEG.forEach((s, i) =>
    label(g, s, segX(i) + TOG.w / 8, TOG.y + 63, lt - 1.05 - i * 0.05, { fam: F.monoB, size: 40, align: 'center', color }));
  segLabels(C.ink);
  if (pill) {
    g.save();
    rr(g, ...pill, pill[3] / 2);
    g.clip();
    segLabels(C.paper);
    g.restore();
  }

  // Route: base line, then who pays each leg.
  const base = spring(lt - 1.0, 'soft');
  g.fillStyle = C.rule;
  g.fillRect(RX - 3, NODE_Y(0), 6, (NODE_Y(4) - NODE_Y(0)) * base);
  const h = track(lt, [[0, 0], [T_FOB, 1], [T_DDP, 4]]);
  const show = spring(lt - T_FOB, 'soft');
  const yh = NODE_Y(0) + h * 160;
  if (show > 0) {
    g.fillStyle = C.ink;
    g.fillRect(RX - 8, NODE_Y(0), 16, yh - NODE_Y(0));
    g.fillStyle = C.accent;
    g.fillRect(RX - 8, yh, 16, (NODE_Y(4) - yh) * show);
  }
  NODES.forEach(([name, sub], i) => {
    const y = NODE_Y(i), p = spring(lt - 1.05 - i * 0.1, 'pop');
    if (p > 0) {
      const fill = show < 0.5 ? C.bg : i <= h + 0.02 ? C.ink : C.accent;
      g.beginPath();
      g.arc(RX, y, 24 * p, 0, Math.PI * 2);
      g.fillStyle = fill;
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = fill === C.accent ? C.accent : C.ink;
      g.stroke();
    }
    slot(g, name, 250, y + 14, lt - 1.1 - i * 0.1, { fam: F.med, size: 52, by: 'word', step: 0.04, preset: 'soft' });
    label(g, sub, 252, y + 62, lt - 1.2 - i * 0.1, { size: 34, color: C.muted });
  });

  // Legend.
  const lg = spring(lt - T_FOB - 0.2, 'snappy');
  if (lg > 0) {
    g.fillStyle = C.ink;
    g.fillRect(M, 1318, 44 * lg, 16);
    g.fillStyle = C.accent;
    g.fillRect(M + 330, 1318, 44 * lg, 16);
  }
  label(g, 'PROVEEDOR', M + 60, 1340, lt - T_FOB - 0.25, { size: 36 });
  label(g, 'TÚ', M + 390, 1340, lt - T_FOB - 0.3, { size: 36 });

  // Captions: FOB pair, then DDP pair + the warning.
  caption(g, 'FOB: el proveedor entrega a bordo.', M, 1450, lt - 2.9, { out: T_DDP - 0.2 - 2.9 });
  caption(g, 'Tú pagas flete, seguro y aduana.', M, 1520, lt - 3.9, { out: T_DDP - 0.15 - 3.9 });
  caption(g, 'DDP: todo pagado hasta tu puerta.', M, 1450, lt - 6.9);
  caption(g, 'Más cómodo, pero con menos control.', M, 1520, lt - 7.6);
  chip(g, 'OJO: ¿EL PEDIMENTO SALE A TU NOMBRE?', M, 1590, spring(lt - 8.4, 'pop'), { size: 34, fill: C.accent, color: C.paper });
}

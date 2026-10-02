// S7 · Cierre (0:54–1:00): checklist + CTA, with the hook's equation answered.
import { spring, clamp } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, check, rr, chip, caption } from '../draw.js';

const ITEMS = ['Proveedor y muestras', 'Incoterm claro', 'Flete cotizado', 'Fracción arancelaria', 'Agente aduanal'];
const ITEM_T = (i) => 0.5 + i * 0.5;
const ITEM_Y = (i) => 620 + i * 108;
const T_CTA = 3.0, T_CHIP = 4.0;

export default {
  id: 's7_cierre',
  start: 54,
  end: 60,
  pre: 0.35,
  cues: [
    ...ITEMS.map((_, i) => [ITEM_T(i), 'tick']), ...ITEMS.map((_, i) => [ITEM_T(i) + 0.08, 'pop', 0.5]),
    [T_CTA, 'thump'], [T_CTA + 0.35, 'swish', 0.6], [T_CHIP, 'pop'],
  ],
  draw(g, lt) {
    const push = 1 + 0.025 * spring(lt - 2.0, { k: 1.2, d: 2.2 });
    g.translate(W / 2, H / 2);
    g.scale(push, push);
    g.translate(-W / 2, -H / 2);

    slot(g, 'TU CHECKLIST', M, 470, lt + 0.3, { size: 160, by: 'word', step: 0.07 });
    ITEMS.forEach((it, i) => {
      const y = ITEM_Y(i), t0 = ITEM_T(i);
      const bp = spring(lt - t0 + 0.25, 'snappy');
      if (bp > 0) {
        rr(g, M, y - 50, 60 * bp, 60, 12);
        g.lineWidth = 5;
        g.strokeStyle = C.ink;
        g.stroke();
      }
      const f = spring(lt - t0, 'pop');
      if (f > 0) {
        g.save();
        g.translate(M + 30, y - 20);
        g.scale(clamp(f, 0, 1.2), clamp(f, 0, 1.2));
        rr(g, -30, -30, 60, 60, 12);
        g.fillStyle = C.ink;
        g.fill();
        g.restore();
        check(g, M + 13, y - 20, 36, clamp(spring(lt - t0 - 0.08, 'snappy')), C.paper, 8);
      }
      slot(g, it, M + 96, y, lt - t0 + 0.25, { fam: F.bold, size: 60, by: 'word', step: 0.04, preset: 'soft' });
    });

    slot(g, 'CALCULA TU', M, 1250, lt - T_CTA, { size: 150, by: 'word', step: 0.07 });
    const w = slot(g, 'COSTO TOTAL', M, 1395, lt - T_CTA - 0.12, { size: 150, color: C.accent, by: 'word', step: 0.07 });
    const ul = spring(lt - T_CTA - 0.35, 'snappy');
    if (ul > 0) {
      g.fillStyle = C.accent;
      g.fillRect(M, 1418, w * ul, 10);
    }
    caption(g, 'antes de pagar.', M, 1505, lt - T_CTA - 0.4, { max: 64 });
    chip(g, '$10,000 ≠ $15,945', M, 1590, spring(lt - T_CHIP, 'pop'), { size: 38 });
  },
};

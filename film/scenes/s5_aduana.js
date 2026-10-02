// S5 · Aduana MX (0:34–0:46): requirements → pedimento → the tariff code decides everything.
import { spring, lerp, clamp, hash } from '../../lib/motion.js';
import { W, H, C, F, M } from '../theme.js';
import { slot, label, kicker, caption, check, rr, fit, polyline } from '../draw.js';
import { irisAt } from './s4_flete.js';

const T_OPEN = 1.0, T_DOC = 4.0, T_TREE = 8.0, OUT = 11.6;
const REQS = [
  ['RFC + e.firma', 'ALTA ANTE EL SAT'],
  ['Padrón de Importadores', 'INSCRIPCIÓN ANTE EL SAT'],
  ['Agente aduanal', 'TE REPRESENTA EN LA ADUANA'],
];
const REQ_T = (i) => 1.6 + i * 0.45;
const REQ_Y = (i) => 780 + i * 190;
const DOC = { x: M, y: 560, w: 888, h: 850 };
const PED = [
  ['FRACCIÓN ARANCELARIA', '8 dígitos + NICO'],
  ['VALOR EN ADUANA', 'mercancía + flete + seguro'],
  ['IGI · ARANCEL', 'según la fracción'],
  ['DTA', '~0.8% del valor en aduana'],
  ['IVA', '16% sobre valor + IGI + DTA'],
];
const PED_T = (i) => 4.5 + i * 0.5;
const LEAVES = [
  ['Arancel (IGI)', 'CUÁNTO PAGAS'],
  ['NOM / etiquetado', 'QUÉ NORMAS CUMPLES'],
  ['Permisos', 'SI NECESITAS AUTORIZACIÓN'],
];
const LEAF_Y = (i) => 900 + i * 190;
const LEAF_T = (i) => 8.6 + i * 0.4;

export default {
  id: 's5_aduana',
  start: 34,
  end: 46,
  pre: 0.35,
  post: 0.5,
  cues: [
    [0, 'thump'], [T_OPEN, 'whoosh', 0.7],
    ...REQS.map((_, i) => [REQ_T(i), 'pop', 0.8]),
    [T_DOC, 'whoosh', 0.6], ...PED.map((_, i) => [PED_T(i), 'tick', 0.8]),
    [T_TREE, 'whoosh', 0.5], [8.2, 'pop'], ...LEAVES.map((_, i) => [LEAF_T(i), 'tick']),
    [OUT, 'whoosh'],
  ],
  draw(g, lt, t) {
    g.translate(0, H * spring(lt - OUT, 'whip'));

    // Ink title card; its top edge drops and the headline inverts where the edge passes.
    const open = spring(lt - T_OPEN, 'whip');
    const panelTop = H * open;
    if (panelTop < H) {
      g.fillStyle = C.ink;
      g.fillRect(-10, panelTop, W + 20, H - panelTop + 10);
    }
    const q = spring(lt - T_OPEN, 'heavy');
    const big = Math.min(340, fit(g, 'ADUANA', F.xcond, 340, 888));
    const size = lerp(big, 170, q), y = lerp(1020, 470, q);
    const head = (color) => slot(g, 'ADUANA', M - 4, y, lt + 0.3, { size, color, step: 0.04 });
    if (lt < 0) {
      const ir = irisAt(t);
      g.save();
      g.beginPath();
      g.arc(ir.x, ir.y, ir.r, 0, Math.PI * 2);
      g.clip();
      head(C.paper);
      g.restore();
      return;
    }
    g.save();
    g.beginPath();
    g.rect(0, 0, W, panelTop);
    g.clip();
    head(C.ink);
    g.restore();
    g.save();
    g.beginPath();
    g.rect(0, panelTop, W, H);
    g.clip();
    head(C.paper);
    g.restore();
    if (lt < T_OPEN) return;

    kicker(g, '04', 'ADUANA MX', M, 290, lt - 1.3);

    // Requirements checklist.
    const reqOut = T_DOC - 0.3;
    caption(g, 'Antes de importar:', M, 620, lt - 1.5, { out: reqOut - 1.5 });
    REQS.forEach(([r, sub], i) => {
      const y = REQ_Y(i), t0 = REQ_T(i);
      const p = spring(lt - t0, 'pop') * (1 - spring(lt - reqOut - i * 0.04, 'whip'));
      if (p > 0.001) {
        g.save();
        g.translate(M + 32, y - 26);
        g.scale(p, p);
        rr(g, -32, -32, 64, 64, 12);
        g.fillStyle = C.ink;
        g.fill();
        g.restore();
        check(g, M + 14, y - 26, 38, clamp(spring(lt - t0 - 0.12, 'snappy')) * clamp(p), C.paper, 8);
      }
      const out = reqOut - t0 + 0.05 + i * 0.04;
      slot(g, r, M + 100, y, lt - t0 + 0.05, { fam: F.bold, size: 68, by: 'word', step: 0.04, preset: 'soft', out });
      label(g, sub, M + 102, y + 58, lt - t0 - 0.15, { size: 34, color: C.muted, out: out - 0.2 });
    });

    // Pedimento sheet.
    const dp = spring(lt - T_DOC, 'soft') - spring(lt - T_TREE + 0.1, 'whip');
    if (dp > 0.001) {
      g.save();
      g.translate(0, (1 - dp) * 1400);
      rr(g, DOC.x, DOC.y, DOC.w, DOC.h, 20);
      g.fillStyle = C.paper;
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = C.ink;
      g.stroke();
      slot(g, 'PEDIMENTO', DOC.x + 44, DOC.y + 112, lt - T_DOC - 0.2, { size: 90, step: 0.025 });
      for (let i = 0; i < 34; i++) {
        const bw = 2 + Math.floor(hash(i, 3) * 3) * 3;
        const bx = DOC.x + 560 + i * 8.4;
        if (bx + bw > DOC.x + DOC.w - 44) break;
        if (hash(i, 9) > 0.28) {
          g.fillStyle = C.ink;
          g.fillRect(bx, DOC.y + 46, bw * clamp(spring(lt - T_DOC - 0.3 - i * 0.008, 'snappy')), 64);
        }
      }
      label(g, 'CLAVE A1 · IMPORTACIÓN DEFINITIVA', DOC.x + 46, DOC.y + 172, lt - T_DOC - 0.35, { size: 34, color: C.muted });
      g.fillStyle = C.ink;
      g.fillRect(DOC.x + 44, DOC.y + 200, (DOC.w - 88) * spring(lt - T_DOC - 0.4, 'soft'), 4);
      PED.forEach(([k, v], i) => {
        const yy = DOC.y + 266 + i * 118, t0 = PED_T(i);
        label(g, k, DOC.x + 46, yy, lt - t0, { size: 34, color: C.muted });
        slot(g, v, DOC.x + 44, yy + 62, lt - t0 - 0.08, { fam: F.cond, size: 58, step: 0.01 });
      });
      g.restore();
    }
    caption(g, 'Tu agente aduanal lo presenta por ti.', M, 1510, lt - 5.0, { out: T_TREE - 0.2 - 5.0 });

    // Tree: the tariff code decides duty, standards and permits.
    if (lt > T_TREE) {
      const lt2 = lt - T_TREE;
      const rw = spring(lt2 - 0.15, 'snappy');
      if (rw > 0) {
        rr(g, M, 600, 888 * rw, 136, 16);
        g.fillStyle = C.accent;
        g.fill();
      }
      const rs = Math.min(92, fit(g, 'FRACCIÓN ARANCELARIA', F.xcond, 92, 800));
      slot(g, 'FRACCIÓN ARANCELARIA', M + 40, 702, lt2 - 0.3, { size: rs, color: C.paper, by: 'word', step: 0.06 });
      const sx = M + 56;
      g.save();
      g.strokeStyle = C.ink;
      g.lineWidth = 6;
      g.lineCap = 'round';
      polyline(g, [[sx, 736], [sx, LEAF_Y(2) - 22]], spring(lt2 - 0.45, 'soft'));
      g.restore();
      LEAVES.forEach(([name, sub], i) => {
        const y = LEAF_Y(i), t0 = LEAF_T(i) - T_TREE;
        g.save();
        g.strokeStyle = C.ink;
        g.lineWidth = 6;
        g.lineCap = 'round';
        polyline(g, [[sx, y - 22], [sx + 64, y - 22]], spring(lt2 - t0, 'snappy'));
        g.restore();
        slot(g, name, sx + 96, y, lt2 - t0 - 0.05, { fam: F.bold, size: 68, by: 'word', step: 0.05, preset: 'soft' });
        label(g, sub, sx + 98, y + 58, lt2 - t0 - 0.15, { size: 34, color: C.muted });
      });
      caption(g, 'Clasifica bien desde el inicio.', M, 1500, lt2 - 2.0);
    }
  },
};

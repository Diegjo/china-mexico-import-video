// S1 · Hook (0:00–0:04): "$10,000 + flete ≠ $?????" then the topic headline.
import { spring, track, clamp, hash } from '../../lib/motion.js';
import { W, H, C, M } from '../theme.js';
import { slot, label, odometer, neq, chip, caption } from '../draw.js';

const OUT = 3.6; // whip pan into S2
const LEAD = 0.42; // frame 0 already shows type in motion

// Unknown total: every wheel spins on its own fast rate, so no number can be read.
export const spinWheels = (lt) => (k) => hash(k, 11) * 10 + Math.max(0, lt) * (38 + hash(k, 5) * 22);

export default {
  id: 's1_hook',
  start: 0,
  end: 4,
  post: 0.6,
  cues: [
    [0, 'whoosh', 0.5], [0.5, 'pop'], [0.55, 'roll', 0.6], [1.0, 'thump'],
    [1.25, 'roll', 0.9], [2.0, 'tick'], [2.15, 'tick', 0.6], [3.0, 'swish', 0.4], [OUT, 'whoosh'],
  ],
  draw(g, lt) {
    g.translate(0, -H * spring(lt - OUT, 'whip'));

    // Price in China, then + freight.
    const lw = label(g, 'PRODUCTO · USD', M, 290, lt + LEAD);
    chip(g, '+ FLETE', M + lw + 20, 276, spring(lt - 0.5, 'pop'), { size: 38 });
    const v = track(lt, [[0, 10000], [0.55, 11200, 'heavy']]);
    odometer(g, v, M - 8, 590, {
      size: 300, prefix: '$', reveal: (i) => spring(lt + LEAD - i * 0.035, 'heavy'),
    });

    // ≠ stamp + equation rule.
    const s = spring(lt - 1.0, 'pop');
    if (s > 0) {
      g.save();
      g.translate(M + 100, 712);
      g.scale(1.9 - 0.9 * s, 1.9 - 0.9 * s);
      neq(g, 0, 0, 180 * clamp(s * 1.4), C.accent);
      g.restore();
      g.fillStyle = C.ink;
      g.fillRect(M + 240, 710, (W - M * 2 - 240) * spring(lt - 1.06, 'snappy'), 4);
    }

    // Total cost: wheels keep spinning; the answer lands in S6.
    label(g, 'COSTO TOTAL EN MÉXICO', M, 860, lt - 1.25);
    odometer(g, 0, M - 8, 1160, {
      size: 300, prefix: '$', color: C.accent, wheels: spinWheels(lt - 1.25),
      reveal: (i) => spring(lt - 1.25 - i * 0.035, 'heavy'),
    });

    // Topic headline + the thesis.
    slot(g, 'IMPORTAR DE', M, 1350, lt - 2.0, { size: 150, by: 'word', step: 0.08 });
    slot(g, 'CHINA A MÉXICO', M, 1495, lt - 2.15, { size: 150, by: 'word', step: 0.08 });
    caption(g, 'El flete no es tu costo total.', M, 1600, lt - 3.0, { max: 54 });
  },
};

// Film entry point. window.seek(t) paints the frame at t seconds; nothing else mutates the canvas.
import { W, H, C, DUR, FONTS } from './theme.js';
import { SCENES } from './scenes/index.js';

const canvas = document.getElementById('c');
const g = canvas.getContext('2d', { alpha: false });

export function draw(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);
  for (const s of SCENES) {
    if (t >= s.start - (s.pre ?? 0) && t < s.end + (s.post ?? 0)) {
      g.save();
      s.draw(g, t - s.start, t);
      g.restore();
    }
  }
}

window.DUR = DUR;
window.SCENES = SCENES.map(({ id, start, end }) => ({ id, start, end }));
window.CUES = SCENES.flatMap((s) => (s.cues ?? []).map(([lt, type, gain = 1]) => ({
  t: Math.round((s.start + lt) * 1000) / 1000, type, gain, scene: s.id,
}))).sort((a, b) => a.t - b.t);
window.seek = (t) => {
  draw(Math.max(0, Math.min(DUR - 1e-6, t)));
  return true;
};

window.__ready = (async () => {
  await Promise.all(Object.keys(FONTS).map((f) => document.fonts.load(`40px ${f}`)));
  draw(0);
  if (!navigator.webdriver) await import('./preview.js');
  return true;
})();

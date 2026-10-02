// Live preview for a normal browser only. Never loaded during headless render (navigator.webdriver).
// Keys: space = play/pause · ←/→ = ∓0.5 s (one beat) · shift+←/→ = ∓2 s (one bar). URL: ?t=12.5
const DUR = window.DUR;
const params = new URLSearchParams(location.search);
let t = Number(params.get('t') ?? 0);
let playing = !params.has('t');
let last = performance.now();

addEventListener('keydown', (e) => {
  if (e.code === 'Space') playing = !playing;
  if (e.code === 'ArrowRight') t += e.shiftKey ? 2 : 0.5;
  if (e.code === 'ArrowLeft') t -= e.shiftKey ? 2 : 0.5;
  t = ((t % DUR) + DUR) % DUR;
});

(function loop(now) {
  if (playing) t = (t + (now - last) / 1000) % DUR;
  last = now;
  window.seek(t);
  requestAnimationFrame(loop);
})(performance.now());

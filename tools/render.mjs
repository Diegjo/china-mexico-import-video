// Full render: seek(t) in headless Chromium → PNG frames → ffmpeg (subframe motion blur) → H.264.
//   node tools/render.mjs [--fps 60] [--sub 8] [--shutter 0.5] [--workers 3] [--from 0] [--to 60]
//                         [--crf 17] [--out out/silent.mp4]
// Workers render contiguous chunks in parallel; chunks are concatenated without re-encoding.
// Also writes out/cues.json (SFX cue list declared by the scenes) for audio/score.py.
// 30 fps × 4 subframes is a quick draft; it strobes visibly on the whip pans.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { openFilm, grab, meta, arg } from './film_page.mjs';

const FPS = Number(arg('fps', 60));
const SUB = Number(arg('sub', 8));
const SHUTTER = Number(arg('shutter', 0.5)); // fraction of the frame interval the "shutter" is open
const WORKERS = Number(arg('workers', 3));
const CRF = arg('crf', '17');
const OUT = arg('out', 'out/silent.mp4');
const CHUNKS = 'out/chunks';

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => p.on('close', (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`)))));
  return { p, done };
}

function encoder(file) {
  const vf = SUB > 1
    ? [`tmix=frames=${SUB}`, `select='eq(mod(n\\,${SUB})\\,${SUB - 1})'`, `setpts=N/${FPS}/TB`].join(',')
    : `setpts=N/${FPS}/TB`;
  return ffmpeg([
    '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-c:v', 'png', '-i', '-',
    '-vf', vf, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p',
    '-x264-params', 'keyint=60:min-keyint=60:scenecut=0', '-tune', 'animation',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    file,
  ]);
}

const write = (stream, buf) => new Promise((ok) => (stream.write(buf) ? ok() : stream.once('drain', ok)));

const film = await openFilm({ pages: WORKERS });
const info = await meta(film.pages[0]);
const FROM = Number(arg('from', 0));
const TO = Number(arg('to', info.dur));
mkdirSync('out', { recursive: true });
writeFileSync('out/cues.json', JSON.stringify({ dur: info.dur, scenes: info.scenes, cues: info.cues }, null, 1));

const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
const per = Math.ceil((f1 - f0) / WORKERS);
rmSync(CHUNKS, { recursive: true, force: true });
mkdirSync(CHUNKS, { recursive: true });

const t0 = Date.now();
let doneFrames = 0;
const progress = setInterval(() => {
  const s = (Date.now() - t0) / 1000;
  console.log(`  ${doneFrames}/${f1 - f0} frames · ${s.toFixed(0)} s · ${(doneFrames / s).toFixed(1)} fps`);
}, 10000);

const parts = [];
await Promise.all(film.pages.map(async (page, w) => {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) return;
  const file = `${CHUNKS}/part_${String(w).padStart(2, '0')}.mp4`;
  parts[w] = file;
  const enc = encoder(file);
  for (let f = a; f < b; f++) {
    for (let s = 0; s < SUB; s++) {
      const t = (f + (SUB > 1 ? (s / SUB) * SHUTTER : 0)) / FPS;
      await write(enc.p.stdin, await grab(page, t));
    }
    doneFrames++;
  }
  enc.p.stdin.end();
  await enc.done;
}));
clearInterval(progress);
await film.close();

const list = `${CHUNKS}/list.txt`;
writeFileSync(list, parts.filter(Boolean).map((p) => `file '${p.split('/').pop()}'`).join('\n') + '\n');
await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', OUT]).done;
console.log(`rendered ${f1 - f0} frames (${FPS} fps × ${SUB} subframes) in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${OUT}`);

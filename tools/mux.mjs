// Loudness-normalize the score (two-pass loudnorm: -14 LUFS, -1 dBTP) and mux with the picture.
//   node tools/mux.mjs [--video out/silent.mp4] [--audio out/score.wav] [--out out/final.mp4]
import { spawnSync } from 'node:child_process';
import { arg } from './film_page.mjs';

const VIDEO = arg('video', 'out/silent.mp4');
const AUDIO = arg('audio', 'out/score.wav');
const OUT = arg('out', 'out/final.mp4');
// TP sits 0.5 dB under the -1 dBTP spec: AAC encoding adds intersample overshoot after loudnorm.
const TARGET = 'I=-14:TP=-1.5:LRA=11';

const run = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};

const pass1 = run(['-i', AUDIO, '-af', `loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-']);
const m = JSON.parse(pass1.slice(pass1.lastIndexOf('{'), pass1.lastIndexOf('}') + 1));
const af = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}`
  + `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;

run([
  '-i', VIDEO, '-i', AUDIO, '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-shortest', '-movflags', '+faststart', OUT,
]);

const check = run(['-i', OUT, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const integrated = check.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
const peak = check.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
console.log(`muxed → ${OUT} · input ${m.input_i} LUFS → ${integrated} · true ${peak}`);

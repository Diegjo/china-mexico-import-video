// Export the SFX cue list the scenes declare (window.CUES) without rendering video.
//   node tools/cues.mjs [out/cues.json]
import { mkdirSync, writeFileSync } from 'node:fs';
import { openFilm, meta } from './film_page.mjs';

const out = process.argv[2] ?? 'out/cues.json';
const film = await openFilm();
const info = await meta(film.pages[0]);
await film.close();
mkdirSync('out', { recursive: true });
writeFileSync(out, JSON.stringify({ dur: info.dur, scenes: info.scenes, cues: info.cues }, null, 1));
console.log(`${info.cues.length} cues → ${out}`);

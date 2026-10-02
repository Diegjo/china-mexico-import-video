// Poster frame: a sharp full-resolution still straight from seek(t).
//   node tools/poster.mjs [--t 53.2] [--out out/poster.png]
import { writeFileSync } from 'node:fs';
import { openFilm, grab, arg } from './film_page.mjs';

const t = Number(arg('t', 53.2));
const out = arg('out', 'out/poster.png');
const film = await openFilm();
writeFileSync(out, await grab(film.pages[0], t));
await film.close();
console.log(`poster @ ${t}s → ${out}`);

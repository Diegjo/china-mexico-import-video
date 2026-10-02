// Render chosen moments as stills + a labelled contact sheet, for the critique loop.
//   node tools/stills.mjs                         one frame per bar (t = 1, 3, 5 ... 59)
//   node tools/stills.mjs --every 0.5 --from 12 --to 22 --cols 5
//   node tools/stills.mjs --times 0.4,1.1,1.9 --scale 540 --sheet out/review/hook.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openFilm, grab, arg } from './film_page.mjs';

const every = Number(arg('every', 2));
const from = Number(arg('from', 1));
const to = Number(arg('to', 60));
const times = arg('times')
  ? arg('times').split(',').map(Number)
  : Array.from({ length: Math.floor((to - from) / every + 1e-9) + 1 }, (_, i) => +(from + i * every).toFixed(3)).filter((t) => t < 60);
const cols = Number(arg('cols', 6));
const tileW = Number(arg('scale', 270));
const sheetPath = arg('sheet', 'out/review/contact_wip.png');
const dir = arg('dir', 'out/review/stills');
const save = arg('save', '0') === '1';

mkdirSync(dir, { recursive: true });
mkdirSync(dirname(sheetPath), { recursive: true });

const film = await openFilm();
const [page] = film.pages;
const pngs = [];
for (const t of times) {
  const png = await grab(page, t);
  pngs.push(png);
  if (save) writeFileSync(`${dir}/t_${t.toFixed(2).padStart(5, '0')}.png`, png);
}

// Compose the sheet in the browser so every tile carries its timestamp.
const sheet = await page.evaluate(async ({ imgs, times, cols, tileW }) => {
  const tileH = Math.round((tileW * 1920) / 1080);
  const rows = Math.ceil(imgs.length / cols);
  const pad = 8, lab = 34;
  const cv = document.createElement('canvas');
  cv.width = cols * (tileW + pad) + pad;
  cv.height = rows * (tileH + lab + pad) + pad;
  const g = cv.getContext('2d');
  g.fillStyle = '#222';
  g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < imgs.length; i++) {
    const im = new Image();
    im.src = 'data:image/png;base64,' + imgs[i];
    await im.decode();
    const x = pad + (i % cols) * (tileW + pad);
    const y = pad + Math.floor(i / cols) * (tileH + lab + pad);
    g.drawImage(im, x, y + lab, tileW, tileH);
    g.fillStyle = '#ddd';
    g.font = '22px Plex';
    g.fillText(`${times[i].toFixed(2)}s`, x + 4, y + 25);
  }
  return cv.toDataURL('image/png');
}, { imgs: pngs.map((b) => b.toString('base64')), times, cols, tileW });

writeFileSync(sheetPath, Buffer.from(sheet.slice(sheet.indexOf(',') + 1), 'base64'));
console.log(`${times.length} stills → ${sheetPath}`);
await film.close();

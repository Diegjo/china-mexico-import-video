// Opens the film in headless Chromium and exposes frame capture. Shared by render, stills, cues.
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

export async function openFilm({ pages = 1 } = {}) {
  const server = await serve();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const list = [];
  for (let i = 0; i < pages; i++) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => { console.error('[page error]', e.message); process.exitCode = 1; });
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
    await page.goto(`${server.url}/film/index.html`);
    await page.evaluate(() => window.__ready);
    list.push(page);
  }
  return {
    pages: list,
    browser,
    close: async () => { await browser.close(); await server.close(); },
  };
}

// Paint frame t and return it as a PNG buffer (reads the canvas directly: lossless, no compositor).
export async function grab(page, t) {
  const url = await page.evaluate((tt) => {
    window.seek(tt);
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

export const meta = (page) => page.evaluate(() => ({ dur: window.DUR, scenes: window.SCENES, cues: window.CUES }));

export const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};

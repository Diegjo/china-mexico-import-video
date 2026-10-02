# china-mexico-import-video
Motion graphics: importación China→México (~60s)

A 60-second 1080×1920 explainer in Spanish (MX) for Mexican entrepreneurs: why USD 10,000 of
product from China lands at roughly USD 15,945 once freight, Mexican customs duties, DTA, IVA and
broker fees are added, and what to check before paying.

| File | What it is |
|---|---|
| `out/final.mp4` | The film: 60 s, 1080×1920, 60 fps, H.264 `yuv420p`, AAC 48 kHz, -14 LUFS |
| `out/contact.png` | One frame per second from the encoded film |
| `out/poster.png` | Full-resolution poster frame (t = 53.2 s) |
| `out/strip.png`, `out/phone.png` | Motion-blur strip of the first whip pan; readability at 360 px wide |

## How it works

The film is a pure function of time. `film/index.html` loads `film/main.js`, which exposes
`window.seek(t)` and paints frame `t` on a canvas. Nothing animates on its own: no CSS
transitions, timers or `requestAnimationFrame` in render mode, and no `Math.random`.

- `lib/motion.js`: closed-form damped springs (`snappy`, `soft`, `heavy`, `pop`, `whip`),
  `track()` for values with several targets, seeded noise, 120 BPM beat grid.
- `film/scenes/s1…s7`: one module per scene. Each scene declares its time window and the SFX cues
  that belong to its animation (`cues`), so picture and sound share one source of truth.
- `film/draw.js`: slot/mask type reveals, mechanical odometer, shapes and icons.
- `tools/render.mjs`: headless Chromium (Playwright) seeks every subframe, pipes PNGs to ffmpeg,
  which blends 8 subframes per frame (180° shutter motion blur) and encodes H.264. Three
  browser pages render contiguous chunks in parallel; chunks are concatenated without re-encoding.
- `audio/score.py`: numpy-only synth. Score at 120 BPM (scene cuts land on bar lines) plus SFX
  placed at the cue times exported by the film.
- `tools/mux.mjs`: two-pass `loudnorm` to -14 LUFS / -1 dBTP, muxes AAC with the video.

House rules are in `CLAUDE.md`; look and timing in `docs/style_guide.md` and `docs/shotlist.md`;
critique rounds in `docs/review_log.md`.

## Requirements

- Node 22+, ffmpeg (with libx264), Python 3 with numpy.
- Playwright Chromium: `npm install && npx playwright install --with-deps chromium`.
- Fonts (Archivo, IBM Plex Mono, OFL) are vendored as static instances in `film/fonts/`.

## Re-render

```bash
npm install
npx playwright install --with-deps chromium

npm run check     # banned-API scan + unit tests (springs, odometer)
npm run render    # out/silent.mp4 + out/cues.json   (60 fps × 8 subframes, ~6 min on 4 cores)
npm run audio     # out/score.wav from out/cues.json
npm run mux       # out/final.mp4 (-14 LUFS, -1 dBTP)
npm run sheets    # out/contact.png, out/strip.png, out/phone.png, out/poster.png

npm run build     # all of the above in order
```

Faster loops while editing:

```bash
npm run preview                           # live preview: http://localhost:5173/film/  (space, ←/→, ?t=12.5)
npm run stills                            # contact sheet, one frame per bar → out/review/contact_wip.png
node tools/stills.mjs --every 0.25 --from 3.4 --to 4.6 --cols 5 --sheet out/review/cut.png
npm run render:draft                      # 30 fps × 4 subframes → out/draft.mp4 (strobes on whip pans)
node tools/render.mjs --from 22 --to 34 --out out/review/flete.mp4   # one scene
```

## Accuracy

Figures are a worked example in USD, labeled as such on screen. IGI (tariff) depends on the
fracción arancelaria; 15 % is illustrative. DTA is shown as ~0.8 % of customs value and IVA as
16 % of customs value + IGI + DTA. Transit times are approximate (~25–35 days ocean
Shenzhen→Manzanillo, ~5–10 days air). Air volumetric weight uses the common ÷ 6000 divisor.
This is general information, not customs or tax advice; confirm with a licensed agente aduanal.

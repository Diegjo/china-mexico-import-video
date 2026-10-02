# Motion studio rules

House rules for every film in this repo. Read before touching `film/`, `lib/`, `audio/` or `tools/`.

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame `t` (seconds) on `#c`.
- No CSS transitions, no `setTimeout`, no `requestAnimationFrame` in render mode, no state
  carried between frames. Seeded noise only (`rng()` / `hash()` in `lib/motion.js`), never `Math.random`.
- The live preview loop is the only `requestAnimationFrame`, and it is disabled when
  `navigator.webdriver` is true (headless render).
- Fonts are vendored in `film/fonts/` and awaited before the first frame. No network at render time.
- Render with `npm run render` (Playwright + ffmpeg). Encode H.264, `yuv420p`, CRF 16–18.
- `npm run check` must pass: banned-API scan + spring unit tests.

## Motion
- Closed-form springs only (`lib/motion.js`). No easing curves, no CSS easing.
  - `snappy`: UI, chips, toggles, leading edges (tiny overshoot).
  - `soft`: cards, containers, camera (no visible overshoot).
  - `heavy`: big type and numbers (no overshoot).
  - `pop`: stamps and checkmarks only (visible overshoot).
- A value with more than one target uses `track()`, one spring per change. Never restart a spring.
- Text inside a moving container enters after the container starts moving and leaves before it leaves.
- Type enters with masks, slots, scale or position. Opacity alone is never an entrance.

## Look
- Banned defaults: centered title on gradient, everything fading in, corner labels and frame
  borders, glow on UI chrome, generic particle bursts, drop-shadow soup.
- One display face (Archivo, static cuts), one UI/data face (IBM Plex Mono).
- Warm neutral canvas, ink, and ONE accent (vermilion `#E4472A`). No second hue, ever.
- Every 2 to 4 seconds something new must happen on screen.
- Keep key content inside the 9:16 social safe area: y 220–1640, x 72–1008.

## Sound
- Score and SFX are synthesized in code (`audio/score.py`). 120 BPM, bar = 2 s, beat = 0.5 s.
- Scene cuts land on bar lines. SFX come from `window.CUES`, which the scenes declare next to
  the animation they belong to, so picture and sound cannot drift.
- Master loudness: -14 LUFS integrated, -1 dBTP (two-pass `loudnorm` in `tools/mux.mjs`).

## Loop before showing anything
1. `npm run stills` renders one frame per beat window as a contact sheet. LOOK at it.
2. Score 1–10: hook in first 2 s · readability at phone size (360 px wide) · motion quality ·
   variety · composition · accuracy · sound sync.
3. Write the 3 worst problems with timestamps in `docs/review_log.md`. Fix them.
4. Repeat (minimum 2 rounds) until every score is 8+. Only then do the full render.
5. After the full render: `npm run sheets` (contact, strip, phone, poster) and look again.

## Accuracy
- High-level, verifiable facts only. Approximate figures carry `~`.
- Example numbers are labeled "ejemplo". Tariff (IGI) depends on the fracción arancelaria.
- No logos, no brand names, no real company data.

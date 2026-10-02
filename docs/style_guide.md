# Style guide — "De China a México"

Reference grammar (no external footage): Swiss/editorial print layouts and freight paperwork —
manifests, proformas, customs forms — animated with product-film UI motion. Take the grammar of
editorial infographics, never anyone's content, logos or characters.

## Palette (hex)
| Role | Hex | Use |
|---|---|---|
| Canvas | `#EEE7DB` | Warm bone paper. Every scene sits on it. |
| Paper | `#F8F4EC` | Documents and cards (proforma, pedimento). |
| Rule | `#D6CDBE` | Hairlines, tracks, inactive UI. |
| Muted | `#6F685D` | Secondary text, sub-labels. |
| Ink | `#1A1814` | Primary type, primary shapes. |
| Accent | `#E4472A` | Vermilion. The ONLY hue. Money that surprises you, the active choice, the CTA. |

Accent budget: at most one accent element group per shot, plus the full-bleed accent wipe into
Incoterms. Tints of ink (`#3B372F`, `#5A5449`, `#8C8475`) separate cost layers; no extra hues.

Texture: none. A per-pixel grain was tried and dropped: it made every PNG frame ~4 MB and
H.264 smears it anyway. Depth comes from ink tints, hairlines and hatching instead.

## Type
| Style | Face | Size (px @1080w) | Notes |
|---|---|---|---|
| Mega | Archivo Extra-Condensed Black | 260–420 | Single words / numbers. Slot reveal per glyph. |
| H1 | Archivo Extra-Condensed Black | 130–190 | 1–3 words per line, uppercase, left-aligned. |
| H2 | Archivo Extra-Bold | 64–88 | Sentence case. |
| Body | Archivo Medium | 50–60 | Captions, max ~28 characters per line. |
| Label | IBM Plex Mono Medium/SemiBold | 34–42 | Uppercase, tracking +4px. Data, kickers, units. |

- Numbers that change use the odometer (per-digit slots, rolling with springs), never a crossfade.
- Minimum on-screen size 34 px (≈11 px on a 360 px-wide phone).
- Layout is left-aligned on a 96 px margin. No centered title cards.

## Motion
- Springs only (`lib/motion.js`): `snappy` UI, `soft` containers/camera, `heavy` type, `pop` stamps.
- Entrances: glyph slots (mask + rise), wipes, line draws, scale from an anchor, morphs.
- Exits: the next shot pushes the previous one (pan, push, iris). No dip-to-black, no crossfades.
- Camera: whip pans (vertical and horizontal), iris through a map node, slow push-ins (≤3%).
- Motion blur: 60 fps, 8 subframes over a 180° shutter, blended in ffmpeg.

## Shot lengths and transitions
- 120 BPM; every shot starts on a bar line (2 s). Inside a shot, state changes land on beats (0.5 s).
- A new visual payoff every 2–4 s (see `docs/shotlist.md`).
- Transitions used once each where possible: vertical whip, accent wipe, horizontal push, iris,
  drop, collapse.

## Sound
- Warm, minimal house groove at 120 BPM in A minor (Am7 – Fmaj7 – C – G).
- Kick/clap/hats, round sub bass, soft electric-piano chords, a pentatonic pluck motif.
- UI SFX are tiny and dry: tick (rows, digits), pop (chips), thump (stamps), whoosh (transitions).

## Banned
Centered title on gradient · everything fading in · corner labels / frame borders / progress bars ·
glow on UI · particle bursts · emoji · flags or logos · `Math.random` · timers · CSS transitions.

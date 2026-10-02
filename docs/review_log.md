# Review log

Scores 1–10: hook · readability (360 px wide) · motion · variety · composition · accuracy · sound sync.
Each round lists the three worst problems, with timestamps, and what changed.

## Round 1 — stills (`npm run stills`, one frame per bar)

| hook | read | motion | variety | comp | accuracy | sound |
|------|------|--------|---------|------|----------|-------|
| 7    | 7    | –      | 8       | 6    | 8        | –     |

1. **0.0–2.0 s, hook.** "USD" clipped off the right edge of the price odometer and the
   headline sat too low; the ≠ read as decoration. Moved "USD" into the label, resized the
   odometers, put ≠ on its own rule between product price and total.
2. **Odometers everywhere (1.2 s, 47–50 s).** Digits rested half-rolled (e.g. 15,944.98 showed
   a 4 and a 5 at once). Rewrote `wheel()` as a mechanical counter: round to the nearest unit,
   carry only through the last 20 % of a step. Locked with tests in `film/draw.test.js`.
3. **30.8 s and 33.2 s, flete.** "50 × 40 × 30 ÷ 6000" and "¿CUÁL CONVIENE?" overflowed the safe
   area. Both lines now use `fit()`; the volumetric result line shares one fitted size.

Also: pedimento rows were cramped (39–42 s); row pitch raised to 118 px.

## Round 2 — motion (12-frame strips across every cut)

| hook | read | motion | variety | comp | accuracy | sound |
|------|------|--------|---------|------|----------|-------|
| 8    | 8    | 6      | 8       | 8    | 8        | 6     |

1. **All six cuts (4, 12, 22, 34, 46, 54 s).** The incoming scene only started drawing at its
   cut, so every transition had 2–5 frames of empty canvas. Scenes now declare `pre`/`post`
   windows and pre-roll under the outgoing move; Incoterms draws its diagram under the opening
   panel; Aduana's title is drawn inside the iris (`irisAt`) before the cut.
2. **3.6 s whip pan.** 30 fps × 4 subframes strobed into four ghost copies of the type. Final
   render is 60 fps × 8 subframes over a 180° shutter (`tools/render.mjs` defaults).
3. **Score.** Mix was squashed (-7.4 LUFS before normalization, LRA 1) and ticks/rolls were
   masked by the bass. Rebalanced bus gains, removed the heavy saturation stage, boosted the
   roll and tick SFX; master goes through two-pass loudnorm in `tools/mux.mjs`.

## Round 3 — encoded film (`npm run sheets`: contact, strip, phone)

| hook | read | motion | variety | comp | accuracy | sound |
|------|------|--------|---------|------|----------|-------|
| 8    | 8    | 8      | 8       | 7    | 8        | 8     |

The 60 fps × 8 strip through the 3.6 s whip is smooth (no ghost copies). The single smeared frame
on the contact sheet at 42 s is the pedimento's fast drop exit, which is intended.

1. **36.7–39.5 s, aduana requirements.** Three small rows ended at y ≈ 1000, leaving the lower
   third of the safe area empty while every other beat fills to ~1250–1500. Rows now use the same
   190 px pitch and 68 px type as the tariff tree, each with a mono sub-label (`ALTA ANTE EL SAT`,
   `INSCRIPCIÓN ANTE EL SAT`, `TE REPRESENTA EN LA ADUANA`), and start 0.1–0.2 s earlier so all
   three are readable together for ~1 s before the pedimento arrives.
2. **Master true peak -0.9 dBTP** (spec -1). AAC adds intersample overshoot after `loudnorm`;
   the loudnorm target is now -1.5 dBTP, which lands at -1.3 dBTP / -14.0 LUFS after encoding.
3. **Review tooling.** `fps=1` in `tools/sheets.sh` rounds to whole seconds, so the contact sheet
   was sampled at 1, 2, 3 … s instead of the 0.5 s offsets it claimed. Sheets now select frames by
   number, so timestamps are exact.

## Round 4 — independent watch of `out/final.mp4` (video-review model, picture only)

| hook | read | motion | variety | comp | accuracy | sound |
|------|------|--------|---------|------|----------|-------|
| 8    | 8    | 9      | 8       | 8    | 8        | 8     |

No blank frames, flicker, strobing, clipped or colliding text. Sequence matched the shot list.

1. **12.0–13.0 s, Incoterms title card.** Held ~1 s; "¿Quién paga cada tramo?" was still
   sliding in when the panel lifted. Panel now lifts at 13.5 s; the diagram build and the FOB
   indicator shift with it (FOB at 14.5 s, still on the beat grid).
2. **20.4–21.6 s, "OJO: ¿EL PEDIMENTO SALE A TU NOMBRE?"** Small and up ~1.2 s, the most important
   warning in the scene. DDP captions now come in 0.3–0.4 s earlier and the chip lands at 19.9 s at
   36 px (the widest that stays inside x ≤ 1008), held ~1.7 s before the push.
3. **47–51 s, cost stack.** Called dense. Kept as is: one layer per beat, then the full stack and
   both footnotes hold for ~5 s (48.5–53.5 s), which reads fine at phone size (`out/phone.png`).

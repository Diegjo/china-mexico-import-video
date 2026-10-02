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

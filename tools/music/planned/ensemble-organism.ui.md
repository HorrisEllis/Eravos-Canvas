# Tool UI — Ensemble Organism

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/ensemble-organism.preview.js` (the real kit, in the real canvas, silent) · pictures: `node docs/previews/ensemble-organism.shots.mjs`.

- **Tool:** `eravos.ensemble-organism` · effects · spec: `tools/music/planned/ensemble-organism.spec` (depth audit: ADDENDUM 2026-11-13)
- **Accent:** `#9fe0d0` — pale glass teal (no other tool's). One accent; the display is all teals.
- **Components it assembles (6 of 6 built):** ensemble-core ✓ · bbd-line ✓ · delay-line ✓ · lfo ✓ · stereo-tools ✓ · saturator-tape ✓ — every
  control names its element (ES1).
- **His words** (2026-11-13): "then i want the next set of high leverage tools" · "Push. The. Next tool."
- **Why it is not Mod Delay:** Mod Delay is one modulated line (chorus / flanger). This is 2–12 lines through a bucket-brigade chip, moving in
  phase sets — the string machine, the Juno, the Dimension, the tape choir.

## What it is for, in one line

Make one part sound like many — a string section's shimmer, a Juno's width, a choir of tapes — made live through a modelled chip.

## The face

| Card | Controls (kit parts) | Component |
|---|---|---|
| header | preset bar · **✦ BLOOM** (primary, hold) | own:bloom |
| MODE | segment Chorus / Ensemble / Flanger / Doubler · segment Machine Juno I / Juno II / Juno I+II / String Machine / Dimension | ensemble-core |
| display | every line as its delay over time (left lines left, right lines right; Spread 0 = one field), the chip's clock and bandwidth across the top, the hiss floor (Age) | all |
| LINES | Lines 2–12 · Spread | ensemble-core |
| MOTION | Rate · Depth · Shimmer | lfo, ensemble-core |
| BUCKET | Chip 512 / 1024 / 2048 / 4096 · Age (hiss + clock bleed) | bbd-line |
| TAPE | Drive | saturator-tape |
| OUT | Width · Mix | stereo-tools |

**Primary action:** ✦ Bloom — hold: deeper, all twelve lines, full width, over Bloom time; let go: back. A gate input (wire a pad or a step to it).
**Displays:** the lines (teals — C1/C2).

## More depth ▸

LINES+ Sets (even / 3-phase / pairs), Set offset · MOTION+ Shimmer rate, Shape, On the beat, Base · BUCKET+ Compand · DOUBLER Double at,
Wow, Feedback · TAPE+ Bias, Bump · OUT+ Bass mono, Level · BLOOM Bloom, Bloom time. 28 controls, 13 on the face.

## Play surfaces

None (an effect). Inputs: every knob automates; Bloom is a gate. Outputs: Motion (the sweep — wire it into a filter, a pan, anything) and
Bloom (the swell as it moves).

## Dynamic

Feedback dims unless Flanger; Double at and Wow dim unless Doubler; Shimmer rate dims with no shimmer; Set offset dims with one set — each says why.

## Sizes and layout

580 × 600 (min 460 × 440). Kit sizes only. The face fits without scrolling; More depth scrolls.

## Checklist

- [x] Surfaces are tokens only · [x] one accent, teals only · [x] kit parts at kit sizes · [x] one primary (Bloom) · [x] knob labels fit
- [ ] The preview was shown to him, and his answer is quoted here:
- [ ] After it is built: `node tests/design-check.mjs` reports it clean

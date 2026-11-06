# Tool UI — Tape Memory

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/tape-memory.preview.js` (the real kit, in the real canvas, silent) · pictures: `node docs/previews/lofi.shots.mjs`.

- **Tool:** `eravos.tape-memory` · effects · spec: `tools/music/planned/tape-memory.spec`
- **Accent:** `#d6b37a` — sun-faded cassette label (tan). One accent; the display is all tans.
- **Components it assembles:** delay-line ✓ · filter-svf ✓ · osc-noise ✓ · saturator-tape · bitcrusher · random-source · tape-transport
  (✓ built; the other four are built first, each proving its own numbers).
- **His words** (2026-11-05/06): "i also want to be able to make lofi" · "Lofi tools: UI previews first."
- **Why it is not Tape Echo:** Tape Echo already has wow, flutter, age and saturation — on the echoes. Tape Memory is the tape itself on
  the whole sound: hiss, crackle, dropouts, copies of copies, the machine's character, tape stop. No echo.

## What it is for, in one line

Make anything sound like it lived on a worn tape — the lofi signature — made live, never a recording.

## The face

| Card | Controls (kit parts) | Component |
|---|---|---|
| header | preset bar · **⏹ TAPE STOP** (primary) | tape-transport |
| MACHINE | segment cassette / vhs / reel / dictaphone | all (sets their character) |
| display | two reels turning (speed, wobble), the pitch line it plays at, dust drifting past, the hiss floor, dropouts | tape-transport, random-source |
| WEAR | Wear (moves everything at once) · Copies 1–8 | all |
| MOTION | Wow · Flutter · Speed | tape-transport, delay-line |
| DUST | Hiss · Crackle · Dropouts | osc-noise, random-source |
| TONE | Low cut · High cut · Saturate | filter-svf, saturator-tape |
| OUT | Mix · Level | — |

**Primary action:** ⏹ Tape stop — the tape slows to a stop over Stop time; again spins it back up (K3).
**Displays:** the cassette (tans — C1/C2).

## More depth ▸

MOTION+ Wow rate, Flutter rate, L/R drift, Wow on the beat (free / 1 bar / 2 bars / ½) · DUST+ Crackle size, Dropout length, Hiss tone ·
TAPE+ Head tilt (VHS tracking) · DIGITAL Bits, Sample rate · STOP Stop time. 24 controls, 13 on the face.

## Play surfaces

None (an effect). Inputs: Wear and Speed take modulation (an LFO on Speed = warble); Dropout is a modulation output (duck something on
each dropout).

## Dynamic

Head tilt dims unless VHS; Dropout length dims with no dropouts; Crackle size dims with no crackle — each says why.

## Sizes and layout

560 × 600 (min 440 × 440). Kit sizes only.

## Checklist

- [x] Surfaces are tokens only · [x] one accent, tans only · [x] kit parts at kit sizes · [x] one primary (Tape stop) · [x] knob labels fit
- [ ] The preview was shown to him, and his answer is quoted here
- [ ] After it is built: `node tests/design-check.mjs` reports it clean

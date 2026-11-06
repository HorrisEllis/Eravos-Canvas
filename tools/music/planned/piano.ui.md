# Tool UI — Piano (tine · reed · felt · upright · honky · grand)

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/piano.preview.js` (the real kit, in the real canvas, silent) · pictures: `node docs/previews/lofi.shots.mjs`.

- **Tool:** `eravos.piano` · instruments · spec: `tools/music/planned/piano.spec`
- **Accent:** `#e7b49b` — dusty rose (warm wood and felt). The spec's cream (#f2e8d5) made the chosen model unreadable on the kit's segment.
- **Engine (spec):** modelled, no sample library — a hammer exciting a tine + tonebar (tine), a reed (reed), or 1–3 detuned strings with
  stretched partials and a body (felt / upright / grand); sustain and sympathetic strings. Components: env-adsr ✓, lfo ✓ (tremolo),
  stereo-tools ✓ (✓ built) · modal-resonator, karplus-string, saturator-tube (drive) still to build, each proving its own numbers.
- **His words** (2026-11-05/06): "i also want to be able to make lofi" · "Lofi tools: UI previews first."

## What it is for, in one line

The keys of lofi and soul — the electric piano's ring and tremolo, the soft felt upright — played live, every note modelled.

## The face

| Card | Controls (kit parts) | Component |
|---|---|---|
| header | preset bar · **Model** segment tine / reed / felt / upright / honky / grand | all |
| display | the hammer striking what sounds (tine and tonebar, reed, strings), ringing down; its stretched partials; the tremolo L↔R | modal-resonator, karplus-string |
| PLAY | Sustain pedal (also from MIDI CC64) | — |
| STRIKE | Hammer · Bright · Bell | modal-resonator |
| BODY | Decay · Release · Resonance | env-adsr, resonator |
| MOVE | Tremolo · Trem rate | lfo, stereo-tools |
| OUT | Drive · Width · Level | saturator-tube, stereo-tools |
| keys | the kit keyboard (every key its own note) | — |

**Primary action:** none needed — the keys play it (like Retro Poly).
**Displays:** the strike and the partials (rose — C1/C2), the spectrum (kit), the keyboard (kit).

## More depth ▸

STRING+ String detune, Stretch, Sympathetic · PLAY+ Velocity curve, Key-off thump, Pedal noise · MIC Mic X, Mic Y, Lid · Tremolo on the
beat (free / ¼ / ⅛ / ⅛t / 1/16). 22 controls, 12 on the face.

## Dynamic

Bell and Tremolo dim on the acoustic models; Sympathetic dims on tine and reed; Lid is the grand's only — each says why.

## Sizes and layout

600 × 640 (min 460 × 480). Kit sizes only.

## Checklist

- [x] Surfaces are tokens only · [x] one accent · [x] kit parts at kit sizes · [x] no primary needed (keys) · [x] knob labels fit
- [x] The preview was shown to him, and his answer is quoted here:
  > "yes" (2026-11-06, to the lofi previews and specs — Tape Memory, Piano, the Lofi setup, Bind on the lane)
- [ ] After it is built: `node tests/design-check.mjs` reports it clean

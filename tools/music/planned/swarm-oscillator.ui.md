# Tool UI — Swarm Oscillator

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/swarm-oscillator.preview.js` (the real kit, in the real canvas, silent) ·
pictures: `node docs/previews/swarm-oscillator.shots.mjs` · checks: `node docs/previews/swarm-oscillator.check.mjs`.

- **Tool:** `eravos.swarm-oscillator` · genre instruments (synthwave / retro) · spec: `tools/music/planned/swarm-oscillator.spec`
- **Accent:** `#8a5cff` — electric violet (beside Retro Poly's magenta, its own colour). One accent; the display's colours are all violets.
- **Components it assembles:** oscillator-population · osc-va · osc-wavetable · filter-svf (built) · env-adsr · lfo · stereo-tools
- **Why this one first:** the highest-leverage tool of phase 1 — 6 components still to build (the fewest but one), and those six reach
  the most other planned tools (14.5 each on average; LFO alone reaches 24). Built, it unlocks most of phase 1.
- **His words** (2026-11-06): "UI preview. What’s the highest leverage?" · "Need to make sure the ui is consistent, supports reactive
  colors and can be added to the timeline and connected as mods or other tools when applicable. Dynamic as possible. As much power and
  control as possible without making it overwhelming. Hardcoded or static earns its place."

## What it is for, in one line

Unison that is alive: the voices pull on each other — drift apart, beat, lock into one wave — and how locked they are is itself a signal.

## The face

| Card | Controls (kit parts) | Component |
|---|---|---|
| header | preset bar · **Mode** segment free / coupled / harmonic / chaotic | oscillator-population |
| display | the swarm (each voice a dot on its orbit, pulled toward the centre) · **Coherence** meter 0–1 (apart / beating / locked) | oscillator-population |
| OSC / LOCK row | **Shape** saw / pulse / tri / table · **Lock on beat** off / ¼ / ½ / bar | osc-va, osc-wavetable · transport |
| SWARM | Voices 1–32 · Spread · Coupling · Cluster | oscillator-population, unison |
| TONE | Cutoff · Res · Attack · Release | filter-svf, env-adsr |
| OUT | Width · Level | stereo-tools |

**Primary action:** none needed — the keys play it (like Retro Poly).
**Displays:** the swarm and the coherence meter (violets), the spectrum (kit), the keyboard (kit).

## More depth ▸

SWARM+ Pull, Drift · OSC+ Table, Sub, Octave · FILTER+ / AMP+ Env amt, Decay, Sustain · MOVE LFO rate, LFO→Pull · OUT+ Mono below.
Nothing is outside his control: 22 controls, 10 on the face.

## What earns its place (hardcoded or static only when it has to be)

- **Dynamic:** a control that does nothing in the current state dims and says why on hover — Coupling / Pull / LFO→Pull in *free*,
  Cluster outside *harmonic*, Table unless the shape is *table* (the Wobble Bass way).
- **Every knob can be moved:** 22 knob inputs (right-click any knob → LFO, Envelope, Wub Rate, XY Pad, Macro, or a tool already on the
  canvas), plus own audio-rate inputs for Coupling and Cutoff.
- **It moves other tools:** **Coherence out** (how locked the swarm is) and **Curve out** (its pitch curve) — wire either to any knob.
- **Timeline:** it takes notes, so the Timeline lists it as an instrument (note clips, piano roll, a Pitch lane, every knob as a lane).
- **Reactive colours:** every colour it draws or styles is a literal colour, so Reactive colours (Beat, Changing, …) light it like
  every other tool; surfaces stay black (BlackSurfaces).
- **Static on purpose:** the four modes (each is a different physics, not a setting), the shape list, the Lock divisions (musical
  values only). Everything else is a continuous control.

## Play surfaces

The kit keyboard (C3–C5, follows the key). No new kit part.

## Sizes and layout

580 × 660, minimum 460 × 480 (as Retro Poly). Knobs at the kit's 32. More depth opens below the face.

## Checklist

- [x] Surfaces are tokens only — measured: no tint inside the tool (the 2 flagged, `wm-vol` and `port-label`, are window chrome, the same on Retro Poly)
- [x] One accent; every gradient within its family (violets only)
- [x] Every control is a kit part at a kit size — D2, D4: 0
- [x] One primary action at most — D5: 0
- [x] Every knob label fits — D3: 0
- [x] Timeline lists it · an LFO wire into Coupling works · its Coherence wire into Retro Poly's cutoff works (`swarm-oscillator.check.mjs`)
- [ ] The preview was shown to him, and his answer is quoted here: > "…"
- [ ] After it is built: `node tests/design-check.mjs` reports it clean (N2)

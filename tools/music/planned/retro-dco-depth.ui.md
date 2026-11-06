# Tool UI — Retro DCO, the new depth

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/retro-dco-depth.preview.js` (the real kit, in the real canvas, silent; the handles work) · picture:
`node docs/previews/retro-dco-depth.shots.mjs` → `docs/previews/retro-dco-depth-preview.png`.

- **His words (2026-11-06):** "I like the new retro tool. What about the shapes and modularity. Like the supersaw amp or like the wobble
  base" · "Like as much ways to manipulate sound as possible. Especially per tool."
- **Where it goes:** under Retro DCO's More depth ▸ (the face stays as approved), one section each, in this order.

| Section | What you do | The shared part it lives in (every tool can take it) |
|---|---|---|
| ENVELOPES | amp + filter shown as shapes; drag A / D / S / R; a bend handle on every segment (Supersaw's, plus curves) | env-adsr gains segment curves; the editor becomes a kit part (`UI.EnvelopeEditor`) |
| LFO SHAPE | draw the motion (add / drag / double-click remove points), Smooth, start from sine · triangle · saw · square · random, Sync to the beat | Wobble Bass's drawn shape moves INTO the lfo component (today it is Wobble Bass's own code) — one drawing for every tool |
| WAVE | draw one cycle; Morph from the classic DCO wave (saw / pulse / triangle / sine) to yours | osc-wavetable (a drawn table); osc-va stays the band-limited classic |
| MOD MATRIX | 6 rows: any source (LFO, LFO 2, amp env, filter env, velocity, key, card, random, mod wheel, aftertouch) → any destination (pitch, width, saw, pulse, sub, noise, cutoff, res, drive, pan, level, chorus mix, LFO rate, wave morph), an amount −1…1 | a new mod-matrix component (sources and destinations named by the tool; the routing is the same everywhere) |
| OPEN AS PARTS | ⧉ Open as parts: the tool opens on the canvas as its components, wired as it plays — rewire, swap a part, plug another tool in | the canvas's suites / components (the Components tab's "comes out of it"), Retro DCO first |

Decisions for him: the look (shown); which first (proposal: the shared lfo drawing and env curves — they reach every tool — then the matrix,
the drawn wave, open as parts).

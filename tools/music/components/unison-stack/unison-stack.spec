# spec_id: eravos.component.unison-stack · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: unison-stack ; group: sources ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: 1–16 voices of any source: detune curve (linear, exp, supersaw-style), spread, blend, per-voice phase (free, reset, seeded random)
  extract from: supersaw, wobble-bass voices (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: fm-matrix · hoover-engine · lead-glide · morph-engine · pad-forge · pluck-forge · reese-architecture · retro-dco · riser-forge · supersaw-cathedral · wub-organism
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel UnisonStack(): layout(voices 1–16, detune 0–1 → ±100 cents at the outer voice, curve 0 linear · 1 exp · 2 supersaw x·(0.25+0.75x²), spread 0–1 equal-power pan θ=(x·spread+1)·π/4, blend 0–1 centre 1−0.4·blend / sides blend, all ÷ √n, phase 0 free · 1 reset · 2 seeded random) → per voice cents, pan, gain, gainL, gainR, phase (preallocated Float64Array(16)); no audio of its own (any source plays once per voice); latency 0; cost: a layout per note or per change, not per sample
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (unison-stack.test.mjs, 95 checks: Supersaw's layout voice for voice, curves, pan power, clamps, seeded phase, 7 osc-va saws beat); moving supersaw and wobble-bass onto it is the later step that must null-render
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

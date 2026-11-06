# spec_id: eravos.component.stereo-tools · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: stereo-tools ; group: space ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: M/S balance, width, Haas, mono-below crossover, correlation output
  extract from: wobble-bass (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: echo-architecture · ensemble-organism · fx-dub-echo · layer-architect · low-end-anchor · phase-weaver · reese-architecture · spatial-organism · spectral-creature · sub-architect · supersaw-cathedral · swarm-oscillator · translation-check · wub-organism
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel: pan(x) equal-power gains for x −1…1 · spread(i, n, width) the i-th of n voices across the field · MonoBelow(): Linkwitz–Riley 2nd-order split (12 dB/oct, sums flat) at 20–400 Hz, below it mid only · width 0…2 on M/S · correlation of a block −1…1
  stands on: —
  status: building 2026-11-06 — NEW code proved on its own (stereo-tools.test.mjs); extraction from wobble-bass (width, mono below) — extraction must null-render
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

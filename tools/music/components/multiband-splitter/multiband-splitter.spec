# spec_id: eravos.component.multiband-splitter · version 0.1.0 · status built (3.243, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: multiband-splitter ; group: shapers ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: 2–6 bands, Linkwitz-Riley 24/48 dB or linear-phase; each band a slot for any mod chain
used by: harmonic-weapon · layer-architect · low-end-anchor · multiband-crush · pump-shaper · reese-architecture · sound-system-sim · spectral-creature · wub-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.243), for Collision (specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)); the original above kept verbatim
his words (2026-11-27): "the frequencies how the collide" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
stands on: nothing
job (as built): 2 or 3 bands, Linkwitz-Riley 24 dB/oct, summing flat
code: multiband-splitter.js (MusicParts) · contract multiband-splitter.contract.json · proof multiband-splitter.test.mjs (node tools/music/components/multiband-splitter/multiband-splitter.test.mjs)

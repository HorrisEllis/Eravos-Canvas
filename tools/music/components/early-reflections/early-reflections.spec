# spec_id: eravos.component.early-reflections · version 0.1.0 · status built (3.244, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: early-reflections ; group: space ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: room geometry taps: size, shape, absorption, listener position
used by: gated-room · sound-system-sim · space-sculptor · spatial-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.244), for Spatial Organism (specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)); the original above kept verbatim
his words (2026-11-27): "i want a bunch of spacial tools and ui elements for components" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
stands on: nothing
job (as built): twelve shoebox echoes: size, pre-delay, absorption per bounce, damping, spread
code: early-reflections.js (MusicParts) · contract early-reflections.contract.json · proof early-reflections.test.mjs

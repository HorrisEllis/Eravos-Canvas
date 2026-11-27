# spec_id: eravos.component.masking-analyzer · version 0.1.0 · status built (3.240, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: masking-analyzer ; group: analysis ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: per-band masking of track A by track B (critical-band model)
used by: sonic-contrast-engine · spectral-negotiator
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.240), for Collision (specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)); the original above kept verbatim
his words (2026-11-27): "the frequencies how the collide" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
stands on: nothing
job (as built): per third-octave band, how much two spectra collide (0…1) and a weighted total
code: masking-analyzer.js (MusicParts) · contract masking-analyzer.contract.json · proof masking-analyzer.test.mjs (node tools/music/components/masking-analyzer/masking-analyzer.test.mjs)

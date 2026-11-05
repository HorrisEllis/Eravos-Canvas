# spec_id: eravos.component.filter-formant · version 1.0.0 · status built (P0.5, 2026-11-05: filter-formant.js + .test.mjs; used by wobble-bass, wub-filter) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: filter-formant ; group: filters ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: vowel morph (9+ vowels, user vowels), formant shift ±24 st, gender, Q
  extract from: wub-filter formant (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: air-horn · growl-forge · poly-filter-matrix · screech-engine · spectral-creature · voice-architect · wub-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

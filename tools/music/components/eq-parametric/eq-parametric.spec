# spec_id: eravos.component.eq-parametric · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: eq-parametric ; group: filters ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: up to 24 bands, minimum/linear phase, dynamic bands with sidechain, M/S per band
  extract from: fx-eq (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: drum-foundry · field-weaver · fx-spring · gated-room · hard-kick-forge · harmonic-weapon · low-end-anchor · multiband-crush · reference-match · rumble-kick · sound-system-sim · space-sculptor · spectral-negotiator · translation-check
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

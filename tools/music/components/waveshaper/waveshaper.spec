# spec_id: eravos.component.waveshaper · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: waveshaper ; group: shapers ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: transfer curve: tanh, asym, sine, user-drawn; bias; pre/post filter; oversampler-aware
  extract from: fx-destroyer shaper (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: acid-line · air-horn · baile-engine · cowbell-lead · drum-foundry · dub-siren · feedback-reactor · glide-808 · growl-forge · hard-kick-forge · harmonic-weapon · hoover-engine · log-drum · organ-bass · poly-filter-matrix · resample-forge · rumble-kick · screech-engine · spectral-creature · sub-architect · wub-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

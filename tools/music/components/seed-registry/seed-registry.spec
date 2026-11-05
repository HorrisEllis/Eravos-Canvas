# spec_id: eravos.component.seed-registry · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: seed-registry ; group: structure ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: project-wide deterministic seeds: per tool, per lane, per render; 'reroll' writes a new seed, never hidden state
used by: analog-drift · contrast-engine · controlled-chaos · entropy-budget · fill-generator · groove-organism · live-commit · melody-organism · memory-echo · parameter-weather · relational-modulation · sound-match · timbre-genome
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

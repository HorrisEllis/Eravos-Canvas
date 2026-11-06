# spec_id: eravos.component.seed-registry · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: seed-registry ; group: structure ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: project-wide deterministic seeds: per tool, per lane, per render; 'reroll' writes a new seed, never hidden state
used by: analog-drift · contrast-engine · controlled-chaos · entropy-budget · fill-generator · groove-organism · live-commit · melody-organism · memory-echo · parameter-weather · relational-modulation · sound-match · timbre-genome
inputs / outputs / limits (written 2026-11-06 for the Pattern Editor; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): Seeds() { seed(path) → a 32-bit seed for 'project/tool/lane/…' (derived from the project seed + the path, stable), set(path, s), reroll(path) → a new one (written, never hidden), rng(seed) → mulberry32 () → 0…1, history(path) }
  stands on: —
  status: building 2026-11-06 — proved on its own (seed-registry.test.mjs); new code
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

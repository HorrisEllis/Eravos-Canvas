# spec_id: eravos.component.relationship-graph · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: relationship-graph ; group: structure ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: the relational core: typed nodes/edges, cycle detection, explicit feedback nodes with one-block delay, topological evaluation
  extract from: motion.js (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: counter-motion · entropy-budget · feedback-reactor · macro-rack · oscillation-ecology · oscillation-matrix · parameter-weather · relational-modulation · sonic-contrast-engine · sonic-gravity · spectral-negotiator · tension-field · tension-to-release
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

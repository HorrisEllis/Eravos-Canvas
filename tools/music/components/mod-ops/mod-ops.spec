# spec_id: eravos.component.mod-ops · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: mod-ops ; group: modulation ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: the §5 modulation operations: add, multiply, scale, offset, invert, rectify, quantize, clamp, smooth, curve-map, compare, condition, interpolate, combine
used by: controller-mapper · counter-motion · gesture-capture · macro-rack · motion-extractor · oscillation-matrix · relational-modulation
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

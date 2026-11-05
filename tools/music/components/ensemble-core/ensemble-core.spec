# spec_id: eravos.component.ensemble-core · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: ensemble-core ; group: time ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: multi-tap modulated lines with phase-offset LFO sets (chorus, ensemble, string machine)
used by: air-horn · ensemble-organism · hoover-engine · retro-dco · supersaw-cathedral
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

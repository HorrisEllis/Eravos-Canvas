# spec_id: eravos.component.envelope-follower · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: envelope-follower ; group: dynamics ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: peak/RMS follower with attack, release, hold, band focus; outputs modulation
used by: feedback-reactor · low-end-anchor · motion-extractor · pump-shaper · relational-modulation · sound-state-machine · sub-architect
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

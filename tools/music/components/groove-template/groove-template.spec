# spec_id: eravos.component.groove-template · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: groove-template ; group: events ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: per-16th timing/velocity/length maps; extract from MIDI or audio; amount
used by: baile-engine · bassline-writer · break-architect · chop-station · club-bounce · dub-skank · garage-skip · groove-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

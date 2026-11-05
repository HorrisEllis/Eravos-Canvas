# spec_id: eravos.component.pitch-shifter · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: pitch-shifter ; group: time ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: granular and PSOLA shift ±48 st, formant preserve, low-latency mode
  extract from: fx-pitch (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: bend-lab · echo-architecture · garage-skip · granular-mutation · memory-echo · resample-forge · riser-forge · screech-engine · shimmer-engine · time-mutation · voice-architect
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

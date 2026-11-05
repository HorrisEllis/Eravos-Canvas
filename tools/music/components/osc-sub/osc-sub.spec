# spec_id: eravos.component.osc-sub · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: osc-sub ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: sub oscillator −1/−2 oct, sine/triangle/square/rounded-square, phase reset to note, kick-phase align input
  extract from: wub-sub, sub-engine (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: glide-808 · hard-kick-forge · log-drum · retro-dco · spectral-creature · sub-architect · wub-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# spec_id: eravos.component.ducker · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: ducker ; group: dynamics ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: volume shape triggered by notes/transport/audio (no audio needed): drawn curve, depth, tempo-synced length
  extract from: sidechain-compressor (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: baile-engine · echo-architecture · filter-house · garage-skip · gated-room · live-looper · psy-roller · pump-shaper · rhythmic-modulator · rumble-kick · space-sculptor · sub-architect · supersaw-cathedral
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

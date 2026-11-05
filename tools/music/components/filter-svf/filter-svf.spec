# spec_id: eravos.component.filter-svf · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: filter-svf ; group: filters ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: LP/HP/BP/notch/peak/shelves, 12/24/36 dB, key-track, env and velocity inputs, 16 Hz–20 kHz, stable to self-oscillation
  extract from: fx-filter, wub-filter (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: chop-station · cowbell-lead · drum-foundry · dub-siren · dub-skank · dub-techno-chord · echo-architecture · feedback-reactor · filter-house · fm-matrix · fx-dub-echo · fx-rewind · glide-808 · granular-mutation · growl-forge · hard-kick-forge · hoover-engine · log-drum · micro-percussion · morph-engine · organ-bass · pad-forge · percussion-physics · pluck-forge · poly-filter-matrix · psy-roller · rave-stab · reese-architecture · resample-forge · retro-dco · riser-forge · rumble-kick · sample-universe · shimmer-engine · sub-architect · supersaw-cathedral · swarm-oscillator · tape-memory · wub-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

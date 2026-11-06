# spec_id: eravos.component.lfo · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: lfo ; group: modulation ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: shapes + drawn, sync incl. dotted/triplet/1/64, phase, fade-in, smoothing, retrigger modes, stereo phase offset
  extract from: lfo (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: bend-lab · drone-engine · dub-siren · dub-techno-chord · echo-architecture · ensemble-organism · filter-house · fm-matrix · granular-mutation · growl-forge · lead-glide · morph-engine · oscillation-matrix · pad-forge · phase-weaver · reese-architecture · retro-dco · rhythmic-modulator · screech-engine · shimmer-engine · space-sculptor · spatial-organism · spectral-creature · swarm-oscillator · wub-organism
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel LFO(): shapes sine · triangle · saw up · saw down · square · sample&hold (seeded) · smooth random; rate 0.01–50 Hz; phase 0–1; fade-in 0–10 s from (re)start; output −1…1 (bipolar) or 0…1 (unipolar); one value per sample, no allocation
  stands on: —
  status: building 2026-11-06 — NEW code proved on its own (lfo.test.mjs); extraction from lfo (today's LFO tool: 9 shapes incl. drawn, tempo sync, retrigger) — extraction must null-render; tempo sync and drawn shapes come with it
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

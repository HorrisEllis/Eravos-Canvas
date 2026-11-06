# spec_id: eravos.component.saturator-tube · version 0.1.0 · status built (2026-11-06, for Piano — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: saturator-tube ; group: shapers ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: triode/pentode style asymmetry, bias drift, even/odd balance
used by: piano · harmonic-weapon · reese-architecture
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel TubeSat(): stereo audio in/out. drive 0–24 dB into a triode-like curve (soft on the way up, harder on the way down — the
  asymmetry is even harmonics), bias 0–1 (how asymmetric), a DC blocker after it (the asymmetry's offset never leaves), tone (a gentle
  tilt, −1…1), mix 0–1, out −24…+6 dB. Faded in over the first 6 dB, so drive 0 is the signal exactly. Latency 0; cpu ~15 ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

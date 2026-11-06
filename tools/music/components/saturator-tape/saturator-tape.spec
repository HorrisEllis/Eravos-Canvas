# spec_id: eravos.component.saturator-tape · version 0.1.0 · status building (2026-11-06, for Tape Memory — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: saturator-tape ; group: shapers ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: tape saturation with hysteresis, head bump, wow/flutter output to a delay-line
  extract from: fx-echo (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: echo-architecture · ensemble-organism · fx-dub-echo · harmonic-weapon · tape-memory
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel TapeSat(): stereo audio in/out. drive 0–24 dB into a biased soft clip with a little memory (hysteresis: the
  curve leans on the last sample, so rising and falling edges differ) between a pre-emphasis (+6 dB shelf above ~3 kHz) and its exact
  inverse; bias 0–1 (even harmonics); bump 0–6 dB at bumpFreq 30–200 Hz (the head bump, a peaking filter); hf 2 000–22 000 Hz (gap loss,
  a 2-pole low-pass; 22 000 and up = off) · mix 0–1 · out −24…+6 dB. At drive 0 with bias, bump and hf off it is transparent (< −60 dB).
  Latency 0; cpu ~40 ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

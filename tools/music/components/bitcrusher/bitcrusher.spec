# spec_id: eravos.component.bitcrusher · version 0.1.0 · status building (2026-11-06, for Tape Memory — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: bitcrusher ; group: shapers ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: bits 1–24, sample-rate reduction with or without aliasing filter, jitter, dither
  extract from: fx-destroyer (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: chop-station · harmonic-weapon · tape-memory
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Crusher(): stereo audio in/out. bits 1–24 (mid-tread quantiser, 24 = transparent) · rate 200 Hz – the context's rate
  (sample-and-hold by a fractional phase; ≥ the context's rate = off) · aa 0/1 (a 4-pole low-pass at rate/2 before the hold: the clean
  way down) · jitter 0–1 (the hold's timing wanders by up to half a period, seeded) · dither 0/1 (TPDF, ±1 LSB) · mix 0–1. Latency 0;
  cpu ~15 ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

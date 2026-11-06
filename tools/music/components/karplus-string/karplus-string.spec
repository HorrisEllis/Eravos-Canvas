# spec_id: eravos.component.karplus-string · version 0.1.0 · status built (2026-11-06, for Piano — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: karplus-string ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: plucked/bowed string model: exciter, damping, stiffness, body coupling, decay
used by: piano · percussion-physics · pluck-forge
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel KString(): mono, per sample — tick(excitation) → the string. set(f0, sr, { t60, bright, stretch, detune }): the loop is a
  delay line tuned EXACTLY (integer delay + a first-order allpass for the fraction, the loop filter's own delay subtracted), a one-pole
  loop low-pass (bright 0–1), a loss per pass set from t60 (the decay at f0), and a stiffness cascade of first-order allpasses (stretch
  0–1: higher partials sharper, as a piano's). 20 Hz – 5 kHz. reset() · energy. Latency 0; cpu ~10 ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

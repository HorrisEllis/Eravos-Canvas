# spec_id: eravos.component.osc-sub · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: osc-sub ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: sub oscillator −1/−2 oct, sine/triangle/square/rounded-square, phase reset to note, kick-phase align input
  extract from: wub-sub, sub-engine (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: glide-808 · hard-kick-forge · log-drum · retro-dco · spectral-creature · sub-architect · wub-organism
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Sub(): next(freq, sr, octave 0 / −1 / −2, shape) → a sample in −1…1; shapes sine · triangle · square (polyBLEP) · rounded square (tanh 2 of a sine); reset() phase 0 rising (per note), align(p) (to a kick); no DC; phase kept through glides; latency 0; cpu 42 ns per sample
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (osc-sub.test.mjs, 31 checks: exact octaves for every shape, no DC / no even harmonics, square 1/n, triangle 1/n², rounded square between them, polyBLEP aliases 13.5 dB under a naive square at 3.7 kHz, reset / align, deterministic, glide without a click); moving wub-sub and sub-engine onto it is the later step that must null-render
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

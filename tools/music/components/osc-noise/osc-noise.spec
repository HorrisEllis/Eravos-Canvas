# spec_id: eravos.component.osc-noise · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: osc-noise ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: white, pink, brown, velvet, crackle and band-limited noise; seedable; colour tilt
used by: analog-drift · drum-foundry · micro-percussion · percussion-physics · retro-dco · riser-forge · tape-memory
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Noise(): stereo out, no input; colour 0 white · 1 pink (−3 dB/oct) · 2 brown (−6 dB/oct) · 3 velvet (density ±1 impulses a second) · 4 crackle (density clicks a second, Poisson) · 5 band-limited (rate points a second, Catmull-Rom: flat to 0.3 × rate); tilt −1…1 (±6 dB either side of 1 kHz); width 0–1 (same → independent, power kept); level; seed by reset(seed) (xorshift32); all AudioParams (colour k-rate); latency 0; cpu 143 ns per stereo sample
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (osc-noise.test.mjs, 32 checks: spectra measured by Welch's method — white 0, pink −3, brown −6 dB/oct; velvet exact count and flat; crackle rate; band-limited corner; tilt equal to its transfer function; seed reproducible; width correlation)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

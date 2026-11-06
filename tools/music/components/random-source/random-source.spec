# spec_id: eravos.component.random-source · version 0.1.0 · status built 2026-11-06 (for Tape Memory — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: random-source ; group: modulation ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: seeded S&H, smooth random, distributions (uniform, gaussian, beta, user histogram)
used by: analog-drift · controlled-chaos · entropy-budget · granular-mutation · parameter-weather · tape-memory · timbre-genome
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Random(): no audio in; 2 channels out — ch0 the random value (offset + depth · v, v in −1…1, or 0…1 when unipolar), ch1 an
  event gate (0/1). rate 0.01–200 Hz (a new value per period) · smooth 0–1 (0 = sample-and-hold steps, 1 = a cosine glide to the next) ·
  dist 0 uniform · 1 gaussian (σ = 1/3 of the range, clipped) · 2 beta (a, b 0.1–20, Marsaglia–Tsang gammas) · 3 histogram (user weights,
  up to 32 bins) · seed 1–2³¹ (k-rate; the same seed gives the same values, sample for sample) · density 0–200 events/s (Poisson) ·
  eventLen 0.0005–2 s · depth 0–1 · offset −1…1 · unipolar 0/1. Also plain JS: MusicParts.rng(seed) → mulberry32. Latency 0; cpu a few
  ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# ---- built 2026-11-06 (everything above kept)
built: NEW code proved on its own — random-source.test.mjs, 18 checks: seeded (the same seed repeats sample for sample), S&H steps exactly on time, smooth continuous, uniform / gaussian / beta(2,5) / histogram statistics, Poisson events at the density with exact lengths, a minute finite, the worklet = the kernel. Loaded in the page by the tool that first uses it (Tape Memory).


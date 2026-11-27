# spec_id: eravos.component.tension-meter · version 0.1.0 · status built (3.243, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: tension-meter ; group: analysis ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: harmonic, rhythmic, spectral, density and pitch-instability tension → one curve + per-domain curves
used by: drop-compiler · harmony-architect · musical-friction-engine · rhythmic-tension-mapper · tension-field · tension-to-release
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.243), for Tension Field (specs/eravos.contrast-space.spec, CS5); the original above kept verbatim
his words (2026-11-27): "the way it creates ripples and tension" · "actually continue with the tensino field then release first."
stands on: nothing
job (as built): loudness, brightness, density, motion heard from audio (each 0…1) and their weighted sum; harmonic and pitch-instability open (they read notes)
code: tension-meter.js (MusicParts) · contract tension-meter.contract.json · proof tension-meter.test.mjs

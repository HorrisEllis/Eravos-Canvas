# spec_id: eravos.component.ensemble-core · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: ensemble-core ; group: time ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: multi-tap modulated lines with phase-offset LFO sets (chorus, ensemble, string machine)
used by: air-horn · ensemble-organism · hoover-engine · retro-dco · supersaw-cathedral
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Ensemble(): mono in (or the mean of two), stereo out; taps 1–8 (LFO phase k/taps, alternating sides, spread 0–1) · base 0.5–40 ms + depth 0–20 ms × LFO 1 (0.01–20 Hz) + depth2 0–10 ms × LFO 2 · shape sine / triangle · mix; machines as data ENSEMBLE_MODES (juno I, II, I+II, string machine, dimension); all AudioParams; latency = base; cpu 195 ns per stereo sample (3 taps, 2 LFOs)
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (ensemble-core.test.mjs, 20 checks: dry exact, a tap = base exactly, taps evenly around the LFO (average = base at every moment), Juno taps opposite, pitch wobble = 2π·rate·depth·f within 12 %, triangle = steady offsets, spread 0 mono / 1 decorrelated, wet level ≈ input, every machine bounded, limits bounded)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

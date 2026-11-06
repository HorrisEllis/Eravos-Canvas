# spec_id: eravos.component.scale-key · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: scale-key ; group: musical ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: scales, modes, tunings (EDO, ratios, Scala), snap
  extract from: music-theory.js, xen-theory.js (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: arpeggio-evolution · bassline-writer · controlled-chaos · counterpoint-engine · cowbell-lead · glide-808 · harmony-architect · log-drum · melody-organism · mpe-surface · musical-friction-engine · sonic-gravity
inputs / outputs / limits (written 2026-11-06 for the Pattern Editor; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): SCALES (the same 11 as MusicTheory) · inScale(midi, root, scale) · quantize(midi, root, scale) (ties go down) · degreeToMidi(degree, octave, root, scale) · degreeOf(midi, root, scale) · step(midi, steps, root, scale) (move by scale steps) · rel ↔ abs (semitones from the root) — equals MusicTheory on every 12-tone input (proved); EDO, ratios and Scala later (xen-theory)
  stands on: —
  status: building 2026-11-06 — proved on its own (scale-key.test.mjs); extraction from music-theory.js / xen-theory.js — scale-key is proved equal to MusicTheory for 12-TET; moving MusicTheory onto it is a later step
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

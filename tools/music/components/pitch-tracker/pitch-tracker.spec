# spec_id: eravos.component.pitch-tracker · version 0.1.0 · status built (3.249, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: pitch-tracker ; group: analysis ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: pYIN pitch + confidence, mono; polyphonic estimate offline
used by: audio-deconstructor · field-weaver · motion-extractor · resynthesis-forge · sound-match · voice-architect
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.249), VL1 of the Voice Lab (specs/eravos.voice-lab.spec ADDENDUM 2026-11-27); the original above kept verbatim
his words (2026-11-27): "Voice tools. Like recording. Making sound like the tools? Full editing and modulation. Full t pain auto tune. Synthesized voice. Everything needed for remixing, EDM; dubstep."
stands on: nothing
job (as built): YIN with the octave guard (the first dip under the threshold) and parabolic interpolation; confidence, voiced, a gate;
  frame 2048, hop 256; mono, real time. The pYIN probabilistic smoothing and the polyphonic estimate: open.
measured: sines 82–988 Hz within 0.2 cents (±3 asked); sung vowels AH / OO / EE within ±3 cents, > 95 % voiced; a 2nd harmonic twice the
  fundamental still reads the fundamental; noise, silence and under −50 dBFS unvoiced; a glide followed within 15 cents.
code: pitch-tracker.js (MusicParts.PitchTracker) · contract pitch-tracker.contract.json · proof pitch-tracker.test.mjs (17 checks)

# spec_id: eravos.component.osc-wavetable · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: osc-wavetable ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: tables × frames, mip-mapped; position, frame interpolation, warp modes (bend, sync, mirror, phase-distort, FM-from-input, remap curve); user tables from audio
  extract from: syn-osc banks, wobble-bass 4.x tables (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: lead-glide · morph-engine · pad-forge · pluck-forge · reese-architecture · resynthesis-forge · spectral-creature · swarm-oscillator · wub-organism
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel WT(): tables × frames (2048 samples), built from harmonic recipes (no recordings), mip-mapped per octave (no partial above Nyquist); position 0…1 morphs frames (linear between neighbours); output −1…1; built-in table: sine → triangle → saw → square → pulse → formant
  stands on: —
  status: building 2026-11-06 — NEW code proved on its own (osc-wavetable.test.mjs); extraction from syn-osc banks, wobble-bass 4.x tables — extraction must null-render; user tables from your own audio come later
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

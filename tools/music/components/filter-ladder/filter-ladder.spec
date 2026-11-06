# spec_id: eravos.component.filter-ladder · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: filter-ladder ; group: filters ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: 4-pole ZDF ladder with drive inside the loop, bass compensation, 2/4-pole taps
used by: lead-glide · poly-filter-matrix · retro-dco
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Ladder(): stereo audio in/out; frequency 16 Hz–20 kHz (< 0.49·sr) + detune cents · resonance 0–1 (k = 4.2·res, self-oscillates past 0.95) · drive 0–36 dB (tanh inside the loop, small-signal level kept) · bass 0–1 (input × (1+k·bass)) · mode 0 LP24 · 1 LP12 · 2 BP12 · 3 HP12 · 4 HP24; all AudioParams (mode k-rate); latency 0; cpu 148 ns per stereo sample (node, this machine)
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (filter-ladder.test.mjs, 36 checks: −12.04 dB at cutoff, 24/12 dB per octave, taps, resonance peak at the cutoff, bass compensation, drive harmonics, self-oscillation bounded 20 s near the cutoff, audio-rate FM bounded)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

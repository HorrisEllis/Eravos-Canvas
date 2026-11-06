# spec_id: eravos.component.delay-line · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: delay-line ; group: time ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: fractional modulated delay up to 20 s, tempo sync, filtered/saturated feedback, freeze, pitch on time change (tape) or none (digital)
  extract from: fx-echo, fx-moddelay (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: acid-line · dub-techno-chord · echo-architecture · ensemble-organism · feedback-reactor · fx-dub-echo · lead-glide · memory-echo · phase-weaver · pluck-forge · riser-forge · rumble-kick · shimmer-engine · spatial-organism · tape-memory
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Delay(): stereo audio in/out; time 0.001–20 s or sync (beats at bpm); 4-point Hermite fractional read; mode 0 tape (80 ms glide: pitch bends) · 1 digital (30 ms cross-fade: no pitch); feedback 0–1.2 through low cut (Hz, 1 = off) · damp (Hz, ≥ 20 000 = off) · drive (dB, tanh); freeze (exact loop, input shut); mix 0–1; mod depth 0–20 ms at 0.01–10 Hz; all AudioParams; latency = the delay; memory 2 × 20 s × 4 bytes at the rate (7.7 MB at 48 kHz, setRate(rate, maxSeconds) to make it smaller); cpu 151 ns per stereo sample
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (delay-line.test.mjs, 19 checks: impulse exact, fractional delay exact to < −80 dB, echoes ×feedback, 20 s, sync, mix, damp and low cut per repeat, saturated feedback bounded, freeze holds 9 s to 0.01 dB, tape bends / digital keeps pitch without a click, mod wobble); moving fx-echo and fx-moddelay onto it is the later step that must null-render
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

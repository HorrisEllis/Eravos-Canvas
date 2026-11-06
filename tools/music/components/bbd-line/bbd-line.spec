# spec_id: eravos.component.bbd-line · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: bbd-line ; group: time ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: bucket-brigade model: clock noise, companding, anti-alias filters — the chorus/flanger character
used by: ensemble-organism · retro-dco
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel BBD(): stereo audio in/out; time 0.5–500 ms (a-rate) · stages 256–4096 → clock = stages/(2·time), anti-alias and reconstruction 4-pole low-passes at clock/3 (≤ 18 kHz), sample-and-hold at the clock · hiss dB inside the line (−120 off) · clock bleed dB (−120 off) · compand 0/1 (2:1 / 1:2, NE570-style, floor −80 dB) · seed by reset(seed); latency = time; cpu 233 ns per stereo sample
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (bbd-line.test.mjs, 20 checks: delay = time by phase, clock law, bandwidth follows the clock and the stages, alias rejection, compander round trip ±0.6 dB, hiss breathes (> 20 dB lower in silence, up under a note), bleed at the clock, seeded, a chorus sweep without clicks)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

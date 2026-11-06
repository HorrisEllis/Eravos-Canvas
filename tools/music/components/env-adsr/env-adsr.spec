# spec_id: eravos.component.env-adsr · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: env-adsr ; group: modulation ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: DAHDSR with curve per segment, loop, retrigger/legato, velocity scaling
  extract from: syn-env (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: acid-line · air-horn · cowbell-lead · fm-matrix · hat-roller · layer-architect · lead-glide · micro-percussion · organ-bass · percussion-physics · pluck-forge · poly-filter-matrix · psy-roller · rave-stab · retro-dco · sample-universe · supersaw-cathedral · swarm-oscillator
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel ADSR(): attack 0.001–10 s (linear) · decay 0.01–10 s · sustain 0…1 · release 0.01–20 s (exponential, −60 dB at the time given); gate on / off, retrigger from the current level (no click); value 0…1 per sample; schedule(param, t, …) for an AudioParam outside a worklet
  stands on: —
  status: building 2026-11-06 — NEW code proved on its own (env-adsr.test.mjs); extraction from syn-env (DAHDSR, curves, loop, legato) — extraction must null-render
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

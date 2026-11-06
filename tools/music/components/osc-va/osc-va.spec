# spec_id: eravos.component.osc-va · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: osc-va ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: band-limited saw/square/triangle/pulse with PWM, hard and soft sync, through-zero FM input (polyBLEP; minBLEP at high pitch)
  extract from: syn-osc, wobble-bass (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: acid-line · air-horn · cowbell-lead · drum-foundry · dub-siren · dub-skank · dub-techno-chord · glide-808 · hard-kick-forge · hoover-engine · lead-glide · micro-percussion · pluck-forge · psy-roller · rave-stab · reese-architecture · retro-dco · riser-forge · screech-engine · sub-architect · supersaw-cathedral · swarm-oscillator · wub-organism
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel VA(): band-limited saw · pulse (width 0.02–0.98) · square · triangle (integrated pulse) by polyBLEP; phase in 0…1, increment f/sr ≤ 0.5; output −1…1, DC ≈ 0; one sample per call, no allocation
  stands on: —
  status: building 2026-11-06 — NEW code proved on its own (osc-va.test.mjs); extraction from syn-osc, wobble-bass — extraction must null-render; hard/soft sync and through-zero FM come with it
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

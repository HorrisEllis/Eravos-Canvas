# spec_id: eravos.component.modal-resonator · version 0.1.0 · status built (2026-11-06, for Piano — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: modal-resonator ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: bank of up to 64 resonant modes: bells, bars, plates, membranes, objects; strike position, material, decay tilt; excited by audio or impulse
used by: piano · drum-foundry · log-drum · micro-percussion · percussion-physics
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Modal(): mono, per sample — tick(x) → the sum of up to 64 modes, each a two-pole resonator (frequency, T60 decay, gain),
  excited by audio or an impulse. set(freqs, t60s, gains, sr) · scale(k) (every mode × k, for a new note) · reset() · energy (to know when
  it has rung out). Modes above 0.45 × the sample rate are skipped (no aliasing, always stable). Shapes as data: MusicParts.MODAL_SHAPES —
  beam (clamped-free: 1, 6.267, 17.547, 34.386 — a tine, a reed), bar (free-free: 1, 2.756, 5.404, 8.933), and a body set (a soundboard's
  low modes). Strike position / material / decay tilt are how a tool sets the gains and decays (the shape stays data). Latency 0; cpu
  ~2 ns a mode a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# spec_id: eravos.component.wave-table · version 1.0.0 · phase P0.1 · status built · kind component (tool: no)
identity:
  id: wave-table ; job: turn one drawn cycle (a function 0..1 → −1..1) into a WebAudio PeriodicWave and its DC term
  lineage: the makeWave() that eravos.lfo (33 harmonics) and eravos.wub-rate (40 harmonics) each carried
inputs: ac (AudioContext) ; fn (cycle → value) ; phase (fraction of a cycle, default 0) ; harmonics (default 33)
outputs: { wave: PeriodicWave (normalization off) , dc: harmonic 0, added back by the caller as a ConstantSource offset }
limits: 1024-point analysis ; harmonics up to the caller (each tool keeps its own count) ; no state ; no randomness
also: phaseWave(ac, deg) — a sine rotated by deg degrees (harmonic 1, no DC); used by eravos.fx-moddelay and eravos.fx-phaser
used_by: eravos.lfo (phase = degrees/360, harmonics 33) ; eravos.wub-rate (phase fraction, harmonics 40)
not_used_by_yet: eravos.wobble-bass (Lanczos-windowed, 64 harmonics) ; eravos.bass-forge — different arithmetic, merged only with its own null proof
proof: tools/music/components/wave-table/wave-table.test.mjs (node) — coefficients equal the two original inline copies exactly ; then tests/null-render.mjs (--record before, check after) on eravos.lfo and eravos.wub-rate

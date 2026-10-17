# spec_id: eravos.organism.syn-env · version 1.0.0 · phase P44 · status canonical
identity:
  id: eravos.syn-env ; label: Envelope ; icon: 📈 ; accent: "#c58bff" ; category: Synthesis
  comp_intent: A shape in time you wire into any knob of any tool.
  novelty: FOLLOW — it moves on the notes of the tools it is wired into; no separate note routing.
engine:
  shape: one ConstantSource 0..1 scheduled on the audio clock: delay → attack (curve, 12 linear pieces) → hold → decay → sustain … release (setTarget, τ = R/4)
  loop: attack/decay cycles while the note is held (up to 64 s or 512 cycles ahead)
  output: depth · (sign · shape + offset) — '+' 0→depth, '−' 0→−depth, bipolar −depth→+depth ; depth mod multiplies
  retrig: every note restarts from 0 ; legato holds while notes overlap
  stop: Stop all drops it to 0 in 5 ms
config: delay, attack, curve −1..1, hold, decay, sustain, release, loop, depth, polarity [+, −, bipolar], velocity, retrig [every note, legato], follow
hooks: mod_out ; note_in ; midi_in ; mod_in depth
presets: Pluck Sweep, Slow Swell, Morph Scan, Drop Close, Note Wobble (loop), Bipolar Bend, Legato Filter
tests: contract ; wired into a tool's knob it follows that tool's notes ; the shape reaches peak at attack and sustain after decay ; loop repeats


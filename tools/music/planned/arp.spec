# spec_id: eravos.organism.arp · version 1.0.0 · phase P8.2 · status canonical
# source: v10 plugins/arp.json "SEQUENCE RUNNER" (shell, F-19) · amendment A-1 (supersaw arp moves here)
identity:
  id: eravos.arp ; label: Arp ; icon: ⋰ ; accent: "#66eeff"
  comp_intent: Turn held notes or chords into rhythmic, in-key patterns for ANY instrument.
  novelty: Only note processor — consumes note:trigger/midi:note, emits note:trigger; no audio of its own.
engine:
  input: note:trigger (target = self) and armed midi:note ; held set with timestamps ; latch keeps last chord
  step grid: 1..16 steps, each {on, octave −1..+2, velocity, tie}; rate division ; swing ; gate 0.05..1
  order: up, down, updown, downup, random(seeded), as-played, chord, converge, diverge
  output: note:trigger {target = chosen instrument, note, velocity, time = tick.time (+swing), duration = gate·stepDur}
  scale: optional quantize of octave-transposed notes to song scale
config: target instanceId ; order def up ; rate enum def 1/16 ; octaves 1..4 def 1 ; gate def 0.6 ; swing 0..0.6 ; steps 1..16 def 8 ; latch bool ; quantize bool ; seed
hooks: arp.hook.note_in STD.note_in ; midi_in STD.midi_in ; note_out (out ; note:trigger 2.0.0) ; STD.transport_in ; STD.theory_in
ui: hero = step lane (on/octave/velocity per step, cursor) + held-notes readout ; order ring selector ; target select
tests: held [60,64,67] up 1/16 @120 → 60,64,67,60… every 0.125 s ; latch keeps playing after release ; downstream target receives exact durations

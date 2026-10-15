# spec_id: eravos.organism.pad-expression · version 1.0.0 · phase P38 · status planned · category drums-and-rhythm
# A Drum Machine 2 capability set (ships as a Drum Machine upgrade + this spec as its contract).
identity:
  id: eravos.pad-expression ; label: Pad Expression (Drum Machine 2) ; icon: 👆 ; accent: "#ff2266"
  comp_intent: Pads that respond like an instrument — pressure, hold, position, repeat — not just on/off.
  novelty: Per-pad expression model shared by mouse, touch, MIDI pads (aftertouch / MPE) and the Sequencer.
engine:
  velocity: from mouse/touch (press speed + position on pad: centre = hard) or MIDI ; per-pad velocity curve ; velocity → level, tone, decay, sample layer
  pressure: touch force / pointer pressure / MIDI poly-aftertouch / MPE → assignable (filter, drive, pitch, swell)
  HOLD behaviours per pad: one-shot | gate (stops on release) | swell (fade IN while held, time 0.05–8 s) | fade-out-on-release (time) | loop while held | note-repeat at grid rate (1/8…1/32, rate from pressure)
  layers: up to 4 voices per pad (synth model + sample) with velocity / round-robin / random switching
  choke groups, mute groups, pad link (one hit fires several pads with offsets)
config: per pad {curve, hold mode, swell, fade, repeat rate, pressure target, layers[]}
hooks: STD.note_in (velocity + pressure) ; STD.midi_in (poly AT, MPE) ; STD.audio_out
ui: pads show pressure as a fill ring ; hold-mode icon per pad ; layer editor
tests: swell 2 s held → level rises 10 %→90 % in 2 s ±50 ms ; release with fade 0.5 s → −60 dB in 0.5 s ; note-repeat 1/16 at 120 BPM → hits every 125 ms ±1 ms

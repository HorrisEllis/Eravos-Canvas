# spec_id: eravos.organism.syn-osc · version 1.0.0 · phase P44 · status canonical
identity:
  id: eravos.syn-osc ; label: Morph Osc ; icon: 🌀 ; accent: "#3ad6c4" ; category: Synthesis
  comp_intent: A small oscillator built to be combined — wavetable morphing, and inputs that turn wiring into synthesis.
  novelty: FM and ring modulation are WIRES, not menus — any sound on the canvas can be a modulator; FOLLOW makes a modulator play along.
engine:
  voice: 8 voices (steal oldest released, then oldest) × unison 1..4 (detune, width) × 6 tables (PeriodicWave, 48 harmonics, RMS-matched)
  morph: one shared ConstantSource (−1..1) → 6 WaveShaper triangle windows → each table's gain — sample-accurate under modulation, no per-voice cost
  pitch: every oscillator holds the note's frequency; a per-voice ConstantSource adds what moves it (glide = linear ramp from the last note, FM) — sample-exact onsets; pitch mod (cents) only when wired (gate P)
  fm in: audio in → per voice gain = FM index × voice frequency × 2.36 (a Morph Osc at Level 1 = the knob's index) → hz (in tune over the keyboard); FM index mod adds (index + mod)·f·input
  ring in: out = sum · (1 − ring + ring·input) while something is wired into Ring in (else plain)
  follow (links): while its output feeds other tools, it also plays the notes sent to them (pitch × Ratio) — a Morph Osc wired into another's FM in becomes its modulator with no note routing
config: bank enum [analog, vocal, digital, organ] ; morph 0..1 ; octave −3..3 ; ratio enum [0.5,1,1.5,2,3,4,5,7] ; fine ±100 c ; glide 0..1 s ; unison 1..4 ; detune 0..50 c ; width 0..1 ; fmIndex 0..16 ; ring 0..1 ; follow bool ; attack / decay / sustain / release ; velocity 0..1 ; level 0..1.5
hooks: audio_out ; note_in ; midi_in ; audio_in fm (port fm) ; audio_in ring (port ring) ; mod_in morph / pitch / fmIndex
links: an incoming Morph Osc shows its bank / morph / ratio face; an incoming Envelope shows its shape
presets: Morph Lead, Glass Pad, Vowel Bass, Drawbar Organ, Pluck, Sub Sine, FM Modulator ×2, Bell Modulator ×7, Growl Modulator ×1
tests: contract ; plays in pitch ; morph changes the spectrum ; a second Morph Osc wired into FM in follows the notes and adds sidebands ; ring in multiplies


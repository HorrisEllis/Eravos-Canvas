# spec_id: eravos.organism.wobble-designer · version 1.0.0 · phase P38 · status planned · category sound-sources
identity:
  id: eravos.wobble-designer ; label: Wub Lab ; icon: 🌊 ; accent: "#7cff4f"
  comp_intent: Design dubstep / riddim / brostep basses from the ground up — talking wubs, yoi, growls, screeches, reese wubs — and write their rhythms.
  novelty: A bass synth whose filter / formant / wavetable position are driven by a built-in rate sequencer and vowel morph (Wobble Bass = one-knob classic wobble).
engine: 2 wavetable oscillators (morphable, FM / ring / sync between them) + sub ; formant filter (vowels A-E-I-O-U morph, the "yoi" = O→I sweep) + comb + 24 dB ladder in series/parallel ; distortion stack: waveshaper, wavefolder, bitcrush, OTT-style multiband upward/downward compression ; per-step modulation lane (rate, vowel, filter, pitch bend) shared with LFO Pro ; RESAMPLE: render 1 bar to a new wavetable or sample (the growl-on-growl workflow) ; mono legato with pitch dives
config: osc A/B tables, positions, warp ; formant vowel ; filter ; dist stack ; mod lane ; glide ; unison
hooks: STD.note_in ; STD.transport_in ; STD.theory_in ; STD.audio_out ; mod_in (any wire)
ui: vowel pad (X = vowel, Y = brightness) ; step lane under it ; distortion rack ; RESAMPLE button
packs: factory (40) — Talking Wub, Yoi, Riddim Square, Brostep Growl, Screech, Metallic Clang, Reese Wub, Neuro Roll, Dub Siren-Wub, Tearout Gnarl, Laser Zap, Wet Fart Bass (yes, that's a real genre term) …
tests: vowel A→O changes F1/F2 toward reference table ±10 % ; resample produces a 2048-sample wavetable whose playback at C1 matches the bar's average spectrum ≥ 0.8 correlation ; OTT stage with amount 0 is transparent

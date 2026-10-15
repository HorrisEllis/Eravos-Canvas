# spec_id: eravos.organism.vocoder · version 1.0.0 · phase P8.2 · status canonical
# source: v10 plugins/vocoder.json "ROBOT CHOIR" (shell, F-19)
identity:
  id: eravos.vocoder ; label: Vocoder ; icon: 🤖 ; accent: "#8888ff"
  comp_intent: Make a synth sing with Raven's words — robot, choir, talkbox.
  novelty: Only organism with two audio inputs (modulator + carrier) and a filterbank envelope-transfer engine.
engine:
  bands: 8..32 log-spaced 80 Hz–10 kHz ; modulator → BP(band) → rectify (WaveShaper abs) → LP (attack/release) = envelope ; carrier → BP(band) → VCA(gain ← envelope) ; Σ bands
  carrier: external port, or internal (saw/square/noise osc bank playing incoming note:trigger chords — poly 4, song-key aware)
  unvoiced: HP noise mixed by modulator high-band energy (sibilance keeps words intelligible)
  formant shift: carrier band centres × 2^(shift/12)
config: bands enum [8,12,16,24,32] def 16 ; carrier enum [ext, saw, square, noise] def saw ; attack 1..100 ms ; release 10..500 ms ; unvoiced 0..1 def 0.4 ; shift −12..12 ; STD mix
presets (vocoder.json): Robot, Choir, Talkbox + Daft Chord, Whisper
hooks: voc.hook.mod_in (in ; audio ; port modulator) ; voc.hook.car_in (in ; audio ; port carrier) ; STD.note_in (internal carrier) ; STD.audio_out ; STD.theory_in
ui: hero = band spectrum (modulator envelopes as bars, carrier overlay) ; carrier select ; mini keyboard for internal carrier
tests: silence on modulator → output < −70 dBFS ; sine sweep modulator lights bands monotonically ; 16 band centres log-spaced ± 1%

# spec_id: eravos.organism.waveform-lab · version 1.0.0 · phase P8.3 · status canonical
# source: v10 plugins/osc2.json "WAVEFORM LAB" (shell, F-19)
identity:
  id: eravos.waveform-lab ; label: Waveform Lab ; icon: ∿ ; accent: "#ff6b00"
  comp_intent: Design raw tones — FM bells, ring-mod metals, wavefolded growls — and see the waveform you made.
  novelty: Only FM / ring-mod / wavefold synth; the drawn waveform IS the display (reads its own analyser).
engine:
  osc A (carrier) + osc B (modulator): waves sine/tri/saw/square/drawn (PeriodicWave from 32-point user sketch)
  modes (combinable): FM (B → A.frequency, index = depth × fA) ; ring (A × B via gain node) ; sync-ish (B hard-restarts not available → declared absent)
  wavefold: WaveShaper sin-fold curve, folds 0..8, oversample 4× ; then LP + ADSR amp ; poly 6
  FM envelope: separate AD on index (bell strikes)
config: waveA/waveB ; ratio 0.25..16 def 2 ; fine −50..50 c ; fmDepth 0..10 ; fmEnvA/D ; ring 0..1 ; fold 0..8 def 0 ; octave ; cutoff ; ADSR
presets: FM Bell, Metal Ring, Fold Growl, Glass Keys, Drawn Buzz
hooks: STD.audio_out ; STD.note_in ; STD.midi_in ; mod_fm, mod_fold, mod_cutoff STD.mod_in
ui: hero = live single-cycle scope (pitch-synced trigger) + spectrum ; draw pad for custom wave ; ratio stepper showing harmonic/inharmonic
tests: ratio 1 depth 0 → pure carrier ; ring of 440×100 → components at 340/540 Hz ; fold 0 = bypass (null test)

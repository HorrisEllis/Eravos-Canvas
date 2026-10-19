# spec_id: eravos.organism.syn-partials · version 1.0.0 · phase P44 · status canonical
identity:
  id: eravos.syn-partials ; label: Partials ; icon: ✳ ; accent: "#ffb547" ; category: Synthesis
  comp_intent: Additive synthesis you draw — two spectra, morph and evolve between them, stretch into bells.
engine:
  voice: 6 voices × 24 sine partials ; partial k at f·c·k·(1 + stretch·0.035·(k−1)), c re-centring the heard pitch on the note (energy-weighted, partials 1–6) ; partials at or above min(18 kHz, 0.45·sr) are never built
  spectrum(x): lerp(A, B, x) · k^(1.2·tilt) · odd/even balance, RMS-normalised (every setting plays at one level)
  per partial: EVOLVE gain (spectrum(morph) → spectrum(1) over evolve s) → DAMP gain (k > 1 sinks to 1 − damp with τ = decay / (1 + 0.6·damp·(k − 1)) / 2) → amp ADSR
config: partialsA / partialsB array[24] 0..1 (hidden — drawn) ; morph ; evolve 0..10 s ; tilt ; oddEven ; stretch −1..1 ; damp 0..1 ; octave ; attack / decay / sustain / release ; level
hooks: audio_out ; note_in ; midi_in ; mod_in pitch ; ui partial_set {set, k, v}
presets: Glass Keys, Tubular Bell, Hollow Reed, Drawbars, Evolving Choir, Mallet, Saw to Sine Pad, Octave Air
tests: contract ; plays in pitch ; odd-only spectrum has no 2nd harmonic ; stretch moves the 2nd partial up ; evolve changes the tone over the note


# 3.48 SUITES (specs/eravos.suites.spec): part of music.synthesis-lab — usable alone as always; its 📘 page shows "Part of" and links the suite page

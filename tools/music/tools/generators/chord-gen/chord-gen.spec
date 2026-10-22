# spec_id: eravos.chord-gen · version 1.0.0 · status built · template eravos.tool/1 · map eravos.phase48-map P48.10 · suite music.edm-lab
identity: id eravos.chord-gen ; label Chords ; domain music ; category generators
  purpose: EDM Lab 3.0's harmony brain as a part. The audit found the chord job inside EDM Lab, Supersaw and Pitch with no tool for it.
ports:
  out: note_out (each chord's notes to every instance wired from it) · chord_out (harmony:chord { degree, notes, name, time, bar, bars, stepDur })
  in:  transport_in · theory_in (the song key) · mod.tension
params: progression [i-VI-III-VII, i-iv-v-i, vi-IV-I-V, i-i-VI-VII, i-v-VI-iv] · chordBars [1, 2, 4] · tension · energy (velocity
  0.45 + 0.45 × energy) · octave 2..5 · gate (how much of its bars a chord holds)
behaviour: at the first 16th of every chordBars bars, the next degree of the progression in the key, voiced by tension (EDM Lab's rule):
  < 0.25 triad + octave · < 0.5 add9 · < 0.75 7sus4 · else a cluster (root, tritone, b9, fifth up). No sound of its own.
acceptance: a chord every bar, in key, its notes to the wired poly tool only · tension 0.9 voices a cluster · harmony:chord carries the
  degree · the tool contract

# spec_id: eravos.bass-gen · version 1.0.0 · status built · template eravos.tool/1 · map eravos.phase48-map P48.10 · suite music.edm-lab
identity: id eravos.bass-gen ; label Bassline ; domain music ; category generators
  purpose: EDM Lab 3.0's bassline as a part. It plays the root of the chord on the rhythm.
ports:
  out: note_out (to every instance wired from it)
  in:  chord_in (harmony:chord, only from a Chords wired into it) · groove_in (groove:step, only from a Groove wired into it) ·
       transport_in · theory_in · mod.energy
params: rhythm [groove kick, every beat, offbeats, eighths, half-time] · energy · octave 0..4 · length (steps) · progression and
  chordBars (used only when no Chords is wired in)
behaviour: groove kick + a Groove wired in → a note on each of its kicks. Otherwise its own steps (groove kick alone = steps 0 and 10).
  The degree comes from the last chord of the wired Chords, else from its own progression. Energy > 0.7 jumps an octave on the
  off-beat (step 4 of 8); energy > 0.6 shortens the note to 0.65×. A slide is flagged off the beat. No sound of its own.
acceptance: follows the wired Chords' degree · plays on the wired Groove's kicks only · alone, plays its own pattern · the tool contract

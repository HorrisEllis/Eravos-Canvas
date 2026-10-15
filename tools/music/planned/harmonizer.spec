# spec_id: eravos.organism.harmonizer · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.harmonizer ; label: Harmonizer ; icon: 🎶 ; accent: "#9cf"
  comp_intent: One voice becomes a stack — up to 4 harmony voices that follow the key (or the chords you play), each with its own formant, pan, timing and detune.
  novelty: Scale-aware multi-voice pitch shifting; voices can follow live chords.
engine: pYIN tracking of the lead ; per voice: interval mode diatonic (3rd, 5th, 6th, octave…) | chromatic | chord (nearest chord tone of note_in chord) | fixed MIDI ; PSOLA per voice with formant control ; humanize: per-voice pitch wander (cents), onset delay (ms), level drift ; voice limit 4 at 44.1/48 kHz under 6 % CPU
config: key/scale follow|own ; voices[4] {on, mode, interval, formant, pan, level, delay, detune} ; dry level ; mode enum key|chords|midi
hooks: STD.audio_in ; STD.audio_out ; STD.theory_in ; STD.note_in (chord/midi mode)
ui: 4 voice columns with interval pickers ; live stave showing lead + harmony notes ; stack presets
packs: factory — Thirds Above, Power Fifths, Gospel Stack, Choir Wide, Octave Doubler, Barbershop, Dark Minor 6th, Chordal (play chords)
tests: lead A4 in C major, diatonic 3rd above → C5 ; chord mode holding Dm → voices land on D/F/A nearest ; formant of each voice preserved within 10 %

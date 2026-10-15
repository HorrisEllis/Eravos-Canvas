# spec_id: eravos.organism.chord-assistant · version 1.0.0 · phase P38 · status planned · category theory
identity:
  id: eravos.chord-assistant ; label: Chords ; icon: 🧩 ; accent: "#8be9fd"
  comp_intent: Play rich chords with one finger and write progressions in any style — pop, jazz, neo-soul, gospel, trap, film — with voice leading done for you.
  novelty: Progression generator + smart voicing + suggestions of "what comes next", all key-aware.
engine: chord grammar per style (functional harmony, ii–V–I, modal interchange, secondary dominants, tritone subs, gospel passing chords, neo-soul extensions 9/11/13) ; voice leading = minimize total movement under register constraints ; one-finger modes (scale degree → diatonic chord, chord memory) ; strum/arp out via Arp ; next-chord suggestions ranked by style probability ; tension score per chord (feeds Alchemy)
config: style ; complexity 0..1 ; voicing enum close|open|drop2|drop3|spread|shell ; register ; oneFinger bool ; progression (data)
hooks: STD.note_in ; note_out (note:trigger to any instrument) ; STD.theory_in ; theory_out (current chord) ; data_out progression
ui: progression lane (chord cards) ; suggestion row ; keyboard showing voicing ; style chips
packs: factory — Pop Four, Jazz ii-V-I Turnarounds, Neo-Soul Lush, Gospel Walk-ups, Trap Dark Minor, Film Epic, Bossa, Blues 12-bar, Lo-fi 7ths
tests: Dm7→G7→Cmaj7 drop2 total voice movement ≤ 6 semitones ; one-finger degree 5 in C → G major triad ; every generated chord tone in key unless style allows borrowed chords (flagged)

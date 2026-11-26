# spec_id: eravos.song-import · version 0.1.0 · status SPEC (2026-11-26; nothing built) · a song in → ERAVOS opens the tools to make it again
# his words (2026-11-26, verbatim): "I want to be able to import a song and have Eravos open it with the needed tools to replicate it. Hard? That
#   could be a good test." · "Like I want to be able to make any genre of music using Eravos."
# Honest scope: making a finished mix again EXACTLY is beyond any tool; what ERAVOS can do, measured, is take a song apart into what can be
#   rebuilt — tempo, key, sections, the drum rhythm, the bass line, the lead line, the chords, each part's character — and open those on the
#   canvas with the nearest tools, so he starts from the song's skeleton, not from nothing. The gate says how close it got, in numbers.
# Stands on: Intake (.mid already opens a Sequencer: tools/music/domain.js), the Timeline (clips, lanes), the Song Engine's parts, the novelty
#   fingerprint (build/novelty-core.mjs) and the character table (ToolBlend.CHAR, 3.230), component specs beat-tracker, key-detector,
#   onset-detector, transient-slicer, pitch-tracker, chord-recognizer, structure-segmenter, source-separator (tools/music/components/*/ — specs).
# No toys holds: an imported recording is HIS input to be analysed (and his to put in a Sample Player); nothing recorded is shipped.

## phases (each proven before the next; each its own PR)
  SI0 MIDI in (the cheapest whole song): a .mid with many tracks → the Timeline, one lane per track; each lane given the nearest ERAVOS tool
      (General MIDI program / channel 10 / the track's name: drums → Drum Machine, bass → Bass tools, pads → Pad Forge, leads → Retro Poly …),
      tempo map and key from the file. Test: a 4-track file opens 4 lanes with the right tools, notes exact, tempo exact.
  SI1 audio → tempo, key, sections: beat-tracker (BPM ± 0.5, downbeats), key-detector (Krumhansl profile, confidence), structure-segmenter
      (verse / chorus / drop by self-similarity) → a Session at that tempo / key and Timeline markers. Test: rendered ERAVOS songs (known truth)
      come back within ± 0.5 BPM, the right key in ≥ 90 %, sections within one bar.
  SI2 the drums: onsets by band (kick < 150 Hz, snare 150–2 k + noise, hats > 6 k) → a drum pattern per section (Patterns › Imported).
  SI3 the lines: pitch-tracker on the low band (the bass line) and the main voice (the lead) → note clips, in key.
  SI4 the chords: chord-recognizer (chroma, a chord per beat, smoothed) → a Chords clip.
  SI5 the tools: each part's fingerprint against ERAVOS's sounds → the nearest tool and preset (the character table says why: "a growling saw
      → Wobble Bass"); the song opens wired, playing the parts. THE GATE: the rebuilt song is rendered and measured against the import (tempo,
      key, rhythm onset match %, line pitch match %, spectral balance per section) — shown as a card, nothing hidden.
  SI6 stems (hardest, last): source-separator → his voice apart from the band (to sing over, or to chop) — his own audio only.
## open (his)
  - start with SI0 (MIDI: quick, exact) or SI1 (his audio: the real test)?

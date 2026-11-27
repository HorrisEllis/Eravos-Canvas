# spec_id: eravos.voice-lab · version 0.1.0 · status SPEC (2026-11-26; nothing built) · a setup of voice tools + the components they stand on
# his words (2026-11-26, verbatim): "Also Like I want a voice lab. T pain like auto tune. Creating voice. And wubs, wow. Like voice music like wubs, etc."
#   · earlier the same day: "i want to learn how to make music from my lyrics. that is the point of the rhythm tool"
# Stands on (already specced, now given an order): tools/music/planned/voice-tune.spec (pitch correction, hard tune at 0 ms) · talkbox.spec ·
#   voice-architect.spec (vocoder, choir, speech from phoneme lanes) · formant-shifter.spec · components pitch-tracker, pitch-shifter,
#   vocal-tract (specs in tools/music/components/) · built: filter-formant (the vowel table Wobble Bass's mouth uses), Lyrics → Rhythm (the
#   syllables on the beat), lyric-shape, Song Recorder (his own voice, recorded), Wobble Bass (the carrier for wubs).
# No toys holds: nothing recorded ships. His own voice is recorded by him; a made voice is SYNTHESISED (a vocal tract driven by phonemes).

## what the lab is (three doors, one lab)
  TUNE      his own sung or spoken take → in key. Speed 0 ms = the hard, stepped tune of the late-2000s R&B / trap vocal (technique only);
            slower = natural. Notes from the song key, a scale, or what he plays (MIDI mode: he plays it, the voice sings it).
  CREATE    a voice made from nothing: the vocal-tract component (glottal pulse → a tube of formants) sings his LYRICS — Lyrics → Rhythm gives
            every syllable its time, stress and note; each syllable's vowel and consonants become phoneme lanes (a small English letter-to-sound
            table, editable per syllable). Range, breath, grit, vibrato, gender / age as the tract's length, choir (many from one).
  WUB       voice and wubs as one: the voice's mouth shapes (formants measured live) open the WOBBLE BASS (a talkbox / vocoder with the
            wobble as the carrier), or the wobble's LFO opens the voice's vowels (the voice wubs). "Make it bun dem" talking bass, technique only.

## components (each its own folder, contract, spec, node test — built in this order, each proving its numbers)
  VL1 pitch-tracker   YIN / pYIN, 2048 / 256, voiced probability, octave guard — test: sines and a synthetic vowel within ±3 cents
  VL2 pitch-shifter   PSOLA ±7 st with formants kept; transients pass — test: shift a vowel +5 st, F1 / F2 within 8 %
  VL3 vocal-tract     glottal source (LF model) + a formant bank from the filter-formant table, phoneme targets with glides — test: each vowel's
                      F1 / F2 measured against the table; consonants as noise bursts with their own bands
  VL4 letter-to-sound a small rule table English → phonemes per syllable (lyric-rhythm's syllables in, phonemes out), editable

## tools (each a tool of its own, UI shown to him first — DESIGN-GUIDE, TOOL-UI template)
  VT1 Tune (voice-tune.spec)       VT2 Voice (CREATE: sings the words from Lyrics → Rhythm)       VT3 Talk / Wub (talkbox.spec + the WUB modes)
  Setup "Voice Lab" (Start › SETUPS): Lyrics → Rhythm → Voice → Tune → Talk / Wub → Wobble Bass, wired; macros WORDS · TUNE · WUB · SPACE.

## acceptance
  - the hard tune: a sung line 30 c flat lands within ±3 c after one period at 0 ms; at 200 ms half-way at ~100 ms (voice-tune.spec tests)
  - CREATE sings any lyrics on the beat (P-test gives words, ERAVOS sings them; no recording anywhere)
  - WUB: the wobble's vowel follows the voice's measured formants (correlation ≥ 0.8 on a test vowel glide)
  - no-toys passes; boundary passes (the canvas names no voice word)

## open (his)
  - which door first: TUNE (his own voice), CREATE (a made voice), or WUB?
  - the made voice: one voice, or a choice of characters (deep, airy, child, choir)?

ADDENDUM 2026-11-26 (2) — the order, his (the original above kept verbatim)
his words (verbatim): "I am a good writer.  It would be cool to be able to import my words.  Can we have voices for the lyrics? On top of my own?
  Like I want to be able to make any genre of music using Eravos."
  → CREATE first (a voice made from nothing singing his lyrics — the words come in through Lyrics → Rhythm's ⇣ Import words, 3.232), sung ON
  TOP of his own recorded voice (Song Recorder) — then TUNE (his voice in key), then WUB. VL3 vocal-tract + VL4 letter-to-sound lead; the voice
  follows the song's genre (a choice of characters: deep, airy, choir, robot / hard-tuned).


ADDENDUM 2026-11-27 — everything a voice needs (the originals above kept verbatim)
his words (verbatim, answering how his lyrics should reach the tools): "Voice tools. Like recording. Making sound like the tools? Full editing and modulation. Full t pain auto tune. Synthesized voice. Everything needed for remixing, EDM; dubstep."
  · the same day: "Still feel like i want to make music with this. using my lyrics. i love the piano its beautiful look at it."
WHAT IT ADDS to the three doors (TUNE · CREATE · WUB): RECORD (his voice in, takes kept, comped) · VOICE → TOOLS (his voice playing any
  instrument: the pitch and loudness he sings drive Piano, Ripple, Wobble Bass … — "making sound like the tools") · EDIT (every take as notes
  and curves: pitch, timing, formant, level per syllable, on the Timeline's roll) · MODULATE (every voice control a modulation destination;
  the voice's own pitch / loudness / vowel as signals out) · REMIX (chop, stutter, pitch-drop, reverse, vocal-chop leads — EDM / dubstep).
ORDER (bottom up, each component proving its numbers, each new tool's face shown to him first):
  VL1 pitch-tracker (every door stands on it: TUNE, VOICE → TOOLS, EDIT) → VL3 vocal-tract + VL4 letter-to-sound (CREATE, his order of
  2026-11-26) → VL2 pitch-shifter (TUNE's correction, formants kept) → VT1 Tune (record + hard tune) → VT2 Voice (sings his lyrics over his
  own) → voice → tools → VT3 Talk / Wub → the remix set (chop · stutter · drop · reverse · vocal chops).

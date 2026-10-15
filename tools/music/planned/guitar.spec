# spec_id: eravos.organism.guitar · version 1.0.0 · phase P38 · status planned · category instruments
identity:
  id: eravos.guitar ; label: Guitar ; icon: 🎸 ; accent: "#d86f3c"
  comp_intent: Playable guitars — acoustic, clean electric, nylon, 12-string — with a strum engine that voices chords like a real hand on six strings.
  novelty: String-level model (Karplus–Strong extended) + fretboard voicing + strum timing.
engine: 6 (or 12) string waveguides with pick position, pluck hardness, palm mute, fret noise, slides/hammer-ons/pull-offs ; chord → fretboard voicing search (playable shapes, minimum hand stretch, open strings preferred) ; strum: down/up, speed 5–60 ms, per-string velocity curve, rhythm patterns synced to transport ; body IRs ; pickup positions for electric (out to Amp Sim)
config: model ; tuning (standard, drop D, DADGAD, open G, custom) ; capo ; strum speed ; pattern ; palmMute ; pickup ; mode enum notes|chords|strum
hooks: STD.note_in ; STD.midi_in ; STD.transport_in ; STD.theory_in ; STD.audio_out
ui: fretboard showing voiced chord ; strum pattern grid ; tuning chips
packs: factory — Campfire Strum, Funk Chicken Scratch, Indie Clean Arps, Nylon Bossa, 12-String Shimmer, Palm-Muted Chug, Reggae Skank (off-beat), Country Pick
tests: C major voiced in standard tuning → x32010 ; strum down 20 ms → string onsets ordered low→high, spread 20 ms ±2 ; palm mute shortens decay ≥ 70 %

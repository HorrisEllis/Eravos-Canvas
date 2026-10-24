# spec_id: eravos.pattern-library · version 1.0.0 · phase P69 · status mapped (not built)
# "what about instead of so many songs, we have a pattern library?" · "strip anything useful [from v10] and make it a
#  tool" · v10 FINAL's own pages: PADS · CLIPS (draw/erase/select/slice/reverse/normalize/stretch/pitch±/chop×8) ·
#  LIBRARY (search, Preview, To Pad) · EUCLID · OSC (waveform, FFT, Lissajous, 3D trajectory; zoom/speed/smooth/freeze).

## What exists already (not rebuilt)
  Euclidean rhythms: the Sequencer has them · sound search with preview: ＋ Sounds · lessons: Learn ·
  trimming and splitting a take: Clip Maker · named-sound library of v10 (60 entries) = metadata only (name, colour,
  synth type) — no sound settings to port.

## 1 · PATTERN LIBRARY (new page, beside Songs)
  A PATTERN = one musical idea you can drop anywhere:
    { id, name, type: drums | perc | bass | chords | lead | arp | wobble | fill, genre, subgenre (eravos.songbook-genres),
      bpm, bars, swing?, lanes: [{ role: pad index | 'bass' | 'lead' | 'chords', steps }], tags }
    steps use the format the Sequencer already reads (data/patterns.js): drum lanes 'X x o .' per 1/16; melodic lanes
    scale-degree tokens — so every pattern plays in the song's key.
  Sources (generated, then curated): every lane and section of data/patterns.js split into patterns; the Song Engine's
    genre generators sampled into patterns; Wub Rate rate-rolls (type wobble); Arp moves (type arp); fills from the
    drum builders; the EUCLID generator inside the page (hits · steps · rotation · pad → a pattern, saved to "Mine").
  The page: type chips (Drums · Bass · Chords · Lead · Arp · Wobble · Fills) × the 8 genres → subgenres, search, BPM
    filter; each card draws its steps (a mini grid or a melodic contour) and has ▶ (hear it on the right tool at its
    BPM, nothing added) and Send to ▾: Sequencer (a lane or a whole slot) · Timeline (a clip on the right lane at the
    playhead) · Wub Rate (wobble rolls) · Arp (arp moves). Drag a card onto a window = send it there.
  Songs become COMBINATIONS of patterns: a song = sections × patterns; "Open as patterns" on a song card lists the
    patterns it is made of. The Songbook keeps a curated set; the library is where variety lives.
  Packs: a pattern pack is a content pack of kind 'patterns' (ContentPacks + the page's addKind) — users' "Mine" too.

## 2 · SCOPE (new visual tool, from v10's OSC page + migration M2)
  views: Waveform · Spectrum · Lissajous (L against R — stereo width at a glance) · Phase Space (the sound as a point in
  3D: brightness × level × low end, with a trail) · controls: zoom, speed, smooth, freeze, and a source picker (the mix
  or any tool's output). Reads the existing taps (no rerouting). Uses the live accent colour.

## 3 · CLIP MAKER 2.0 (v10's CLIPS page into the existing tool, not a new one)
  adds to trim/split: slice (at transients or a grid) · reverse · normalize · stretch (time, keeps pitch) · pitch ±
  semitones (keeps time) · chop ×8 (equal slices → 8 pads of the Drum Machine) · record a clip · every edit undoable,
  non-destructive (the original take kept).

## Acceptance
  library ≥ 300 patterns across 8 types and 8 genres, each with genre + subgenre · ▶ plays in under 300 ms ·
  Send to Sequencer/Timeline places it exactly (step-for-step test) · Euclid E(5,16) = x..x..x..x..x... rotated as asked ·
  Scope's Lissajous is a line for mono and opens for wide stereo (tested) · Clip Maker: reverse twice = original,
  chop ×8 = 8 equal pads (tested)

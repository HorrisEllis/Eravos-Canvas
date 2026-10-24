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

## ADDENDUM 2026-10-24 (P69.3 built as 3.71 — the first slice) — decided by his axioms after "continue"
  His words, 2026-10-24, after the coder asked whether the 8 Floor Falls songs stay songs: "what about instead of so much songs, we have a
  pattern library" · then "continue" (no answer to the two calls). Decided by his axioms, recorded as his system deciding: the direction is
  his and stated (USER_AUTONOMY: "instead of so much songs"), so the 8 Floor Falls songs do NOT go on the Songbook shelf; their moves are
  the library's first patterns, and their code stays as the source (§0.3, nothing deleted). The coder builds the library (§8.6: nothing of it
  existed; the session that mapped it has not started, checked on origin 2026-10-24).
  FORMAT AMENDED (the coder's call, D-71.1): a pattern stores the timeline's own clip notes { s, l, r | n, v, p?, b? } — r = semitones from
  the key's root (pitched parts), n = the pad's note (drums) — not step tokens. Step tokens cannot hold what makes a drop: per-note bends,
  oscillation, per-note knobs (wobble rate). A new type CURVE stores a curve lane (knob, points from bar 0, oscillation) for a kind of tool.
  Pattern: { id, name, type: drums | bass | wobble | chords | lead | arp | drop | fill | curve, genre, genreLabel, bpm, bars, tool, preset?,
             configure?, scale, drums?, notes?, curve?: { key, points, osc? }, source }
  FIRST SLICE (3.71): the library is GENERATED from the Song Engine (every genre: every part's first bars of every section kind, the pause
  as a DROP pattern, the build's last bar of drums as a FILL, every curve lane as a CURVE), the Floor Falls moves named (falls · stairs ·
  freefall · rises); the page (type chips × genre chips, search, a mini drawing per card, ▶ Hear it rendered off the canvas, Send to the
  Timeline: the right track or a new one with the tool, at the playhead, in the session's key); toolbar button "Patterns".
  NOT in this slice (open): Send to Sequencer / Wub Rate / Arp, Euclid, pattern packs and "Mine", "Open as patterns" on a song card,
  drag a card onto a window. The acceptance's ≥ 300 patterns is checked by a test.

## ADDENDUM 2026-10-24 (3.72) — "curves, depth, deep bass, huge drop, contrast and a lot of tensnio'"
  His words, verbatim, right after the library's first slice was merged. The coder's reading (TO CONFIRM — it could also be one song): what
  the library should give next, by his words, one by one:
    tension    🔺 TENSION patterns: a snare roll that speeds up (1/4 → 1/32), a kick that thins out to nothing, a sub that rises out of
               the floor, a wobble whose rate speeds up, curves: a riser (+12), a filter that closes then rips open, the pad's pitch climbing
    contrast   the pause: the build stops dead before the hit (the chains below leave one bar of near-silence, measured)
    huge drop  🕳 DROP patterns that slam: the sub lands from an octave above, wobble hits with a rate per note and a dive at the turn,
    deep bass  a Reese + sub stack — every sub at its real note (Octave 0: C#1 = 35 Hz), no dive under ~18 Hz (3.70's finding)
    curves     every build and drop carries its curves (riser, filter, depth swing)
    → ⛓ BUILD → DROP chains: one card = a build (8 bars of tension) + the pause (one of the four Floor Falls moves) + a 4-bar huge drop,
      sent to the Timeline in one click, each part on its own track.
  Proof is measured on each chain's render: tension = the build's last bar louder and brighter than its first (dB); contrast = the pause
  against the drop (dB); depth = the drop's share of 30–60 Hz. Thresholds are in tests/p72-tension-drops.test.js.
  Pattern gains: type 'tension' and type 'chain' { parts: [{ at: bar offset, pattern }] }; PatternLibrary.addSource(fn) (a data file adds
  hand-made patterns; generated ones stay generated).

## ADDENDUM 2026-10-24 (3.73) — "needs to be able to collapse tge catogaries. curves, deep drops. make it powerful."
  His words, on a screenshot of the page (≈90 genre chips in one wall). Built:
    FAMILIES   genres fold into 13 families (🕳 Deep drops & tension · Dubstep · Drum & Bass · House & Garage · Techno & Trance ·
               Trap & Hip-hop · Reggae & Dancehall · Synth & Dark · Chill & Ambient · Lost Love · For Her · Odd Couples · Synthesis),
               folded; the caret opens a family's genres, the name picks the whole family. No genre falls into "More" (tested).
    QUICK      🕳 Deep drops (Floor Falls · Heavy Drops · the tension studies) · 📈 Curves · 🔺 Tension · ⛓ Build → Drop · ★ Favourites
    PICKING    type and genre chips: click = only this · shift/ctrl-click = add it; search words all narrow (name, genre, family, type,
               tool, move, preset, BPM); BPM min–max; sort (genre · name · BPM ↑↓ · longest); Clear; "/" focuses search
    SECTIONS   results grouped by type (or family, genre, none); each section folds (Fold all / Open all); 24 cards, "Show more"
    KEPT       the pick stays for the session; folds, open families and ★ favourites persist (localStorage eravos.patterns.page)
  Look unchanged (existing chip and card styles; no theme touched). Tests: tests/p73-patterns-page.test.js.

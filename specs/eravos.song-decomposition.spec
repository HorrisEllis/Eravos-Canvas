# spec_id: eravos.song-decomposition · version 0.1.0 · status SPEC (mapped 2026-11-13) · music
# his words (2026-11-13, verbatim): "also songs decomposed one by one." · "rhythmes and notes per tool." (the same message; session map:
#   specs/eravos.2026-11-13-session.map.spec). Stands on: the Song Engine (SongEngine.generate(genre, seed) → the song as data: each part's
#   tool, preset, clips of notes, curves, markers), the songbooks (the Songs menu's list, 3.172 duplicates hidden), the pattern library.
purpose: every song in the Songs menu taken apart, one by one, into what it is made of — so each part can be found, heard and used alone:
  the rhythms and notes PER TOOL that Browse shows (specs/eravos.store-browse.spec › RHYTHMS / NOTES), and what each song is built from.
for each song (genre + seed, as listed):
  song      { id, label, genre, seed, bpm, key, bars, sections [markers] }
  parts     per part: { role (drums, bass, chords, lead, arp, fx …), tool (organism id), preset, notes [{ s, l, n, v } per bar or clip],
            rhythm (the onsets only: step + velocity, pitch dropped), curves [{ target, points }], section map (which bars it plays) }
  per tool  the rhythms and notes it plays across all songs, de-duplicated by content (same onsets = one rhythm; same notes relative to the
            key root = one line), each naming the songs it came from (provenance)
output: tools/music/data/song-parts/<tool>.json (generated, data only, beside the tool's other data; a pack for the store later) +
  docs/song-decomposition.md (counts: songs, parts, rhythms and lines per tool, duplicates folded)
how: build/song-decompose.mjs drives the page (host/driver/glass.js), calls SongEngine.generate for each listed song (no audio), writes the
  files; deterministic (same songbooks → byte-identical output); a check that every listed song decomposed (or names the one that did not).
phases: SD1 the decomposer + the files + the report · SD2 the rhythms and notes in the pattern library per tool (heard on the tool) · SD3 Browse
  shows them (store-browse SB2–SB3)
decisions: D1 (proposed) rhythm and notes are kept apart (a rhythm can drive any tool; a line belongs to pitched tools); D2 (proposed)
  relative to the key root, so a line can be played in any key.
open: songs from recipes that are not engine genres (one hand-made recipe song has no preview, 3.177) — decomposed from its recipe steps.

# ---- ADDENDUM 2026-11-13 — SD1 built (nothing above is changed)
#   his words: "also songs decomposed one by one." · "just begin."
#   build/song-decompose.mjs: 301 songs (300 engine, 1 recipe), none failed; 84,388 part-bars → 3,933 rhythms and 4,607 lines across 21 tools.
#   Identity, decided while building (D1 kept: rhythm and line apart): a rhythm is its onsets (a drum's pads kept), a line its notes (step,
#   length, interval from the key root — D2 kept); velocity is NOT identity — humanised velocities made every bar "new" (5,040 rhythms before,
#   3,933 after) — each keeps the mean velocity of the bars that play it. A song's part is stored as runs [first bar, bars, rhythm, line].
#   Output as specced (tools/music/data/song-parts/, docs/song-decomposition.md), 4.6 MB, deterministic (two runs byte-identical).
#   Open (as specced): the one recipe song ("Make a song for her") lists its tools but no notes — they come from a sequencer starter, not clips.
#   Proof: tests/song-parts.test.mjs (every id a song plays exists in its tool's file, bars add up, lines relative, onsets unique — a removed
#   rhythm fails it with 323 problems); in CI with a check that the files match the songbooks.

# ============================================================
# ERAVOS PHASE 9 — TRACKS (make music in the timeline)
# spec_id:      eravos.phase9-tracks
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# conforms_to:  ERAVOS.kernel.spec + amendment 3.1 + amendment 3.2 (domain packs)
# created_at:   2026-09-27
# pack:         3.20.0-alpha.1
# ============================================================
#
# Intent (from James, 2026-09-27):
#   "this is to make music. i need to be able to edit and create tracks. i like this so far.
#    expand it with more presets, pad sounds. edm, monstercat style. i don't like the sound in the
#    tension section of the drop builder."
#
# FORGE 5 (answered from evidence):
#   phase:       P9 (after P8.5 tools)
#   last_state:  3.19-alpha-2, 191/191 tests green in Chromium
#   bugs:        none failing; gaps G-01…G-04 below
#   intent:      instrument tracks with editable note clips; Monstercat/EDM sound expansion; tension fix
#   warp_jaa:    referenced by specs only; not present in this pack's code (unchanged by P9 — flagged)

gaps:
  G-01: the timeline could only hold audio clips and sequencer pattern cues — no instrument (synth/drum)
        could be written into the song directly; "create a track" did not exist.
  G-02: no note editor anywhere in the arrangement (the sequencer is step-only, 16/32 steps, scale degrees).
  G-03: the Drop Builder tension pad was tritone-stacked raw saws (0/6/12/18 st) with Q rising to 9 —
        horror-film dissonance with a whistling resonance; wrong for melodic EDM.
  G-04: sound palette thin for melodic EDM / Monstercat (future bass chords, plucks, silk pads,
        colour bass, a punchy future-bass drum kit).

resolution:
  G-01, G-02 → eravos.organism.timeline.spec v2.1.0 (instrument lanes, note clips, piano roll, chord fill)
  G-03       → eravos.organism.bass-drop-builder.spec 2.1.0 (tensionTone: lush | pluck | dark; dark = old sound, kept)
  G-04       → presets (supersaw +7, reese +3, wobble +2, acid +1), supersaw chordMode add9,
               pads bank D "Future" (constraint pads.C-2 amended to 4 banks; 3-bank snapshots upgrade)

exit_criteria (tests/organisms.test.js, suite "P9 tracks"):
  - instrument lane + note clip at bar 2 → note:trigger to target at t0 + barSec ± 1e-6, duration = l·stepDur·0.98
  - sub-step note start (s = 4.5) lands at t0 + 4.5·stepDur
  - muted lane / soloed other lane → no notes
  - missing target → exactly one RUNTIME_003, no throw
  - split notes clip at bar boundary keeps every note, offsets continuous
  - duplicate deep-copies notes (edit of copy does not touch original)
  - chord fill: "anthem" progression, 4 bars → 4 chords, key-relative, in scale
  - notes clip → supersaw renders non-silent audio (end-to-end)
  - every preset of every organism names only declared config keys, values in range / in options
  - drop builder: each tensionTone renders non-silent; 'lush' is in scale for the song key
  - pads: bank D selectable and sounds; 3-bank snapshot restores with D appended

ui_rule: the piano roll is its own UI area → timeline.pianoroll.js + timeline.pianoroll.css
         (loaded by organisms/index.js EXTRA map; engine → extras → ui)

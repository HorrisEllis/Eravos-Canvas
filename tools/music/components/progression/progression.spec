# spec_id: eravos.component.progression · version 1.0.0 · phase P0.3 · status built · kind component (tool: no)
identity:
  id: progression ; job: the named chord progressions (scale degrees) and the degree playing at a given bar
  lineage: PROG + chordAt()/ownDegree() of eravos.bass-gen and eravos.chord-gen (identical) and eravos.edm-lab (four of the five)
inputs: a table of progressions ; a name ; a bar number (0-based) ; bars per chord (1, 2 or 4; a number or its string)
outputs: a scale degree 1..7
limits: pure ; no state ; the table is not frozen so a tool that mutated its own copy before still could — none does
used_by: eravos.bass-gen, eravos.chord-gen (all five) ; eravos.edm-lab (pickProgressions of four, so its menu does not change)
proof: tools/music/components/progression/progression.test.mjs (node) — every progression × bars 0..255 × chordBars {1,2,4} (number and string) equals the original lookups ; the three original tables equal / are a subset of the component's

# ---- ADDENDUM 2026-11-06 · 3.132 jazz progressions (everything above kept verbatim — Axiom 9)
# his words: "i also want to be able to make lofi" (2026-11-05) · "yes" (2026-11-06, to the Lofi setup: specs/eravos.lofi-setup.spec)
jazz_table:
  - MusicParts.JAZZ_PROGRESSIONS: a SECOND table, so the first (the five) stays exactly as it was — bass-gen, chord-gen and edm-lab's
    lookups are unchanged (its test still pins the five, in order)
  - ii-V-I-I [2,5,1,1] · ii-V-I-vi [2,5,1,6] · I-vi-ii-V [1,6,2,5] · IV-iii-vi-ii [4,3,6,2] · i-iv-VII-III [1,4,7,3] · vi-ii-V-I [6,2,5,1]
    — scale degrees, so they sit in whatever key and scale the song is in (in a minor key ii-V-i is the minor two-five)
  - MusicParts.ALL_PROGRESSIONS: the five, then the jazz six, in that order (what a tool offers when it offers both)
proof: progression.test.mjs — the five unchanged; the jazz six are degrees 1–7; degreeAt on ALL equals degreeAt on the table it came from


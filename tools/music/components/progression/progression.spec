# spec_id: eravos.component.progression · version 1.0.0 · phase P0.3 · status built · kind component (tool: no)
identity:
  id: progression ; job: the named chord progressions (scale degrees) and the degree playing at a given bar
  lineage: PROG + chordAt()/ownDegree() of eravos.bass-gen and eravos.chord-gen (identical) and eravos.edm-lab (four of the five)
inputs: a table of progressions ; a name ; a bar number (0-based) ; bars per chord (1, 2 or 4; a number or its string)
outputs: a scale degree 1..7
limits: pure ; no state ; the table is not frozen so a tool that mutated its own copy before still could — none does
used_by: eravos.bass-gen, eravos.chord-gen (all five) ; eravos.edm-lab (pickProgressions of four, so its menu does not change)
proof: tools/music/components/progression/progression.test.mjs (node) — every progression × bars 0..255 × chordBars {1,2,4} (number and string) equals the original lookups ; the three original tables equal / are a subset of the component's

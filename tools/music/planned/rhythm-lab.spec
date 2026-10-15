# spec_id: eravos.organism.rhythm-lab · version 1.0.0 · phase P38 · status planned · category drums-and-rhythm
identity:
  id: eravos.rhythm-lab ; label: Rhythm Lab ; icon: 🧮 ; accent: "#ff9100"
  comp_intent: Go deep into rhythm — recursive subdivisions, polyrhythm, polymeter, accelerando/ritardando inside a bar, rapid ups and downs of density.
  novelty: Recursive rhythm trees (a beat divides into beats that divide …) rendered to any tool.
engine: rhythm tree: node = duration split into n parts with weights (e.g. 1 → [3,3,2] → each 3 → [1,1,1]) ; depth up to 6 ; polyrhythm layers sharing a cycle (3:4:5) ; polymeter lanes with own lengths ; tempo curves INSIDE a pattern (accelerating fills, "rapid ups and downs") ; density curve (thinning/thickening) ; probability and seeded variation ; output notes/pads to any tool
config: tree (data) ; layers[] ; cycle ; tempo curve ; density curve ; seed
hooks: STD.transport_in ; note_out ; data_out pattern
ui: tree view (click a node to split) + circular view of layers ; curve editors
tests: [3,3,2] in one bar of 4/4 → onsets at 0, 1.5, 3 beats ; 3:4 polyrhythm aligns every cycle ±0 ; accelerando curve onsets strictly decreasing gaps

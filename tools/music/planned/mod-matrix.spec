# spec_id: eravos.organism.mod-matrix · version 1.0.0 · phase P38 · status planned · category modulation
# "Relational modularity": tools don't just send sound to each other — their VALUES relate.
identity:
  id: eravos.mod-matrix ; label: Relations ; icon: 🕸 ; accent: "#ff9ff3"
  comp_intent: Make any value on the canvas follow, oppose, scale or react to any other — "when the bass filter opens, the pad closes", "reverb grows as the drop builds".
  novelty: A relation graph over all params, readable as sentences, with cycle protection.
engine: relation {from (param | audio level | note | data value | transport position), to (param), law: follow | invert | ratio k | offset | curve (drawn) | threshold→trigger | quantize | lag (slew) | random-around | max/min of several} ; evaluation per audio block for AudioParam targets (scheduled), per frame for others ; graph cycle detection (refuse with a plain message, like data loops) ; relations saved with the project and in presets of the matrix
config: relations[] ; enabled ; update rate
hooks: control_in (any) ; control_out (any) ; STD.transport_in ; data_in ; data_out
ui: list of sentences ("Bass Cutoff → inverts → Pad Cutoff, 80 %") + node view (tools as nodes, relations as arrows) ; click a knob anywhere on the canvas to pick a source/target
tests: invert relation: source 0.2 → target 0.8 within 1 block ; A→B→A refused with a message ; lag 200 ms reaches 63 % at 200 ms ±5 %

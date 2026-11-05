# spec_id: eravos.sound-system-sim · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (dub_and_sound_system) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.sound-system-sim ; label: Sound System Sim ; domain: music ; family: dub_and_sound_system
  lineage: custom-built sound systems: scoop bins, mid horns, tweeters, a crowd in a hall
  family_from: Jamaican dub (late 1960s–70s), sound-system culture, roots, steppers, dub techno and dubstep's roots
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  reverb-convolution · eq-parametric · multiband-splitter · early-reflections · limiter-true-peak · loudness-meter
adds (behaviour only this tool has):
  - hear the mix through a stack model on headphones (monitoring only, never on export)
  - sub-pressure meter (how hard the low end hits)
  - hall + crowd absorption
modes: stack · hall · outdoor
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Scoop Bin Hall — big scoop-bin stack in a hall
  - Yard Session — outdoor yard stack
  - Basement Rig — small rig in a low room
  - Festival Line Array — modern line-array field
  - Tower Of Horns — mid-horn-heavy stack
  - Weekender Tent — tent with a crowd
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

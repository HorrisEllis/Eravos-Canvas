# spec_id: eravos.translation-check · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (mix_and_master) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.translation-check ; label: Translation Check ; domain: music ; family: mix_and_master
  lineage: checking a mix on small speakers, cars, earbuds and clubs
  family_from: console-era mixing, multiband and upward compression (EDM 2010s), loudness-normalised streaming
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  eq-parametric · reverb-convolution · stereo-tools · loudness-meter
adds (behaviour only this tool has):
  - listening models: phone, laptop, earbuds, car, club (monitoring only)
  - mono check
  - one-key cycling
modes: cycle · single
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Phone Speaker — tiny phone speaker
  - Laptop Speakers — laptop speakers
  - Earbuds — cheap earbuds
  - Car Cabin — car stereo in a cabin
  - Club Floor — club system
  - Mono Bluetooth — mono bluetooth speaker
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

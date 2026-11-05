# spec_id: eravos.micro-percussion · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (house_garage_techno) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.micro-percussion ; label: Micro Percussion ; domain: music ; family: house_garage_techno
  lineage: minimal techno and microhouse clicks, blips and glitches
  family_from: Chicago house and Detroit techno (1980s), UK garage (late 1990s), minimal and dub techno, French filter house
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-va · osc-noise · modal-resonator · env-adsr · filter-svf · probability-gate
adds (behaviour only this tool has):
  - micro-hits under 50 ms
  - pitch and decay randomised per hit (seeded)
  - groove-aware placement
modes: click · blip · glitch
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Click Garden — tiny clicks and pops
  - Blip Machine — short pitched blips
  - Microhouse Rain — random tiny hits
  - Digital Crickets — high chirps
  - Wood Micro — small wooden ticks
  - Glitch Seeds — seeded glitch hits
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

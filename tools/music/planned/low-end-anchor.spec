# spec_id: eravos.low-end-anchor · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (mix_and_master) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.low-end-anchor ; label: Low End Anchor ; domain: music ; family: mix_and_master
  lineage: mono bass, phase checks and kick/sub balance tools
  family_from: console-era mixing, multiband and upward compression (EDM 2010s), loudness-normalised streaming
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  stereo-tools · phase-correlation · multiband-splitter · envelope-follower · eq-parametric
adds (behaviour only this tool has):
  - mono below N Hz with phase-safe crossover
  - kick/sub overlap display and fix
  - sub level meter vs reference
modes: mono · check · fix
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Club Mono Floor — mono below 120 Hz
  - Kick Sub Separation — kick and sub kept apart
  - Wide Above Floor — wide above the low end
  - Phase Safe Low — phase-checked low end
  - Weight Booster — adds low weight safely
  - Tight Low — tight controlled lows
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

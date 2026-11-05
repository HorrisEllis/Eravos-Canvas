# spec_id: eravos.multiband-crush · version 0.1.0 · status extends:fx-squash · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (mix_and_master) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.multiband-crush ; label: Multiband Crush ; domain: music ; family: mix_and_master
  lineage: upward + downward multiband compression, the 2010s EDM sound-design staple
  family_from: console-era mixing, multiband and upward compression (EDM 2010s), loudness-normalised streaming
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  multiband-dynamics · multiband-splitter · compressor · eq-parametric
adds (behaviour only this tool has):
  - depth and time for the whole thing, per-band ratios behind it
  - upward-only and downward-only views
  - detail recovery per band
modes: 3-band · 6-band
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Everything Louder — heavy upward on all bands
  - Gentle Glue — light multiband glue
  - Air Lift — upward on highs only
  - Mid Grit Lift — mids lifted for bass music
  - Tame Lows — downward on the low end
  - Detail Revealer — upward on quiet details
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# spec_id: eravos.timbre-genome · version 0.1.0 · status new (builds on eravos.genomes-v10.spec) · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (signature_innovations) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.timbre-genome ; label: Timbre Genome ; domain: music ; family: signature_innovations ; signature: true
  lineage: ERAVOS: breed presets — crossover and mutation with lineage
  family_from: ERAVOS's own ideas — the reason to choose it over any DAW
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  preset-morph · seed-registry · spectral-features · random-source
adds (behaviour only this tool has):
  - pick two or more parents, breed children (crossover per parameter group, mutation rate)
  - family tree kept: any child can be traced and re-bred
  - fitness = the user's likes, nothing hidden
modes: breed · mutate · family-tree
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Gentle Offspring — children close to parents
  - Wild Mutation — high mutation rate
  - Bass Bloodline — breeding rules tuned for basses
  - Pad Lineage — breeding for pads
  - Cross-Species — crossing different tools' presets via shared components
  - Survivor Pool — keep only liked children
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

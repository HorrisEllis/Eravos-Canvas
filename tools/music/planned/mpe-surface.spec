# spec_id: eravos.mpe-surface · version 0.1.0 · status extends:pads, xy-pad · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (performance_and_control) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.mpe-surface ; label: MPE Surface ; domain: music ; family: performance_and_control
  lineage: expressive controllers: per-note pressure, slide and bend
  family_from: live electronic performance: clip launching, looping, controllers, MPE
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  mpe-expression · scale-key · pattern-store
adds (behaviour only this tool has):
  - on-screen MPE grid in scale
  - per-note expression routing to any tool
  - isomorphic layouts
modes: grid · keys · strip
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Fourths Grid — isomorphic fourths layout
  - Scale Pads — pads in key only
  - Slide Strings — string-like slides
  - Pressure Bass — pressure-controlled bass
  - Drum Fingers — finger drumming
  - Xen Grid — microtonal grid
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

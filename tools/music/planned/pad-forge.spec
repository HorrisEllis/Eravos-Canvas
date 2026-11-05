# spec_id: eravos.pad-forge · version 0.1.0 · status extends:pad-forge · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (ambient_and_texture) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.pad-forge ; label: Pad Forge ; domain: music ; family: ambient_and_texture
  lineage: evolving pads of ambient, trance and film
  family_from: ambient (1970s on), drone, musique concrète, field recording, cinematic sound design
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-wavetable · osc-additive · unison-stack · filter-svf · env-msseg · lfo · reverb-fdn · preset-morph
adds (behaviour only this tool has):
  - pad evolution over minutes via morph
  - per-note evolution offsets
  - brightness follows chord tension
modes: warm · glass · evolving
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Aurora Pad — bright shifting pads
  - Warm Blanket — soft warm pads
  - Glass Horizon — glassy wide pads
  - Dark Halo — dark evolving pads
  - Breath Pad — pads with breath noise
  - Endless Morph — pads morphing forever
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

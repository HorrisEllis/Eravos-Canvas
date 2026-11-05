# spec_id: eravos.field-weaver · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (ambient_and_texture) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.field-weaver ; label: Field Weaver ; domain: music ; family: ambient_and_texture
  lineage: field recording and musique concrète turned into musical material
  family_from: ambient (1970s on), drone, musique concrète, field recording, cinematic sound design
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  spectral-features · filter-bank · grain-cloud · pitch-tracker · eq-parametric · transient-slicer
adds (behaviour only this tool has):
  - pitch a recording into the song key (tonal extraction)
  - separate tonal and noisy parts
  - rhythm from natural events
modes: tonal · texture · rhythm
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Rain Into Chords — rain tuned into chords
  - City Rhythm — street sounds as grooves
  - Forest Tonal — birds and wind made tonal
  - Kitchen Concrete — kitchen sounds as percussion
  - Train Station Pad — station ambience as pad
  - Sea Glass — waves into bright textures
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

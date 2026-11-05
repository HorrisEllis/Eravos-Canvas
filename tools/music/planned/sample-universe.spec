# spec_id: eravos.sample-universe · version 0.1.0 · status planned:sampler-pro.spec; extends:sample-player · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (sampling_and_reconstruction) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.sample-universe ; label: Sample Universe ; domain: music ; family: sampling_and_reconstruction
  lineage: multisampled instruments, round robins, granular playback
  family_from: samplers (1980s on), hip-hop sampling, resynthesis research, stem separation
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  sampler-voice · grain-cloud · preset-morph · env-adsr · filter-svf · voice-allocator
adds (behaviour only this tool has):
  - key/velocity/round-robin zones with drag-in mapping
  - sample morph between zones
  - auto-map from file names or pitch detection
modes: multisample · granular · morph
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  multisampling · key-zones · velocity-zones · round-robin · granular-playback · sample-morphing
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Analog Collection — multisampled vintage synth sounds made by the user or ERAVOS
  - Found Sound — everyday objects as instruments
  - Organic Percussion — wood, skin and seeds
  - Cinematic Textures — evolving textures for scenes
  - Vocal Fragments — short vocal snippets
  - Industrial Objects — machines and metal
  - Hybrid Instruments — acoustic + synth layers
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

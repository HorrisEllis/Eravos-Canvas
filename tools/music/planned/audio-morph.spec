# spec_id: eravos.audio-morph · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (sampling_and_reconstruction) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.audio-morph ; label: Audio Morph ; domain: music ; family: sampling_and_reconstruction
  lineage: morphing, cross-synthesis and spectral interpolation
  family_from: samplers (1980s on), hip-hop sampling, resynthesis research, stem separation
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  partial-tracker · osc-additive · filter-bank · time-stretch · onset-detector
adds (behaviour only this tool has):
  - morph between N sources with pitch and transient preservation
  - morph rhythmic structure separately from timbre
  - morph curve per bar
modes: spectral · envelope · rhythmic
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  multi-source-morphing · pitch-preservation · transient-preservation · spectral-envelope-morphing · rhythmic-structure-morphing
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Voice-to-Machine — voice morphing into machinery
  - Drum-to-Bass — drums morphing into a bass
  - Analog-to-Digital — warm to cold
  - Organic-to-Industrial — nature to factory
  - Texture Evolution — texture A becoming B
  - Spectral Fusion — two sounds fused
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

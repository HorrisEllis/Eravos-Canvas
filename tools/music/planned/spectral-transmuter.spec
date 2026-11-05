# spec_id: eravos.spectral-transmuter · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (space_and_transformation) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.spectral-transmuter ; label: Spectral Transmuter ; domain: music ; family: space_and_transformation
  lineage: spectral freezing, cross-synthesis and resynthesis
  family_from: tape echo and spring tanks (dub), plates and halls (studio era), digital reverbs (1980s on), spectral processing
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  partial-tracker · osc-additive · filter-bank · spectral-features · grain-cloud
adds (behaviour only this tool has):
  - freeze and edit partials live
  - harmonic redistribution (move energy to chosen partials)
  - cross-synthesis of any two inputs
modes: freeze · redistribute · cross
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  spectral-freezing · partial-manipulation · harmonic-redistribution · cross-synthesis · spectral-resynthesis
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Frozen Harmonics — held spectra as pads
  - Spectral Ghost — faint spectral echoes of a sound
  - Metallic Voice — voice spectra made metal
  - Vocal Machine — machines speaking with a voice spectrum
  - Harmonic Bloom — partials blooming upwards
  - Spectral Collapse — spectra falling into one band
  - Alien Atmosphere — strange shifted spectra for worlds
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

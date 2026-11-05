# spec_id: eravos.oscillation-ecology · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (signature_innovations) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.oscillation-ecology ; label: Oscillation Ecology ; domain: music ; family: signature_innovations ; signature: true
  lineage: ERAVOS: populations of oscillators that compete, cooperate and synchronise
  family_from: ERAVOS's own ideas — the reason to choose it over any DAW
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  oscillator-population · chaos-attractor · relationship-graph · spectral-features
adds (behaviour only this tool has):
  - oscillator-populations
  - coupling-topologies
  - phase-interaction
  - frequency-interaction
  - attractor-behavior
  - synchronization
  - competing-oscillators
  - group-coherence
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  oscillator-populations · coupling-topologies · phase-interaction · frequency-interaction · attractor-behavior · synchronization · competing-oscillators · group-coherence
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Coupled Choir — voices coupling into a choir
  - Competing Machines — oscillators fighting for dominance
  - Harmonic Ecosystem — a balanced harmonic world
  - Phase Storm — chaotic phase interactions
  - Stable Orbit — calm stable orbits
  - Chaotic Bloom — chaos blooming into order
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

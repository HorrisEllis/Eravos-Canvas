# spec_id: eravos.tension-field · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (tension_and_oscillation) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.tension-field ; label: Tension Field ; domain: music ; family: tension_and_oscillation ; signature: true
  lineage: ERAVOS: tension measured in five domains at once and used as a control signal
  family_from: film-score suspense, EDM build-ups, minimalism, phase music, chaotic and coupled systems
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  tension-meter · energy-curve · spectral-features · onset-detector · chord-recognizer · relationship-graph
adds (behaviour only this tool has):
  - live tension curves (harmonic, rhythmic, spectral, density, pitch-instability)
  - map any tension domain to any parameter
  - trajectory targets: 'reach 80 by bar 16'
modes: measure · map · target
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  harmonic-tension · rhythmic-pressure · spectral-brightness · density-pressure · pitch-instability · tension-trajectory · release-trajectory
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Slow Burn — tension rising over 32 bars across all domains
  - Rising Pressure — density and brightness climbing together
  - Suspended Resolution — harmonic tension held high, rhythm relaxed
  - Dissonance Bloom — dissonance opening as the filter opens
  - Pre-Drop — all domains peak in the bar before the drop
  - Psychological Horror — pitch instability and silence used for dread
  - Release Cascade — domains releasing one after another
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

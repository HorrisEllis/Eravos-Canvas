# spec_id: eravos.motion-extractor · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (tension_and_oscillation) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.motion-extractor ; label: Motion Extractor ; domain: music ; family: tension_and_oscillation
  lineage: envelope followers and audio-to-control, generalised to any audio feature
  family_from: film-score suspense, EDM build-ups, minimalism, phase music, chaotic and coupled systems
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  envelope-follower · onset-detector · spectral-features · pitch-tracker · beat-tracker · mod-ops
adds (behaviour only this tool has):
  - any feature of any audio becomes modulation
  - feature recording to modulation clips
  - smoothing, range and curve per feature
modes: live · recorded
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  amplitude-analysis · transient-analysis · spectral-analysis · pitch-analysis · rhythm-analysis · feature-to-modulation
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Bass Follower — bass loudness driving pad brightness
  - Transient Driver — drum hits triggering modulation pulses
  - Spectral Motion — centroid driving filter and width
  - Vocal Movement — vocal pitch and loudness steering synths
  - Kick Pump — kick envelope as a pump source
  - Rhythmic Breath — onset density driving reverb size
  - Reactive Texture — every feature mapped gently to a texture
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

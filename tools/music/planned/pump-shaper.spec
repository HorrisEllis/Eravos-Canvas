# spec_id: eravos.pump-shaper · version 0.1.0 · status extends:sidechain-compressor · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (rhythm_and_contrast) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.pump-shaper ; label: Pump Shaper ; domain: music ; family: rhythm_and_contrast
  lineage: sidechain pumping of French house, EDM and future bass
  family_from: drum machines (1980s on), breakbeat culture, UK garage, jungle, footwork, dembow, techno, polyrhythm traditions worldwide
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  ducker · compressor · envelope-follower · multiband-splitter · clock-div
adds (behaviour only this tool has):
  - pump from notes, kick audio or transport — drawn curve
  - per-band pump (sub ducks, tops don't)
  - pump amount as a relationship target
modes: curve · audio · multiband
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Filter Disco Pump — deep quarter-note breathing
  - Future Bass Swell — chords swelling back after each kick
  - Sub Only Duck — sub ducks, mids stay put
  - Tight Club Duck — fast short duck for clean low end
  - Off-Beat Breathe — pump on the off-beats instead
  - Triplet Pump — pumping in triplets over straight four
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

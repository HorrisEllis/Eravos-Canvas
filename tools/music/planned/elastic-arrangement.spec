# spec_id: eravos.elastic-arrangement · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (signature_innovations) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.elastic-arrangement ; label: Elastic Arrangement ; domain: music ; family: signature_innovations ; signature: true
  lineage: ERAVOS: sections resize and everything in them adapts
  family_from: ERAVOS's own ideas — the reason to choose it over any DAW
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  structure-segmenter · pattern-store · energy-curve · time-stretch
adds (behaviour only this tool has):
  - stretch a section from 16 to 24 bars: patterns extend, automation re-scales, fills move to the new end
  - insert/delete bars with musical repair
  - section rules per tool (loop, stretch, hold)
modes: stretch · insert · repair
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Radio Edit — shorten to a radio length
  - Extended Mix — lengthen intros and outros for DJs
  - Breakdown Grow — longer breakdowns
  - Tight Arrangement — remove dead space
  - DJ Tool — long beat-only intros
  - Live Version — loose, extended sections
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

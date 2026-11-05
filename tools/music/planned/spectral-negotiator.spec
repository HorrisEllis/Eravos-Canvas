# spec_id: eravos.spectral-negotiator · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (signature_innovations) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.spectral-negotiator ; label: Spectral Negotiator ; domain: music ; family: signature_innovations ; signature: true
  lineage: beyond sidechain EQ: every track on the canvas negotiates frequency space by priority
  family_from: ERAVOS's own ideas — the reason to choose it over any DAW
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  masking-analyzer · eq-parametric · multiband-dynamics · relationship-graph · spectral-features
adds (behaviour only this tool has):
  - N tracks, each with a priority per band; lower priority yields only where and when masked
  - every carve is a visible, editable EQ band
  - negotiation strength per section
modes: priority · fair · follow-the-lead
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Vocal Is King — everything yields to the vocal
  - Kick First — kick wins the low end
  - Fair Share — equal give-and-take
  - Lead Spotlight — the lead melody wins mids
  - Drop Clarity — strong carving in drops only
  - Gentle Peace — very light carving
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

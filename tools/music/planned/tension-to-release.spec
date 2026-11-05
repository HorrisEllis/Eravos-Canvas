# spec_id: eravos.tension-to-release · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (signature_innovations) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.tension-to-release ; label: Tension-to-Release Engine ; domain: music ; family: signature_innovations ; signature: true
  lineage: ERAVOS: tension trajectories as playable objects (tension-field measures; this plays)
  family_from: ERAVOS's own ideas — the reason to choose it over any DAW
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  tension-meter · energy-curve · relationship-graph · state-machine-core
adds (behaviour only this tool has):
  - tension-trajectories
  - release-trajectories
  - multi-domain-mapping
  - temporal-progression
  - user-defined-resolution
  - conditional-release
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  tension-trajectories · release-trajectories · multi-domain-mapping · temporal-progression · user-defined-resolution · conditional-release
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Suspense — long slow suspense
  - Last Bar Before — max tension in the final bar
  - Release Explosion — all release at once
  - Slow Pressure — pressure building slowly
  - Unresolved Motion — tension never released
  - False Release — fake drop then real drop
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

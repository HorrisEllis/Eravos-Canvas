# spec_id: eravos.fill-generator · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (rhythm_and_contrast) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.fill-generator ; label: Fill Generator ; domain: music ; family: rhythm_and_contrast
  lineage: drum fills, snare rolls and build-ups of every dance genre
  family_from: drum machines (1980s on), breakbeat culture, UK garage, jungle, footwork, dembow, techno, polyrhythm traditions worldwide
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  ratchet · pattern-store · probability-gate · energy-curve · seed-registry
adds (behaviour only this tool has):
  - fills written to the last N steps of a phrase, density rising to the downbeat
  - build-ups: 1/4 → 1/8 → 1/16 → 1/32 rolls with pitch and filter ramps
  - fills target any drum tool
modes: fill · build · transition
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Festival Snare Rise — 8-bar accelerating snare roll with pitch climb
  - Tom Cascade — falling tom fills into the one
  - Two-Beat Flick — short fills every 4 bars
  - Breakbeat Turnaround — slice-based fills from the loaded break
  - Hat Spiral — hats rolling faster and opening
  - Anti-Fill — drops out instead of filling: tension by absence
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

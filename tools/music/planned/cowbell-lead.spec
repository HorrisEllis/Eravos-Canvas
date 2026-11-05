# spec_id: eravos.cowbell-lead · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (hiphop_and_global_club) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.cowbell-lead ; label: Cowbell Lead ; domain: music ; family: hiphop_and_global_club
  lineage: drift phonk: melodic distorted cowbell lines from a classic drum-machine cowbell
  family_from: trap (2000s on), UK and NY drill (2010s), phonk (Memphis roots, 2020s drift phonk), amapiano (South Africa, 2010s), baile funk (Rio, 1990s on), jersey and Baltimore club, gqom, reggaeton and dembow, footwork and juke (Chicago)
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-va · filter-svf · waveshaper · clipper · env-adsr · scale-key · reverb-fdn
adds (behaviour only this tool has):
  - two-square cowbell tuned to the note
  - distortion + reverb tail as one tone
  - pitched melody playable
modes: phonk · latin · metal
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Drift Bell — distorted melodic cowbell
  - Night Ride Bell — dark reverb cowbells
  - Clean Bell Line — undistorted pitched cowbell
  - Crushed Bell — bit-crushed cowbell
  - Bell Chords — cowbell chords
  - Metal Bell — inharmonic metallic cowbell
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

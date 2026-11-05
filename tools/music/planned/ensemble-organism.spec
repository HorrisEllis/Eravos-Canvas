# spec_id: eravos.ensemble-organism · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.ensemble-organism ; label: Ensemble Organism ; domain: music ; family: synthwave_retro
  lineage: 1970s string machines and bucket-brigade chorus/ensemble units, tape doubling
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  ensemble-core · bbd-line · delay-line · lfo · stereo-tools · saturator-tape
adds (behaviour only this tool has):
  - 3-phase ensemble LFO sets
  - voice-count 2–12 with per-line character
  - BBD clock noise and companding as controls
modes: chorus · ensemble · flanger · doubler
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  modulated-delay-lines · multi-voice-chorus · phase-offset-modulation · stereo-movement · detuning · bbd-modeling
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Divide-Down Strings — string-machine shimmer from three-phase ensemble
  - Twin-Bucket Width — classic two-mode BBD chorus width
  - Tape Choir — tape-doubled lines with wow for a slurred choir
  - Shimmer Strings — fast ensemble shimmer over a bright high shelf
  - Warped Cassette — chorus that wanders off pitch like a stretched tape
  - Glass Ensemble — many clean lines, crystalline and wide
  - Wide Analog — subtle stereo motion for basses and keys
  - Dream Machine — slow deep ensemble for ambient chords
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

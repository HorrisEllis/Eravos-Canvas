# spec_id: eravos.swarm-oscillator · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.swarm-oscillator ; label: Swarm Oscillator ; domain: music ; family: synthwave_retro
  lineage: beyond supersaw: coupled-oscillator physics applied to unison
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  oscillator-population · osc-va · osc-wavetable · filter-svf · env-adsr · lfo · stereo-tools
adds (behaviour only this tool has):
  - unison voices that pull on each other (lock, beat, break apart) instead of fixed detune
  - harmonic grouping: voices cluster on chosen partials
  - coherence meter + coherence as a modulation source
modes: free · coupled · harmonic · chaotic
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  coupled-oscillator-bank · independent-frequency-control · phase-coupling · frequency-drift · harmonic-grouping · phase-coherence-analysis
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Loose Constellation — voices orbiting each other, never quite in tune
  - Locked Unison — huge unison that snaps to perfect phase on the beat
  - Harmonic Swarm — voices settling on 3rds, 5ths and octaves like a chord
  - Choir Drift — slow vocal-pad swarm, breathing apart and together
  - Detuned Cathedral — wide organ-like swarm with church-room width
  - Pulsing Machine — coupling pumped by tempo, rhythmic beating
  - Fractured Cluster — high-coupling chaos: shards of pitch that won't settle
  - Organic Strings — section-like ensemble where players lock and slip
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

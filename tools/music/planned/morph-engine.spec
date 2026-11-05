# spec_id: eravos.morph-engine · version 0.1.0 · status extends:syn-osc · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.morph-engine ; label: Morph Engine ; domain: music ; family: synthwave_retro
  lineage: 1980s wavetable synthesis to modern wavetable/spectral synths
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-wavetable · osc-additive · unison-stack · filter-svf · filter-comb · env-msseg · lfo · preset-morph
adds (behaviour only this tool has):
  - morph between wavetable, additive and spectral views of the same sound
  - tables from any audio or drawn, with spectral edit
  - two-layer position morph with independent warp
modes: wavetable · additive · spectral · hybrid
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  wavetable · additive · spectral · sample-derived-waveforms · waveform-morphing
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Liquid Motion — smooth position sweeps, glassy and wet
  - Neon Saw — bright morphing saws for synthwave leads and chords
  - Organic Evolution — tables made from wood, breath and voice, slowly moving
  - Digital Decay — bit-sliced frames that crumble as position rises
  - Spectral Bloom — additive swells that open partial by partial
  - Hyperpop — squeaky formant tables, pitched-up and plastic-bright
  - Dark Matter — low, heavy frames for menacing basses and drones
  - Morphing Choir — vowel-table pads walking through a choir
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

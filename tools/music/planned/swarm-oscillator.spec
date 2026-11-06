# spec_id: eravos.swarm-oscillator · version 1.0.0 · status building (2026-11-06, his go: "Make the swarm oscillator first. Since you were ready to.") · template eravos.tool/1
# built in: tools/music/tools/genre-instruments/swarm-oscillator/ (that folder's spec is generated from the code; this file stays the design)
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
ports (written 2026-11-06; 0.1.0 said, verbatim: "ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)"):
  in:  note_in (note:trigger — sequenced, Timeline clips) · midi_in (hands) · transport_in (Lock on beat) · theory_in (key)
       mod_in coupling (audio-rate, ±1 added to Coupling) · mod_in cutoff (audio-rate, ±4800 cents) · every other control: knob.<key> (automatic)
  out: audio_out (stereo) · mod_out coherence (0…1, audio-rate: how locked the swarm is, the loudest note's) · curve.out (automatic)
params (written 2026-11-06; 0.1.0 said, verbatim: "params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination"):
  SWARM   mode [free, coupled, harmonic, chaotic] def coupled · voices 1..32 def 9 · spread 0..1 def 0.35 (±50 cents at 1) ·
          coupling 0..1 def 0.45 · pull 0..1 def 0.5 · drift 0..1 def 0.25 · cluster 0..1 def 0 · sync [off, 1/4, 1/2, bar] def off
  OSC     shape [saw, pulse, tri, table] def saw · table 0..1 def 0 · sub 0..1 def 0.2 · octave -3..3 def 0
  TONE    cutoff 40..18000 Hz def 6000 · res 0..1 def 0.2 · envAmt 0..1 def 0.4 · attack 0.001..10 s · decay 0.01..4 s · sustain 0..1 · release 0.01..12 s
  MOVE    lfoRate 0.01..20 Hz def 0.3 · lfoCouple -1..1 def 0 (the LFO moves Coupling)
  OUT     width 0..1 def 0.8 · monoBelow 20..400 Hz def 120 · level 0..1 def 0.7
  face (10): voices spread coupling cluster · cutoff res attack release · width level — the rest behind More depth ▸ (UI: swarm-oscillator.ui.md)
signal_dag (per note; up to 8 notes, each its own swarm):
  notes → env-adsr (amp) · env-adsr (filter, × envAmt)
  lfo → oscillator-population (coupling += lfoCouple · lfo)
  oscillator-population (N phases, natural frequencies from spread + drift, Kuramoto coupling, pull, harmonic ratios) → osc-va (saw · pulse · tri, polyBLEP) | osc-wavetable (table)
  osc-va (sub, one octave down, not coupled) → sum
  osc-va | osc-wavetable → stereo-tools (each voice panned across width, equal power) → sum
  sum → filter-svf (lowpass 24 dB, cutoff + filter env + mod) → env-adsr (amp) → stereo-tools (mono below) → out
  oscillator-population → meter (coherence R = |mean of e^(iθ)|) → coherence out
decisions (2026-11-06):
  - the swarm runs in ONE AudioWorklet built from the components' own kernel text (what the tests prove is what plays — as filter-svf)
  - modes are different physics, not settings: free = no coupling · coupled = phases pull together (Kuramoto) · harmonic = voices
    settle on ratios 1, 3/2, 2, 5/4, 3 … (n:m locking, Cluster = how far toward the ratios) · chaotic = repulsive coupling (they push apart)
  - Pull = how fast the voices' own frequencies are drawn to the swarm's while coupled (adaptive frequency); 0 = only phases lock
  - Lock on beat: on each division of the transport, every phase snaps to the swarm's mean phase
  - components are NEW code, proved on their own (each <id>.test.mjs); extracting them out of today's tools (lfo, syn-env, syn-osc,
    wobble-bass) is a separate step that must null-render — listed per component, not hidden
open gaps (none hidden):
  - packs: one factory pack with one preset per planned pack name (8); the spec's ≥ 6 presets per pack is not met yet
  - LFO free-running in Hz only (no tempo sync yet); osc-wavetable has built-in tables only (no user tables from audio yet)
  - Open as components (each component as its own window) — after the components have windows
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

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 7 it stands on · 7 of 7 built (✓)
  layer 0: env-adsr ✓ · filter-svf ✓ · lfo ✓ · osc-va ✓ · osc-wavetable ✓ · oscillator-population ✓ · stereo-tools ✓
  tool: eravos.swarm-oscillator ← oscillator-population + osc-va + osc-wavetable + filter-svf + env-adsr + lfo + stereo-tools
  build order: env-adsr ✓ → filter-svf ✓ → lfo ✓ → osc-va ✓ → osc-wavetable ✓ → oscillator-population ✓ → stereo-tools ✓ → swarm-oscillator
  shared with: env-adsr 20 · filter-svf 40 · lfo 27 · osc-va 26 · osc-wavetable 11 · oscillator-population 3 · stereo-tools 16  (other tools on each)
  signal_dag check: every node is one of its components ✓

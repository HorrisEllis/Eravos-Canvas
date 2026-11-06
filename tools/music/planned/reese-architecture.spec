# spec_id: eravos.reese-architecture · version 0.1.0 · status audited · extends:reese-bass · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (wub_bass) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.reese-architecture ; label: Reese Architecture ; domain: music ; family: wub_bass
  lineage: detuned-saw bass from late-1980s Detroit techno, adopted by jungle, drum & bass and neurofunk
  family_from: UK dubstep (mid-2000s), brostep (c. 2010), neurofunk (late 1990s on), riddim and tearout (2015 on), melodic and colour bass
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-va · osc-wavetable · unison-stack · filter-svf · filter-allpass-chain · multiband-splitter · stereo-tools · lfo · saturator-tube
adds (behaviour only this tool has):
  - independent detune per oscillator with beat-rate display (Hz)
  - phase-interaction view
  - mid-band movement with mono sub band
modes: classic · neuro · wide
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  multi-oscillator · independent-detuning · spectral-layering · phase-interaction · stereo-evolution
built_today (read from tools/music/tools/bass/reese-bass/reese-bass.engine.js, eravos.reese-bass 2.0.0 — the code is the source of truth; re-run the extract when it changes):
  ports: audio_out · note_in · midi_in · transport_in · mod_in(cutoff) · mod_in(combTime) · mod_in(width)
  params (26):
    STACK: voices 2..6 · detune 0..50 c · width 0..1
    PITCH: octave -4..2 · transpose -36..24 st
    FILTER: cutoff 30..16000 Hz · res 0.5..20 · envAmt 0..4 oct · envDecay 0.05..3 s · drift 0..1 · driftRate 0.05..2 Hz
    COMB: combTime 1..12 ms · combFb -0.95..0.95 · combSync (on/off) · combRate [4/1, 2/1, 1/1, 1/2, 1/4, 1/8, 1/16] · combHz 0.02..10 Hz · combMix 0..1
    DRIVE+SUB: dist 0..1 · level 0..1.5 · sub 0..1 · keepRange (on/off) · subOct [0, -1, -2] · subWarm 0..1 · glide 0..2 s · attack 0.001..6 s · release 0.01..10 s
component_mapping (where each group's code moves — phase 0; the move changes nothing: every factory preset nulls ≤ −60 dB):
  STACK → osc-va · unison-stack (voices, detune) · stereo-tools (width, M/S)
  PITCH → scale-key / note handling (no DSP component)
  FILTER → filter-svf (24 dB = two stages) · env-adsr (env) · random-source + slew-lag (drift walk)
  COMB → filter-comb · lfo (comb sweep, sync/free)
  DRIVE+SUB → waveshaper (dist, 4× oversampled) · osc-sub (sub, subOct, keepRange) · waveshaper (subWarm) · slew-lag (glide) · env-adsr (attack, release)
depth_audit — gaps to full range (each new control defaults to the value that reproduces today's sound):
  - voices 2–6 → 1–16 (unison-stack), with a detune CURVE and per-oscillator detune shown as beat rate in Hz
  - wavetable source beside the saws (osc-wavetable) — the ecosystem entry assembles it
  - phaser stage (filter-allpass-chain) — neuro movement today comes only from the comb
  - multiband: mid band moves, sub band stays mono and clean (multiband-splitter) — today the sub bypasses width and comb, the stack does not split
  - drive character choice: tube asymmetry (saturator-tube) beside the current asymmetric shaper
  - filter: types and slopes (filter-svf), full ADSR filter envelope (today decay only), key track, velocity
  - a general LFO to cutoff / width / detune (lfo) — today movement = drift walk + comb sweep + mod inputs
  - comb key-tracking (comb time follows the note)
ports_target (added to today's ports; nothing removed):
  - mod_in for detune, res, combFb, combMix, dist, sub (today: cutoff, combTime, width)
  - theory_in (Wobble, Supersaw and Retro Poly have it; Reese does not)
params_target: today's params unchanged + one control per gap above, named in the component that owns it (no duplicate controls across components)
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Classic Reese — two saws, slow beating, simple lowpass
  - Neuro Reese — phaser and comb movement over a reese core
  - Dark DnB — low, tense, distorted reese for rollers
  - Liquid Reese — soft and wide, gently moving
  - Metallic Reese — ring-modded upper reese, steel-edged
  - Wide Saw — unison reese with mono-below for clubs
  - Submerged — underwater filtered reese drones
  - Industrial Reese — clipped and folded reese grind
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
  components: 9 it stands on · 6 of 9 built (✓)
  layer 0: filter-allpass-chain · filter-svf ✓ · lfo ✓ · multiband-splitter · osc-va ✓ · osc-wavetable ✓ · saturator-tube · stereo-tools ✓ · unison-stack ✓
  tool: eravos.reese-architecture ← osc-va + osc-wavetable + unison-stack + filter-svf + filter-allpass-chain + multiband-splitter + stereo-tools + lfo + saturator-tube
  build order: filter-allpass-chain → filter-svf ✓ → lfo ✓ → multiband-splitter → osc-va ✓ → osc-wavetable ✓ → saturator-tube → stereo-tools ✓ → unison-stack ✓ → reese-architecture
  shared with: filter-allpass-chain 5 · filter-svf 40 · lfo 27 · multiband-splitter 10 · osc-va 26 · osc-wavetable 11 · saturator-tube 2 · stereo-tools 16 · unison-stack 15  (other tools on each)

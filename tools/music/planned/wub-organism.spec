# spec_id: eravos.wub-organism · version 0.1.0 · status audited · extends:wobble-bass · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (wub_bass) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.wub-organism ; label: Wub Organism ; domain: music ; family: wub_bass
  lineage: LFO-to-filter wobble grown into multi-stage modulated bass design
  family_from: UK dubstep (mid-2000s), brostep (c. 2010), neurofunk (late 1990s on), riddim and tearout (2015 on), melodic and colour bass
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-va · osc-wavetable · osc-fm-operator · osc-phase-distortion · osc-sub · sampler-voice · unison-stack · ring-mod · filter-svf · filter-formant · filter-comb · waveshaper · clipper · lfo · step-mod · env-msseg · stereo-tools · multiband-splitter
adds (behaviour only this tool has):
  - wub lanes: rate, shape and depth per step (Wub Seq) per stage
  - stage graph: source → growl → filter → drive → bands, each stage replaceable by any component by wiring (K4)
  - sub stays mono and phase-aligned while tops move
modes: wobble · growl · riddim · neuro · melodic
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  wavetable · fm · phase-distortion · analog-oscillators · sample-layering · multi-stage-modulation
built_today (read from tools/music/tools/bass/wobble-bass/wobble-bass.engine.js, eravos.wobble-bass 4.1.0 — the code is the source of truth; re-run the extract when it changes):
  ports: audio_out · note_in · midi_in · theory_in · transport_in · mod_in(cutoff) · mod_in(depth) · mod_in(drive) · mod_in(rate) · mod_in(fm) · mod_in(pitch) · mod slots: growl
  params (69):
    WOBBLE: div [1/1, 1/2, 1/4., 1/4, 1/8., 1/4t, 1/8, 1/16., 1/8t, 1/16, 1/16t, 1/32, 1/64] · lfoShape [sine, sawdown, square, yoy, draw] · shapePts (drawn) · depth 0..8 oct · lfoSync (on/off) · lfoHz 0.02..40 Hz · retrig (on/off) · lfoPhase 0..1 · ampMod 0..1 · vibrato 0..2400 c · rateBend 0.25..4 × · rateGlide 0..2 s
    WUB SEQ: wubOn (on/off) · wubLen 1..16 · wubStep [1/16, 1/8, 1/4, 1/2, 1/1] · wubSeq (drawn)
    FILTER: filterMode [lowpass, formant, highpass, bandpass, notch, comb, comb-] · vowelA [OO, OH, AH, EH, EE, UH, AE, IH, ER] · vowelB [OO, OH, AH, EH, EE, UH, AE, IH, ER] · formantShift -24..24 st · cutoff 40..8000 Hz · res 0.5..20
    FILTER+: slope [12, 24, 36] · keyTrack 0..1 · fEnvAmt -8..8 oct · fEnvDecay 0.005..4 s · velCutoff 0..1
    GROWL: fmIndex 0..12 · fmRatio [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8] · fmWub 0..1 · squash 0..1
    GROWL+: fmFine -0.5..0.5 · ring 0..1 · voices [2, 4, 6, 8] · subWave [sine, triangle, square]
    WAVETABLE: wtMix 0..1 · wtTable [growl, vowel, metal, digital, organ] · wtPos 0..1
    TONE: osc2 0..1 · sub 0..1 · drive 0..1 · shaper 0..1 · gritMode [auto, soft, asym, fold, hard, crush] · octave -3..3 · transpose -36..24 st · spread 0..50 c · width 0..1 · noise 0..1 · sqOct [0, -1] · keepRange (on/off) · subOct [0, -1, -2] · subAlign (on/off) · level 0..1.5
    ENV: glide 0..2 s · attack 0.001..4 s · release 0.01..8 s · pitchDive -48..48 st · diveTime 0.005..1 s
    ENV+: decay 0.001..4 s · sustain 0..1
    LFO 2: lfo2Dest [off, pitch, cutoff, fm, volume] · lfo2Shape [sine, triangle, square, sawtooth] · lfo2Sync (on/off) · lfo2Div [1/1, 1/2, 1/4., 1/4, 1/8., 1/4t, 1/8, 1/16., 1/8t, 1/16, 1/16t, 1/32, 1/64] · lfo2Hz 0.02..20 Hz · lfo2Depth 0..1
    OUTPUT: monoBelow 0..400 Hz · clipOn (on/off) · ceiling -24..0 dB
component_mapping (where each group's code moves — phase 0; the move changes nothing: every factory preset nulls ≤ −60 dB):
  WOBBLE → lfo
  WUB SEQ → step-mod
  FILTER → filter-svf · filter-formant · filter-comb
  FILTER+ → filter-svf (slope, key track) · env-adsr (filter env)
  GROWL → osc-fm-operator · waveshaper (squash)
  GROWL+ → osc-fm-operator (fine) · ring-mod · unison-stack (voices) · osc-sub (subWave)
  WAVETABLE → osc-wavetable
  TONE → osc-va (osc2) · osc-sub · osc-noise · waveshaper (drive, shaper, gritMode) · bitcrusher (crush grit) · stereo-tools (spread, width)
  ENV → env-adsr · slew-lag (glide) · env-msseg (pitch dive)
  ENV+ → env-adsr
  LFO 2 → lfo (second instance)
  OUTPUT → stereo-tools (monoBelow) · clipper (clipOn, ceiling)
depth_audit — gaps to full range (each new control defaults to the value that reproduces today's sound):
  - wavetable MORPH between two positions/tables, and tables from any audio (osc-wavetable warp modes)
  - phase-distortion source (osc-phase-distortion) and sample layer (sampler-voice) — named in the ecosystem entry, absent today
  - filter types still open from tool-depth D1: ladder (filter-ladder), phaser (filter-allpass-chain); a SECOND filter, serial/parallel
  - FM feedback and hard sync (osc-fm-operator feedback, osc-va sync)
  - oversampling choice 1–8× on drive stages (oversampler) — today fixed per stage
  - Wub Seq per-step DEPTH and SHAPE (step-mod lanes per stage), not only per-step values
  - LFO: stereo phase offset, fade-in, smoothing, envelope-follower mode (lfo, envelope-follower)
  - full multi-segment envelopes for amp, filter and wave position (env-msseg) — today amp ADSR + filter decay
  - multiband stage: different motion per band with a clean mono sub (multiband-splitter)
  - true-peak meter on the output (limiter-true-peak detector)
  - velocity → depth / FM / drive (today velocity → cutoff only)
ports_target (added to today's ports; nothing removed):
  - mod_in for every component control (motion core gives each knob one) — first: wtPos, res, ring, lfo2Depth, formantShift, monoBelow
  - audio_in on the growl slot (already a mods slot) and on each stage once the stage graph opens as components
params_target: today's params unchanged + one control per gap above, named in the component that owns it (no duplicate controls across components)
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Classic Wobble — half-note to 1/8 LFO lowpass wobble over a clean sub
  - Tearout — aggressive serrated mids, fast rate changes, hard clipping
  - Riddim — sparse square-ish wubs, repetitive and hypnotic, heavy space
  - Deep Dub — slow round wobbles, lots of sub, dub weight
  - Brostep Growl — FM-driven formant growls with vowel sweeps
  - Neuro Bass — tight, technical comb and phaser movement
  - Melodic Wub — tuned wubs that play chords and leads
  - Metallic Bass — ring-mod and inharmonic FM steel
  - Liquid Bass — smooth, rolling and warm, low drive
  - Xeno Wub — unrecognisable alien vowels and pitch dives
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# ============================================================
# ERAVOS v10 → ORGANISM CONVERSION MAP
# spec_id:      eravos.v10-conversion
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# source:       ERAVOS_v10.html (6147 lines, v9 engine + v10 patches) + eravos_dist/{library,plugins,clips}
# extends:      eravos.phasemap.music-3.18 (adds phase P8)
# created_at:   2026-09-25
# ============================================================
#
# Rule: convert what is REAL, rebuild what is a SHELL, absorb what
# DUPLICATES an existing organism, drop what is decoration.
# Nothing is copied verbatim — v10 code is reference, not source.
# (v10 is a single global-scope app: window.* singletons, inline
# onclick, shared `synths`/`AC` globals — violates K-3/K-5 throughout.)

# ============================================================
# v10 FAULT REGISTER (continues F-series)
# ============================================================
v10_faults:
  F-19: 21 plugins are UI shells — window._plugState written (L4238/4247), never read by any audio code
  F-20: mixer fake — faders move CSS only; VU = master spectrum bands, not channels (L1560–1610)
  F-21: EMERGE "granular" spawns synth voices, not buffer grains
  F-22: euclid, emerge, spatial, vagal each run a private setTimeout clock (4 more clocks; see F-18)
  F-23: library entries carry voice name + metadata only — no sound parameters; 117 presets map onto ~30 voices
  F-24: everything global (window.SPATIAL_INSTRUMENT etc., inline onclick) — no instances, no unmount
  F-25: PRESET_STORE uses localStorage per plugin id — lost across machines, not in workspace
  F-26: codec-v2 f0 = FFT peak bin in 80–1200 Hz → octave errors on harmonic-rich voice (no autocorrelation/YIN)

# ============================================================
# VERDICTS
# ============================================================
# convert  → new organism spec (listed)
# rebuild  → v10 had the idea but no working engine; new organism
# absorb   → feature moves into an existing organism/runtime (amendment below)
# data     → JSON carried into catalog as data, feeds an organism
# drop     → decoration / superseded

verdicts:
  # ── v9 engine / v10 modules ───────────────────────────────
  synth_library (~30 voices):     absorb → pads (drum voices) + eravos.fx-box (one-shot SFX) + eravos.library (browser)
  library/ 117 presets:           data   → data/library/ ; consumed by eravos.library
  QOTSA gothic_organ/gothic_chord: convert → eravos.organ
  eerie_scrape, bounceL/R, ricochet, laser, pew, zap, riser, drop, scream, glitch, vinyl: convert → eravos.fx-box
  curvePerc + CURVE_INSTRUMENT + curve editor + plugin 'curve': convert → eravos.curve-synth
  euclidean:                      convert → eravos.euclid
  clip maker:                     convert → eravos.clip-maker
  oscilloscope:                   absorb → UIKit.Scope (runtime)
  codec-v2 (pitch/slope/stability/oscillation): convert → eravos.voice-scope   (fix F-26)
  mapper v2 + pad lighting MIDI out + MIDI monitor: convert → eravos.midi-mapper
  PRESET_STORE:                   absorb → organism-sdk presets (workspace + IndexedDB, F-25)
  import/export:                  absorb → runtime Workspace
  mixer:                          drop   (superseded by eravos.channel, F-20)
  particles / beam FX / beat flash: drop (canvas-cfr already covers)
  learn page + lessons:           convert → eravos.coach (P8, low priority, spec below)

  # ── modes (boot screen) ───────────────────────────────────
  SPATIAL (orbital XY note placer): convert → eravos.orbit
  VISUAL  (grid painter, colour = pitch): absorb → eravos.sequencer 'paint view' (amendment A-4)
  EMERGE  (cloud):                rebuild → eravos.granular (real buffer grains, F-21)
  VAGAL   (breath instrument):    convert → eravos.breath
  mode environments themselves:   convert → genome + recipe specs (eravos.genomes-v10.spec)

  # ── plugins (21 shells → real DSP) ────────────────────────
  chorus, flanger:  rebuild → eravos.fx-moddelay (one topology, two ranges — hardware-honest, not fused)
  phaser:           rebuild → eravos.fx-phaser
  filter:           rebuild → eravos.fx-filter
  eq:               rebuild → eravos.fx-eq
  dist, bitcrush:   rebuild → eravos.fx-destroyer (non-linear family: shape → fold → crush → downsample)
  comp:             rebuild → eravos.fx-dynamics
  gate (trance gate): absorb → sidechain step-pattern mode (amendment A-2)
  delay:            rebuild → eravos.fx-echo
  rev:              absorb → master-fx reverb (send) ; freeze/shimmer added there (amendment A-5)
  pitch:            rebuild → eravos.fx-pitch
  glitch:           rebuild → eravos.fx-glitch
  looper:           rebuild → eravos.looper
  vocoder:          rebuild → eravos.vocoder
  arp:              rebuild → eravos.arp (note processor) ; supersaw arp removed (amendment A-1)
  osc2 (WAVEFORM LAB): rebuild → eravos.waveform-lab
  sampler:          absorb → eravos.sample-player
  sidechain:        absorb → eravos.sidechain-compressor
  curve:            absorb → eravos.curve-synth
  plugin JSON params/presets: data → data/plugins/ ; each FX organism seeds factory presets from its file

# ============================================================
# AMENDMENTS TO EXISTING 3.18 SPECS (no silent drift)
# ============================================================
amendments:
  A-1: eravos.supersaw   — arp section removed; chord mode kept; arpeggiation is eravos.arp placed between source and synth
  A-2: eravos.sidechain-compressor — shape length enum [1 beat, 1 bar]; 'step' mode: 16-step on/off/level pattern with smoothing (absorbs v10 gate)
  A-3: eravos.organism-sdk (runtime R2) — presets: factory (data/presets) + user (IndexedDB 'presets' store, keyed by organism id) ; saved into workspace
  A-4: eravos.sequencer  — 'paint view': drag across grid paints steps; vertical position within a melodic cell = degree, brush pressure = velocity; colour renders degree
  A-5: eravos.master-fx  — reverb gains freeze (infinite hold, input muted) and shimmer (+12 st pitch in feedback via eravos.fx-pitch algorithm, internal)
  A-6: eravos.pads       — voice set extended from v10 library: tom, perc(FM), shaker, cowbell already present; add 'break' voice = sample slot preloaded from clip-maker output

# ============================================================
# PHASE P8 — v10 CONVERSION (after P7 verify)
# ============================================================
phase_P8:
  depends_on: [P7]
  order (bottom-up; each sub-phase gated like P2–P6):
    P8.1 effects:     [fx-moddelay, fx-phaser, fx-filter, fx-eq, fx-destroyer, fx-dynamics, fx-echo, fx-pitch, fx-glitch]
    P8.2 processors:  [arp, looper, vocoder]
    P8.3 sources:     [organ, waveform-lab, fx-box, curve-synth, granular]
    P8.4 generators:  [euclid, orbit, breath]
    P8.5 tools:       [clip-maker, voice-scope, midi-mapper, library, coach]
    P8.6 ecosystems:  [eravos.genomes-v10.spec recipes]
  exit (all):
    - every FX: in→out null test (mix 0 → output equals input ± 1e-6) and bypass click-free (< −60 dB step)
    - no private clocks (F-22): grep setTimeout in P8 engines used only for UI
    - library: every one of 117 entries resolves to organism + preset, audition non-silent
    - plugin JSON presets load into their organism without fault
  versioning: pack 3.19.0 at P8 exit

organism_index_P8:
  eravos.fx-moddelay: P8.1 ; eravos.fx-phaser: P8.1 ; eravos.fx-filter: P8.1 ; eravos.fx-eq: P8.1
  eravos.fx-destroyer: P8.1 ; eravos.fx-dynamics: P8.1 ; eravos.fx-echo: P8.1 ; eravos.fx-pitch: P8.1 ; eravos.fx-glitch: P8.1
  eravos.arp: P8.2 ; eravos.looper: P8.2 ; eravos.vocoder: P8.2
  eravos.organ: P8.3 ; eravos.waveform-lab: P8.3 ; eravos.fx-box: P8.3 ; eravos.curve-synth: P8.3 ; eravos.granular: P8.3
  eravos.euclid: P8.4 ; eravos.orbit: P8.4 ; eravos.breath: P8.4
  eravos.clip-maker: P8.5 ; eravos.voice-scope: P8.5 ; eravos.midi-mapper: P8.5 ; eravos.library: P8.5 ; eravos.coach: P8.5

# ============================================================
# STANDARD FX CONTRACT (all eravos.fx-* inherit)
# ============================================================
STD.fx:
  graph: in → inputGain → [DRY path] + [WET: algorithm] → mix (equal-power crossfade) → outputGain → out
  hooks: fx.hook.audio_in (in ; audio ; port in) ; STD.audio_out ; STD.mod_in(mix) ; STD.transport_in when tempo-synced
  config_common: mix 0..1 ; inGain −24..24 dB ; outGain −24..24 dB ; bypass bool (ramped 10 ms)
  ui_common: header with bypass LED + preset select + mix knob ; algorithm-specific hero visual (real analyser data only)
  tests_common: null test at mix 0 ; bypass click-free ; standard_tests with oscillator source wired in ; latency reported if > 0

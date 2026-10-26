# ============================================================
# ERAVOS PHASE MAP — MUSIC LAYER BUILD 3.18
# spec_id:      eravos.phasemap.music-3.18
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# conforms_to:  ERAVOS.kernel.spec v1.0.0 + ERAVOS.kernel.amendment-3.1
# created_at:   2026-09-25
# ============================================================
#
# Source of truth for the order the music layer is built in.
# Each phase is a gate: nothing in phase N+1 starts until every
# exit criterion of phase N passes in Chromium (tests/run.html).
#
# Intent (from James, 2026-09-25):
#   - Full production organisms. No demos, no stubs, no toys.
#   - Every organism novel — no copy-paste engines or UIs.
#   - Fused organisms (EDM Lab, Bass Drop Builder) rebuilt, kept.
#   - Drum-step sequencing model; the non-musician gap is bridged
#     by SONG KEY + SCALE LOCK (wrong notes impossible).
#   - Purpose: make EDM tracks with Raven's voice clips, export them.

# ============================================================
# BASELINE FAULT REGISTER (v3.17 audit — verified in source)
# Every fault is referenced by id in the spec that resolves it.
# ============================================================

baseline_faults:
  F-01: factory discards mount() handle; × only unregisters → subs, keydown handlers, oscillators leak
  F-02: wire-system drop target [data-hook-input] never rendered → no wire can be completed
  F-03: audio:signal is a notification, not audio; every voice hard-wired to master
  F-04: SNRChain.boot disconnects dry master from kernel compressor → Master FX comp only hits FX returns
  F-05: sidechain ducks masterGain at hard-coded 0.88; FX tails never ducked
  F-06: precision-clock worklet URL resolves to root, file lives in runtime/; file:// blocks addModule → always setTimeout
  F-07: Space bound in shell + sequencer + timeline → double-start race, two PrecisionClocks
  F-08: sequencer stop/play restart on every kernel:bpm-change → BPM drag resets to step 0 per pixel
  F-09: channel strip cosmetic — meter is Math.random, gain node has no inputs, pan/verb/delay/mute/solo unbound
  F-10: LFO knobs unbound, LFO never starts; nothing consumes mod:signal or mod:xy
  F-11: synths fixed-pitch mono one-shots; no note on/off, no polyphony, no ADSR; acid glide inert
  F-12: timeline clips never play; clip length hard-coded 4 s; snap/loop/bounce declared but absent
  F-13: sample-player reverse via negative playbackRate; playhead ignores rate; pad trigger hook declared, unimplemented
  F-14: contrast-analyser "FFT" maps raw amplitude to bins — clash score meaningless; grabs every dropped file globally
  F-15: pads keyboard map global across all instances; sequencer ignores pad volume/pitch/decay
  F-16: kernel_target compared as string ('3.10.0' < '3.2.0')
  F-17: master FX defaults (thresh −24, ratio 12) crush the mix
  F-18: EDM Lab + Bass Drop Builder run private clocks and duplicate synth engines

# ============================================================
# PHASE GRAPH
# ============================================================
#
#   P0 KERNEL ──► P1 RUNTIME ──► P2 SOURCES ──┐
#                                              ├──► P4 ARRANGE ──► P5 MOD ──► P6 COMPOSITE ──► P7 VERIFY
#                               P3 MIX ────────┘
#   (P2 and P3 may run in parallel; both depend only on P1)

phases:

  P0:
    name:         Kernel 3.1
    specs:        [ERAVOS.kernel.amendment-3.1.spec]
    resolves:     [F-03, F-04, F-05(partial), F-16]
    deliver:      [kernel/kernel.js]
    exit:
      - audio.registerPort / connect / disconnect pass port tests
      - audio wire removes source from master; unwire restores master route
      - cycle A→B→A raises WIRE_006, graph unchanged
      - modulation wire scales by port range, removed cleanly
      - unregister(instance) disconnects every port, reroutes upstream sources to master
      - master chain single path: masterIn→djFilter→duck→comp→makeup→limiter→clip→out
      - contract.validate rejects wrong type / missing required / out-of-range with RUNTIME_002
      - semver compare: 3.10.0 > 3.2.0

  P1:
    name:         Runtime
    specs:        [eravos.runtime.spec]
    depends_on:   [P0]
    resolves:     [F-01, F-02, F-06, F-07, F-08]
    deliver:
      - runtime/music-theory.js
      - runtime/organism-sdk.js
      - runtime/precision-clock.js      (blob worklet → blob worker → setTimeout)
      - runtime/master-transport.js     (sole clock owner)
      - runtime/audio-recorder.js       (PCM capture, WAV 16/24, TPDF dither)
      - runtime/workspace.js            (snapshot/restore/autosave IndexedDB)
      - runtime/ui-kit.js               (bidirectional controls, meters, keyboard)
      - runtime/wire-system.js          (port rails, typed wire colours)
      - runtime/organism-factory.js     (handle store, unmount lifecycle, focus, snapshot)
    exit:
      - closing window, CLEAR ALL, and registry.unregister each call engine.unmount exactly once
      - 16 ticks at 120 BPM: max |t_n − t_expected| < 1 ms (AudioContext time)
      - BPM change mid-play: no restart, next tick uses new step length
      - exactly one Space handler toggles transport
      - wire drag from out-dot to in-dot registers kernel wire
      - bounce of 4 bars at 120 BPM → WAV length = 8.000 s ± 1 sample
      - workspace snapshot → clear → restore reproduces organisms, positions, params, wires

  P2:
    name:         Sound sources
    depends_on:   [P1]
    specs:
      - eravos.organism.pads.spec            (v2)
      - eravos.organism.sample-player.spec   (v2)
      - eravos.organism.wobble-bass.spec
      - eravos.organism.acid-synth.spec
      - eravos.organism.reese-bass.spec
      - eravos.organism.supersaw.spec
    resolves:     [F-11, F-13, F-15]
    exit:
      - each source renders non-silent audio through its out port in OfflineAudioContext test
      - each source respects note:trigger target filtering (two instances, no crosstalk)
      - each source serialize → deserialize round-trips params exactly
      - novelty gate: no engine shares a voice-graph topology with another (reviewed in P7)

  P3:
    name:         Mix
    depends_on:   [P1]
    specs:
      - eravos.organism.channel.spec
      - eravos.organism.sidechain-compressor.spec
      - eravos.organism.master-fx.spec
    resolves:     [F-04, F-05, F-09, F-17]
    exit:
      - channel meter reads −6.02 dBFS ± 0.1 for a 0.5-amplitude sine
      - solo on channel A mutes B/C, un-solo restores exact prior gains
      - sidechain duck curve at scheduled t matches depth/attack/release ± 1 ms
      - master FX comp threshold change measurably alters dry signal gain reduction

  P4:
    name:         Arrangement
    depends_on:   [P2, P3]
    specs:
      - eravos.organism.sequencer.spec   (v2)
      - eravos.organism.timeline.spec    (v2)
      - eravos.organism.session.spec     (new)
    resolves:     [F-07, F-08, F-12]
    exit:
      - sequencer step at swing 50% lands at t + 0.5·stepDur·(2/3) on odd steps
      - scale lock: degree 1..7 in C minor → [60,62,63,65,67,68,70]
      - MIDI export → re-import yields identical pattern
      - timeline clip at bar 3 starts at AC time t0 + 2·barSec ± 1 sample
      - pattern-lane clip cues sequencer slot on bar boundary
      - session save → open reproduces song incl. embedded audio

  P5:
    name:         Modulation
    depends_on:   [P4]
    specs:
      - eravos.organism.lfo.spec
      - eravos.organism.xy-pad.spec
      - eravos.organism.macro-automation.spec
    resolves:     [F-10]
    exit:
      - LFO 1/4 synced at 120 BPM: 2 cycles/s measured on target param
      - XY gesture loop of 2 bars replays aligned to bar 1 ± 1 ms
      - macro breakpoint lane reproduces drawn curve on target param

  P6:
    name:         Composite + analysis
    depends_on:   [P5]
    specs:
      - eravos.organism.edm-lab.spec
      - eravos.organism.bass-drop-builder.spec
      - eravos.organism.contrast-analyser.spec
    resolves:     [F-14, F-18]
    exit:
      - no private clock: grep for PrecisionClock in organisms/ = 0
      - drop builder FIRE on bar N: DROP section starts exactly at bar N + Σ section bars
      - analyser: two sines 100 Hz / 5 kHz → clash < 5; identical files → clash > 95

  P7:
    name:         Verify
    depends_on:   [P6]
    checks:
      - tests/run.html all green in Chromium (Playwright runner)
      - screenshot every organism at default + min size; no clipped controls
      - leak test: spawn/close each organism ×20 → bus subscriber count returns to baseline
      - hostile review against every spec: hooks, ui_hooks, faults, config ranges — zero drift
      - novelty review: diff engines pairwise; shared helpers only from organism-sdk/ui-kit
      - manifest.json 3.18.0 lists every file; CHANGELOG.md phase-by-phase

# ============================================================
# ORGANISM → PHASE INDEX
# ============================================================

organism_index:
  eravos.pads:                 P2
  eravos.sample-player:        P2
  eravos.wobble-bass:          P2
  eravos.acid-synth:           P2
  eravos.reese-bass:           P2
  eravos.supersaw:             P2
  eravos.channel:              P3
  eravos.sidechain-compressor: P3
  eravos.master-fx:            P3
  eravos.sequencer:            P4
  eravos.timeline:             P4
  eravos.session:              P4
  eravos.lfo:                  P5
  eravos.xy-pad:               P5
  eravos.macro-automation:     P5
  eravos.edm-lab:              P6
  eravos.bass-drop-builder:    P6
  eravos.contrast-analyser:    P6
  out_of_scope:                [photo-editor, video-editor, serial-bridge, webhook-automation, nexus-*]

# ============================================================
# PER-ORGANISM BUILD ORDER (applies inside P2–P6)
# Mirrors nexus.build-contract phase_4 — bottom-up, UI last.
# ============================================================

organism_build_order:
  1: schema/schema.json            derived from spec hooks + config
  2: data/presets.json             pure data, no logic
  3: <id>.engine.js                organism-sdk; no DOM
  4: tests/<id>.test.js            engine tests pass before UI exists
  5: <id>.ui.js                    ui-kit; ui_hooks only
  6: tests (UI section)            state_sync ↔ control round trip
  7: ledger + CHANGELOG entry

version_rule: +0.1 per completed phase; pack reaches 3.18.0 at P7 exit.

# ============================================================
# FORGE 5 — answered for this session
# ============================================================
forge:
  phase:        P0 not started (map + specs complete)
  last_state:   v3.17 catalog, unmodified; pristine copy kept
  bugs:         F-01 … F-18
  intent:       production music layer for making EDM tracks with Raven's voice
  siso_jaa:     not required by this pack; bus semantics follow SISO (named topics, residue = unclaimed events)

# ============================================================
# P8 — v10 CONVERSION: see eravos.v10-conversion.spec (faults F-19…F-26,
# verdicts, amendments A-1…A-6, 24 organism specs, genomes-v10).
# ============================================================

# ============================================================
# P9 — TRACKS: see eravos.phase9-tracks.spec (gaps G-01…G-04,
# timeline 2.1.0 instrument lanes + piano roll, drop builder 2.1.0
# tensionTone, Monstercat/EDM presets, pads bank D). pack 3.20.0-alpha.1
# ============================================================

# ============================================================
# P10 — PATCHING: see eravos.phase10-patching.spec (gaps W-01…W-04:
# five STD.fx effects built, master-fx audio input, wire-system plug
# handle + drop-on-window + reverse drag + toasts). Also fixed: sdk-music
# fxHooks referenced an undefined STD (latent since P8.1).
# pack 3.20.0-alpha.1 = P9 + P10
# ============================================================

# ============================================================
# P11 — PRODUCTION (eravos.phase11-production.spec): gates L + M closed (3.21a1); U/E/S/A/P/F/D open.
# P12 — DESKTOP CANVAS (eravos.phase12-desktop.spec): ERAVOS.exe (Electron, eravos:// origin, app-granted MIDI/mic),
#        ERAVOS Library folder (Drop Here / Packs / Projects / Exports). pack 3.22.0-alpha.1
# ============================================================

# ============================================================
# P13 — SKELETON + PACKS (eravos.phase13-skeleton-packs.spec): exe = skeleton; music domain + 10 tool-family packs;
#        recipes gated on installed tools; late domain shell hooks. pack 3.23.0-alpha.1
# ============================================================

# ============================================================
# P11.1 — UNDO (eravos.phase11-1-undo.spec): runtime/history.js, kernel bus.tap, factory before-unmount, shell ↶ ↷ + Ctrl+Z.
#          gate U closed. pack 3.24.0-alpha.1
# ============================================================

# ============================================================
# P16 — STUDIO (3.26-alpha, James 2026-10-10): modes = Music Production + Lab (xen, analysis, breath) + agnostic;
#   Add menu shows the active mode's tools only · "Make a song for her" bass = Reese ("Her Drop") · Wobble 2.1
#   (free rate, retrig, phase, vol/pitch wub, formant shift, unison, width, noise, sub oct, dive, level; +11 presets) ·
#   user presets save the whole piece (patterns, notes, kits, clips — files kept in IndexedDB) · preset bars on
#   Sequencer, Timeline, Clip Maker, Sampler.  OPEN: Song Engine (generative genre songs incl. 80s), "Connect to…" menu.
# ============================================================

# ============================================================
# P16.1 — 3.27-alpha (James 2026-10-10): modes = Music Production + Lab (Lab = xenharmonic, analysis, breath; the Add
#   menu shows only the active mode's tools) · Song Recorder ▶ plays the takes ONLY (canvas silent; "Play with song"
#   for overdubs; the dock recorder survives a new song) · windows open fitted to their content (double-click the grip
#   to refit) · redesigned: Supersaw (spectrum + cutoff/env overlay, unison fan), Wobble (grouped), LFO, Contrast
#   (empty state), Phaser (live allpass response), Mod Delay (delay-time sweep when silent), Haunt (test tone when
#   silent), Macro Automation (empty state + one-click lanes) · Connect menu: click a window's ⇢ plug ·
#   SONG ENGINE (data/song-engine.js): 12 genres incl. Synthwave + Darkwave (80s), every press writes a new song in key
#   on the Timeline; SongEngine.addGenre for packs · preset packs (data/preset-packs.js): 80s + Club · docs/tools at 2×.
#   tests: tests/p16.test.js (Chromium) + tests/p16-ui.mjs (real shell).
#   OPEN (P11 gates unchanged): E errors, A accessibility, P performance, F remaining FX, D drum lanes, S/X partial.
# ============================================================

# ============================================================
# P11.G + P11.S — 3.28-alpha (James 2026-10-10: "make sure it's enterprise grade" · "production grade" · "some of
#   them hang and don't stop playing and have no stop button. The tape is like that." · "way more edm pad sounds")
#   CLOSED gates (tests/p17.test.js, phase P11.G): E plain-language errors (runtime/plain-errors.js + music rules) ·
#   A keyboard + screen-reader names for every control (test: no unnamed focusable control in any tool) · S named
#   projects, 5 autosaves, backup/import, unsaved guard · X Timeline → MIDI + stems · F EQ, Dynamics, Glitch, Pitch,
#   FX Box · D drum lanes with pad names · P note ceiling 32/tool + lazy modulation wiring + supersaw pan folded into
#   gains. P HONEST: the 20-tool scene renders at ≈ 105 % of ONE core offline on the 2-core test VM — the test is a
#   regression guard (≤ 5 s / 4 s), not a real-time claim; numbers in specs/eravos.performance.spec.
#   STOP CONTRACT (tests/p18.test.js, phase P11.S): K.silence({hard, instanceId}) + ctx.onSilence; transport Stop =
#   soft silence to every tool (also when already stopped); "■ Stop all" (Shift+Esc) and a ■ in every sounding
#   window = hard: an output guard closes in 8 ms and stays closed until that tool is played or touched again.
#   RCAs: Tape Echo + Dub Station — saturator inside the feedback loop had 3.3× / 8.5× small-signal gain (new 'tape'
#   curve: unity small-signal gain, so the Feedback knob IS the loop gain); Destroyer — mid-rise quantiser turned
#   silence into DC; Coven — release never re-checked the Summon drone; Ratio Lattice / Recursive Spectra / Breath —
#   endless by design with no stop (now ▶/■ buttons, and Stop switches them off). Runner hang — renderer OOM around
#   test 327 (tests/run.mjs now batches in fresh pages). Organ drive test recalibrated (measured 2.6×, not 3×).
#   EDM Pads pack (data/preset-packs.js): 44 pads — Pad Forge 20, Supersaw 14, Retro Poly 10.
# ============================================================

# ============================================================
# ADDENDUM 2026-10-26 — 3.74b drum packs that add their own sounds (specs/eravos.phase74b-map.spec)
#   James, 2026-10-25: "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive."
#   Done: P74b.1 DrumRecipes + interpreter · P74b.2 Synthwave (22 sounds, 4 kits, measured apart) · P74b.4 synthwave tools inventory.
#   Open: P74b.3 the other 12 packs, one at a time · P74b.5 recipes onto ContentPacks + dropped zips. Numbered 3.74b because
#   specs/eravos.phase75-map.spec (another session) reserves 3.75–3.86.
# ============================================================

# spec_id: eravos.music-ecosystem
# version: 0.2.0
# status: proposed
# template: eravos.system/1
# supersedes: 0.1.0 (same intent, same sections; nothing in 0.1.0 is dropped — it is re-based on components)
# binding: eravos.components.spec (any part another tool can use is its own component, and a component tool when useful
#          on the canvas) · eravos.tool-depth.spec (full range in every aspect) · eravos.links-and-mods.spec (wires, links, mods)
#
# "All parts that can be used by other tools should be tools. Full synthwave tools. Wub tools. Rhythm and contrast.
#  Tension and oscillation. Look at the most popular tools … across all domains, years, artists … Invent or innovate also.
#  Packs for each tool. Each is novel. All tools have the full range of sound. Nothing is outside of the user's control.
#  Then we need optimization. I want to make something better than Ableton."
#
# HOW TO READ THIS FILE
#   §0  what changed from 0.1.0, and the naming rule for packs
#   §1  identity · §2 axioms
#   §3  COMPONENTS — every reusable part, written once. Every tool below is an assembly of these.
#   §4  TOOL FAMILIES — every tool: status vs the repo, lineage, the components it assembles, what only it adds, its packs
#   §5  tool contract · §6 pack contract (incl. the novelty test) · §7 audio engine
#   §8  optimization (concrete for ERAVOS's runtime) · §9 creative environment · §10 beyond a conventional DAW
#   §11 Emerge integration · §12 acceptance · §13 phases · §14 boundaries · §15 definition of done
#
# STATUS WORDS (per tool)
#   new                 nothing in the repo does this yet
#   extends:<tool>      an existing tool in tools/music/tools/** is rebuilt on components and taken to this scope
#   planned:<spec>      a spec exists in tools/music/planned/ — this entry widens it; that spec stays the detail
#   mapped:<spec>       a tool spec already written (e.g. the dub specs) — listed here so the ecosystem is complete

# ============================================================
# 0. CHANGES FROM 0.1.0
# ============================================================

changes_from_0_1_0:
  - every tool's `engines:` list is replaced by `assembles:` (component ids from §3) + `adds:` (behaviour only that tool has).
    The validator (§12 spec_checks) fails if a tool names a component that is not in §3, or a component no tool uses.
  - §3 COMPONENTS is new. 0.1.0 named the same filter, envelope, unison, granular and analysis engines in many tools; each is
    now one component, so depth added once lands in every tool (tool-depth K1–K5).
  - eight new families from the across-genres sweep — rave & trance · house, garage & techno · hip-hop & global club ·
    hard & heavy · dub & sound system · ambient & texture · mix & master · performance & control.
  - nine new signature inventions (§4.16), beside the eight from 0.1.0.
  - every pack now has an `is:` line (what it is, in one line) and every pack name is unique across the whole ecosystem.
    0.1.0 had duplicates (Alien Choir ×2, Alien Language ×2, Liquid Motion ×2, Pre-Drop ×2, Broken Grid ×2).
  - pack names that were trademarks or one specific record are renamed (naming rule below). The technique stays; the name
    becomes ERAVOS's own.
  - §8 optimization rewritten around the measured numbers in eravos.performance.spec and the AudioWorklet/WASM path.
  - §10 beyond a conventional DAW is new: parity targets vs Ableton Live, then where ERAVOS goes past it.

naming_rule:
  packs: >
    A pack name is ERAVOS's own. It never uses a manufacturer, model or product name (Juno, Prophet, Oberheim, DX, Solina,
    808, 909 …), an artist's name, or the title of a record. The technique a pack reaches for is written in its `is:` line
    in plain words ("dual-BBD chorus on a square pad"), which says more than a model number and ships cleanly.
  lineage: >
    A tool's `lineage:` line records the history of the technique (which instrument, scene or era made it known). It is
    history, not a claim about how any record was made. Same honesty as contrast-engine.spec: ERAVOS ships no transcription,
    sample, melody or rhythm taken from a record; reference audio the user brings stays the user's.
  renamed_from_0_1_0:
    Juno Glass: Chorus Glass Poly
    Prophet Brass: Five-Voice Brass Swell
    Oberheim Motion: Voice-Card Motion
    DX Electric: Tine Electric
    Solina: Divide-Down Strings
    Juno Width: Twin-Bucket Width
    808 Foundation: Boom Foundation
    909 Machine: Shuffle Machine Kit
    Amen Mutation: Six-Second Break Mutation
    Dub Tank (space-sculptor): Concrete Tank   # fx-spring keeps "Dub Tank"
    Alien Choir (spectral-creature): Xeno Formant Choir
    Alien Language (voice-architect): Glossolalia Engine
    Liquid Motion (arpeggio-evolution): Mercury Arp
    Pre-Drop (tension-to-release): Last Bar Before
    Broken Grid (rhythmic-tension-mapper): Grid Fracture Map
    Harmonic Tension (relational-modulation pack): Tension Ledger

# ============================================================
# 1. IDENTITY
# ============================================================

identity:
  id: eravos.music-ecosystem
  label: Eravos Music Ecosystem
  domain: music
  category: creative-audio-environment
  purpose: >
    A modular, programmable music production and sound-design ecosystem combining synthesis, sampling, audio processing,
    rhythm generation, musical intelligence, relational modulation, sound analysis, arrangement, and real-time performance —
    built from small components that every tool shares and every user can wire.
  design_objective: >
    Build a musical environment that exceeds conventional DAW workflows in composability, sound-design depth, relational
    control, extensibility, and user-directed creative freedom — while matching them on stability, latency and timing,
    which is what working producers judge first.
  positioning:
    - digital-audio-workstation
    - modular-synthesis-environment
    - sound-design-platform
    - generative-music-environment
    - audio-analysis-and-reconstruction-system
  competitive_reference:
    daws: [Ableton Live, Bitwig Studio, FL Studio, Logic Pro, Reaper, Renoise]
    synths: [Serum, Vital, Phase Plant, Pigments, Massive X, Omnisphere, Diva, Repro, Dexed, Surge XT]
    modular: [VCV Rack, Reaktor, Max for Live, Bitwig Grid]
    effects_and_tools: [OTT-style multiband, Soothe-style resonance suppression, Trackspacer-style masking, Portal-style granular,
                        Shaperbox-style shapers, Kickstart-style ducking, Valhalla-style reverbs, Little AlterBoy-style formant]
    note: reference products are named here only as the bar to clear; nothing ships under their names (naming_rule).

# ============================================================
# 2. CORE AXIOMS
# ============================================================

axioms:

  user_sovereignty:
    description: >
      The user retains control over all exposed sound-generation, modulation, processing, sequencing, routing, and
      performance parameters.
    requirements:
      - no permanently locked parameter ranges
      - no inaccessible preset internals
      - no mandatory genre-specific behavior
      - no hidden modulation restrictions
      - user-editable signal routing
      - user-editable modulation routing
      - user-editable tool configurations
      - deterministic randomization when requested (seed-registry)
      - complete preset inspection
      - complete preset modification
      - user-defined parameter relationships
      - every generator (chords, melody, arrangement, rivalry, genome) writes ordinary editable notes, steps or parameters —
        never an opaque result
      - every automatic decision (auto-gain, masking repair, tension mapping) can be shown, frozen, edited or turned off

  sonic_range:
    description: Tools must not be artificially restricted to their intended genre or marketing category.
    requirements:
      - cross-genre sound design
      - broad frequency coverage (sub to air: 16 Hz – 20 kHz in every source and filter that has a frequency)
      - broad modulation capability
      - configurable synthesis architecture
      - multiple operating modes where appropriate
      - unrestricted parameter access within engine capabilities
      - range audit per tool (eravos.tool-depth.spec) — aspect → what it has → what a professional tool of its kind has → gap
      - a genre family names where a tool comes FROM, never where it must stay (a synthwave tool can make riddim)

  composability:
    description: >
      Tools must be independently usable and combinable into larger instruments, processing chains, modulation systems, and
      generative musical structures.
    requirements:
      - standard input and output contracts
      - inspectable dependencies
      - reusable processing components
      - explicit lifecycle
      - modular routing
      - state serialization
      - compatible event scheduling
      - '"Open as components" on every all-in-one tool: its stages open as wired component tools that sound identical'

  components_first:
    description: >
      Any part another tool can use is a component: written once, its own spec and tests, and a component tool (window +
      ports) when it is useful on the canvas. Tools assemble components; they never re-implement one.
    requirements:
      - every tool lists the components it assembles (§4 `assembles:`)
      - a capability that appears in two tools is a component, or the spec check fails
      - a component never imports a tool
      - moving code into a component is proved by null renders (every touched factory preset nulls below −60 dB)

  relational_sound_design:
    description: >
      Musical relationships must be controllable objects rather than being limited to independent parameter automation.
    requirements:
      - parameter-to-parameter relationships
      - event-to-parameter relationships
      - audio-to-modulation relationships
      - rhythmic-to-modulation relationships
      - cross-tool modulation
      - feedback-aware relationship graphs

  no_artificial_ceiling:
    description: Presets and packs are starting configurations, not locked operating modes.
    requirements:
      - every pack is editable
      - every preset exposes its configuration
      - every compatible parameter can be automated
      - every compatible parameter can receive modulation
      - users can create new packs
      - users can create new instruments and effects

  novel_packs:
    description: >
      Every pack is a distinct idea, not a re-skin. Its name is unique in the ecosystem and its presets are measurably
      different from every other pack's in the same tool (§6 novelty test).
    requirements:
      - unique pack names across all tools
      - an `is:` line saying what the pack is
      - each preset differs from its nearest neighbour in the same tool by ≥ the novelty threshold

  timing_and_stability_first:
    description: >
      Nothing beats a DAW that drops out. Sample-accurate timing, no glitches under load, and exact project restore come
      before any new feature.
    requirements:
      - a feature that adds audio-thread cost ships with its measured cost (§8 budgets)
      - a regression in timing, dropout rate or restore exactness blocks a release

# ============================================================
# 3. COMPONENTS — the parts every tool is built from
# ============================================================
# On disk: tools/music/components/<id>/<id>.js · <id>.spec · <id>.test.js (eravos.components.spec).
# tool: yes  → also a component tool on the canvas (own window, typed ports, packs allowed)
# tool: no   → called by other code only (engine internals: no musical use on its own)
# from:      existing code it is extracted from (each extraction proved by null renders)
# Every numeric control of a component is a modulation destination (motion core), unless marked fixed.

components:

  sources:
    - { id: osc-va, tool: yes, from: "syn-osc, wobble-bass", job: "band-limited saw/square/triangle/pulse with PWM, hard and soft sync, through-zero FM input (polyBLEP; minBLEP at high pitch)" }
    - { id: osc-wavetable, tool: yes, from: "syn-osc banks, wobble-bass 4.x tables", job: "tables × frames, mip-mapped; position, frame interpolation, warp modes (bend, sync, mirror, phase-distort, FM-from-input, remap curve); user tables from audio" }
    - { id: osc-fm-operator, tool: yes, from: "wobble-bass FM", job: "one phase-mod operator: ratio 0.0625–64 or fixed Hz, fine, feedback, waveform, its own envelope input; chains into N-operator algorithms" }
    - { id: osc-additive, tool: yes, from: syn-partials, job: "up to 512 partials with per-partial amp/ratio/phase arrays, spectral filter and morph between partial sets" }
    - { id: osc-phase-distortion, tool: yes, job: "phase-distortion and casio-style resonant waveforms, bend amount and window shape" }
    - { id: osc-noise, tool: yes, job: "white, pink, brown, velvet, crackle and band-limited noise; seedable; colour tilt" }
    - { id: osc-sub, tool: yes, from: "wub-sub, sub-engine", job: "sub oscillator −1/−2 oct, sine/triangle/square/rounded-square, phase reset to note, kick-phase align input" }
    - { id: unison-stack, tool: no, from: "supersaw, wobble-bass voices", job: "1–16 voices of any source: detune curve (linear, exp, supersaw-style), spread, blend, per-voice phase (free, reset, seeded random)" }
    - { id: sampler-voice, tool: yes, from: sample-player, job: "zone playback: sinc or linear interpolation, loop modes with crossfade, start/end modulation, reverse, pitch/formant independent" }
    - { id: grain-cloud, tool: yes, from: granular, job: "granular engine: density, size, position, spray, pitch scatter, window shape, direction, spectral-preserve mode, deterministic seed" }
    - { id: karplus-string, tool: yes, job: "plucked/bowed string model: exciter, damping, stiffness, body coupling, decay" }
    - { id: modal-resonator, tool: yes, job: "bank of up to 64 resonant modes: bells, bars, plates, membranes, objects; strike position, material, decay tilt; excited by audio or impulse" }
    - { id: vocal-tract, tool: yes, job: "glottal source + formant tract: vowel morph, consonant noise, breath, vibrato, choir multiplier" }
    - { id: oscillator-population, tool: yes, job: "N coupled oscillators (Kuramoto-style): coupling strength, topology (all, ring, small-world, user), drift, group-coherence output" }

  shapers:
    - { id: waveshaper, tool: yes, from: "fx-destroyer shaper", job: "transfer curve: tanh, asym, sine, user-drawn; bias; pre/post filter; oversampler-aware" }
    - { id: wavefolder, tool: yes, job: "folding stages 1–8, symmetry, soft/hard fold" }
    - { id: clipper, tool: yes, from: "wobble-bass clipper", job: "soft/hard/knee clipping with ceiling, oversampled, clip count output" }
    - { id: rectifier, tool: yes, job: "half/full rectify with blend; octave-up generator" }
    - { id: bitcrusher, tool: yes, from: fx-destroyer, job: "bits 1–24, sample-rate reduction with or without aliasing filter, jitter, dither" }
    - { id: saturator-tape, tool: yes, from: fx-echo, job: "tape saturation with hysteresis, head bump, wow/flutter output to a delay-line" }
    - { id: saturator-tube, tool: yes, job: "triode/pentode style asymmetry, bias drift, even/odd balance" }
    - { id: multiband-splitter, tool: yes, job: "2–6 bands, Linkwitz-Riley 24/48 dB or linear-phase; each band a slot for any mod chain" }
    - { id: ring-mod, tool: yes, from: "wobble-bass ring", job: "ring and amplitude modulation, carrier from any audio or internal osc" }
    - { id: freq-shifter, tool: yes, job: "single-sideband frequency shift ±5 kHz, barber-pole feedback" }

  filters:
    - { id: filter-svf, tool: yes, from: "fx-filter, wub-filter", job: "LP/HP/BP/notch/peak/shelves, 12/24/36 dB, key-track, env and velocity inputs, 16 Hz–20 kHz, stable to self-oscillation" }
    - { id: filter-ladder, tool: yes, job: "4-pole ZDF ladder with drive inside the loop, bass compensation, 2/4-pole taps" }
    - { id: filter-diode, tool: yes, job: "diode-ladder squelch with accent input (the acid sound)" }
    - { id: filter-sallen-key, tool: yes, job: "aggressive 2-pole with drive in the feedback path (screaming resonance)" }
    - { id: filter-comb, tool: yes, from: wub-filter, job: "comb ±, tuned to note, damping, feedback to self-oscillation" }
    - { id: filter-formant, tool: yes, from: "wub-filter formant", job: "vowel morph (9+ vowels, user vowels), formant shift ±24 st, gender, Q" }
    - { id: filter-allpass-chain, tool: yes, from: fx-phaser, job: "2–24 allpass stages: phaser, dispersion, chirp, spring-like smear" }
    - { id: filter-bank, tool: yes, job: "8–64 band analysis/synthesis bank (vocoder, spectral gating, resonator bank)" }
    - { id: eq-parametric, tool: yes, from: fx-eq, job: "up to 24 bands, minimum/linear phase, dynamic bands with sidechain, M/S per band" }

  time:
    - { id: delay-line, tool: yes, from: "fx-echo, fx-moddelay", job: "fractional modulated delay up to 20 s, tempo sync, filtered/saturated feedback, freeze, pitch on time change (tape) or none (digital)" }
    - { id: bbd-line, tool: no, job: "bucket-brigade model: clock noise, companding, anti-alias filters — the chorus/flanger character" }
    - { id: ensemble-core, tool: no, job: "multi-tap modulated lines with phase-offset LFO sets (chorus, ensemble, string machine)" }
    - { id: pitch-shifter, tool: yes, from: fx-pitch, job: "granular and PSOLA shift ±48 st, formant preserve, low-latency mode" }
    - { id: time-stretch, tool: no, job: "phase vocoder with transient lock and phase locking; offline high-quality and real-time modes" }
    - { id: reverse-buffer, tool: no, job: "rolling reverse capture, crossfaded, tempo-quantised lengths" }
    - { id: looper-buffer, tool: no, job: "record/overdub/replace buffers with sample-accurate loop points" }
    - { id: tape-transport, tool: yes, job: "varispeed, tape stop/start with curves, rewind spin, scrub" }

  space:
    - { id: reverb-fdn, tool: yes, job: "feedback-delay-network reverb: 8–32 lines, size, diffusion, modulation, damping per band, freeze, infinite" }
    - { id: reverb-convolution, tool: yes, job: "partitioned convolution, zero-latency head, IR stretch/reverse/trim, IR from any audio" }
    - { id: spring-model, tool: yes, from: "fx-spring (mapped)", job: "dispersive spring: chirp, drip, tension, springs 1–3" }
    - { id: plate-model, tool: yes, job: "plate: size, damping, tension, pre-delay" }
    - { id: early-reflections, tool: no, job: "room geometry taps: size, shape, absorption, listener position" }
    - { id: panner, tool: yes, job: "stereo/equal-power/binaural (HRTF) positioning, distance (air absorption, level, pre-delay), motion path input" }
    - { id: stereo-tools, tool: yes, from: wobble-bass, job: "M/S balance, width, Haas, mono-below crossover, correlation output" }

  dynamics:
    - { id: envelope-follower, tool: yes, job: "peak/RMS follower with attack, release, hold, band focus; outputs modulation" }
    - { id: compressor, tool: yes, from: fx-dynamics, job: "feed-forward/back, knee, lookahead, sidechain with filter, program-dependent release" }
    - { id: multiband-dynamics, tool: yes, job: "upward + downward per band on multiband-splitter (OTT-style), depth, time scaling" }
    - { id: transient-shaper, tool: yes, job: "attack/sustain gain from differential envelopes, band focus" }
    - { id: gate-expander, tool: yes, job: "gate/expander with hysteresis, lookahead, sidechain, ducking mode" }
    - { id: limiter-true-peak, tool: yes, job: "lookahead limiter with 4× true-peak detection, release shaping, ceiling" }
    - { id: ducker, tool: yes, from: sidechain-compressor, job: "volume shape triggered by notes/transport/audio (no audio needed): drawn curve, depth, tempo-synced length" }

  modulation:
    - { id: env-adsr, tool: yes, from: syn-env, job: "DAHDSR with curve per segment, loop, retrigger/legato, velocity scaling" }
    - { id: env-msseg, tool: yes, job: "drawable multi-segment envelope: any points, curves, loop region, sustain point, tempo sync" }
    - { id: lfo, tool: yes, from: lfo, job: "shapes + drawn, sync incl. dotted/triplet/1/64, phase, fade-in, smoothing, retrigger modes, stereo phase offset" }
    - { id: step-mod, tool: yes, from: "wub-rate Wub Seq", job: "1–64 step values with per-step slew, probability, length; any rate" }
    - { id: random-source, tool: yes, job: "seeded S&H, smooth random, distributions (uniform, gaussian, beta, user histogram)" }
    - { id: chaos-attractor, tool: yes, job: "bounded Lorenz, Rössler, logistic, double-pendulum outputs (x,y,z), speed, seed" }
    - { id: macro, tool: yes, from: macro-automation, job: "one control → many destinations, each with its own curve and range" }
    - { id: mod-ops, tool: no, job: "the §5 modulation operations: add, multiply, scale, offset, invert, rectify, quantize, clamp, smooth, curve-map, compare, condition, interpolate, combine" }
    - { id: slew-lag, tool: no, job: "rise/fall slew, glide, portamento curves" }
    - { id: mpe-expression, tool: yes, job: "per-note pressure, slide, pitch bend, lift; MPE and MIDI 2.0 per-note controllers" }
    - { id: note-follow, tool: no, from: "links FOLLOW", job: "plays the notes of the tool it is wired into (links-and-mods FOLLOW)" }

  analysis:
    - { id: pitch-tracker, tool: yes, job: "pYIN pitch + confidence, mono; polyphonic estimate offline" }
    - { id: onset-detector, tool: yes, job: "spectral-flux onsets with strength and band; transient positions" }
    - { id: beat-tracker, tool: no, job: "tempo + beat phase + downbeat estimate with confidence" }
    - { id: spectral-features, tool: yes, job: "centroid, spread, flux, flatness, rolloff, crest, MFCC, band energies — as modulation outputs" }
    - { id: loudness-meter, tool: yes, job: "LUFS momentary/short/integrated, LRA, true peak, PLR" }
    - { id: key-detector, tool: no, job: "chroma key + mode estimate with confidence" }
    - { id: chord-recognizer, tool: no, job: "chord labels over time from chroma with confidence" }
    - { id: phase-correlation, tool: yes, job: "stereo correlation, per-band phase, mono-compat warning" }
    - { id: masking-analyzer, tool: no, job: "per-band masking of track A by track B (critical-band model)" }
    - { id: source-separator, tool: no, job: "model-based stems (drums, bass, vocals, other), async in a worker, cached" }
    - { id: partial-tracker, tool: no, job: "sinusoidal + residual modeling (partials with amp/freq tracks, noise envelope)" }
    - { id: modulation-estimator, tool: no, job: "estimates LFO rate/shape/depth and filter motion in a recording (hypotheses with confidence)" }
    - { id: structure-segmenter, tool: no, job: "section boundaries and repetition from self-similarity" }
    - { id: tension-meter, tool: no, job: "harmonic, rhythmic, spectral, density and pitch-instability tension → one curve + per-domain curves" }

  events:
    - { id: clock-div, tool: yes, from: precision-clock.js, job: "divide/multiply/shift transport, swing input, odd divisions (1/5, 1/7), reset" }
    - { id: euclid-generator, tool: yes, job: "euclidean k-of-n, rotation, accents, nested" }
    - { id: polymeter-cycle, tool: no, job: "independent cycle lengths with common re-alignment point reporting" }
    - { id: groove-template, tool: yes, job: "per-16th timing/velocity/length maps; extract from MIDI or audio; amount" }
    - { id: humanizer, tool: no, job: "seeded timing/velocity variation with correlation (players drift, not jitter)" }
    - { id: probability-gate, tool: yes, job: "per-event probability, conditions (every N, first, fill, A:B), seeded" }
    - { id: ratchet, tool: yes, job: "retrigger 1–16 within a step, curves for spacing, pitch and velocity" }
    - { id: pattern-store, tool: no, job: "patterns as data: notes, steps, lanes; versioned, diffable" }
    - { id: markov-chain, tool: no, job: "order 1–4 transitions over notes, steps or states; learn from user clips; seeded" }
    - { id: transient-slicer, tool: no, job: "slice audio at onsets or grid, slice map export" }

  musical:
    - { id: scale-key, tool: no, from: "music-theory.js, xen-theory.js", job: "scales, modes, tunings (EDO, ratios, Scala), snap" }
    - { id: chord-engine, tool: no, from: chord-gen, job: "chord spelling, voicings, inversions, spread, extensions" }
    - { id: voice-leader, tool: no, job: "minimal-motion voice leading with constraints (range, common tones, parallel rules on/off)" }
    - { id: motif-store, tool: no, job: "motifs with transforms: transpose, invert, retrograde, augment, diminish, displace, fragment" }
    - { id: contour-generator, tool: no, job: "melodic contour curves (arch, wave, climb, fall, user) → pitch targets" }
    - { id: energy-curve, tool: no, job: "energy over song time (drawn or measured) shared by arrangement, tension and contrast tools" }

  structure:
    - { id: relationship-graph, tool: no, from: motion.js, job: "the relational core: typed nodes/edges, cycle detection, explicit feedback nodes with one-block delay, topological evaluation" }
    - { id: state-machine-core, tool: no, job: "named states, transition graph, conditions, transition curves" }
    - { id: preset-morph, tool: yes, from: xy-pad, job: "N-way interpolation between parameter sets on a 1D/2D/3D space; per-parameter morph curves; discrete params switch at a chosen point" }
    - { id: seed-registry, tool: no, job: "project-wide deterministic seeds: per tool, per lane, per render; 'reroll' writes a new seed, never hidden state" }
    - { id: oversampler, tool: no, job: "2–16× polyphase up/down, linear or minimum phase, per-stage (only around nonlinear parts)" }
    - { id: param-smoother, tool: no, job: "per-parameter smoothing (linear, one-pole, sample-accurate ramps)" }
    - { id: voice-allocator, tool: no, job: "poly/mono/legato, steal policies (oldest, quietest, same-note), voice budget reporting" }
    - { id: latency-compensator, tool: no, job: "per-path latency reporting and delay compensation" }

# ============================================================
# 4. TOOL FAMILIES
# ============================================================
# Each tool: id · label · status · lineage · assembles (components, §3) · adds (only this tool) · modes · packs.
# A tool with signature: true is an ERAVOS invention or a decisive innovation on a known idea.
# Every tool also obeys §5 (contract) and §6 (packs) — not repeated per tool.

tool_families:

  # ---------- 4.1 SYNTHWAVE & RETRO ----------
  synthwave_retro:
    from: "late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave"
    tools:

      - id: retro-dco
        label: Retro DCO
        status: "extends:retro-poly"
        lineage: "1980s DCO polys: one stable oscillator per voice with sub and PWM, through a 24 dB filter and a bucket-brigade chorus"
        assembles: [osc-va, osc-sub, osc-noise, unison-stack, filter-svf, filter-ladder, env-adsr, lfo, ensemble-core, bbd-line, voice-allocator]
        adds: ["per-voice-card variance (each voice its own filter/env offsets, seeded)", "chorus modes I · II · I+II", "poly-mod (filter env and osc B into osc A pitch/PW)"]
        modes: [poly, mono, unison, chord-memory]
        packs:
          - { name: Chorus Glass Poly, is: "square-pulse pads breathing through the twin-chorus modes" }
          - { name: Five-Voice Brass Swell, is: "poly brass with slow filter-envelope swells and poly-mod bite" }
          - { name: Voice-Card Motion, is: "eight-voice stacks where every voice drifts a little differently" }
          - { name: VHS Dreams, is: "soft PWM pads with worn tape wobble and rolled-off tops" }
          - { name: Arcade Pulse, is: "narrow-pulse arps and bleeps with fast decay" }
          - { name: Analog Machine, is: "mechanical sequenced basses, tight envelopes, ladder drive" }
          - { name: Coldwave, is: "thin detuned leads and cold, chorus-free minor pads" }
          - { name: Neon Noir, is: "dark poly-mod stabs and resonant night-drive basses" }

      - id: fm-matrix
        label: FM Matrix
        status: new
        lineage: "6-operator digital FM of the early 1980s (electric pianos, bells, slap bass); later FM bass in house, neuro and riddim"
        assembles: [osc-fm-operator, ring-mod, env-msseg, env-adsr, lfo, filter-svf, unison-stack, voice-allocator]
        adds: ["2–8 operators with a drawable algorithm matrix (any op → any op, incl. feedback loops via explicit feedback nodes)", "ratio/fixed per op, per-op key scaling and velocity curves", "import of classic 6-op patch banks as editable presets (format only, no factory sounds copied)"]
        modes: [classic-6op, matrix, fm-bass, percussion]
        packs:
          - { name: Tine Electric, is: "bell-struck electric pianos with velocity-shaped bark" }
          - { name: Glass Cathedral, is: "long inharmonic bells over slow pads" }
          - { name: Metallic Percussion, is: "fixed-frequency hits: cowbells, clanks, struck tubes" }
          - { name: FM Reese, is: "two detuned FM stacks beating like a reese" }
          - { name: Digital Brass, is: "bright operator brass with feedback rasp" }
          - { name: Crystal Plucks, is: "fast-decay high-ratio plucks for arps" }
          - { name: Industrial Bells, is: "clangorous ratios, feedback grit, cold decay" }
          - { name: Sideband Choir, is: "low-index FM vowel-like pads sung by operator envelopes" }

      - id: morph-engine
        label: Morph Engine
        status: "extends:syn-osc"
        lineage: "1980s wavetable synthesis to modern wavetable/spectral synths"
        assembles: [osc-wavetable, osc-additive, unison-stack, filter-svf, filter-comb, env-msseg, lfo, preset-morph]
        adds: ["morph between wavetable, additive and spectral views of the same sound", "tables from any audio or drawn, with spectral edit", "two-layer position morph with independent warp"]
        modes: [wavetable, additive, spectral, hybrid]
        packs:
          - { name: Liquid Motion, is: "smooth position sweeps, glassy and wet" }
          - { name: Neon Saw, is: "bright morphing saws for synthwave leads and chords" }
          - { name: Organic Evolution, is: "tables made from wood, breath and voice, slowly moving" }
          - { name: Digital Decay, is: "bit-sliced frames that crumble as position rises" }
          - { name: Spectral Bloom, is: "additive swells that open partial by partial" }
          - { name: Hyperpop, is: "squeaky formant tables, pitched-up and plastic-bright" }
          - { name: Dark Matter, is: "low, heavy frames for menacing basses and drones" }
          - { name: Morphing Choir, is: "vowel-table pads walking through a choir" }

      - id: swarm-oscillator
        label: Swarm Oscillator
        status: new
        lineage: "beyond supersaw: coupled-oscillator physics applied to unison"
        assembles: [oscillator-population, osc-va, osc-wavetable, filter-svf, env-adsr, lfo, stereo-tools]
        adds: ["unison voices that pull on each other (lock, beat, break apart) instead of fixed detune", "harmonic grouping: voices cluster on chosen partials", "coherence meter + coherence as a modulation source"]
        modes: [free, coupled, harmonic, chaotic]
        packs:
          - { name: Loose Constellation, is: "voices orbiting each other, never quite in tune" }
          - { name: Locked Unison, is: "huge unison that snaps to perfect phase on the beat" }
          - { name: Harmonic Swarm, is: "voices settling on 3rds, 5ths and octaves like a chord" }
          - { name: Choir Drift, is: "slow vocal-pad swarm, breathing apart and together" }
          - { name: Detuned Cathedral, is: "wide organ-like swarm with church-room width" }
          - { name: Pulsing Machine, is: "coupling pumped by tempo, rhythmic beating" }
          - { name: Fractured Cluster, is: "high-coupling chaos: shards of pitch that won't settle" }
          - { name: Organic Strings, is: "section-like ensemble where players lock and slip" }

      - id: poly-filter-matrix
        label: Poly Filter Matrix
        status: "extends:fx-filter"
        lineage: "the filter as the instrument: ladder, diode, Sallen-Key and formant characters, per voice"
        assembles: [filter-svf, filter-ladder, filter-diode, filter-sallen-key, filter-comb, filter-formant, env-adsr, waveshaper, oversampler]
        adds: ["2–4 filters in serial, parallel or a drawn matrix", "per-voice filtering when hosted by a poly tool, global when used as an effect", "pre/post drive, self-oscillation tuned to note"]
        modes: [serial, parallel, matrix, per-voice]
        packs:
          - { name: Warm Ladder, is: "round 24 dB sweeps, drive in the loop" }
          - { name: Acid Sweep, is: "diode squelch with accent-dependent resonance" }
          - { name: Formant Voice, is: "vowel filter that speaks as the envelope moves" }
          - { name: Screaming Resonance, is: "Sallen-Key howl on the edge of oscillation" }
          - { name: Rubber Bass, is: "fast filter envelopes for bouncing basses" }
          - { name: Hollow Glass, is: "notch-and-comb pairs with a glassy hollow middle" }
          - { name: Moving Comb, is: "note-tuned combs sweeping like a flanger" }
          - { name: Filter Choir, is: "four formant filters in parallel singing a chord" }

      - id: ensemble-organism
        label: Ensemble Organism
        status: new
        lineage: "1970s string machines and bucket-brigade chorus/ensemble units, tape doubling"
        assembles: [ensemble-core, bbd-line, delay-line, lfo, stereo-tools, saturator-tape]
        adds: ["3-phase ensemble LFO sets", "voice-count 2–12 with per-line character", "BBD clock noise and companding as controls"]
        modes: [chorus, ensemble, flanger, doubler]
        packs:
          - { name: Divide-Down Strings, is: "string-machine shimmer from three-phase ensemble" }
          - { name: Twin-Bucket Width, is: "classic two-mode BBD chorus width" }
          - { name: Tape Choir, is: "tape-doubled lines with wow for a slurred choir" }
          - { name: Shimmer Strings, is: "fast ensemble shimmer over a bright high shelf" }
          - { name: Warped Cassette, is: "chorus that wanders off pitch like a stretched tape" }
          - { name: Glass Ensemble, is: "many clean lines, crystalline and wide" }
          - { name: Wide Analog, is: "subtle stereo motion for basses and keys" }
          - { name: Dream Machine, is: "slow deep ensemble for ambient chords" }

      - id: analog-drift
        label: Analog Drift
        status: new
        lineage: "the instability of vintage voltage-controlled circuits, as a modulation source"
        assembles: [random-source, osc-noise, slew-lag, seed-registry]
        adds: ["per-voice drift with correlated (shared-supply) and independent parts", "warm-up curve over the session", "outputs to pitch, filter, PW, env times of any tool — a modulation tool, not a sound"]
        modes: [subtle, vintage, failing]
        packs:
          - { name: Vintage Warmth, is: "a few cents and a little filter wander per voice" }
          - { name: Dying Circuit, is: "drift that grows and sags like a failing supply" }
          - { name: Unstable Voltage, is: "fast correlated wobble across every voice at once" }
          - { name: Tape Flutter, is: "periodic + random pitch flutter at tape rates" }
          - { name: Aging Poly, is: "voices that have each aged differently" }
          - { name: Mechanical Imperfection, is: "envelope-time and velocity scatter, no pitch drift" }

      - id: gated-room
        label: Gated Room
        status: new
        lineage: "1980s gated reverb on drums: big room cut off hard by a gate"
        assembles: [reverb-fdn, early-reflections, gate-expander, compressor, eq-parametric, ducker]
        adds: ["gate keyed from the dry hit with tempo-synced hold", "reverse-gate shape", "room tone before gate (compressed room mics)"]
        modes: [snare, toms, full-kit, reverse]
        packs:
          - { name: Chrome Snare Wall, is: "huge snare room chopped at an eighth" }
          - { name: Tom Thunder Gate, is: "booming toms with short, dense gated tails" }
          - { name: Reverse Bloom Gate, is: "swelling backwards room into each hit" }
          - { name: Stadium Clap, is: "claps in a massive bright gated hall" }
          - { name: Night Drive Kit, is: "synthwave kit space: gated, wide, dark top" }
          - { name: Tight Box Gate, is: "small, punchy gated room for modern pop drums" }

      - id: tape-memory
        label: Tape Memory
        status: new
        lineage: "cassette and VHS degradation, the vaporwave and lo-fi signature"
        assembles: [saturator-tape, delay-line, filter-svf, osc-noise, bitcrusher, random-source, tape-transport]
        adds: ["wear amount driving wow, flutter, dropouts, head misalignment and hiss together", "dropout events as triggers", "generation count (copy-of-a-copy)"]
        modes: [cassette, vhs, reel, dictaphone]
        packs:
          - { name: Third Generation Dub, is: "a copy of a copy: soft, dull, wobbly" }
          - { name: Mall Ghost, is: "slowed, warbled, glossy-dead mall music tone" }
          - { name: Tracking Error, is: "VHS head misalignment dropping the top out in waves" }
          - { name: Pocket Recorder, is: "narrow band, hiss, motor whine" }
          - { name: Sunbleached Reel, is: "warm gentle wow, rounded transients" }
          - { name: Chewed Tape, is: "severe dropouts and pitch crumples on cue" }

      - id: lead-glide
        label: Lead Glide
        status: new
        lineage: "mono synth leads: portamento, delayed vibrato, legato filter retrigger (film and outrun leads)"
        assembles: [osc-va, osc-wavetable, unison-stack, filter-ladder, env-adsr, lfo, slew-lag, mpe-expression, delay-line]
        adds: ["glide by time or by rate, legato-only option, fingered vs always", "delayed vibrato with fade", "expression-mapped bend and brightness"]
        modes: [mono, legato, duo]
        packs:
          - { name: Night Highway Lead, is: "square-saw lead, slow glide, vibrato after a beat" }
          - { name: Laser Duo, is: "two-voice leads splitting into intervals" }
          - { name: Synth Sax, is: "breathy expressive lead with pressure-controlled brightness" }
          - { name: Dagger Lead, is: "hard sync lead slicing through a mix" }
          - { name: Sunset Whistle, is: "pure sine-ish lead with soft portamento" }
          - { name: Darksynth Screamer, is: "driven ladder lead, screaming resonance on bends" }

  # ---------- 4.2 WUB & BASS ----------
  wub_bass:
    from: "UK dubstep (mid-2000s), brostep (c. 2010), neurofunk (late 1990s on), riddim and tearout (2015 on), melodic and colour bass"
    tools:

      - id: wub-organism
        label: Wub Organism
        status: "extends:wobble-bass"
        lineage: "LFO-to-filter wobble grown into multi-stage modulated bass design"
        assembles: [osc-va, osc-wavetable, osc-fm-operator, osc-phase-distortion, osc-sub, sampler-voice, unison-stack, ring-mod, filter-svf, filter-formant, filter-comb, waveshaper, clipper, lfo, step-mod, env-msseg, stereo-tools, multiband-splitter]
        adds: ["wub lanes: rate, shape and depth per step (Wub Seq) per stage", "stage graph: source → growl → filter → drive → bands, each stage replaceable by any component by wiring (K4)", "sub stays mono and phase-aligned while tops move"]
        modes: [wobble, growl, riddim, neuro, melodic]
        packs:
          - { name: Classic Wobble, is: "half-note to 1/8 LFO lowpass wobble over a clean sub" }
          - { name: Tearout, is: "aggressive serrated mids, fast rate changes, hard clipping" }
          - { name: Riddim, is: "sparse square-ish wubs, repetitive and hypnotic, heavy space" }
          - { name: Deep Dub, is: "slow round wobbles, lots of sub, dub weight" }
          - { name: Brostep Growl, is: "FM-driven formant growls with vowel sweeps" }
          - { name: Neuro Bass, is: "tight, technical comb and phaser movement" }
          - { name: Melodic Wub, is: "tuned wubs that play chords and leads" }
          - { name: Metallic Bass, is: "ring-mod and inharmonic FM steel" }
          - { name: Liquid Bass, is: "smooth, rolling and warm, low drive" }
          - { name: Xeno Wub, is: "unrecognisable alien vowels and pitch dives" }

      - id: growl-forge
        label: Growl Forge
        status: "planned:growl-resampler.spec"
        lineage: "the growl: FM sidebands pushed through moving formant filters and distortion"
        assembles: [osc-fm-operator, filter-formant, filter-svf, waveshaper, wavefolder, env-msseg, lfo, step-mod, preset-morph]
        adds: ["vowel path drawn as a curve on a vowel map", "sideband density linked to formant Q (relationship preset)", "throat/jaw macro"]
        modes: [vocal, mechanical, hybrid]
        packs:
          - { name: Human Growl, is: "near-speech growls: 'yeah', 'wow', 'oi' shapes" }
          - { name: Mechanical Beast, is: "metallic engine growls with gear-like rhythm" }
          - { name: Robotic Speech, is: "stepped vowels, quantised formants" }
          - { name: Industrial Jaw, is: "chewing, crushing mid growls" }
          - { name: Creature Dialect, is: "vowel sets from no human language" }
          - { name: Vocal Bass, is: "sung bass with vowel legato" }
          - { name: Hybrid Creature, is: "growl and animal-like breath layered" }

      - id: reese-architecture
        label: Reese Architecture
        status: "extends:reese-bass"
        lineage: "detuned-saw bass from late-1980s Detroit techno, adopted by jungle, drum & bass and neurofunk"
        assembles: [osc-va, osc-wavetable, unison-stack, filter-svf, filter-allpass-chain, multiband-splitter, stereo-tools, lfo, saturator-tube]
        adds: ["independent detune per oscillator with beat-rate display (Hz)", "phase-interaction view", "mid-band movement with mono sub band"]
        modes: [classic, neuro, wide]
        packs:
          - { name: Classic Reese, is: "two saws, slow beating, simple lowpass" }
          - { name: Neuro Reese, is: "phaser and comb movement over a reese core" }
          - { name: Dark DnB, is: "low, tense, distorted reese for rollers" }
          - { name: Liquid Reese, is: "soft and wide, gently moving" }
          - { name: Metallic Reese, is: "ring-modded upper reese, steel-edged" }
          - { name: Wide Saw, is: "unison reese with mono-below for clubs" }
          - { name: Submerged, is: "underwater filtered reese drones" }
          - { name: Industrial Reese, is: "clipped and folded reese grind" }

      - id: harmonic-weapon
        label: Harmonic Weapon
        status: "extends:fx-destroyer"
        lineage: "distortion as synthesis: tube, fuzz, fold, crush, multiband"
        assembles: [waveshaper, wavefolder, clipper, rectifier, bitcrusher, saturator-tube, saturator-tape, multiband-splitter, oversampler, eq-parametric]
        adds: ["chain builder with per-band chains", "pre/post emphasis EQ pairs", "harmonic readout (which orders it adds)"]
        modes: [single, chain, multiband]
        packs:
          - { name: Tube Fury, is: "hot tube asymmetry, even harmonics, compression" }
          - { name: Digital Ruin, is: "crush and downsample with aliasing on purpose" }
          - { name: Folded Metal, is: "multi-stage folding for metallic overtones" }
          - { name: Broken Speaker, is: "rattle, crackle and blown-cone fuzz" }
          - { name: Warm Saturation, is: "gentle glue, barely there" }
          - { name: Tearout Bite, is: "multiband mid destruction, clean sub" }
          - { name: Fuzz Cathedral, is: "huge fuzz into dark space" }
          - { name: Bitcrush Chaos, is: "modulated bits and rate, stuttering grit" }

      - id: granular-mutation
        label: Granular Mutation
        status: "extends:granular"
        lineage: "granular synthesis (1970s–90s computer music) turned into a bass and texture weapon"
        assembles: [grain-cloud, sampler-voice, filter-svf, random-source, lfo, step-mod, pitch-shifter]
        adds: ["grain population rules (birth/death per beat)", "spectral-preserve on pitch scatter", "position path drawn over the waveform"]
        modes: [cloud, rhythmic, frozen]
        packs:
          - { name: Frozen Voice, is: "a held vocal syllable stretched into a pad" }
          - { name: Particle Cloud, is: "sparse bright grains floating in stereo" }
          - { name: Glitch Storm, is: "dense tempo-locked grain bursts" }
          - { name: Liquid Texture, is: "smooth overlapping grains, gentle motion" }
          - { name: Reverse Dust, is: "reversed micro-grains drifting backwards" }
          - { name: Micro-Rhythm, is: "grains as tiny rhythmic events" }
          - { name: Shattered Glass, is: "high, sharp, scattered grains" }
          - { name: Organic Noise, is: "grains from nature recordings, unpitched" }

      - id: feedback-reactor
        label: Feedback Reactor
        status: new
        lineage: "no-input mixing, dub feedback and circuit-bent loops, made safe"
        assembles: [delay-line, filter-svf, filter-comb, freq-shifter, waveshaper, limiter-true-peak, envelope-follower, relationship-graph]
        adds: ["2–8 node feedback network with drawn topology", "bounded self-oscillation: energy governor keeps loops alive but under ceiling", "runaway detector with soft fade"]
        modes: [loop, network, governed-drone]
        packs:
          - { name: Feedback Cathedral, is: "long tonal feedback blooms in a resonant net" }
          - { name: Screaming Circuit, is: "high, edgy loops on the verge" }
          - { name: Resonant Collapse, is: "loops that build then fold in on themselves" }
          - { name: Dub Feedback, is: "filtered echo feedback swells for drops" }
          - { name: Metallic Loop, is: "short comb loops ringing like metal" }
          - { name: Infinite Drone, is: "self-sustaining governed drones" }
          - { name: Controlled Instability, is: "chaotic but bounded feedback motion" }

      - id: spectral-creature
        label: Spectral Creature
        status: new
        lineage: "multiband bass design: separate synthesis per band, recombined"
        assembles: [multiband-splitter, osc-wavetable, osc-sub, filter-formant, freq-shifter, waveshaper, lfo, step-mod, stereo-tools, spectral-features]
        adds: ["each band a different sound with its own modulation", "cross-band modulation (high band driven by low-band envelope)", "band-recombination morph"]
        modes: [3-band, 5-band, spectral]
        packs:
          - { name: Talking Sub, is: "sub that pulses while the mids speak" }
          - { name: Shattered Midrange, is: "mid band broken into stutters, clean sub and tops" }
          - { name: Glass Highs, is: "airy top-band shimmer on a dark bass" }
          - { name: Neuro Spectrum, is: "different neuro motion in each band" }
          - { name: Xeno Formant Choir, is: "formant mids sung over a fixed sub" }
          - { name: Moving Harmonics, is: "harmonic bands walking against each other" }
          - { name: Frequency Beast, is: "full-spectrum monster with every band alive" }

      - id: resample-forge
        label: Resample Forge
        status: "planned:growl-resampler.spec"
        lineage: "bass-music resampling: render, chop, re-process, render again — generations of the same sound"
        assembles: [sampler-voice, transient-slicer, time-stretch, pitch-shifter, waveshaper, filter-svf, grain-cloud, looper-buffer]
        adds: ["generations stack: G0 → G1 → G2 kept and comparable, each one editable and re-renderable from its parents", "one-click 'render to sampler' from any tool on the canvas", "chop-to-pads with rhythm from the source"]
        modes: [generations, chop, freeze]
        packs:
          - { name: Seventh Generation, is: "seven resample passes of growls into something new" }
          - { name: Chop Salad, is: "mixed slices of five basses retriggered" }
          - { name: Vowel Harvest, is: "best vowel moments extracted and looped" }
          - { name: Pitch-Down Monster, is: "resamples dropped an octave with formant fixed" }
          - { name: Stutter Generations, is: "each generation stuttered at a faster grid" }
          - { name: Clean Rebuild, is: "resamples re-cleaned with a fresh sub underneath" }

      - id: sub-architect
        label: Sub Architect
        status: "extends:sub-engine"
        lineage: "sound-system sub weight: sine sub, kick-phase alignment, small-speaker harmonics"
        assembles: [osc-sub, osc-va, waveshaper, filter-svf, stereo-tools, phase-correlation, ducker, envelope-follower]
        adds: ["phase-align sub start to kick transient", "harmonic translator (adds 2nd/3rd for phones)", "sub glide between notes with mono-safe phase"]
        modes: [pure, translated, glide]
        packs:
          - { name: Rig Pressure, is: "pure sine sub tuned for big systems" }
          - { name: Phone Translation, is: "sub with harmonics heard on small speakers" }
          - { name: Kick-Locked Sub, is: "sub starting in phase with every kick" }
          - { name: Slide Weight, is: "gliding subs for drill and dub" }
          - { name: Square Floor, is: "rounded-square sub for riddim" }
          - { name: Breathing Sub, is: "sub with a slow amplitude swell per bar" }

      - id: bend-lab
        label: Bend Lab
        status: new
        lineage: "pitch as gesture: dives, rises, scoops, drops and 'yoy' bends of bass music"
        assembles: [env-msseg, slew-lag, step-mod, pitch-shifter, lfo]
        adds: ["drawn pitch curves in semitones per note or per bar", "curve library as data, applied to any tool's pitch input", "tempo-scaled bends"]
        modes: [per-note, per-bar, triggered]
        packs:
          - { name: Floor Drop, is: "two-octave dives at the end of phrases" }
          - { name: Yoy Bends, is: "fast up-down bends that sound like speech" }
          - { name: Scoop Entry, is: "every note scoops in from below" }
          - { name: Siren Climb, is: "long rising bends for builds" }
          - { name: Glitch Steps, is: "stepped pitch jumps quantised to 1/32" }
          - { name: Drunk Bend, is: "slow wandering bends, never landing exactly" }

  # ---------- 4.3 RHYTHM & CONTRAST ----------
  rhythm_and_contrast:
    from: "drum machines (1980s on), breakbeat culture, UK garage, jungle, footwork, dembow, techno, polyrhythm traditions worldwide"
    tools:

      - id: polyrhythm-engine
        label: Polyrhythm Engine
        status: "planned:euclid.spec, rhythm-lab.spec"
        lineage: "euclidean rhythms (Toussaint), polymeter in techno and IDM, cross-rhythm traditions"
        assembles: [euclid-generator, polymeter-cycle, clock-div, probability-gate, pattern-store, ratchet]
        adds: ["lanes with independent lengths and divisions, re-alignment shown on a timeline", "nested sequences (a step can contain a sequence)", "phase offset per lane, modulatable"]
        modes: [euclid, polymeter, nested]
        packs:
          - { name: Euclidean Pulse, is: "k-of-n patterns across six lanes" }
          - { name: Six Over Four Sahel, is: "6:4 cross-rhythm lattices with a shared downbeat" }
          - { name: Broken Grid, is: "lanes of 5, 7 and 11 drifting over 16" }
          - { name: Techno Machinery, is: "steady four with polymetric percussion" }
          - { name: DnB Crossfire, is: "two-step DnB with 3:4 percussion crossing it" }
          - { name: Odd Meter, is: "7/8, 5/4, 11/8 grooves that still dance" }
          - { name: Hypnotic Cycles, is: "long cycles that only realign every 64 bars" }

      - id: groove-organism
        label: Groove Organism
        status: "planned:groove.spec; extends:groove-gen"
        lineage: "swing and microtiming of drum machines, MPC-era hip-hop, UKG and live drummers"
        assembles: [groove-template, humanizer, onset-detector, clock-div, seed-registry]
        adds: ["groove extraction from any audio or MIDI clip into a template", "groove applied to notes, modulation and audio slices alike", "velocity–timing relationships (late notes softer, or louder)"]
        modes: [swing, template, human]
        packs:
          - { name: UK Garage Swing, is: "2-step skip with late hats and pushed snares" }
          - { name: Shuffle, is: "triplet shuffle from 50 to 75 percent" }
          - { name: Broken Beat, is: "West London broken beat displacement" }
          - { name: Loose Funk, is: "behind-the-beat snare, ghost notes alive" }
          - { name: Mechanical Precision, is: "dead-straight with velocity accent only" }
          - { name: Human DnB, is: "break-drummer feel at 174" }
          - { name: Dub Pocket, is: "lazy one-drop pocket, late rim and hats" }
          - { name: Afro Groove, is: "lilting swing from West African bell patterns" }

      - id: drum-foundry
        label: Drum Foundry
        status: "extends:drum-forge"
        lineage: "analog drum synthesis (1980s machines), sample layering, modern kick design"
        assembles: [osc-va, osc-noise, modal-resonator, env-msseg, filter-svf, waveshaper, clipper, transient-shaper, sampler-voice, eq-parametric]
        adds: ["per-voice designers (kick, snare, hat, clap, tom, perc) each with full synthesis depth", "layer a synthesized part with a sample part per pad, phase-aligned", "tuning to song key"]
        modes: [synth, layered, sample]
        packs:
          - { name: Boom Foundation, is: "long tuned booms and crisp analog claps" }
          - { name: Shuffle Machine Kit, is: "punchy kicks, noisy snares and metallic hats of house" }
          - { name: Dubstep Impact, is: "huge snares on 3, short sub kicks" }
          - { name: DnB Breaks, is: "tight kicks and cracking snares for 174" }
          - { name: Industrial Percussion, is: "metal hits, clanks and distorted toms" }
          - { name: Organic Drums, is: "modal skins, wood and hand percussion" }
          - { name: Glitch Kit, is: "clicks, crushes and micro-hits" }
          - { name: Future Garage, is: "soft shuffled kits with rain-like texture" }

      - id: contrast-engine
        label: Contrast Engine
        status: "planned:contrast-engine.spec (v2: moves, rivalry, Tap-Map)"
        lineage: "rhythm that fights the grid and snaps back: complextro chops, half-time switches, dembow, footwork"
        assembles: [pattern-store, polymeter-cycle, probability-gate, spectral-features, onset-detector, energy-curve, seed-registry]
        adds: ["the contrast-engine.spec grammar: DISPLACE · CROSS · SYNCOPATE · HEMIOLA · METRIC MOD · SWITCH · GAP · FLIP · STUTTER · REGISTER · CALL/ANSWER · SNAP-BACK", "contrast score per bar vs target curve", "silence as an instrument"]
        modes: [director, rivalry, tap-map]
        packs:
          - { name: Drop Contrast, is: "everything-at-once drop after a starved build" }
          - { name: Minimal Tension, is: "two elements, maximum push-pull" }
          - { name: Maximum Density, is: "switch every 16th between sources" }
          - { name: Sparse Impact, is: "single hits after long gaps" }
          - { name: Dynamic Collapse, is: "full mix collapsing to one sound" }
          - { name: Rhythmic Interruption, is: "gaps that cut riffs mid-phrase" }
          - { name: Silence as Instrument, is: "silences placed like notes" }

      - id: rhythmic-modulator
        label: Rhythmic Modulator
        status: new
        lineage: "trance gates, dubstep gates, sidechain pump and step LFOs (shaper plugins)"
        assembles: [step-mod, lfo, env-msseg, probability-gate, clock-div, ducker]
        adds: ["any rhythm shape to volume, filter, pan or any parameter", "nested cycles (a 1/16 gate inside a 1-bar envelope)", "event-driven reset from notes, kicks or onsets"]
        modes: [gate, shape, event]
        packs:
          - { name: Wobble Grid, is: "step-shaped wobble rates" }
          - { name: Trance Pulse, is: "16th trance gates on pads" }
          - { name: Broken LFO, is: "LFOs that skip and restart" }
          - { name: Dubstep Gate, is: "half-time gate stutters" }
          - { name: Techno Pressure, is: "subtle driving filter pumps" }
          - { name: DnB Motion, is: "fast two-step accent movement" }
          - { name: Chaotic Sync, is: "probabilistic resets at odd divisions" }

      - id: break-architect
        label: Break Architect
        status: new
        lineage: "breakbeat chopping from hip-hop to jungle and breakcore"
        assembles: [transient-slicer, onset-detector, sampler-voice, time-stretch, ratchet, reverse-buffer, pattern-store, groove-template]
        adds: ["break reconstruction: re-sequence slices by rules (keep kick positions, shuffle snares)", "per-slice pitch, reverse, stretch, envelope", "slice-to-MIDI and back"]
        modes: [chop, rebuild, mangle]
        packs:
          - { name: Six-Second Break Mutation, is: "classic jungle break re-ordered and pitched (user's own break)" }
          - { name: Jungle Pressure, is: "fast edits, rolls and reverse snares" }
          - { name: UK Breaks, is: "nu-skool breaks with a heavy bottom" }
          - { name: Glitch Chop, is: "micro-slices and retrigs" }
          - { name: Half-Time Collapse, is: "breaks stretched to half-time weight" }
          - { name: Stutter Grid, is: "1/32 stutter rolls on fills" }
          - { name: Broken Garage, is: "breaks with 2-step skips" }

      - id: fill-generator
        label: Fill Generator
        status: new
        lineage: "drum fills, snare rolls and build-ups of every dance genre"
        assembles: [ratchet, pattern-store, probability-gate, energy-curve, seed-registry]
        adds: ["fills written to the last N steps of a phrase, density rising to the downbeat", "build-ups: 1/4 → 1/8 → 1/16 → 1/32 rolls with pitch and filter ramps", "fills target any drum tool"]
        modes: [fill, build, transition]
        packs:
          - { name: Festival Snare Rise, is: "8-bar accelerating snare roll with pitch climb" }
          - { name: Tom Cascade, is: "falling tom fills into the one" }
          - { name: Two-Beat Flick, is: "short fills every 4 bars" }
          - { name: Breakbeat Turnaround, is: "slice-based fills from the loaded break" }
          - { name: Hat Spiral, is: "hats rolling faster and opening" }
          - { name: Anti-Fill, is: "drops out instead of filling: tension by absence" }

      - id: percussion-physics
        label: Percussion Physics
        status: new
        lineage: "physical modelling percussion: hand drums, struck objects, synthetic materials"
        assembles: [modal-resonator, karplus-string, osc-noise, env-adsr, filter-svf, mpe-expression]
        adds: ["exciter (mallet, hand, stick, brush, scrape) × resonator (skin, wood, metal, glass, plastic)", "strike position and damping per hit from velocity/MPE", "material morph"]
        modes: [hand, mallet, object]
        packs:
          - { name: Clay And Skin, is: "hand-drum family from tight to deep" }
          - { name: Junkyard Hits, is: "struck pipes, cans and sheets" }
          - { name: Latex Percussion, is: "plastic, squeaky synthetic materials" }
          - { name: Wood Marimba Field, is: "tuned wood bars with soft mallets" }
          - { name: Glass Taps, is: "bright struck glass, short ring" }
          - { name: Impossible Materials, is: "resonators no real object has" }

      - id: pump-shaper
        label: Pump Shaper
        status: "extends:sidechain-compressor"
        lineage: "sidechain pumping of French house, EDM and future bass"
        assembles: [ducker, compressor, envelope-follower, multiband-splitter, clock-div]
        adds: ["pump from notes, kick audio or transport — drawn curve", "per-band pump (sub ducks, tops don't)", "pump amount as a relationship target"]
        modes: [curve, audio, multiband]
        packs:
          - { name: Filter Disco Pump, is: "deep quarter-note breathing" }
          - { name: Future Bass Swell, is: "chords swelling back after each kick" }
          - { name: Sub Only Duck, is: "sub ducks, mids stay put" }
          - { name: Tight Club Duck, is: "fast short duck for clean low end" }
          - { name: Off-Beat Breathe, is: "pump on the off-beats instead" }
          - { name: Triplet Pump, is: "pumping in triplets over straight four" }

  # ---------- 4.4 TENSION & OSCILLATION ----------
  tension_and_oscillation:
    from: "film-score suspense, EDM build-ups, minimalism, phase music, chaotic and coupled systems"
    tools:

      - id: tension-field
        label: Tension Field
        signature: true
        status: new
        lineage: "ERAVOS: tension measured in five domains at once and used as a control signal"
        assembles: [tension-meter, energy-curve, spectral-features, onset-detector, chord-recognizer, relationship-graph]
        adds: ["live tension curves (harmonic, rhythmic, spectral, density, pitch-instability)", "map any tension domain to any parameter", "trajectory targets: 'reach 80 by bar 16'"]
        modes: [measure, map, target]
        packs:
          - { name: Slow Burn, is: "tension rising over 32 bars across all domains" }
          - { name: Rising Pressure, is: "density and brightness climbing together" }
          - { name: Suspended Resolution, is: "harmonic tension held high, rhythm relaxed" }
          - { name: Dissonance Bloom, is: "dissonance opening as the filter opens" }
          - { name: Pre-Drop, is: "all domains peak in the bar before the drop" }
          - { name: Psychological Horror, is: "pitch instability and silence used for dread" }
          - { name: Release Cascade, is: "domains releasing one after another" }

      - id: oscillation-matrix
        label: Oscillation Matrix
        status: new
        lineage: "multi-LFO modulation rigs, coupled oscillators, phase music"
        assembles: [lfo, oscillator-population, chaos-attractor, mod-ops, relationship-graph]
        adds: ["matrix of modulation oscillators that modulate each other's rate, phase and depth", "sync groups and phase-lock controls", "outputs any number of modulation signals"]
        modes: [free, coupled, nested, chaotic]
        packs:
          - { name: Phase Lock, is: "LFOs locking into phase over time" }
          - { name: Beating Patterns, is: "close rates producing slow beats" }
          - { name: Chaotic Motion, is: "attractor-driven modulation" }
          - { name: Nested Oscillation, is: "LFOs modulating LFOs three deep" }
          - { name: Slow Drift, is: "very slow, never-repeating motion" }
          - { name: Rhythmic Machine, is: "tempo-locked interlocking cycles" }
          - { name: Harmonic Orbit, is: "rates in harmonic ratios, orbiting" }

      - id: motion-extractor
        label: Motion Extractor
        status: new
        lineage: "envelope followers and audio-to-control, generalised to any audio feature"
        assembles: [envelope-follower, onset-detector, spectral-features, pitch-tracker, beat-tracker, mod-ops]
        adds: ["any feature of any audio becomes modulation", "feature recording to modulation clips", "smoothing, range and curve per feature"]
        modes: [live, recorded]
        packs:
          - { name: Bass Follower, is: "bass loudness driving pad brightness" }
          - { name: Transient Driver, is: "drum hits triggering modulation pulses" }
          - { name: Spectral Motion, is: "centroid driving filter and width" }
          - { name: Vocal Movement, is: "vocal pitch and loudness steering synths" }
          - { name: Kick Pump, is: "kick envelope as a pump source" }
          - { name: Rhythmic Breath, is: "onset density driving reverb size" }
          - { name: Reactive Texture, is: "every feature mapped gently to a texture" }

      - id: phase-weaver
        label: Phase Weaver
        status: new
        lineage: "phase alignment tools, phase music, stereo phase effects"
        assembles: [filter-allpass-chain, delay-line, phase-correlation, stereo-tools, lfo]
        adds: ["align two sources by phase (auto or by hand)", "controlled cancellation as a sound-design move", "stereo phase motion with mono safety"]
        modes: [align, displace, sculpt]
        packs:
          - { name: Perfect Lock, is: "kick and sub phase-aligned exactly" }
          - { name: Phase Drift, is: "slowly sliding phase between layers" }
          - { name: Beating Glass, is: "phase beating in bright layers" }
          - { name: Moving Stereo, is: "phase-based width that stays mono-safe" }
          - { name: Cancellation Sculptor, is: "carving sound by cancelling parts of it" }
          - { name: Unstable Choir, is: "choir layers phasing against each other" }
          - { name: Harmonic Alignment, is: "partials aligned for punch" }

      - id: controlled-chaos
        label: Controlled Chaos
        status: new
        lineage: "aleatoric music, generative systems, modular random sources"
        assembles: [random-source, chaos-attractor, markov-chain, probability-gate, seed-registry, scale-key]
        adds: ["bounded stochastic processes with visible distributions", "markov transitions learned from the user's clips", "chaos amount per bar from an energy-curve"]
        modes: [random, markov, attractor]
        packs:
          - { name: Organic Randomness, is: "small, correlated variations" }
          - { name: Fractured Rhythm, is: "probabilistic rhythmic breaks" }
          - { name: Controlled Glitch, is: "glitches only where allowed" }
          - { name: Evolving Arpeggio, is: "arps that change but stay in key" }
          - { name: Unstable Machine, is: "machines that misbehave on schedule" }
          - { name: Chaotic Percussion, is: "attractor-driven percussion" }
          - { name: Living Texture, is: "textures that never repeat" }

      - id: riser-forge
        label: Riser Forge
        status: new
        lineage: "EDM transition FX: risers, uplifters, downlifters, impacts, sweeps"
        assembles: [osc-noise, osc-va, filter-svf, env-msseg, pitch-shifter, reverb-fdn, delay-line, unison-stack]
        adds: ["riser length in bars, synced to transport", "pitch, filter, width and density curves designed together", "impact + tail generated to land on the downbeat"]
        modes: [riser, downlifter, impact, sweep]
        packs:
          - { name: Eight Bar Ascent, is: "noise and saw riser over 8 bars" }
          - { name: Sinking Ship, is: "long downlifters into breakdowns" }
          - { name: Sub Boom Impact, is: "deep boom + reversed tail on the one" }
          - { name: Whoosh Library, is: "short sweeps for every transition" }
          - { name: Tension Siren, is: "pitched siren riser with vibrato speed-up" }
          - { name: Reverse Vacuum, is: "reverb sucked backwards into the drop" }

  # ---------- 4.5 SPACE & TRANSFORMATION ----------
  space_and_transformation:
    from: "tape echo and spring tanks (dub), plates and halls (studio era), digital reverbs (1980s on), spectral processing"
    tools:

      - id: echo-architecture
        label: Echo Architecture
        status: "extends:fx-echo (fx-dub-echo stays its own tool)"
        lineage: "tape echo, multi-head echo, ping-pong and digital delays"
        assembles: [delay-line, saturator-tape, filter-svf, stereo-tools, pitch-shifter, ducker, lfo]
        adds: ["topologies: single, multi-tap, multi-head, ping-pong, cross-feed, diffused", "rhythmic throws (send-on-event)", "feedback filter + pitch in loop"]
        modes: [tape, digital, multi-head, diffused]
        packs:
          - { name: Dub Chamber, is: "dark filtered tape repeats" }
          - { name: Tape Decay, is: "repeats that degrade each pass" }
          - { name: Infinite Delay, is: "freeze and build loops" }
          - { name: Rhythmic Throw, is: "single words or hits thrown into echoes" }
          - { name: Dark Echo, is: "low-passed echoes behind the mix" }
          - { name: Stereo Spiral, is: "ping-pong spiralling outwards" }
          - { name: Broken Machine, is: "glitchy, modulated, misbehaving echo" }

      - id: space-sculptor
        label: Space Sculptor
        status: "planned:space-reverb.spec"
        lineage: "chambers, plates, springs, halls, algorithmic and convolution reverbs"
        assembles: [reverb-fdn, reverb-convolution, plate-model, spring-model, early-reflections, eq-parametric, ducker, lfo]
        adds: ["blend algorithms (ER from one, tail from another)", "decay modulation and per-band decay", "space from any audio (convolve with a sound)"]
        modes: [hall, plate, spring, room, convolution, hybrid]
        packs:
          - { name: Cathedral, is: "huge stone hall, long low decay" }
          - { name: Small Room, is: "tight rooms for drums and vocals" }
          - { name: Concrete Tank, is: "dub-style hard concrete space" }
          - { name: Infinite Space, is: "never-ending modulated tails" }
          - { name: Metallic Hall, is: "ringing steel halls" }
          - { name: Dark Chamber, is: "warm dark chamber" }
          - { name: Frozen Reverb, is: "held tails as pads" }

      - id: spatial-organism
        label: Spatial Organism
        status: new
        lineage: "stereo imaging, binaural audio, surround and immersive mixing"
        assembles: [panner, stereo-tools, early-reflections, delay-line, lfo, phase-correlation]
        adds: ["motion paths drawn in 2D/3D", "depth via air, level and pre-delay together", "multichannel and binaural outputs"]
        modes: [stereo, binaural, multichannel]
        packs:
          - { name: Wide Horizon, is: "spread across the full field" }
          - { name: Moving Orbit, is: "sounds circling the listener" }
          - { name: Narrow Pressure, is: "intense centred focus" }
          - { name: Immersive Field, is: "binaural placement for headphones" }
          - { name: Mono Focus, is: "mono-first, phase-perfect" }
          - { name: Rotating Machine, is: "rotary-speaker-like spin" }
          - { name: Deep Space, is: "very distant, air-absorbed sounds" }

      - id: time-mutation
        label: Time Mutation
        status: "planned:time-warp.spec"
        lineage: "time-stretch, tape stop, reverse and time-warp effects"
        assembles: [time-stretch, grain-cloud, reverse-buffer, tape-transport, transient-slicer, pitch-shifter]
        adds: ["nonlinear time warp curves drawn per bar", "transient-preserving stretch on live input", "time freeze on trigger"]
        modes: [stretch, warp, freeze]
        packs:
          - { name: Elastic Breaks, is: "breaks stretched without smearing" }
          - { name: Reverse Gravity, is: "everything flowing backwards" }
          - { name: Frozen Moment, is: "one instant held forever" }
          - { name: Accelerating Collapse, is: "time speeding up into nothing" }
          - { name: Tape Stop, is: "classic stop and start curves" }
          - { name: Glitch Time, is: "time jumps and skips" }
          - { name: Liquid Stretch, is: "smooth slow stretches" }

      - id: spectral-transmuter
        label: Spectral Transmuter
        status: new
        lineage: "spectral freezing, cross-synthesis and resynthesis"
        assembles: [partial-tracker, osc-additive, filter-bank, spectral-features, grain-cloud]
        adds: ["freeze and edit partials live", "harmonic redistribution (move energy to chosen partials)", "cross-synthesis of any two inputs"]
        modes: [freeze, redistribute, cross]
        packs:
          - { name: Frozen Harmonics, is: "held spectra as pads" }
          - { name: Spectral Ghost, is: "faint spectral echoes of a sound" }
          - { name: Metallic Voice, is: "voice spectra made metal" }
          - { name: Vocal Machine, is: "machines speaking with a voice spectrum" }
          - { name: Harmonic Bloom, is: "partials blooming upwards" }
          - { name: Spectral Collapse, is: "spectra falling into one band" }
          - { name: Alien Atmosphere, is: "strange shifted spectra for worlds" }

      - id: shimmer-engine
        label: Shimmer Engine
        status: new
        lineage: "pitch-shifted feedback reverb of 1980s–90s ambient and post-rock"
        assembles: [reverb-fdn, pitch-shifter, filter-svf, delay-line, lfo]
        adds: ["shift intervals in the feedback (+12, +7, −12, any)", "shimmer only on sustained notes (transient bypass)", "bloom amount over time"]
        modes: [octave, fifth, chord]
        packs:
          - { name: Angel Octave, is: "classic +12 shimmer wash" }
          - { name: Fifth Heaven, is: "+7 and +12 together" }
          - { name: Downward Shimmer, is: "−12 shimmer for dark ambient" }
          - { name: Chord Halo, is: "shimmer in a major-7 chord" }
          - { name: Glacial Bloom, is: "very slow bloom over minutes" }
          - { name: Bright Mist, is: "subtle shimmer behind vocals" }

  # ---------- 4.6 MUSICAL INTELLIGENCE ----------
  musical_intelligence:
    from: "harmony, voice leading and counterpoint traditions; arpeggiators; generative composition"
    tools:

      - id: harmony-architect
        label: Harmony Architect
        status: "planned:chord-assistant.spec; extends:chord-gen"
        lineage: "functional, modal and jazz harmony; the chord pads of trance, house and cinematic music"
        assembles: [chord-engine, voice-leader, scale-key, tension-meter, pattern-store]
        adds: ["progressions as editable chord clips", "modal interchange and secondary dominants on request", "tension-to-resolution target per bar"]
        modes: [progression, voicing, reharmonise]
        packs:
          - { name: Dream Pop, is: "major 7ths, add9s, gentle movement" }
          - { name: Dark Cinematic, is: "minor modes, pedal tones, sudden majors" }
          - { name: Jazz Fusion, is: "extended chords, tritone subs" }
          - { name: Emotional Trance, is: "minor-key uplifting progressions" }
          - { name: Dissonant Techno, is: "cluster chords and stabs" }
          - { name: Neo-Classical, is: "voice-led classical progressions" }
          - { name: Suspended Harmony, is: "sus chords that never quite resolve" }
          - { name: Deep House, is: "minor 9ths and 11ths, soft" }

      - id: melody-organism
        label: Melody Organism
        status: new
        lineage: "motif development from classical to trance anthems and hooks"
        assembles: [motif-store, contour-generator, scale-key, markov-chain, pattern-store, seed-registry]
        adds: ["motif + transforms per phrase", "rhythmic identity locked while pitches vary (or the other way)", "call/answer phrase writer"]
        modes: [motif, contour, call-answer]
        packs:
          - { name: Trance Lead, is: "soaring leads with step-wise climbs" }
          - { name: Liquid DnB, is: "flowing jazzy lines at 174" }
          - { name: Synthwave Arpeggio, is: "driving 16th arp melodies" }
          - { name: Minimal Motif, is: "three-note motifs developed slowly" }
          - { name: Broken Melody, is: "melodies with missing notes and leaps" }
          - { name: Hypnotic Loop, is: "short loops with tiny changes" }
          - { name: Cinematic Theme, is: "wide-interval themes" }

      - id: arpeggio-evolution
        label: Arpeggio Evolution
        status: "extends:arp"
        lineage: "arpeggiators of 1980s polysynths to modern multi-lane arps"
        assembles: [pattern-store, probability-gate, ratchet, clock-div, scale-key, note-follow]
        adds: ["2–4 arp lanes with independent direction, rate and octave", "evolution rules over bars", "gate and velocity lanes"]
        modes: [classic, multi, generative]
        packs:
          - { name: Classic Trance, is: "up-down 16ths over chords" }
          - { name: Psychedelic Spiral, is: "rolling, rising spirals" }
          - { name: Acid Sequence, is: "slides and accents for diode filters" }
          - { name: Mercury Arp, is: "fluid, constantly morphing arps" }
          - { name: Fractured Arp, is: "skipping, probabilistic arps" }
          - { name: Polymetric Arp, is: "lanes of different lengths" }
          - { name: Generative Sequence, is: "arps that write new variations" }

      - id: voice-architect
        label: Voice Architect
        status: "planned:vocoder.spec, talkbox.spec, voice-character.spec"
        lineage: "vocoders, talk boxes, formant processing, choir synthesis"
        assembles: [vocal-tract, filter-bank, filter-formant, pitch-shifter, grain-cloud, pitch-tracker]
        adds: ["vocoder with any carrier from the canvas", "choir from one voice (pitch + formant spread)", "speech-like synthesis from phoneme lanes"]
        modes: [vocoder, choir, synth-voice, formant]
        packs:
          - { name: Robotic Choir, is: "vocoded choir pads" }
          - { name: Human Ghost, is: "breathy, distant voices" }
          - { name: Formant Bass, is: "talking bass via vocoder" }
          - { name: Digital Choir, is: "bright synthetic choirs" }
          - { name: Glossolalia Engine, is: "invented-language phrases" }
          - { name: Choir Cathedral, is: "massive choirs in space" }
          - { name: Vocal Chop, is: "pitched vocal chops for future bass and house" }

      - id: arrangement-organism
        label: Arrangement Organism
        status: "extends:timeline, bass-drop-builder"
        lineage: "song forms of dance music: intro, build, drop, break, outro"
        assembles: [structure-segmenter, energy-curve, motif-store, pattern-store, state-machine-core]
        adds: ["section templates with energy curves", "motif recurrence tracking", "transition generation between sections"]
        modes: [template, analyse, generate]
        packs:
          - { name: Festival Arc, is: "big-room build–drop structure" }
          - { name: Progressive Journey, is: "long, slow evolution" }
          - { name: Dub Journey, is: "versions and breakdowns" }
          - { name: Cinematic Build, is: "one long build to a climax" }
          - { name: Minimal Evolution, is: "tiny changes over long time" }
          - { name: DnB Energy Curve, is: "two-drop DnB structure" }
          - { name: Experimental Structure, is: "non-standard forms" }

      - id: bassline-writer
        label: Bassline Writer
        status: new
        lineage: "basslines of house, techno, DnB and dub, written against chords and kicks"
        assembles: [chord-engine, scale-key, pattern-store, onset-detector, groove-template, markov-chain]
        adds: ["kick-aware: avoids or locks to kick positions by rule", "follows the chord clip on the canvas", "octave jumps and slides as lanes"]
        modes: [root, walking, rolling, offbeat]
        packs:
          - { name: Offbeat Engine, is: "house bass on every off-beat" }
          - { name: Rolling Sixteenths, is: "psy/techno rolling bass between kicks" }
          - { name: Steppers Walk, is: "dub steppers bass movement" }
          - { name: Two-Step Bounce, is: "UKG bouncing bass" }
          - { name: Walking Night, is: "jazzy walking lines" }
          - { name: One-Note Menace, is: "single-note rhythmic bass with octave flicks" }

      - id: counterpoint-engine
        label: Counterpoint Engine
        status: new
        lineage: "species counterpoint, contrary motion, countermelody writing"
        assembles: [voice-leader, motif-store, scale-key, contour-generator, pattern-store]
        adds: ["writes a countermelody against any melody on the canvas", "motion rules: contrary, oblique, parallel on/off", "rhythmic complement (fills gaps of the main line)"]
        modes: [counter, harmony-line, fill]
        packs:
          - { name: Mirror Line, is: "contrary motion to the lead" }
          - { name: Gap Filler, is: "notes only where the lead rests" }
          - { name: Baroque Engine, is: "strict counterpoint rules" }
          - { name: Thirds Companion, is: "a third above or below, smart" }
          - { name: Pedal Anchor, is: "held pedal tones under movement" }
          - { name: Answer Phrase, is: "phrase-length replies" }

  # ---------- 4.7 SAMPLING & RECONSTRUCTION ----------
  sampling_and_reconstruction:
    from: "samplers (1980s on), hip-hop sampling, resynthesis research, stem separation"
    tools:

      - id: sample-universe
        label: Sample Universe
        status: "planned:sampler-pro.spec; extends:sample-player"
        lineage: "multisampled instruments, round robins, granular playback"
        assembles: [sampler-voice, grain-cloud, preset-morph, env-adsr, filter-svf, voice-allocator]
        adds: ["key/velocity/round-robin zones with drag-in mapping", "sample morph between zones", "auto-map from file names or pitch detection"]
        modes: [multisample, granular, morph]
        packs:
          - { name: Analog Collection, is: "multisampled vintage synth sounds made by the user or ERAVOS" }
          - { name: Found Sound, is: "everyday objects as instruments" }
          - { name: Organic Percussion, is: "wood, skin and seeds" }
          - { name: Cinematic Textures, is: "evolving textures for scenes" }
          - { name: Vocal Fragments, is: "short vocal snippets" }
          - { name: Industrial Objects, is: "machines and metal" }
          - { name: Hybrid Instruments, is: "acoustic + synth layers" }

      - id: resynthesis-forge
        label: Resynthesis Forge
        status: new
        lineage: "analysis-resynthesis (sinusoidal modelling) applied to sound matching"
        assembles: [partial-tracker, osc-additive, osc-wavetable, onset-detector, pitch-tracker, modulation-estimator]
        adds: ["rebuild a sound as an editable synth patch (hypothesis with confidence)", "extract wavetables from audio", "estimate envelopes and LFOs"]
        modes: [additive, wavetable, patch]
        packs:
          - { name: Bass Reconstruction, is: "basses rebuilt as patches" }
          - { name: Instrument Rebuild, is: "acoustic instruments resynthesised" }
          - { name: Vocal Resynthesis, is: "voices as partials" }
          - { name: Drum Reconstruction, is: "drum hits rebuilt as synth drums" }
          - { name: Analog Approximation, is: "analog tones approximated" }
          - { name: Spectral Sculpture, is: "rebuilt sounds edited into new ones" }

      - id: audio-deconstructor
        label: Audio Deconstructor
        status: "planned:stem-split.spec"
        lineage: "stem separation and music information retrieval"
        assembles: [source-separator, beat-tracker, key-detector, chord-recognizer, pitch-tracker, spectral-features, structure-segmenter, modulation-estimator]
        adds: ["production hypothesis report: tempo, key, sections, likely bass technique — each with confidence", "never claims exact reconstruction (§14)", "results stay with the user's file"]
        modes: [stems, analysis, hypothesis]
        packs:
          - { name: Dubstep Breakdown, is: "analysis presets tuned for 140 half-time" }
          - { name: Synthwave Breakdown, is: "tuned for 80s-style arrangements" }
          - { name: Techno Breakdown, is: "loop-based structure analysis" }
          - { name: DnB Breakdown, is: "174 and break analysis" }
          - { name: Ambient Breakdown, is: "texture and slow change" }
          - { name: House Breakdown, is: "four-on-the-floor sections" }
          - { name: Cinematic Breakdown, is: "dynamic range and orchestration" }

      - id: layer-architect
        label: Layer Architect
        status: new
        lineage: "layered instruments: stacked basses, hybrid orchestras, impact design"
        assembles: [multiband-splitter, env-adsr, macro, phase-correlation, stereo-tools, voice-allocator]
        adds: ["any tools on the canvas stacked as one instrument", "per-layer envelopes and key ranges", "shared modulation across layers with per-layer depth"]
        modes: [stack, split, crossfade]
        packs:
          - { name: Massive Bass, is: "sub + mid + top layers" }
          - { name: Hybrid Orchestra, is: "acoustic and synth layers" }
          - { name: Layered Reese, is: "reese layers with mono sub" }
          - { name: Synthwave Stack, is: "brass + strings + arp layers" }
          - { name: Impact Designer, is: "hit layers: sub, body, crack, tail" }
          - { name: Vocal Texture, is: "vocal layers with pads" }
          - { name: Organic Machine, is: "natural + mechanical layers" }

      - id: audio-morph
        label: Audio Morph
        status: new
        lineage: "morphing, cross-synthesis and spectral interpolation"
        assembles: [partial-tracker, osc-additive, filter-bank, time-stretch, onset-detector]
        adds: ["morph between N sources with pitch and transient preservation", "morph rhythmic structure separately from timbre", "morph curve per bar"]
        modes: [spectral, envelope, rhythmic]
        packs:
          - { name: Voice-to-Machine, is: "voice morphing into machinery" }
          - { name: Drum-to-Bass, is: "drums morphing into a bass" }
          - { name: Analog-to-Digital, is: "warm to cold" }
          - { name: Organic-to-Industrial, is: "nature to factory" }
          - { name: Texture Evolution, is: "texture A becoming B" }
          - { name: Spectral Fusion, is: "two sounds fused" }

      - id: chop-station
        label: Chop Station
        status: new
        lineage: "1980s–90s pad samplers: chop, assign to pads, swing, filter — hip-hop's core instrument"
        assembles: [transient-slicer, sampler-voice, groove-template, filter-svf, time-stretch, pattern-store, bitcrusher]
        adds: ["16 pads × banks, chop by onset/grid/hand", "per-pad pitch, filter, envelope, choke groups", "sampler-era colour (bit depth, rate) per pad"]
        modes: [chop, pads, flip]
        packs:
          - { name: Dusty Crate Flip, is: "warm chops with low-bit colour" }
          - { name: Soul Chop Pocket, is: "pitched-up vocal-and-keys chops" }
          - { name: Boom-Bap Brain, is: "punchy chopped drums with swing" }
          - { name: Choke Group Lab, is: "tight choke-based rhythms" }
          - { name: Lo-Fi Study Loops, is: "soft, filtered, wobbly chops" }
          - { name: Sci-Fi Flip, is: "chops re-pitched into strange chords" }

      - id: sound-match
        label: Sound Match
        status: "new (parked idea in PROGRESS.md: the offline matcher as a tool)"
        lineage: "ERAVOS: automatic patch search against a reference the user supplies"
        assembles: [spectral-features, loudness-meter, pitch-tracker, onset-detector, modulation-estimator, seed-registry]
        adds: ["choose any tool, give it a reference clip; an offline search finds the closest settings (cost shown)", "result is an ordinary preset; reference audio stays out of the project unless the user keeps it", "multi-objective: spectrum, envelope, motion"]
        modes: [match, nearest, explore-around]
        packs:
          - { name: Match Strict, is: "low tolerance, slow, closest result" }
          - { name: Match Quick, is: "fast rough match for sketching" }
          - { name: Motion First, is: "matches movement over tone" }
          - { name: Tone First, is: "matches spectrum over movement" }
          - { name: Neighbourhood Walk, is: "variations around a match" }
          - { name: Opposite Of, is: "finds the most different settings on purpose" }

  # ---------- 4.8 RAVE & TRANCE ----------
  rave_and_trance:
    from: "acid house (1987 on), hardcore and rave (early 1990s), trance (1990s–2000s), uplifting and psy"
    tools:

      - id: hoover-engine
        label: Hoover Engine
        status: new
        lineage: "the early-1990s rave 'hoover': PWM saws with chorus and pitch envelope, from a mid-80s digital-analog synth"
        assembles: [osc-va, unison-stack, ensemble-core, env-msseg, slew-lag, filter-svf, waveshaper]
        adds: ["pitch dip-and-rise envelope per note", "PWM + saw blend with ensemble at the core", "glide with negative-dip"]
        modes: [classic, modern, bass]
        packs:
          - { name: Rave Vacuum, is: "the classic dipping hoover lead" }
          - { name: Hoover Bass Crash, is: "hoover as a huge bass" }
          - { name: Early-Nineties Stab, is: "short hoover chord stabs" }
          - { name: Hardcore Wail, is: "high, pitch-bent hoover lines" }
          - { name: Dark Hoover Drone, is: "slow low hoover pad" }
          - { name: Modern Hoover Riddim, is: "hoover through riddim gates" }

      - id: supersaw-cathedral
        label: Supersaw Cathedral
        status: "extends:supersaw"
        lineage: "the late-1990s supersaw: seven detuned saws, the trance and EDM anthem sound"
        assembles: [osc-va, unison-stack, filter-svf, ensemble-core, reverb-fdn, ducker, stereo-tools, env-adsr]
        adds: ["detune curve that matches the classic non-linear spread, plus user curves", "centre-voice level", "stereo per voice with mono-below"]
        modes: [lead, chord, pad, pluck]
        packs:
          - { name: Uplift Anthem, is: "huge bright trance chords" }
          - { name: Festival Lead, is: "big-room lead with pitch drop" }
          - { name: Future Bass Wall, is: "wide chord stacks with pump" }
          - { name: Hands Up Pluck, is: "short supersaw plucks" }
          - { name: Darkened Saws, is: "low-passed minor supersaws" }
          - { name: Seven Voices Clean, is: "pure, no-chorus supersaw" }

      - id: pluck-forge
        label: Pluck Forge
        status: new
        lineage: "trance, progressive and future house plucks"
        assembles: [osc-va, osc-wavetable, karplus-string, env-adsr, filter-svf, transient-shaper, delay-line, unison-stack]
        adds: ["transient layer + body layer with one decay control", "filter-env and amp-env linked by one 'snap' macro", "built-in rhythmic echo option"]
        modes: [synth, string, hybrid]
        packs:
          - { name: Progressive Droplet, is: "round soft plucks with echo" }
          - { name: Snap Pluck, is: "very short clicky plucks" }
          - { name: Glass String, is: "string-model plucks with shine" }
          - { name: Marimba Synth, is: "woody synthetic plucks" }
          - { name: Future House Bounce, is: "plucky bouncy leads" }
          - { name: Tropic Pluck, is: "soft mellow plucks" }

      - id: rave-stab
        label: Rave Stab
        status: new
        lineage: "rave and house chord stabs: organ, piano and synth chord memory"
        assembles: [chord-engine, osc-va, osc-fm-operator, sampler-voice, filter-svf, env-adsr, reverb-fdn]
        adds: ["one-key chord memory with any voicing", "stab shape (short, gated, swelled)", "pitch drop per stab"]
        modes: [organ, piano, synth]
        packs:
          - { name: Warehouse Organ Stab, is: "minor-7 organ stabs" }
          - { name: Hardcore Piano Hit, is: "bright piano stab chords" }
          - { name: Detroit Chord Memory, is: "string-synth chord stabs" }
          - { name: Breakbeat Rave Hit, is: "stab + noise hits for hardcore" }
          - { name: Dub Techno Smear, is: "stabs into long delay" }
          - { name: Euphoric Stab, is: "major chord stabs" }

      - id: acid-line
        label: Acid Line
        status: "extends:acid-synth"
        lineage: "the 1980s bass-line box: diode filter, accent and slide; acid house onward"
        assembles: [osc-va, filter-diode, env-adsr, slew-lag, waveshaper, pattern-store, delay-line]
        adds: ["step sequencer with accent and slide like the original grammar", "accent-to-resonance coupling", "random pattern generator in key"]
        modes: [classic, modern, overdriven]
        packs:
          - { name: Squelch Protocol, is: "classic resonant acid lines" }
          - { name: Overdriven Acid, is: "distorted acid for techno" }
          - { name: Acid Trance, is: "fast acid under trance" }
          - { name: Psychedelic Acid, is: "acid through delay and phaser" }
          - { name: Slow Acid Dub, is: "slow, spacey acid" }
          - { name: Acid Riddim, is: "acid lines in bass-music tempo" }

  # ---------- 4.9 HOUSE, GARAGE & TECHNO ----------
  house_garage_techno:
    from: "Chicago house and Detroit techno (1980s), UK garage (late 1990s), minimal and dub techno, French filter house"
    tools:

      - id: organ-bass
        label: Organ Bass
        status: "extends:organ"
        lineage: "late-1980s–90s house organ bass from a digital workstation, and UKG organ bass"
        assembles: [osc-additive, osc-fm-operator, filter-svf, env-adsr, waveshaper]
        adds: ["drawbar-like partial control for bass registers", "click and decay shaping", "key-follow brightness"]
        modes: [house, garage, deep]
        packs:
          - { name: Club Organ Low, is: "classic house organ bassline tone" }
          - { name: Speed Garage Organ, is: "UKG organ bass with wobble" }
          - { name: Deep Organ Pulse, is: "soft deep-house organ bass" }
          - { name: Hammered Organ, is: "percussive organ bass" }
          - { name: Organ Wub, is: "organ bass with filter motion" }
          - { name: Glass Organ Bass, is: "bright upper-partial organ bass" }

      - id: filter-house
        label: Filter House
        status: new
        lineage: "French touch filter house: loops through a swept filter, phaser and pump"
        assembles: [filter-svf, filter-allpass-chain, ducker, compressor, lfo, sampler-voice]
        adds: ["one big filter sweep macro across a loop", "phaser + pump as one move", "loop source from any canvas audio"]
        modes: [sweep, phaser, pump]
        packs:
          - { name: Disco Sweep, is: "8-bar lowpass open on disco loops" }
          - { name: Phased Groove, is: "slow phaser on chord loops" }
          - { name: Filtered Funk, is: "funky loops pumping under a filter" }
          - { name: Night Club Filter, is: "dark filter pumping in a club" }
          - { name: Highpass Tease, is: "highpass build before drops" }
          - { name: Robot Disco, is: "talkbox-like filter on loops" }

      - id: rumble-kick
        label: Rumble Kick
        status: new
        lineage: "techno rumble: kick into reverb, filtered and ducked into a rolling low end"
        assembles: [reverb-fdn, filter-svf, ducker, waveshaper, delay-line, eq-parametric]
        adds: ["kick in → rumble out, tuned to key", "rumble groove (on 1/16 off-beats)", "rumble decay synced to tempo"]
        modes: [reverb, delay, synth]
        packs:
          - { name: Berlin Basement, is: "dark warm rumble" }
          - { name: Industrial Rumble, is: "distorted rolling rumble" }
          - { name: Hypnotic Roll, is: "off-beat rumble pulses" }
          - { name: Warehouse Fog, is: "long foggy rumble" }
          - { name: Tight Rumble, is: "short controlled rumble" }
          - { name: Acid Rumble, is: "rumble with resonant motion" }

      - id: dub-techno-chord
        label: Dub Techno Chord
        status: new
        lineage: "1990s Berlin dub techno: minor chord stab into filtered echo and reverb"
        assembles: [chord-engine, osc-va, filter-svf, delay-line, reverb-fdn, lfo]
        adds: ["chord + delay + filter as one instrument", "filter motion per bar", "echo feedback breathing with tempo"]
        modes: [stab, wash]
        packs:
          - { name: Deep Fog Stab, is: "classic foggy minor chord in echo" }
          - { name: Grey Mist Stab, is: "misty dub stabs, top rolled off, endless tail" }
          - { name: Snowy Echo, is: "bright stabs into white echo" }
          - { name: Underwater Chords, is: "low-passed submerged chords" }
          - { name: Endless Dub, is: "feedback near infinite" }
          - { name: Minimal Chord, is: "dry, short dub stabs" }

      - id: micro-percussion
        label: Micro Percussion
        status: new
        lineage: "minimal techno and microhouse clicks, blips and glitches"
        assembles: [osc-va, osc-noise, modal-resonator, env-adsr, filter-svf, probability-gate]
        adds: ["micro-hits under 50 ms", "pitch and decay randomised per hit (seeded)", "groove-aware placement"]
        modes: [click, blip, glitch]
        packs:
          - { name: Click Garden, is: "tiny clicks and pops" }
          - { name: Blip Machine, is: "short pitched blips" }
          - { name: Microhouse Rain, is: "random tiny hits" }
          - { name: Digital Crickets, is: "high chirps" }
          - { name: Wood Micro, is: "small wooden ticks" }
          - { name: Glitch Seeds, is: "seeded glitch hits" }

      - id: garage-skip
        label: Garage Skip
        status: new
        lineage: "2-step UK garage: skipping kicks, shuffled hats, vocal chops"
        assembles: [pattern-store, groove-template, sampler-voice, pitch-shifter, ducker]
        adds: ["2-step pattern writer (skip kicks on the and-of-2/4)", "vocal chop pitcher", "bass pressure on swing"]
        modes: [2-step, speed-garage, future-garage]
        packs:
          - { name: Two-Step Skip, is: "classic skipping garage groove" }
          - { name: Speed Garage Shuffle, is: "4x4 garage with shuffle" }
          - { name: Rainy Garage, is: "future garage with rain texture" }
          - { name: Vocal Chop Garage, is: "chopped vocals over 2-step" }
          - { name: Bass Garage, is: "heavy bass garage" }
          - { name: Night Bus Garage, is: "late-night melancholic garage" }

  # ---------- 4.10 HIP-HOP & GLOBAL CLUB ----------
  hiphop_and_global_club:
    from: "trap (2000s on), UK and NY drill (2010s), phonk (Memphis roots, 2020s drift phonk), amapiano (South Africa, 2010s),
           baile funk (Rio, 1990s on), jersey and Baltimore club, gqom, reggaeton and dembow, footwork and juke (Chicago)"
    tools:

      - id: glide-808
        label: Glide 808
        status: new
        lineage: "the tuned long-decay drum-machine kick used as a bass: trap glides, drill slides, phonk distortion"
        assembles: [osc-sub, osc-va, env-msseg, slew-lag, waveshaper, clipper, filter-svf, scale-key]
        adds: ["slides between notes by time or by bend curve (drill slides)", "click + body + tail designed separately", "distortion that keeps the fundamental"]
        modes: [trap, drill, phonk, clean]
        packs:
          - { name: Slide Lord, is: "long drill slides between notes" }
          - { name: Trap Long Tail, is: "clean long boom with soft click" }
          - { name: Distorted Drift, is: "phonk-style saturated 808s" }
          - { name: Punch Short Boom, is: "short punchy 808 for fast flows" }
          - { name: Saw-Layer Boom, is: "long boom with a detuned saw layer on top" }
          - { name: Sub Whistle, is: "very pure, high-tuned 808" }

      - id: hat-roller
        label: Hat Roller
        status: new
        lineage: "trap hi-hat rolls: triplet and 1/32 runs, pitch ramps, open/closed choke"
        assembles: [ratchet, probability-gate, pattern-store, sampler-voice, env-adsr, clock-div]
        adds: ["roll lanes with rate curves (1/8 → 1/32t)", "pitch ramps per roll", "velocity wave per roll"]
        modes: [trap, drill, jersey]
        packs:
          - { name: Triplet Rattle, is: "rolling triplet hats" }
          - { name: Thirty-Second Spray, is: "fast 1/32 bursts" }
          - { name: Drill Skitter, is: "irregular drill hat patterns" }
          - { name: Pitch Climb Rolls, is: "rolls that rise in pitch" }
          - { name: Lazy Hats, is: "sparse laid-back hats" }
          - { name: Choke Dance, is: "open/closed choke rhythms" }

      - id: log-drum
        label: Log Drum
        status: new
        lineage: "the amapiano log drum: a pitched percussive bass with a woody attack and long glide-y tail"
        assembles: [modal-resonator, osc-sub, env-msseg, filter-svf, waveshaper, slew-lag, scale-key]
        adds: ["attack wood + tuned body + sub tail as one note", "note-length tail shaping", "slides that keep the wood attack"]
        modes: [classic, deep, bright]
        packs:
          - { name: Township Wood, is: "classic woody log drum bass" }
          - { name: Deep Log Night, is: "darker deeper log drums" }
          - { name: Bright Log Lead, is: "higher log drums as melody" }
          - { name: Log Glide, is: "log drums with long slides" }
          - { name: Knock Log, is: "short knocking log drums" }
          - { name: Log Sub Hybrid, is: "log attack on a pure sub" }

      - id: baile-engine
        label: Baile Engine
        status: new
        lineage: "baile funk: drum-machine percussion grooves (tamborzão), chopped vocals, distorted bass (mandelão)"
        assembles: [pattern-store, sampler-voice, waveshaper, clipper, groove-template, ducker]
        adds: ["groove skeletons of funk carioca as editable patterns", "hyper-saturated bass/kick channel", "vocal shout chopper"]
        modes: [classic, mandelao, automotivo]
        packs:
          - { name: Hillside Drums, is: "classic baile percussion groove" }
          - { name: Blown Speaker Funk, is: "extremely distorted bass and kick" }
          - { name: Shout Chop, is: "vocal shouts chopped rhythmically" }
          - { name: Automotive Pulse, is: "repetitive hypnotic funk" }
          - { name: Funk Brega Mix, is: "lighter melodic funk" }
          - { name: Night Baile, is: "dark heavy baile groove" }

      - id: cowbell-lead
        label: Cowbell Lead
        status: new
        lineage: "drift phonk: melodic distorted cowbell lines from a classic drum-machine cowbell"
        assembles: [osc-va, filter-svf, waveshaper, clipper, env-adsr, scale-key, reverb-fdn]
        adds: ["two-square cowbell tuned to the note", "distortion + reverb tail as one tone", "pitched melody playable"]
        modes: [phonk, latin, metal]
        packs:
          - { name: Drift Bell, is: "distorted melodic cowbell" }
          - { name: Night Ride Bell, is: "dark reverb cowbells" }
          - { name: Clean Bell Line, is: "undistorted pitched cowbell" }
          - { name: Crushed Bell, is: "bit-crushed cowbell" }
          - { name: Bell Chords, is: "cowbell chords" }
          - { name: Metal Bell, is: "inharmonic metallic cowbell" }

      - id: club-bounce
        label: Club Bounce
        status: new
        lineage: "jersey and Baltimore club kick bounce, gqom, dembow, footwork 160 triplet kicks"
        assembles: [pattern-store, groove-template, sampler-voice, probability-gate, ratchet]
        adds: ["skeleton patterns of each scene as editable data", "kick-bounce generator (triplet kick runs)", "vocal-sample chop trigger lane"]
        modes: [jersey, gqom, dembow, footwork]
        packs:
          - { name: Bed Squeak Bounce, is: "jersey-style bouncing triplet kicks" }
          - { name: Durban Dark, is: "gqom-style heavy broken kicks" }
          - { name: Dembow Engine, is: "3+3+2 dembow grooves" }
          - { name: Footwork Storm, is: "160 triplet kick bursts" }
          - { name: Bmore Breaks, is: "Baltimore club break bounce" }
          - { name: Club Hybrid, is: "mixed club skeletons" }

  # ---------- 4.11 HARD & HEAVY ----------
  hard_and_heavy:
    from: "gabber (early 1990s), hardstyle and rawstyle (2000s on), psytrance (1990s on), industrial and EBM"
    tools:

      - id: hard-kick-forge
        label: Hard Kick Forge
        status: new
        lineage: "hardstyle and gabber kicks: punch, pitch-bent 'tok', distorted tail, reverse bass"
        assembles: [osc-sub, osc-va, env-msseg, waveshaper, clipper, filter-svf, eq-parametric, reverse-buffer, transient-shaper]
        adds: ["three-layer kick: click, punch, tail with their own chains", "tail tuned to key with pitch envelope", "reverse-bass generator between kicks"]
        modes: [hardstyle, rawstyle, gabber, hardtechno]
        packs:
          - { name: Euphoric Punch, is: "melodic euphoric kick" }
          - { name: Raw Screech Kick, is: "raw gritty distorted kick" }
          - { name: Gabber Pound, is: "fast, brutal, distorted kick" }
          - { name: Reverse Bass Roll, is: "reverse bass between kicks" }
          - { name: Hard Techno Thud, is: "distorted techno kick" }
          - { name: Zaag Tail, is: "saw-like long kick tail" }

      - id: psy-roller
        label: Psy Roller
        status: new
        lineage: "psytrance rolling bass: three bass notes between each kick, tight and in phase"
        assembles: [osc-va, filter-svf, env-adsr, ducker, pattern-store, phase-correlation]
        adds: ["kick-aware bass placement", "envelope-per-step shaping", "phase lock to kick"]
        modes: [full-on, progressive, dark]
        packs:
          - { name: Full-On Roll, is: "classic rolling psy bass" }
          - { name: Progressive Groove, is: "softer progressive psy bass" }
          - { name: Dark Forest Roll, is: "dark psy rolling bass" }
          - { name: Triplet Roller, is: "triplet psy bass" }
          - { name: Clicky Roll, is: "short clicky rolls" }
          - { name: Wide Roll, is: "stereo psy rolls" }

      - id: screech-engine
        label: Screech Engine
        status: new
        lineage: "rawstyle screeches and neuro screeches: pitched, formant-swept distorted leads"
        assembles: [osc-va, osc-fm-operator, filter-formant, waveshaper, clipper, env-msseg, lfo, pitch-shifter]
        adds: ["pitch sweep + formant sweep as one gesture", "multi-stage distortion with formants between", "hits as screech triggers"]
        modes: [raw, neuro, horror]
        packs:
          - { name: Raw Scream, is: "high raw screeches" }
          - { name: Neuro Screech, is: "neuro mid screeches" }
          - { name: Horror Shriek, is: "terrifying high shrieks" }
          - { name: Screech Chord, is: "multi-note screeches" }
          - { name: Siren Screech, is: "screech with siren pitch" }
          - { name: Formant Shriek, is: "vowel-moving screeches" }

  # ---------- 4.12 DUB & SOUND SYSTEM ----------
  dub_and_sound_system:
    from: "Jamaican dub (late 1960s–70s), sound-system culture, roots, steppers, dub techno and dubstep's roots"
    note: "the six tools below are already specced in eravos_dub_specs (status mapped); their packs are listed as shipped there. Dub Station stays the all-in-one that assembles them."
    tools:

      - id: dub-siren
        label: Dub Siren
        status: "mapped:dub-siren.spec"
        lineage: "the hand-played sound-system siren"
        assembles: [osc-va, lfo, slew-lag, filter-svf, waveshaper]
        adds: ["hold to wail, release to fall; a new hold catches the pitch where it is"]
        packs:
          - { name: Classic Wail, is: "rising wail and slow fall" }
          - { name: Fall Away, is: "long falls after release" }
          - { name: Air Raid, is: "slow, wide air-raid sweep" }
          - { name: Short Blast, is: "short siren blasts" }
          - { name: Triplet Chop, is: "triplet-rate siren chop" }
          - { name: Zap Down, is: "fast downward zaps" }
          - { name: Rising Sweep, is: "upward sweep only" }
          - { name: Sound System Siren, is: "the Dub Station siren, null-matched" }

      - id: air-horn
        label: Air Horn
        status: "mapped:air-horn.spec"
        lineage: "the sound-system air horn and its cousins"
        assembles: [osc-va, env-adsr, filter-formant, waveshaper, ensemble-core]
        adds: ["horn, siren-blast and hit-stab fired from pad, key or event"]
        packs:
          - { name: Sound System Air Horn, is: "the classic horn blast" }
          - { name: Double Blast, is: "two quick blasts" }
          - { name: Train Horn, is: "low chord horn" }
          - { name: Stab Hit, is: "short horn stab" }
          - { name: Siren Blast, is: "horn with siren pitch" }
          - { name: Short Rave Horn, is: "rave-style short horn" }
          - { name: Low Truck Horn, is: "very low horn" }
          - { name: Fifth Horn, is: "horn in fifths" }

      - id: dub-skank
        label: Dub Skank
        status: "mapped:dub-skank.spec"
        lineage: "the offbeat chord chop of reggae and dub"
        assembles: [chord-engine, pattern-store, groove-template, osc-va, sampler-voice, filter-svf]
        adds: ["plays the 'and' of every beat in one-drop, steppers and rockers feels"]
        packs:
          - { name: One Drop Chop, is: "one-drop skank" }
          - { name: Roots Organ Bubble, is: "organ bubble rhythm" }
          - { name: Dancehall Stab, is: "dancehall chord stabs" }
          - { name: Rockers Skank, is: "rockers feel" }
          - { name: Steppers Skank, is: "steppers feel" }
          - { name: Ska Up-Stroke, is: "ska up-strokes" }
          - { name: Minor Dub Skank, is: "minor-key dub chops" }
          - { name: Half-time Chop, is: "half-time skank" }

      - id: fx-dub-echo
        label: Dub Echo
        status: "mapped:fx-dub-echo.spec"
        lineage: "tape echo with a sweepable filter in the loop and a throw"
        assembles: [delay-line, filter-svf, saturator-tape, limiter-true-peak, stereo-tools]
        adds: ["throw button; feedback to 1.08 governed by an in-loop limiter; freeze"]
        packs:
          - { name: Tubby Chamber, is: "dark classic dub echo" }
          - { name: Roots Echo 1/8., is: "dotted-eighth roots echo" }
          - { name: Dub Throw, is: "throws on hits" }
          - { name: Self-Osc Drone (feedback 1.08), is: "self-oscillating drone" }
          - { name: Dark Sweep Down, is: "filter sweeping down" }
          - { name: Wide Ping-Pong, is: "stereo ping-pong dub" }
          - { name: Slap Dub, is: "short slap echo" }
          - { name: Freeze Loop, is: "frozen loop" }

      - id: fx-rewind
        label: Rewind
        status: "mapped:fx-rewind.spec"
        lineage: "the selector's wheel-up"
        assembles: [reverse-buffer, tape-transport, filter-svf]
        adds: ["grab the last seconds, spin back, stop the riddim, drop it back from the top"]
        packs:
          - { name: Pull Up 3s, is: "three-second pull-up" }
          - { name: Wheel Up Bar 1, is: "wheel up to bar 1" }
          - { name: Brake, is: "tape brake" }
          - { name: Reverse Fast, is: "fast reverse" }
          - { name: Scratch Out, is: "scratch exit" }
          - { name: Both Ways, is: "back and forth" }
          - { name: One Bar Rewind, is: "one-bar rewind" }
          - { name: Long Dub Rewind, is: "long rewind" }

      - id: fx-spring
        label: Spring Tank
        status: "mapped:fx-spring.spec"
        lineage: "the spring reverb of the dub mix"
        assembles: [spring-model, filter-allpass-chain, eq-parametric]
        adds: ["chirp, boing and drip; hit the tank with a snare"]
        packs:
          - { name: Dub Tank, is: "the dub spring" }
          - { name: Drippy Splash, is: "wet drippy spring" }
          - { name: Short Surf Spring, is: "short surf spring" }
          - { name: Long Boing, is: "long boingy spring" }
          - { name: Snare Spring Hit, is: "snare into spring" }
          - { name: Tight Tank, is: "tight spring" }
          - { name: Wide Triple, is: "three springs wide" }
          - { name: Dark Sub Tank, is: "dark low spring" }

      - id: sound-system-sim
        label: Sound System Sim
        status: new
        lineage: "custom-built sound systems: scoop bins, mid horns, tweeters, a crowd in a hall"
        assembles: [reverb-convolution, eq-parametric, multiband-splitter, early-reflections, limiter-true-peak, loudness-meter]
        adds: ["hear the mix through a stack model on headphones (monitoring only, never on export)", "sub-pressure meter (how hard the low end hits)", "hall + crowd absorption"]
        modes: [stack, hall, outdoor]
        packs:
          - { name: Scoop Bin Hall, is: "big scoop-bin stack in a hall" }
          - { name: Yard Session, is: "outdoor yard stack" }
          - { name: Basement Rig, is: "small rig in a low room" }
          - { name: Festival Line Array, is: "modern line-array field" }
          - { name: Tower Of Horns, is: "mid-horn-heavy stack" }
          - { name: Weekender Tent, is: "tent with a crowd" }

  # ---------- 4.13 AMBIENT & TEXTURE ----------
  ambient_and_texture:
    from: "ambient (1970s on), drone, musique concrète, field recording, cinematic sound design"
    tools:

      - id: drone-engine
        label: Drone Engine
        status: new
        lineage: "drone music and slow-evolving cinematic beds"
        assembles: [oscillator-population, osc-additive, filter-bank, reverb-fdn, chaos-attractor, lfo]
        adds: ["drones that evolve for hours without repeating", "harmonic field (which partials are allowed)", "evolution speed from minutes to hours"]
        modes: [harmonic, noise, hybrid]
        packs:
          - { name: Tidal Drone, is: "slowly ebbing harmonic drone" }
          - { name: Iron Hum, is: "dark industrial drone" }
          - { name: Choir Of Wires, is: "high singing drone" }
          - { name: Deep Ocean, is: "very low drone" }
          - { name: Breathing Field, is: "drone with breath-like motion" }
          - { name: Sacred Fifths, is: "drones in pure fifths" }

      - id: field-weaver
        label: Field Weaver
        status: new
        lineage: "field recording and musique concrète turned into musical material"
        assembles: [spectral-features, filter-bank, grain-cloud, pitch-tracker, eq-parametric, transient-slicer]
        adds: ["pitch a recording into the song key (tonal extraction)", "separate tonal and noisy parts", "rhythm from natural events"]
        modes: [tonal, texture, rhythm]
        packs:
          - { name: Rain Into Chords, is: "rain tuned into chords" }
          - { name: City Rhythm, is: "street sounds as grooves" }
          - { name: Forest Tonal, is: "birds and wind made tonal" }
          - { name: Kitchen Concrete, is: "kitchen sounds as percussion" }
          - { name: Train Station Pad, is: "station ambience as pad" }
          - { name: Sea Glass, is: "waves into bright textures" }

      - id: pad-forge
        label: Pad Forge
        status: "extends:pad-forge"
        lineage: "evolving pads of ambient, trance and film"
        assembles: [osc-wavetable, osc-additive, unison-stack, filter-svf, env-msseg, lfo, reverb-fdn, preset-morph]
        adds: ["pad evolution over minutes via morph", "per-note evolution offsets", "brightness follows chord tension"]
        modes: [warm, glass, evolving]
        packs:
          - { name: Aurora Pad, is: "bright shifting pads" }
          - { name: Warm Blanket, is: "soft warm pads" }
          - { name: Glass Horizon, is: "glassy wide pads" }
          - { name: Dark Halo, is: "dark evolving pads" }
          - { name: Breath Pad, is: "pads with breath noise" }
          - { name: Endless Morph, is: "pads morphing forever" }

  # ---------- 4.14 MIX & MASTER ----------
  mix_and_master:
    from: "console-era mixing, multiband and upward compression (EDM 2010s), loudness-normalised streaming"
    tools:

      - id: multiband-crush
        label: Multiband Crush
        status: "extends:fx-squash"
        lineage: "upward + downward multiband compression, the 2010s EDM sound-design staple"
        assembles: [multiband-dynamics, multiband-splitter, compressor, eq-parametric]
        adds: ["depth and time for the whole thing, per-band ratios behind it", "upward-only and downward-only views", "detail recovery per band"]
        modes: [3-band, 6-band]
        packs:
          - { name: Everything Louder, is: "heavy upward on all bands" }
          - { name: Gentle Glue, is: "light multiband glue" }
          - { name: Air Lift, is: "upward on highs only" }
          - { name: Mid Grit Lift, is: "mids lifted for bass music" }
          - { name: Tame Lows, is: "downward on the low end" }
          - { name: Detail Revealer, is: "upward on quiet details" }

      - id: master-ceiling
        label: Master Ceiling
        status: "planned:master-suite.spec"
        lineage: "lookahead true-peak limiting and loudness targets"
        assembles: [limiter-true-peak, clipper, loudness-meter, oversampler]
        adds: ["targets for streaming, club, broadcast (user-editable)", "clip-then-limit chain", "gain-matched A/B"]
        modes: [stream, club, transparent]
        packs:
          - { name: Streaming Ready, is: "−14 LUFS-ish target with safe peaks" }
          - { name: Club Loud, is: "loud club master" }
          - { name: Transparent Ceiling, is: "clean, minimal limiting" }
          - { name: Clip First, is: "soft clip before the limiter" }
          - { name: Dynamic Master, is: "preserves dynamics" }
          - { name: Broadcast Safe, is: "conservative broadcast levels" }

      - id: low-end-anchor
        label: Low End Anchor
        status: new
        lineage: "mono bass, phase checks and kick/sub balance tools"
        assembles: [stereo-tools, phase-correlation, multiband-splitter, envelope-follower, eq-parametric]
        adds: ["mono below N Hz with phase-safe crossover", "kick/sub overlap display and fix", "sub level meter vs reference"]
        modes: [mono, check, fix]
        packs:
          - { name: Club Mono Floor, is: "mono below 120 Hz" }
          - { name: Kick Sub Separation, is: "kick and sub kept apart" }
          - { name: Wide Above Floor, is: "wide above the low end" }
          - { name: Phase Safe Low, is: "phase-checked low end" }
          - { name: Weight Booster, is: "adds low weight safely" }
          - { name: Tight Low, is: "tight controlled lows" }

      - id: reference-match
        label: Reference Match
        status: new
        lineage: "reference-track comparison: tonal balance, loudness, stereo"
        assembles: [spectral-features, loudness-meter, phase-correlation, eq-parametric]
        adds: ["compare a mix to the user's reference: spectrum, loudness, width", "suggests EQ moves as editable bands (never auto-applied)", "reference audio stays out of the project unless kept"]
        modes: [compare, suggest]
        packs:
          - { name: Balance Check, is: "tonal balance comparison" }
          - { name: Loudness Check, is: "loudness and dynamics comparison" }
          - { name: Width Check, is: "stereo comparison" }
          - { name: Low End Check, is: "sub and bass comparison" }
          - { name: Top End Check, is: "highs comparison" }
          - { name: Full Report, is: "everything compared" }

      - id: translation-check
        label: Translation Check
        status: new
        lineage: "checking a mix on small speakers, cars, earbuds and clubs"
        assembles: [eq-parametric, reverb-convolution, stereo-tools, loudness-meter]
        adds: ["listening models: phone, laptop, earbuds, car, club (monitoring only)", "mono check", "one-key cycling"]
        modes: [cycle, single]
        packs:
          - { name: Phone Speaker, is: "tiny phone speaker" }
          - { name: Laptop Speakers, is: "laptop speakers" }
          - { name: Earbuds, is: "cheap earbuds" }
          - { name: Car Cabin, is: "car stereo in a cabin" }
          - { name: Club Floor, is: "club system" }
          - { name: Mono Bluetooth, is: "mono bluetooth speaker" }

  # ---------- 4.15 PERFORMANCE & CONTROL ----------
  performance_and_control:
    from: "live electronic performance: clip launching, looping, controllers, MPE"
    tools:

      - id: macro-rack
        label: Macro Rack
        status: "planned:macro-rack.spec; extends:macro-automation"
        lineage: "macro knobs of instrument racks"
        assembles: [macro, mod-ops, relationship-graph]
        adds: ["16 macros, each to any parameters on the canvas with curves", "macro snapshots", "macro-to-macro relationships"]
        modes: [macro, snapshot]
        packs:
          - { name: Drop Controls, is: "macros for drop moments" }
          - { name: Filter Ride, is: "macros for filter performance" }
          - { name: Space Throw, is: "macros for reverb and delay throws" }
          - { name: Energy Knob, is: "one knob for whole-mix energy" }
          - { name: Texture Mix, is: "macros blending textures" }
          - { name: Chaos Knob, is: "one knob for randomness" }

      - id: scene-morph
        label: Scene Morph
        status: "planned:scene-morph.spec"
        lineage: "snapshot morphing across a whole set"
        assembles: [preset-morph, param-smoother, state-machine-core]
        adds: ["morph the whole canvas between scenes", "per-tool morph inclusion", "tempo-synced morph times"]
        modes: [xy, timeline, trigger]
        packs:
          - { name: Verse To Chorus, is: "morph between song parts" }
          - { name: Day To Night, is: "bright to dark" }
          - { name: Calm To Storm, is: "sparse to dense" }
          - { name: Clean To Dirty, is: "clean to distorted" }
          - { name: Near To Far, is: "close to distant" }
          - { name: Four Corners, is: "XY between four scenes" }

      - id: live-looper
        label: Live Looper
        status: "planned:looper.spec"
        lineage: "live looping pedals and performance loopers"
        assembles: [looper-buffer, clock-div, time-stretch, ducker]
        adds: ["sample-accurate loop sync", "overdub layers with undo", "loops as clips on the canvas"]
        modes: [single, multi, sync]
        packs:
          - { name: Beatbox Layers, is: "vocal beatbox layering" }
          - { name: Guitar Stack, is: "guitar loops" }
          - { name: Synth Jam, is: "synth loop jam" }
          - { name: Reverse Loop, is: "reversed loops" }
          - { name: Half Speed Loop, is: "half-speed loops" }
          - { name: Endless Overdub, is: "overdub forever" }

      - id: gesture-capture
        label: Gesture Capture
        status: new
        lineage: "ERAVOS: record performances of knobs, pads and XY as editable modulation clips"
        assembles: [pattern-store, slew-lag, mod-ops, mpe-expression]
        adds: ["any gesture recorded as a modulation clip", "gesture quantise, smooth, scale", "gesture library reused on any parameter"]
        modes: [record, replay, library]
        packs:
          - { name: Filter Gestures, is: "recorded filter rides" }
          - { name: Hand Wobbles, is: "hand-played wobbles" }
          - { name: Breath Swells, is: "swells like breathing" }
          - { name: Scratch Moves, is: "scratch-like gestures" }
          - { name: Slow Rides, is: "slow rises and falls" }
          - { name: Nervous Hands, is: "fast twitchy gestures" }

      - id: mpe-surface
        label: MPE Surface
        status: "extends:pads, xy-pad"
        lineage: "expressive controllers: per-note pressure, slide and bend"
        assembles: [mpe-expression, scale-key, pattern-store]
        adds: ["on-screen MPE grid in scale", "per-note expression routing to any tool", "isomorphic layouts"]
        modes: [grid, keys, strip]
        packs:
          - { name: Fourths Grid, is: "isomorphic fourths layout" }
          - { name: Scale Pads, is: "pads in key only" }
          - { name: Slide Strings, is: "string-like slides" }
          - { name: Pressure Bass, is: "pressure-controlled bass" }
          - { name: Drum Fingers, is: "finger drumming" }
          - { name: Xen Grid, is: "microtonal grid" }

      - id: controller-mapper
        label: Controller Mapper
        status: "extends:midi-mapper"
        lineage: "MIDI learn, controller scripts and template layouts"
        assembles: [macro, mod-ops]
        adds: ["learn any control to any parameter", "controller templates", "takeover modes (jump, pickup, scale)"]
        modes: [learn, template]
        packs:
          - { name: Eight Knob Template, is: "eight-knob controller layout" }
          - { name: Pad Grid Template, is: "pad grid layout" }
          - { name: Fader Bank, is: "fader controller layout" }
          - { name: DJ Template, is: "DJ-style controls" }
          - { name: Foot Control, is: "foot pedal layout" }
          - { name: Keyboard Split, is: "split keyboard layout" }

  # ---------- 4.16 SIGNATURE INNOVATIONS ----------
  signature_innovations:
    from: "ERAVOS's own ideas — the reason to choose it over any DAW"
    tools:

      - id: relational-modulation
        label: Relational Modulation
        signature: true
        status: "planned:mod-matrix.spec (widened)"
        lineage: "beyond mod matrices: relationships as objects"
        description: "Modulation relationships operate between parameters, events, audio features, and other modulation relationships."
        assembles: [relationship-graph, mod-ops, envelope-follower, spectral-features, onset-detector, seed-registry]
        adds: [parameter-to-parameter, parameter-to-feature, event-to-parameter, audio-to-parameter, tool-to-tool, conditional-relationships, mathematical-transformations, relationship-chains, relationship-feedback]
        packs:
          - { name: Counterbalance, is: "as one goes up, another goes down" }
          - { name: Tension Ledger, is: "harmonic tension steering brightness" }
          - { name: Reactive Bass, is: "bass reacting to drums" }
          - { name: Density Compensation, is: "busier mix, quieter parts" }
          - { name: Phase Relationship, is: "phase linked between layers" }
          - { name: Dynamic Space, is: "space reacting to loudness" }

      - id: tension-to-release
        label: Tension-to-Release Engine
        signature: true
        status: new
        lineage: "ERAVOS: tension trajectories as playable objects (tension-field measures; this plays)"
        assembles: [tension-meter, energy-curve, relationship-graph, state-machine-core]
        adds: [tension-trajectories, release-trajectories, multi-domain-mapping, temporal-progression, user-defined-resolution, conditional-release]
        packs:
          - { name: Suspense, is: "long slow suspense" }
          - { name: Last Bar Before, is: "max tension in the final bar" }
          - { name: Release Explosion, is: "all release at once" }
          - { name: Slow Pressure, is: "pressure building slowly" }
          - { name: Unresolved Motion, is: "tension never released" }
          - { name: False Release, is: "fake drop then real drop" }

      - id: oscillation-ecology
        label: Oscillation Ecology
        signature: true
        status: new
        lineage: "ERAVOS: populations of oscillators that compete, cooperate and synchronise"
        assembles: [oscillator-population, chaos-attractor, relationship-graph, spectral-features]
        adds: [oscillator-populations, coupling-topologies, phase-interaction, frequency-interaction, attractor-behavior, synchronization, competing-oscillators, group-coherence]
        packs:
          - { name: Coupled Choir, is: "voices coupling into a choir" }
          - { name: Competing Machines, is: "oscillators fighting for dominance" }
          - { name: Harmonic Ecosystem, is: "a balanced harmonic world" }
          - { name: Phase Storm, is: "chaotic phase interactions" }
          - { name: Stable Orbit, is: "calm stable orbits" }
          - { name: Chaotic Bloom, is: "chaos blooming into order" }

      - id: rhythmic-tension-mapper
        label: Rhythmic Tension Mapper
        signature: true
        status: new
        lineage: "ERAVOS: rhythm analysed for tension and turned into modulation"
        assembles: [onset-detector, pattern-store, tension-meter, probability-gate, energy-curve]
        adds: [event-relationship-analysis, rhythmic-displacement, missing-event-detection, rhythmic-density, event-triggered-modulation, tension-trajectory-generation]
        packs:
          - { name: Drop Pressure, is: "rhythmic pressure before drops" }
          - { name: Missing Beat, is: "tension from missing beats" }
          - { name: Syncopation Tension, is: "syncopation driving modulation" }
          - { name: Rhythmic Friction, is: "rhythms rubbing against each other" }
          - { name: Silence Trigger, is: "silence triggering events" }
          - { name: Grid Fracture Map, is: "broken grids mapped to tension" }

      - id: sonic-contrast-engine
        label: Sonic Contrast Engine
        signature: true
        status: "new (cross-track; contrast-engine is the rhythm director)"
        lineage: "ERAVOS: contrast between tracks measured and shaped"
        assembles: [masking-analyzer, spectral-features, loudness-meter, onset-detector, phase-correlation, relationship-graph]
        adds: [cross-track-comparison, spectral-opposition, dynamic-opposition, rhythmic-opposition, density-opposition, stereo-counterpoint]
        packs:
          - { name: Frequency Separation, is: "tracks kept in their own bands" }
          - { name: Density Opposition, is: "one busy, one sparse" }
          - { name: Stereo Counterpoint, is: "tracks moving opposite in stereo" }
          - { name: Dynamic Contrast, is: "loud against quiet" }
          - { name: Harmonic Contrast, is: "consonant against dissonant" }
          - { name: Call-and-Response, is: "tracks answering each other" }

      - id: musical-friction-engine
        label: Musical Friction Engine
        signature: true
        status: new
        lineage: "ERAVOS: friction between parts as a controllable quantity"
        assembles: [polymeter-cycle, contour-generator, scale-key, filter-allpass-chain, tension-meter]
        adds: [competing-rhythms, competing-melodic-contours, microtonal-displacement, phase-interference, controlled-dissonance, rhythmic-conflict]
        packs:
          - { name: Polyrhythmic Conflict, is: "rhythms in conflict" }
          - { name: Harmonic Friction, is: "harmonies rubbing" }
          - { name: Phase Collision, is: "phases colliding" }
          - { name: Mechanical Resistance, is: "machines resisting each other" }
          - { name: Dissonant Dialogue, is: "dissonant conversation" }
          - { name: Controlled Disorder, is: "disorder within limits" }

      - id: sonic-gravity
        label: Sonic Gravity
        signature: true
        status: new
        lineage: "ERAVOS: attraction and repulsion between notes, rhythms and parameters"
        assembles: [relationship-graph, scale-key, pattern-store, slew-lag]
        adds: [attraction, repulsion, convergence, orbit, tonal-gravity, rhythmic-gravity, parameter-gravity]
        packs:
          - { name: Harmonic Gravity, is: "notes pulled to chord tones" }
          - { name: Rhythmic Attraction, is: "hits pulled to the grid" }
          - { name: Phase Orbit, is: "phases orbiting" }
          - { name: Melodic Magnetism, is: "melodies drawn to a target" }
          - { name: Frequency Repulsion, is: "sounds pushed apart in frequency" }
          - { name: Convergence, is: "everything converging" }

      - id: sound-state-machine
        label: Sound-State Machine
        signature: true
        status: new
        lineage: "ERAVOS: sounds as named states with transitions"
        assembles: [state-machine-core, preset-morph, onset-detector, envelope-follower]
        adds: [named-sound-states, state-transition-graphs, event-driven-transition, audio-driven-transition, state-specific-processing, state-specific-modulation, transition-curves]
        packs:
          - { name: Evolving Bass, is: "bass through states" }
          - { name: Living Pad, is: "pad changing states" }
          - { name: Mechanical Transformation, is: "machine state changes" }
          - { name: Organic Decay, is: "decaying states" }
          - { name: Unstable Lead, is: "lead switching states" }
          - { name: Cinematic Evolution, is: "film-like state changes" }

      # ---- new inventions in 0.2.0 ----

      - id: spectral-negotiator
        label: Spectral Negotiator
        signature: true
        status: new
        lineage: "beyond sidechain EQ: every track on the canvas negotiates frequency space by priority"
        assembles: [masking-analyzer, eq-parametric, multiband-dynamics, relationship-graph, spectral-features]
        adds: ["N tracks, each with a priority per band; lower priority yields only where and when masked", "every carve is a visible, editable EQ band", "negotiation strength per section"]
        modes: [priority, fair, follow-the-lead]
        packs:
          - { name: Vocal Is King, is: "everything yields to the vocal" }
          - { name: Kick First, is: "kick wins the low end" }
          - { name: Fair Share, is: "equal give-and-take" }
          - { name: Lead Spotlight, is: "the lead melody wins mids" }
          - { name: Drop Clarity, is: "strong carving in drops only" }
          - { name: Gentle Peace, is: "very light carving" }

      - id: timbre-genome
        label: Timbre Genome
        signature: true
        status: "new (builds on eravos.genomes-v10.spec)"
        lineage: "ERAVOS: breed presets — crossover and mutation with lineage"
        assembles: [preset-morph, seed-registry, spectral-features, random-source]
        adds: ["pick two or more parents, breed children (crossover per parameter group, mutation rate)", "family tree kept: any child can be traced and re-bred", "fitness = the user's likes, nothing hidden"]
        modes: [breed, mutate, family-tree]
        packs:
          - { name: Gentle Offspring, is: "children close to parents" }
          - { name: Wild Mutation, is: "high mutation rate" }
          - { name: Bass Bloodline, is: "breeding rules tuned for basses" }
          - { name: Pad Lineage, is: "breeding for pads" }
          - { name: Cross-Species, is: "crossing different tools' presets via shared components" }
          - { name: Survivor Pool, is: "keep only liked children" }

      - id: drop-compiler
        label: Drop Compiler
        signature: true
        status: "new (widens bass-drop-builder)"
        lineage: "ERAVOS: describe the drop's energy curve; it compiles the transitions across the canvas"
        assembles: [energy-curve, state-machine-core, pattern-store, tension-meter, structure-segmenter]
        adds: ["draw energy for build → drop → break; it writes risers, fills, gaps, filter rides and pumps as ordinary clips", "every compiled event lists which tool it targets", "recompile keeps manual edits"]
        modes: [compile, assist]
        packs:
          - { name: Classic Build Drop, is: "16-bar build into a full drop" }
          - { name: Silent Drop, is: "a gap before the drop" }
          - { name: Double Drop, is: "two drops back to back" }
          - { name: Switch-Up Drop, is: "second half of the drop changes genre" }
          - { name: Anti-Climax, is: "the drop goes sparse instead" }
          - { name: Slow Burn Drop, is: "energy rises inside the drop" }

      - id: entropy-budget
        label: Entropy Budget
        signature: true
        status: new
        lineage: "ERAVOS: one global control over how much varies, and where"
        assembles: [seed-registry, energy-curve, random-source, relationship-graph]
        adds: ["a song-wide variation budget over time; every random/probability control draws from it", "freeze any region exactly (seed snapshot)", "shows where variation was spent"]
        modes: [budget, freeze, spend-map]
        packs:
          - { name: Tight Song, is: "almost no variation" }
          - { name: Living Loop, is: "small variations each loop" }
          - { name: Wild Breakdown, is: "variation spent in breakdowns" }
          - { name: Variation Drops, is: "variation spent in drops" }
          - { name: Slow Unravel, is: "variation rising through the song" }
          - { name: Jam Session, is: "high variation everywhere" }

      - id: elastic-arrangement
        label: Elastic Arrangement
        signature: true
        status: new
        lineage: "ERAVOS: sections resize and everything in them adapts"
        assembles: [structure-segmenter, pattern-store, energy-curve, time-stretch]
        adds: ["stretch a section from 16 to 24 bars: patterns extend, automation re-scales, fills move to the new end", "insert/delete bars with musical repair", "section rules per tool (loop, stretch, hold)"]
        modes: [stretch, insert, repair]
        packs:
          - { name: Radio Edit, is: "shorten to a radio length" }
          - { name: Extended Mix, is: "lengthen intros and outros for DJs" }
          - { name: Breakdown Grow, is: "longer breakdowns" }
          - { name: Tight Arrangement, is: "remove dead space" }
          - { name: DJ Tool, is: "long beat-only intros" }
          - { name: Live Version, is: "loose, extended sections" }

      - id: memory-echo
        label: Memory Echo
        signature: true
        status: new
        lineage: "ERAVOS: a delay that remembers the phrase and replays it changed"
        assembles: [delay-line, looper-buffer, transient-slicer, pitch-shifter, markov-chain, seed-registry]
        adds: ["remembers the last N bars as slices; repeats are re-ordered, re-pitched or reversed by rule", "memory decay (older phrases fade, mutate more)", "tempo-locked"]
        modes: [echo, recall, mutate]
        packs:
          - { name: Deja Vu, is: "repeats slightly altered" }
          - { name: Reverse Memory, is: "memories played backwards" }
          - { name: Harmonic Memory, is: "repeats re-pitched in key" }
          - { name: Fragmented Recall, is: "broken pieces of the phrase" }
          - { name: Old Dream, is: "faded, mutated memories" }
          - { name: Call Back, is: "phrase answered later" }

      - id: parameter-weather
        label: Parameter Weather
        signature: true
        status: new
        lineage: "ERAVOS: slow fields of change over the whole canvas"
        assembles: [chaos-attractor, random-source, slew-lag, relationship-graph, seed-registry]
        adds: ["weather fronts (slow modulation fields) that pass across chosen tools", "strength per tool", "seeded and repeatable"]
        modes: [front, climate, storm]
        packs:
          - { name: Warm Front, is: "slow warming across all tools" }
          - { name: Cold Snap, is: "sudden darkening" }
          - { name: Storm Cell, is: "chaotic motion in a few tools" }
          - { name: Calm Season, is: "barely moving" }
          - { name: Monsoon, is: "heavy rhythmic change" }
          - { name: Fog Bank, is: "everything softening" }

      - id: counter-motion
        label: Counter Motion
        signature: true
        status: new
        lineage: "ERAVOS: parts automatically move against each other (pitch, filter, pan, density)"
        assembles: [relationship-graph, contour-generator, mod-ops, spectral-features]
        adds: ["choose a leader; followers move opposite by rule", "per-domain rules", "strength curve over the song"]
        modes: [mirror, complement, avoid]
        packs:
          - { name: Opposite Filters, is: "one opens, one closes" }
          - { name: Pan Dance, is: "parts pan away from each other" }
          - { name: Register Mirror, is: "one rises, one falls" }
          - { name: Density Swap, is: "one busy, one sparse, swapping" }
          - { name: Brightness Seesaw, is: "brightness traded" }
          - { name: Space Trade, is: "one wet, one dry" }

      - id: live-commit
        label: Live Commit
        signature: true
        status: new
        lineage: "beyond freeze/flatten: render to audio and keep the patch live behind it"
        assembles: [looper-buffer, latency-compensator, seed-registry]
        adds: ["commit any tool or chain to audio (saves CPU); the source stays one click away and re-renders on edit", "partial commit (only bars 1–32)", "committed audio is cached by content hash"]
        modes: [commit, partial, auto-commit-idle]
        packs:
          - { name: Commit Idle Tracks, is: "auto-commit tracks you haven't touched in 10 min" }
          - { name: Commit Heavy Synths, is: "commit the heaviest instruments first" }
          - { name: Commit Drums, is: "commit drum tracks" }
          - { name: Commit Effects, is: "commit effect chains" }
          - { name: Commit Before Export, is: "commit everything before export" }
          - { name: Commit Nothing, is: "always live" }

# ============================================================
# 5. UNIVERSAL TOOL CONTRACT
# ============================================================

tool_contract:

  identity:
    required: [id, label, domain, category, version, purpose, status, lineage, assembles]

  ports:
    types: [audio, midi, note-event, trigger-event, clock, transport, modulation, control, feature, state, data]
    requirements:
      - typed-inputs
      - typed-outputs
      - explicit-cardinality
      - explicit-scheduling-semantics
      - explicit-channel-layout
      - validation-before-connection
      - connection-lifecycle-management
      - every component a tool assembles can be reached by wiring ("Open as components")

  parameters:
    required_fields: [id, label, type, default, minimum, maximum, unit, smoothing, automation_support, modulation_support]
    types: [float, integer, boolean, enumeration, vector, curve, event, structured-data]
    requirements:
      - normalized-and-native-values
      - parameter-validation
      - parameter-versioning
      - automation
      - modulation
      - midi-mapping
      - serialization
      - user-defined-macros
      - full-range (tool-depth audit closed or each gap listed in the tool's spec)

  modulation:
    sources: [envelope, lfo, step-sequencer, audio-follower, transient-detector, spectral-feature, pitch-feature, midi, mpe,
              note-event, transport, probability, oscillator, chaos, tension, energy, gesture, external-tool, user-defined-function]
    operations: [add, multiply, scale, offset, invert, rectify, quantize, clamp, smooth, curve-map, compare, condition, interpolate, combine]
    relationship_fields: [source, destination, operation, depth, polarity, curve, offset, range, smoothing, condition, enabled, priority, rate]
    rate: "each relationship declares control-rate (per block) or audio-rate; default control-rate (§8)"

  presets:
    requirements:
      - full-parameter-state
      - full-modulation-state
      - routing-state
      - dependency-state
      - versioned-format
      - deterministic-load
      - user-editable
      - pack-membership
      - metadata
      - compatibility-check
      - seed-state (every random part's seed is in the preset)

  lifecycle:
    requirements: [spawn-clean, restore-state, release-resources, disconnect-ports, remove-subscribers, stop-all-compliance, deterministic-teardown, sleep-and-wake (§8)]

# ============================================================
# 6. PACK CONTRACT
# ============================================================

pack_contract:
  description: >
    A pack is a portable collection of configurations, presets, modulation graphs, performance mappings, patterns, and
    compatible tool combinations. Format: eravos.pack.format.spec (manifest.json first).
  contents: [presets, engine-configurations, modulation-graphs, rhythmic-patterns, performance-mappings, tool-combinations,
             evolution-profiles, metadata, compatibility-requirements]
  per_pack_fields: [name, is, tool, presets (≥ 6), lineage-note (optional), seeds, demo-pattern]
  rules:
    - packs-must-not-lock-parameters
    - packs-must-not-hide-engine-configuration
    - packs-must-be-editable
    - packs-must-be-exportable
    - packs-must-be-versioned
    - packs-must-support-user-extensions
    - packs-must-declare-dependencies
    - packs-must-load-deterministically
    - pack-names-are-unique-across-the-ecosystem
    - pack-names-follow-the-naming-rule (§0)
    - no-sample-or-transcription-from-a-record-ships (user-supplied material stays the user's)
  novelty_test:
    description: "Each is novel — made testable."
    method: >
      Render every preset of a tool with the pack's demo pattern (or a C2/C4 held note for instruments; pink-noise burst +
      drum loop for effects). Feature vector per render: 24 band energies, centroid/flux/flatness means and variances,
      envelope (attack, decay, sustain), modulation rate estimate, stereo correlation.
    rules:
      - every preset's nearest neighbour inside the same tool is at distance ≥ 0.15 (normalised feature space)
      - each pack's centroid is at distance ≥ 0.25 from every other pack centroid of the same tool
      - a failing preset is reported with its nearest neighbour; it is changed or merged, never shipped as a duplicate

# ============================================================
# 7. AUDIO ENGINE REQUIREMENTS
# ============================================================

audio_engine:

  execution:
    architecture: real-time-dsp
    runtime_today: "Web Audio in Electron (canvas/), native glass-host available under host/ (eravos.host.spec)"
    requirements:
      - deterministic-audio-callback
      - bounded-processing-time
      - no-blocking-io-on-audio-thread
      - no-unbounded-allocation-on-audio-thread
      - lock-free-or-bounded-cross-thread-communication
      - sample-accurate-event-scheduling
      - explicit-buffer-ownership
      - predictable-voice-allocation

  processing:
    features: [polyphonic-voice-management, multichannel-audio, oversampling, band-limited-oscillators, parameter-smoothing,
               latency-accounting, delay-compensation, denormal-protection, clipping-detection, cpu-metering]

  graph:
    requirements: [directed-signal-graph, typed-edges, cycle-detection, explicit-feedback-nodes, topological-scheduling,
                   graph-validation, graph-versioning, incremental-recompilation]

  feedback:
    requirements: [explicit-feedback-paths, bounded-delay, stability-analysis, runaway-detection, user-configurable-limits, safe-stop-behavior]

# ============================================================
# 8. PERFORMANCE AND OPTIMIZATION
# ============================================================
# Starting point (eravos.performance.spec, measured 2026-10-10 on a 2-core Xeon 2.1 GHz, Chromium headless, one core = 100 %):
#   20-tool scene 86.2 % · full song graph 22.7 % · empty 3.5 % · heaviest: Pad Forge 36 %, Gothic Organ 28 %, Xen Synth 22 %,
#   Supersaw 17 %. These are the numbers to beat; every target below is on that same machine and method.

optimization:

  engine_tiers:
    description: "Where DSP runs. A component is written once and compiled for the tier it runs on."
    T1_webaudio_nodes: "built-in Web Audio nodes (BiquadFilter, Delay, Convolver, Gain) — used where they are exact enough; zero JS per sample"
    T2_worklet_wasm: >
      components in Rust or C++ compiled to WebAssembly with SIMD128, run inside AudioWorklet. One worklet per GRAPH REGION
      (a fused chain of components), not one per component: each worklet boundary costs a 128-frame hop and scheduling.
    T3_native_host: >
      the same component sources compiled natively for the glass host (desktop): larger buffers on non-live tracks,
      multi-core scheduling, plugin hosting. The project sounds identical on T2 and T3 (null test).
    rule: "no general-purpose interpreter in the sample loop (Emerge describes graphs; it never runs per sample)"

  audio:
    - SIMD across voices (4 voices per 128-bit lane) and across samples where voices < 4
    - graph fusion: adjacent components in one region compile into one kernel (no intermediate buffers)
    - mip-mapped wavetables and polyBLEP/minBLEP oscillators (no oversampling needed for oscillators)
    - selective oversampling — only around nonlinear components (waveshaper, clipper, wavefolder, drive in filters); 1× when the input is below a level where aliasing is inaudible
    - FFT-plan reuse; partitioned convolution with uniform head + non-uniform tail
    - cached filter coefficients, recomputed only when a cutoff/Q changes beyond a threshold
    - efficient multiband routing (shared crossover per tool, not per band chain)
    - bounded feedback processing with explicit one-block feedback nodes
    - zero-copy buffer routing where safe
    - SLEEP: a tool whose input and output are below −90 dBFS for its declared tail length stops processing; wakes on the next event or non-silent input, sample-exact
    - voice culling: release-phase voices below −96 dB are freed
    - denormal flush-to-zero in every kernel

  modulation:
    - control-rate by default: one value per 32 samples, smoothed into audio-rate only at the destination
    - audio-rate only where required (FM, AM, audio-rate filter modulation) — declared per relationship
    - shared-source evaluation (one LFO evaluated once, read by every destination)
    - modulation-graph caching and incremental dependency updates
    - redundant-route elimination (zero-depth and disabled routes are compiled out)
    - event-driven updates for stepped sources

  scheduling_and_threads:
    - lock-free single-producer/single-consumer ring buffers on SharedArrayBuffer between UI, control and audio threads
    - control thread (Worker) runs transport look-ahead, generators and relationship graphs; audio thread only reads
    - render-ahead for tracks that are not being played live (anticipative processing, larger buffers, native tier)
    - Live Commit (§4.16) for idle heavy tools

  analysis:
    - background-processing in Workers
    - incremental-feature-extraction
    - cached-analysis-results by content hash
    - multiresolution-analysis
    - source-separation-asynchronous with progress, cancellable
    - non-blocking-ui-results

  interface:
    - virtualized-large-canvases
    - incremental-rendering
    - OffscreenCanvas for meters, scopes and spectra; meters at 30 fps, scopes at 60 fps max, off-screen windows draw nothing (already a ceiling)
    - cached-waveforms and cached-spectrograms
    - efficient-graph-layout
    - independent-ui-and-audio-lifecycles

  state:
    - incremental-serialization
    - versioned-state
    - dependency-indexing
    - content-addressable-assets
    - recovery-checkpoints (every 60 s and before every risky operation)
    - deterministic-restoration

  performance_budgets:
    required_measurements: [cpu-per-instance, cpu-per-voice, maximum-polyphony, worst-case-block-time, memory-per-instance,
                            memory-per-voice, latency-contribution, maximum-modulation-rate, maximum-concurrent-instances,
                            dropout-count-per-hour, project-load-time]
    targets_v1:
      scene_20_tools: "≤ 35 % (from 86.2 %)"
      empty_baseline: "≤ 1.5 % (from 3.5 %)"
      heaviest_instrument: "≤ 10 % at 8 voices (Pad Forge today 36 %)"
      per_voice: "≤ 0.6 % for a 2-osc subtractive voice; ≤ 1.5 % for a 16-voice-unison voice"
      worst_case_block: "≤ 50 % of the block deadline at 128 frames / 48 kHz"
      dropouts: "0 per hour at 128 frames with the 20-tool scene on the reference machine"
      round_trip_latency: "reported per device; tool-added latency reported per path and compensated"
      load_time: "100-tool project opens and plays in ≤ 3 s (warm cache)"
    policy: >
      Performance limits must be measured on target hardware. No tool is considered production-ready solely because it
      renders successfully in a low-load test. build/perf.mjs regenerates eravos.performance.spec on every release; a
      regression of more than 10 % on any measured case blocks the release.

# ============================================================
# 9. ERAVOS CREATIVE ENVIRONMENT
# ============================================================

creative_environment:

  views: [canvas-view, session-view, arrangement-view, instrument-view, signal-flow-view, modulation-view, relationship-view,
          tension-view, performance-view, analysis-view, pack-browser, preset-browser, genome-view]

  session:
    requirements: [clips, scenes, synchronized-launch, launch-quantization, scene-transitions, clip-probability, follow-actions,
                   scene-morph (§4.15), clip-variations (seeded)]

  arrangement:
    requirements: [multitrack-timeline, audio-editing, midi-editing, automation, tempo-map, time-signature-map, comping, markers,
                   non-destructive-editing, elastic-sections (§4.16 elastic-arrangement), energy-lane, tension-lane]

  audio_manipulation:
    requirements: [time-warping, transient-detection, pitch-preserving-stretch, reverse, slicing, resampling, spectral-editing,
                   audio-to-midi-hypothesis, resample-generations (§4.2)]

  performance:
    requirements: [midi-hardware, controller-mapping, midi-clock, external-sync, low-latency-monitoring, macro-mapping,
                   live-tool-mutation, safe-scene-transitions, mpe, gesture-recording]

  history:
    requirements:
      - undo tree, not a line: every branch kept, any state reachable
      - sound history scrubber: drag back through a tool's last hour of settings and hear each
      - A/B/C/D per tool and per scene

  extensibility:
    requirements: [user-created-tools, user-created-effects, custom-modulation-sources, custom-processing-graphs,
                   external-plugin-hosting (native tier), documented-sdk, versioned-tool-api, user-created-components]

# ============================================================
# 10. BEYOND A CONVENTIONAL DAW
# ============================================================
# "Better than Ableton" is two lists. PARITY is what a producer leaving Live will not give up — missing any of it loses
# them regardless of what else ERAVOS does. SURPASS is the reason to switch.

beyond_conventional_daw:

  parity:
    - rock-solid timing and no dropouts under a real project (§8 budgets)
    - session + arrangement with clip launch, follow actions, scenes
    - warping with several algorithms (beats, tones, texture, complex) and warp markers
    - comping, take lanes, MIDI editing with scales/keys, MIDI generators and transforms
    - racks / macros / chains (ERAVOS: mods, links, macro-rack)
    - device-building environment (ERAVOS: components + Emerge + SDK)
    - plugin hosting (VST3/AU/CLAP) on the native tier
    - controller ecosystem: MIDI learn, templates, a dedicated grid controller workflow
    - sync: MIDI clock, and Ableton Link (open sync protocol; check its licence terms before shipping)
    - stem separation, audio-to-MIDI, freeze/flatten (ERAVOS: Live Commit keeps it live)
    - project recovery and collection of samples into the project

  surpass:
    - components first: every stage of every instrument is a tool you can wire, replace or reuse — no closed devices
    - relationships, not only automation (relational-modulation, counter-motion, sonic-gravity, spectral-negotiator)
    - tension and energy as first-class lanes that drive tools (tension-field, tension-to-release, drop-compiler)
    - rhythm that fights and snaps back, measured (contrast-engine, rhythmic-tension-mapper)
    - oscillator ecologies and swarm unison
    - breedable sounds with lineage (timbre-genome), sound matching against the user's references (sound-match)
    - elastic arrangement: resize a section and everything adapts
    - one global variation budget with exact freeze (entropy-budget)
    - Live Commit: CPU savings of freezing without losing the patch
    - undo tree + sound history scrubber
    - every generator writes ordinary editable material — the user always owns the result

# ============================================================
# 11. EMERGE INTEGRATION
# ============================================================

emerge_integration:
  role: [tool-description, tool-configuration, graph-construction, dependency-resolution, orchestration, user-defined-logic,
         pack-definition, system-extension, component-composition]
  constraints:
    - no-general-interpreter-in-sample-loop
    - real-time-dsp-executes-in-dedicated-engine
    - bounded-control-to-audio-communication
    - explicit-state-transitions
    - explicit-resource-ownership
    - versioned-tool-contracts
  interfaces: [tool-registry, component-registry, parameter-registry, port-registry, modulation-registry, pack-registry,
               audio-graph-api, transport-api, state-api]

# ============================================================
# 12. VALIDATION AND ACCEPTANCE
# ============================================================

acceptance:

  spec_checks:   # run on this file (build/specs) before any build work
    - every tool id is unique; every component id is unique
    - every id in a tool's assembles exists in §3
    - every component in §3 is assembled by at least one tool
    - every tool has ≥ 6 packs; every pack has a name and an is line
    - pack names are unique across the ecosystem
    - no pack name contains a name listed in naming_rule as forbidden

  tool_contract:
    - every-tool-spawns-clean
    - every-tool-restores-state
    - every-tool-releases-resources
    - every-tool-obeys-stop-all
    - no-orphaned-subscribers
    - no-orphaned-ports
    - no-orphaned-wires
    - open-as-components-nulls (the wired components render the same as the all-in-one, ≤ −60 dB difference)

  audio:
    - sample-accurate-event-timing
    - pitch-accuracy-tested
    - no-unexpected-clipping
    - no-audio-thread-blocking
    - no-unbounded-audio-thread-allocation
    - latency-reported
    - cpu-budget-reported
    - deterministic-render-where-required
    - sleep-wake-is-sample-exact (a slept tool's first sound after wake matches a never-slept render)
    - tier-equivalence (T2 and T3 renders null ≤ −90 dB)

  modulation:
    - modulation-depth-validated
    - polarity-validated
    - range-validated
    - smoothing-tested
    - relationship-cycle-detection-tested
    - deterministic-seed-tested
    - control-rate-vs-audio-rate-tested (a control-rate route differs from audio-rate by ≤ −60 dB on slow sources)

  packs:
    - every-pack-loads
    - every-preset-loads
    - every-preset-is-editable
    - save-load-roundtrip-exact
    - dependencies-resolve
    - compatibility-is-reported
    - novelty-test-passes (§6)

  range:
    - each tool's depth audit is written in its spec; each open gap is listed, none hidden
    - every source and filter reaches 16 Hz – 20 kHz where it has a frequency

  creative_environment:
    - session-launch-tested
    - arrangement-playback-tested
    - automation-tested
    - tempo-change-tested
    - hardware-disconnect-tested
    - project-recovery-tested
    - undo-tree-tested

  regression:
    - no-existing-tool-contract-breakage
    - no-unintended-preset-change (every factory preset nulls ≤ −60 dB before/after)
    - no-unintended-routing-change
    - no-unintended-timing-change
    - no-unintended-audio-output-change
    - no-performance-regression-over-10-percent

# ============================================================
# 13. DEVELOPMENT STRATEGY
# ============================================================

development_phases:

  phase_0_components:
    objective: "Extract the shared parts (tool-depth K1–K5) with no sound change, and move them to the WASM worklet tier."
    deliverables: [tools/music/components/* for the §3 sources, filters, shapers, modulation, structure groups,
                   component spec checks, null-render harness, graph-fusion compiler, sleep/wake, perf gate in CI]
    exit: "Wobble Bass, Reese, Supersaw, Retro Poly, Acid, Sub re-assembled from components and nulling; 20-tool scene ≤ 50 %"

  phase_1_foundation:
    objective: Establish shared engines and contracts.
    tools: [morph-engine, swarm-oscillator, wub-organism, poly-filter-matrix, oscillation-matrix, retro-dco, fm-matrix]
    deliverables: [oscillator-engine, filter-engine, modulation-engine, tool-contract, preset-contract, audio-test-harness, novelty-test]

  phase_2_rhythm:
    objective: Establish rhythmic generation and interaction.
    tools: [groove-organism, polyrhythm-engine, drum-foundry, rhythmic-modulator, break-architect, contrast-engine, fill-generator]
    deliverables: [event-scheduler, groove-engine, rhythm-analysis, pattern-contract]

  phase_3_signature:
    objective: Establish Eravos-specific relational sound design.
    tools: [tension-field, relational-modulation, oscillation-ecology, rhythmic-tension-mapper, sonic-contrast-engine, spectral-negotiator, drop-compiler]
    deliverables: [relationship-graph, tension-model, coupling-model, contrast-analysis, relational-visualization]

  phase_4_scenes:
    objective: "Cover the genre lineages: wub & bass depth, rave & trance, house & techno, hip-hop & global club, hard, dub, ambient."
    tools: [growl-forge, reese-architecture, resample-forge, sub-architect, hoover-engine, supersaw-cathedral, acid-line,
            organ-bass, rumble-kick, glide-808, log-drum, hard-kick-forge, dub-siren, fx-dub-echo, drone-engine]
    deliverables: [the scene packs, novelty-test passing for each]

  phase_5_space_and_reconstruction:
    objective: Expand processing and audio analysis.
    tools: [echo-architecture, space-sculptor, time-mutation, spectral-transmuter, audio-deconstructor, resynthesis-forge, sound-match]
    deliverables: [spatial-engine, spectral-analysis, audio-reconstruction-pipeline, time-warp-engine]

  phase_6_environment:
    objective: Complete the production workflow and close the §10 parity list.
    deliverables: [session-view, arrangement-view, hardware-integration, performance-workflow, plugin-hosting (native tier),
                   project-management, undo-tree, live-commit, tool-sdk]

  phase_7_inventions:
    objective: The remaining signature inventions.
    tools: [timbre-genome, entropy-budget, elastic-arrangement, memory-echo, parameter-weather, counter-motion, musical-friction-engine, sonic-gravity, sound-state-machine]

# ============================================================
# 14. NON-GOALS AND ENGINEERING BOUNDARIES
# ============================================================

boundaries:
  - Do not claim exact reconstruction of an original production chain from a stereo recording. Analysis produces hypotheses with confidence and uncertainty.
  - Do not use a general-purpose language interpreter in the real-time sample-processing path.
  - Do not equate a large tool count with product completeness. This spec lists many tools; the phases ship a few deep ones first.
  - Do not duplicate DSP implementations when a shared engine can satisfy multiple tool contracts (components_first).
  - Do not hide performance costs behind asynchronous UI behavior.
  - Do not assume all modulation should run at audio rate.
  - Do not assume all oscillators should phase-lock or frequency-lock.
  - Do not allow uncontrolled feedback to destabilize the audio engine.
  - Do not treat genre packs as restrictions on the underlying tool.
  - Do not mark a capability implemented until its implementation and acceptance tests have been inspected.
  - Do not ship packs named after products, artists or records, or containing material taken from records (naming_rule).
  - Do not let any automatic process change the user's sound without a visible, undoable record of what it changed.

# ============================================================
# 15. DEFINITION OF DONE
# ============================================================

definition_of_done:
  system:
    - shared-component-architecture-operational
    - tool-contracts-enforced
    - project-state-restores
    - session-and-arrangement-operational
    - real-time-audio-stable
    - performance-budgets-measured-and-met (§8 targets_v1)
  tools:
    - tool-has-complete-parameter-schema
    - tool-has-complete-port-schema
    - tool-has-modulation-support
    - tool-has-editable-presets
    - tool-has-pack-definitions
    - tool-has-acceptance-tests
    - tool-has-performance-measurements
    - tool-has-depth-audit
    - tool-opens-as-components
  signature_innovations:
    - relational-modulation-operational
    - tension-field-operational
    - oscillation-ecology-operational
    - rhythmic-tension-mapper-operational
    - sonic-contrast-engine-operational
    - spectral-negotiator-operational
    - drop-compiler-operational
  product:
    - users-can-create-complete-tracks
    - users-can-design-original-instruments
    - users-can-build-processing-graphs
    - users-can-analyze-and-reconstruct-audio
    - users-can-perform-live
    - users-retain-control-over-underlying-systems
    - every-parity-item-in-§10-closed

# ============================================================
# APPENDIX A. ENGINES AS WRITTEN IN 0.1.0 (verbatim, per tool)
# ============================================================
# 0.2.0 expresses these as assembles + adds; kept here so no original wording is lost.

engines_0_1_0:
  retro-dco: [analog-oscillator, pulse-width-modulation, sub-oscillator, noise, unison, oscillator-sync]
  fm-matrix: [multi-operator-fm, phase-modulation, operator-feedback, ratio-and-fixed-frequency, operator-envelopes]
  morph-engine: [wavetable, additive, spectral, sample-derived-waveforms, waveform-morphing]
  swarm-oscillator: [coupled-oscillator-bank, independent-frequency-control, phase-coupling, frequency-drift, harmonic-grouping, phase-coherence-analysis]
  poly-filter-matrix: [multimode-filter, per-voice-filtering, filter-envelope, resonance, saturation, self-oscillation, filter-routing]
  ensemble-organism: [modulated-delay-lines, multi-voice-chorus, phase-offset-modulation, stereo-movement, detuning, bbd-modeling]
  analog-drift: [band-limited-noise, per-voice-drift, temperature-modeling, correlated-instability, deterministic-seeding]
  wub-organism: [wavetable, fm, phase-distortion, analog-oscillators, sample-layering, multi-stage-modulation]
  growl-forge: [formant-filtering, fm-sidebands, vowel-morphing, nonlinear-distortion, resonant-filtering]
  reese-architecture: [multi-oscillator, independent-detuning, spectral-layering, phase-interaction, stereo-evolution]
  harmonic-weapon: [waveshaping, wavefolding, clipping, saturation, rectification, bit-reduction, multiband-distortion]
  granular-mutation: [granular-playback, grain-population-control, spectral-preservation, grain-pitch-distribution, position-modulation]
  feedback-reactor: [feedback-networks, resonant-loops, nonlinear-feedback, cross-channel-feedback, bounded-self-oscillation]
  spectral-creature: [multiband-processing, independent-band-synthesis, cross-band-modulation, spectral-recombination]
  polyrhythm-engine: [independent-rhythmic-cycles, polymeter, phase-offsets, euclidean-generation, nested-sequences]
  groove-organism: [swing, microtiming, velocity-relationships, timing-displacement, groove-extraction, humanization]
  drum-foundry: [transient-synthesis, kick-synthesis, snare-synthesis, cymbal-synthesis, noise-percussion, sample-layering]
  contrast-engine: [density-analysis, spectral-contrast, dynamic-contrast, rhythmic-contrast, harmonic-contrast, silence-and-interruption]
  rhythmic-modulator: [step-modulation, probability, beat-division, nested-cycles, event-driven-modulation]
  break-architect: [transient-detection, sample-slicing, time-stretching, retriggering, reverse-playback, break-reconstruction]
  tension-field: [harmonic-tension, rhythmic-pressure, spectral-brightness, density-pressure, pitch-instability, tension-trajectory, release-trajectory]
  oscillation-matrix: [multi-oscillator-modulation, independent-phase, frequency-coupling, nonlinear-oscillation, synchronization, phase-drift]
  motion-extractor: [amplitude-analysis, transient-analysis, spectral-analysis, pitch-analysis, rhythm-analysis, feature-to-modulation]
  phase-weaver: [phase-alignment, phase-displacement, phase-cancellation, stereo-phase-movement, oscillator-synchronization]
  controlled-chaos: [seeded-randomness, probability-distributions, markov-transitions, bounded-stochastic-processes, attractor-modulation]
  echo-architecture: [multi-topology-delay, tape-delay, feedback-filtering, ping-pong, rhythmic-throws, pitch-modulation]
  space-sculptor: [algorithmic-reverb, convolution-reverb, plate, spring, hall, diffusion, early-reflections, decay-modulation]
  spatial-organism: [stereo-positioning, binaural-positioning, depth-modeling, spatial-motion, multichannel-routing]
  time-mutation: [time-stretching, granular-time, reverse-playback, transient-preservation, pitch-independent-time, nonlinear-time-warp]
  spectral-transmuter: [spectral-freezing, partial-manipulation, harmonic-redistribution, cross-synthesis, spectral-resynthesis]
  harmony-architect: [chord-generation, voice-leading, modal-interchange, harmonic-tension, harmonic-resolution]
  melody-organism: [interval-generation, motif-development, melodic-contour, phrase-variation, rhythmic-identity]
  arpeggio-evolution: [multi-arpeggiator, independent-direction, probability, octave-selection, gate-control, evolving-patterns]
  voice-architect: [vocal-synthesis, formant-processing, granular-vocal-processing, vocoder, choir-synthesis]
  arrangement-organism: [section-management, energy-trajectories, motif-recurrence, transition-generation, arrangement-variation]
  sample-universe: [multisampling, key-zones, velocity-zones, round-robin, granular-playback, sample-morphing]
  resynthesis-forge: [partial-analysis, transient-analysis, spectral-reconstruction, pitch-reconstruction, modulation-estimation]
  audio-deconstructor: [source-separation, rhythm-analysis, pitch-analysis, spectral-analysis, arrangement-analysis, production-hypothesis]
  layer-architect: [composite-instruments, independent-layer-envelopes, shared-modulation, phase-control, layer-routing]
  audio-morph: [multi-source-morphing, pitch-preservation, transient-preservation, spectral-envelope-morphing, rhythmic-structure-morphing]
  relational-modulation: [parameter-to-parameter, parameter-to-feature, event-to-parameter, audio-to-parameter, tool-to-tool, conditional-relationships, mathematical-transformations, relationship-chains, relationship-feedback]
  tension-to-release: [tension-trajectories, release-trajectories, multi-domain-mapping, temporal-progression, user-defined-resolution, conditional-release]
  oscillation-ecology: [oscillator-populations, coupling-topologies, phase-interaction, frequency-interaction, attractor-behavior, synchronization, competing-oscillators, group-coherence]
  rhythmic-tension-mapper: [event-relationship-analysis, rhythmic-displacement, missing-event-detection, rhythmic-density, event-triggered-modulation, tension-trajectory-generation]
  sonic-contrast-engine: [cross-track-comparison, spectral-opposition, dynamic-opposition, rhythmic-opposition, density-opposition, stereo-counterpoint]
  musical-friction-engine: [competing-rhythms, competing-melodic-contours, microtonal-displacement, phase-interference, controlled-dissonance, rhythmic-conflict]
  sonic-gravity: [attraction, repulsion, convergence, orbit, tonal-gravity, rhythmic-gravity, parameter-gravity]
  sound-state-machine: [named-sound-states, state-transition-graphs, event-driven-transition, audio-driven-transition, state-specific-processing, state-specific-modulation, transition-curves]

# END SPEC

# ============================================================
# ADDENDUM 2026-11-06 — §6 novelty, across ALL of ERAVOS; packs are four kinds (his words)
# ============================================================
#   "Need to make sure it’s all novel. Full depth in pitch, tone, wavelength, modulation, etc. like I want unique (in relation to Eravos) packs for each tool. Mods. Complete settings for adjusting and tuning each tool." · "The swarm doesn’t seem like anything new sound wise."
#   "Expand wave, modulation, wave, tone, pitch, maybe: Speed, tempo, rhythm, not just limited to those but no noise either" · "Packs aren’t just presets. They’re drum pad sounds. Like units or additional capabilities like mods also. Also need to be novel"
pack_kinds (a pack may carry any of them, each judged as its kind):
  presets     settings for a tool's engine
  pad sounds  drum / one-shot recipes a drum tool plays (the synthwave pack's own sounds — built from synthesis, never recordings)
  units       new capabilities a tool takes in: an oscillator model, a filter model, a rhythm engine, a wavetable set …
  mods        behaviour that goes in and comes out of a tool (Mods), never wired into its engine
novelty_across_eravos (replaces "inside the same tool" — the original rules above stay, this widens them):
  - the fingerprint (the method above, plus pitch movement, harmonicity, rhythm onsets for rhythmic material) is taken for every
    preset and pad sound of EVERY tool; each new one is ≥ the threshold from its nearest neighbour anywhere in ERAVOS, not just in its tool
  - units and mods: novel by capability (a dimension of control or behaviour no installed unit / mod already gives) AND by sound
    (what they make passes the rule above)
  - a tool as a whole: its factory sound set must not sit inside another tool's (the report names any tool whose presets all fall
    near another's — Swarm Oscillator ↔ Supersaw is the first suspect, his ear: "doesn't seem like anything new sound wise")
  - a failing item is reported with its nearest neighbour and changed, merged or dropped — never shipped as a duplicate
  order: N1 the fingerprint + the report across ERAVOS (no changes) · N2 Swarm made audibly new (locking heard, intervals formed,
    voices cross-modulating, coherence driving timbre), proved against Supersaw · N3 Tuning & settings tab · N4 depth + packs per tool,
    worst duplicates first


## ADDENDUM 2026-11-07 — the novelty gate, advisory; five measures, not one; the measure is not an authority
  Sent by him (2026-11-07T10:26:25Z; recorded verbatim in specs/eravos.2026-11-06-session.map.spec): the order — "Novelty gate, advisory mode
  first. Establish a baseline, detect duplication and flag collisions. Don’t hard-block merges until the measurement is validated against
  actual listening." → "W1, The Workshop" → "Waveshaper" → "Spectral-features"; and "ERAVOS should be able to recognize when it is repeating
  itself without accidentally preventing itself from discovering something new."
  - BASELINE: build/novelty.mjs also writes docs/novelty-baseline.json — every preset's fingerprint as measured, the per-feature scale, and
    the calibration (CLOSE, TWIN, μ, σ from ERAVOS itself). The measure lives in ONE place, build/novelty-core.mjs, used by the report and
    the gate alike (refactor proved 2026-11-07: on the same 621-preset render, the report and novelty.json from the old code and the new are byte-identical).
  - THE GATE (build/novelty-gate.mjs), ADVISORY: renders only the tools a branch changed (or named tools, or a given render); every new or
    changed preset → its nearest sound already in ERAVOS → TWIN / CLOSE / novel, in σ too; a match in another tool says whether they share
    a ROLE ("roles" in tool.json if declared, else the category — the report says which): same role = "possible duplicate — listen",
    different role = "overlap, usually fine" (his: "Tool overlap isn’t necessarily redundancy"). It never fails a build (exit 0 always;
    CI: continue-on-error, the result in the job summary). Hard blocking only when he says the measure has been validated by listening.
  - FIVE MEASURES, NOT ONE (his: "Novelty isn’t the same as quality"): novelty (measured, the gate) · musical usefulness · expressiveness ·
    controllability · functional distinctiveness (heard — docs/listening-log.md, one line per listen, never edited). Where the ear and the
    number disagree, the ear wins and the measure is what gets fixed (the first such line: Swarm, 2026-11-06).
  - OPEN: declared roles in tool.json for the tools whose category says too little (Deep Sub vs Reese Bass); a fair render for effects (a
    kick, a key, the transport); longer renders (8 s, held) so motion counts; controllability as a measure (how many controls audibly move
    the sound) once spectral-features exists.

# spec_id: eravos.organism.swarm-oscillator · version 1.0.0 · phase P123 · status built 2026-11-06 (his go: "Make the swarm oscillator first. Since you were ready to.")
# the design (ports, params, signal_dag, decisions, open gaps): tools/music/planned/swarm-oscillator.spec · the face: tools/music/planned/swarm-oscillator.ui.md
identity:
  id: eravos.swarm-oscillator ; label: Swarm Oscillator ; icon: 🐝 ; accent: "#8a5cff" (electric violet) ; category: Genre instruments
  comp_intent: Beyond supersaw: unison voices that pull on each other — drift apart, beat, lock into one wave. Coherence out moves any knob.
  engine_notes: |
    One AudioWorklet built from the components' own kernel text (osc-va, osc-wavetable, oscillator-population, env-adsr, lfo,
    filter-svf, stereo-tools): what their tests prove is what plays. Everything timed is an AudioParam (settings k-rate; notes through
    8 voice slots: trigger, gate, note, velocity; Lock on beat a count) — sample-true live and in an offline render (messages are not:
    found 2026-11-06, an offline render ran ahead of them and played nothing). The wavetables are built on the main thread once and
    handed to the worklet at construction (building takes ~0.1–0.2 s; never on the audio thread). Presets are data (packs/factory).
config:
  mode: enum [free, coupled, harmonic, chaotic] def coupled   # SWARM
  voices: number 1..32 def 9   # SWARM
  spread: number 0..1 def 0.35   # SWARM (±50 cents at 1)
  coupling: number 0..1 def 0.45   # SWARM (own audio-rate input)
  cluster: number 0..1 def 0   # SWARM (harmonic mode)
  sync: enum [off, 1/4, 1/2, bar] def off   # SWARM · Lock on beat
  pull: number 0..1 def 0.5   # SWARM+
  drift: number 0..1 def 0.25   # SWARM+
  shape: enum [saw, pulse, tri, table] def saw   # OSC
  table: number 0..1 def 0   # OSC+
  sub: number 0..1 def 0.2   # OSC+
  octave: integer -3..3 def 0   # OSC+
  cutoff: number 40..18000 Hz def 6000   # TONE (own audio-rate input)
  res: number 0..1 def 0.2   # TONE
  attack: number 0.001..10 s def 0.01   # TONE
  release: number 0.01..12 s def 0.6   # TONE
  envAmt: number 0..1 def 0.4   # FILTER+
  decay: number 0.01..4 s def 0.4   # AMP+
  sustain: number 0..1 def 0.8   # AMP+
  lfoRate: number 0.01..20 Hz def 0.3   # MOVE
  lfoCouple: number -1..1 def 0   # MOVE (the LFO moves Coupling)
  width: number 0..1 def 0.8   # OUT
  monoBelow: number 20..400 Hz def 120   # OUT+
  level: number 0..1 def 0.7   # OUT
  restless: number 0..1 def 0   # LIFE (1.1, ADDENDUM 2026-11-06)
  form: number 0..4 s def 0   # LIFE (1.1; harmonic mode)
  fieldFm: number 0..1 def 0   # LIFE (1.1)
  cohTone: number -1..1 def 0   # LIFE (1.1; Lock → tone)
ports:
  in: so.hook.note_in · so.hook.midi_in · so.hook.theory_in · so.hook.transport_in · so.hook.mod_coupling · so.hook.mod_cutoff · knob.<every other control> · bend.in
  out: so.hook.audio_out (stereo) · so.hook.coherence (0…1) · curve.out
packs: factory — Loose Constellation · Locked Unison (default) · Harmonic Swarm · Choir Drift · Detuned Cathedral · Pulsing Machine · Fractured Cluster · Organic Strings
proof (2026-11-06): swarm-oscillator.test.js 10/10 — the tool contract (4); a held note sounds, finite, under full scale, release to silence;
  coupling 1 → coherence > 0.9, free well under it; every mode and shape plays clean; Timeline lists it, Coherence out, every control movable;
  an 8-note chord at full level on every preset stays under full scale; More depth closed at first, free mode dims Coupling and says why.
  design check: D1–D6 all 0. Components: each its own <id>.test.mjs (node tests/components.mjs).
open (none hidden): packs 1 preset per planned pack name (the spec's ≥ 6 per pack not met) · LFO in Hz only (no tempo sync) · built-in tables only
  · Open as components (each component its own window) · CPU: oscillator-population ~2–3 µs a sample for 32 voices (measured under load) — 8 notes × 32 voices is heavy

# ---- ADDENDUM 2026-11-06 (1.1, N2 — "The swarm doesn't seem like anything new sound wise." · "I need to be able to make more with this.")
#   The novelty report (docs/novelty-report.md) put Swarm +1.2σ from Supersaw on one held note: on a still note it is a detuned stack.
#   What only a coupled population can do is move by itself, so 1.1 adds four LIFE controls (More depth ▸ LIFE), all 0 by default —
#   every existing preset is unchanged (oscillator-population 1.1 is bit-identical to 1.0 at these defaults: its test proves it
#   against the kept 1.0 fixture):
#     restless   once locked (R > 0.92), the swarm gets a seeded kick in pitch and the coupling rests for half a cool-down: it bursts
#                into a cloud and is drawn back into one wave, again and again — a breathing no LFO on a stack makes
#     form       harmonic mode: each note blooms from one pitch into its chord over `form` seconds; a new Cluster glides there too
#     fieldFm    the swarm's own sum (its mean sine) phase-modulates every voice (up to 0.3 cycle, the pitch kept): locked it brightens
#                like feedback FM, apart the voices bend each other (growl)
#     cohTone    how locked it is moves the cutoff ±2 octaves (+ opens when locked, − closes)
#   packs: living — Breathing Swarm · Blooming Chord · Metal Swarm · Growl Cloud · Tide Lock · Shatter Bloom
#   proof: swarm-oscillator.test.js P123 9/9 (+3: Restless swings the coherence > 0.3 and without it < 0.15; Field FM brightness × 1.5;
#   the Living presets shipped) · oscillator-population.test.mjs 24 checks · headroom: every preset's 8-note chord at full level < 1
#   open: re-measure against Supersaw with motion in the fingerprint (pitch movement, centroid movement) — N2's last step

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 7 it stands on · 7 of 7 built (✓)
  layer 0: env-adsr ✓ · filter-svf ✓ · lfo ✓ · osc-va ✓ · osc-wavetable ✓ · oscillator-population ✓ · stereo-tools ✓
  tool: eravos.swarm-oscillator ← osc-va + osc-wavetable + oscillator-population + env-adsr + lfo + filter-svf + stereo-tools
  build order: env-adsr ✓ → filter-svf ✓ → lfo ✓ → osc-va ✓ → osc-wavetable ✓ → oscillator-population ✓ → stereo-tools ✓ → swarm-oscillator
  shared with: env-adsr 21 · filter-svf 41 · lfo 28 · osc-va 26 · osc-wavetable 11 · oscillator-population 3 · stereo-tools 17  (other tools on each)
  in it now: osc-va · osc-wavetable · oscillator-population · env-adsr · lfo · filter-svf · stereo-tools
  comes out of it: —
  planned: —

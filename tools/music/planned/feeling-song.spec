# spec_id: eravos.feeling-song · version 0.1.0 · status planned (spec only — his words: "just spec this") · template eravos.tool/1
# His words (2026-11-13), verbatim:
#   "i also want a actual tool for irrational frequencies, and unconvential harmonic data, like dragging around to create a nervous system
#    response using poly vegal. like feelings or emotions as frequencies. make patterns from feelings."
#   "just spec this. i had it before and it was like wail songs, it was beautiful. i want thinking of trying to use it for embodiement"
# Read as: "wail songs" = whale songs (long gliding calls) — his to confirm. "had it before": the v10 VAGAL mode (specs/eravos.genomes-v10.spec:
#   breath + organ + granular), his 2026-10-15 ask "a tool for music from emotions (love, hate…) with irrational frequencies — the polyvagal
#   mode" (specs/eravos.phase37-map.spec), the planned Feeling Engine (tools/music/planned/feeling-engine.spec) and the built Embodiment Lab.
# Working name: Feeling Song (alternatives: Vagal — his old mode's name; Calls). His call.
identity:
  id: eravos.feeling-song ; label: Feeling Song ; domain: music ; category: embodiment ; accent: "#7fb8ff" (deep-water blue, to confirm)
  purpose: an instrument you play by dragging through feelings — the drag is the call: long gliding voices in irrational and unconventional
    harmonics, moving between the three polyvagal states; what you play becomes patterns (calls → phrases → themes, as whale song is built).
  not_a_duplicate:
    Embodiment Lab — a guided drone (breath clock, body cues, feelings as presets): you listen. Here you PLAY; the drag is the sound.
    Feeling Engine (planned) — a generator driving OTHER tools from a feeling. Here the sound is its own; its drive-other-tools output is
    folded in (ports: notes_out, control_out) so Feeling Engine becomes this tool's output side, not a second tool (feeling-engine.spec ADDENDUM).
    Xen Synth — a keyboard synth in other tunings. Here there are no keys: glides, gestures, states.
  claims: NONE. A personal listening and embodiment practice — never described as treatment, therapy or regulation of anyone's nervous system.
    The polyvagal states are his framing for the surface (Porges' theory; its physiology is contested). What the tool does is acoustic, and
    every test measures the SOUND (pitch, roughness, brightness, onsets, silence), never a body.
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  ratio-set · pitch-path · modal-resonator · osc-wavetable · filter-formant · mod-tree · random-source · lfo · slew-lag · reverb-fdn · stereo-tools · pattern-store · scale-key
adds (behaviour only this tool has):
  - the STATE FIELD: a surface where the three states sit (ventral · sympathetic · dorsal) and named feelings are points; the dot's place is
    a blend of the three (barycentric weights) × an intensity (distance from centre). Dragging moves the sound live; the drag's own shape
    (direction, speed, curvature) is the call's pitch contour
  - the CUE MAP: each state's acoustic cues, as data, every number his (cues_by_state below)
  - CAPTURE: what was dragged is kept as units; call-grammar builds phrases and themes from them (repeat, drift, answer); out as a pattern
    on the Timeline (notes carrying their pitch curves — pitch-path), editable in the Field
signal_dag (in → out):
  state field (drag / mod in / data in) → cue map → { call voice, drift, pulse, space }
  call voice: pitch-path (the glide) → partials from ratio-set (irrational / data harmonics) → osc-wavetable (additive table, rebuilt on change and
    crossfaded) ∥ modal-resonator (struck / bowed bodies tuned to the same set) → filter-formant (the vowel of the call) → [removed 2026-11-13 (2): the
    call's swell] → stereo-tools → reverb-fdn (distance: water, hall, open air) → out
  modulation: lfo + random-source (drift, the call's wobble) · slew-lag (state changes glide, never jump) · mod-tree (any cue modulated)
  steps: ratio-set (the set's own intervals) or scale-key (when it follows the song's key) → pitch-path
  patterns: [2026-11-13 (2): the captured path, not phrases] → pattern-store → notes_out / the Timeline
cues_by_state (starting points as data; hypotheses for him to tune by ear — none is a claim about a body):
  ventral (safe / social)   mid register (roughly a voice's range), smooth glides with melodic contour, moderate call rate, near-consonant
                            set steps, warm formants (open vowels), regular breath-length phrases, close space
  sympathetic (mobilised)   higher and wider, rising contours, faster calls, sharper onsets, roughness (beating 20–70 Hz between partials),
                            brighter, irregular phrase timing, wider stereo
  dorsal (shutdown)         low register (felt more than heard, ≥ 25 Hz), slow falling glides, long silences, dark closed vowels, sparse,
                            far space, the pulse slowing
  between states the cues interpolate (weights); intensity scales distance from the neutral centre
harmonics (ratio-set — irrational frequencies and unconventional harmonic data):
  sets: φ golden · √2 · √3 · π/2 · e/2 · 2^(1/φ) · golden stack (Embodiment Lab's, moved here) · φ series (φⁿ) · n^φ · primes only ·
    Fibonacci ratios · stretched string n·√(1+Bn²) · membrane modes (Bessel zeros) · bar modes · Bohlen–Pierce (3:1 in 13) · beating clusters
  data: any list of numbers → partials (paste, a file, a wire carrying numbers: "unconventional harmonic data"); mapping: as ratios / as Hz /
    log-scaled into a range; amplitudes from the data or by rank
  from your own audio: partial-tracker (planned) reads a sound you bring and gives its partials as a set — resynthesis, never playback (no toys)
  melody steps come from the same set (the set's own intervals, not the 12 notes) or are free (continuous glides)
ports:
  in   note_in (a note moves the root) · transport_in (calls on the beat, or free) · mod: every knob (knob.<key>) + x, y, intensity of the
       state dot (wire an LFO, a breath, an XY Pad into the feeling) · breath (from Breath / Embodiment Lab: phrases on the breath)
       · data_in (numbers → harmonics)
  out  audio_out (stereo, soft ceiling) · notes_out (the calls as notes with curves) · control_out (the state weights v, s, d and intensity,
       0…1 — drive any tool from the feeling; Feeling Engine's job) · event feeling:state {v, s, d, intensity, named}
params (face ★; the rest under More depth ▸):
  FIELD     ★ the state dot (x, y — on the field itself) · ★ intensity · glide (how fast the sound follows the dot, 0.05–8 s)
  CALL      ★ register (root) · ★ range · ★ call rate · contour from drag on|off · vowel · ★ roughness · onset
  HARMONICS ★ set (above) · partials 1–32 · spread (how far the set's ratios are stretched) · tilt · data mapping · body (modal-resonator mix)
  BREATH    phrases on: own | breath in | beat · in / hold / out / rest (as Embodiment Lab)
  SPACE     ★ distance · space (water | hall | open) · width
  PATTERN   ★ CAPTURE (record) · phrase length · repeats · drift (how much each repeat changes) · answer (a second voice answers)
  OUT       ★ level (ceiling ≤ 0.72 peak) · fade · ★ RETURN time
  every cue in cues_by_state is a deep control (CUE MAP tab): per state, its register, rate, roughness, brightness, silence, space
play_surfaces:
  the state field: drag = play (the call follows); hold still = the call sustains and breathes; double-click a named feeling = glide there;
  a pen / MPE pressure (mpe-expression, planned) = intensity
  ◎ RETURN: from wherever it is, the sound glides to the ventral centre over RETURN time (seconds to minutes) — a way back, always one press
  ● CAPTURE (the primary): records the drags as calls; stop → a pattern (units → phrases → themes) on the Timeline
safety (acoustic, measured): peak ≤ 0.72; no onset louder than +12 dB within 10 ms (no startle); sub content ≥ 25 Hz and limited; state changes
  always glide (slew-lag); nothing in the display flickers (no change faster than 3 a second; it swells)
packs (factory, settings only — no recordings; names unique across the ecosystem, checked at build):
  - Open Water — wide slow ventral calls in φ, far water space
  - Kin Call — two voices answering, mid register, near-consonant √3
  - Low Ache — dorsal glides in membrane modes, long silences
  - Hunted — sympathetic, rough beating clusters, fast rising calls
  - Thaw — a path dorsal → ventral over 3 minutes (a drawn feeling path)
  - Lament Across Distance — falling calls in e/2, very far
  - Night Swim — dark, breathing, phrases on the breath
  - Coming Back — Return built in: any state → ventral over 2 minutes
decisions (2026-11-13, proposed with this spec; his yes / no):
  F1 a new tool, not Embodiment Lab extended: the Lab is to listen, this is to play — they wire (breath, control_out → the Lab)
  F2 Feeling Engine folds into this tool's outputs (control_out, notes_out) — one feeling surface, not two
  F3 the polyvagal states are the surface's frame, not a claim; tests measure sound only
  F4 harmonics are shared data (ratio-set): Embodiment Lab and Xen Synth move onto it, each nulls (sound unchanged)
  F5 its UI is shown to him first (a preview), built on his yes
open_gaps: the name · "wail songs" = whale songs? · what he had before (a recording, a description or the v10 build would let it be matched
  by ear) · partial-tracker, slew-lag, env-msseg, reverb-fdn, mpe-expression are planned, not built (build order: ratio-set → call-grammar →
  slew-lag → env-msseg → reverb-fdn → the tool)
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every preset loads in range · save → load exact · closing leaves nothing · Stop all obeyed
  - the field moves the sound, measured: dot toward sympathetic → roughness (envelope energy 20–70 Hz) and spectral centroid up, call onsets
    per minute up; toward dorsal → centroid and onsets down, silence fraction up; toward ventral → pitch movement within a voice's range, smooth
    (no glide faster than the set glide)
  - ratio-set exact: every set's partials within 0.5 c of their formula; data in → partials at those ratios (±0.5 c)
  - a captured drag replays its pitch curve within 1 c; phrases repeat with measured variation (similarity 0.6–0.95 at drift 0.5)
  - RETURN reaches the ventral centre within RETURN time ± 5 %, gliding
  - safety: peak ≤ 0.72, no onset over +12 dB in 10 ms, nothing under 25 Hz above −40 dB
  - novelty: every preset's nearest neighbour ≥ 0.15 (the novelty gate), apart from Embodiment Lab's feelings
  - cpu per voice measured (build/perf.mjs)

# ---- ADDENDUM 2026-11-13 (2) — his answer: four feelings at the corners of one pad; no breathing; no song (everything above kept, but where
#      this addendum differs, it wins). The research: docs/research/feelings-as-sound.md (every field, sources listed).
# His words, verbatim:
#   "looks horrible. sounds horrible. no breathing. no song. a full drag on a tool and have it play the sounds like a four way grid. per song.
#    look at all research into this, from all domains."
#   (asked: is it the whole window as one pad, a sound in each corner, the drag blending the four live, each song / preset bringing its own
#    four corners?) "yes. i want love, anger which is low irratating pitch, sadness, like hanging tree or bite the hand that feeds you."
# Changed: the assembles line above dropped call-grammar and env-msseg (it was: "ratio-set · call-grammar · pitch-path · modal-resonator ·
#   osc-wavetable · filter-formant · mod-tree · random-source · lfo · slew-lag · env-msseg · reverb-fdn · stereo-tools · pattern-store ·
#   scale-key"). REMOVED: the state triangle, the BREATH group and the breath port, the whale-song calls → phrases → themes (call-grammar stays a
#   spec for other tools), the drag-as-call contour. KEPT: irrational / data harmonics (ratio-set), CAPTURE, RETURN, claims NONE, safety.
the_pad (the whole tool):
  - the window IS the pad: edge to edge, one surface; the only chrome a thin strip (the corner set's name, ● CAPTURE, ◎ RETURN, level)
  - four corners, one feeling each; the dot is where you are; bilinear weights (the four always sum to 1) — vector synthesis (Prophet VS,
    1986) taken further: not four waveforms mixed, every cue of the four feelings moves between them (pitch, roughness, tuning, onset, bend,
    timbre, space), and their four voices crossfade at equal power
  - drag anywhere: the sound follows at once (slew-lag, no jumps); let go: it stays where you left it (option: fades)
  - the drag's speed is arousal (Filippi 2017: arousal heard by pitch and brightness across species): faster = a little higher, brighter, louder
  - double-click a corner: glide there · ◎ RETURN: glide to Love (or the set's "home" corner) over RETURN time
  - the trail: the last few seconds of the path, fading — what you drew is what you heard
corners (the factory set — his four; each a set of cues from the research, every number his to change):
  LOVE       tender and close (Juslin & Laukka; Gobl & Ní Chasaide; Morton: friendly = higher, tonal): mid register, pure partials, soft slow
             onsets, legato, slight breath in the tone (noise, not a breath cycle), near, centred; tuned to the MINIMA of its own timbre's
             dissonance curve (Sethares) — irrational and still sweet; roughness ≈ 0
  ANGER      "low irritating pitch" (Morton: hostile = LOW and HARSH; Arnal 2015: irritation = roughness 30–150 Hz): a low growl 40–110 Hz,
             pressed, buzzing, broadband; partials placed so their beats fall inside 30–150 Hz; tuned to the PEAKS of the dissonance curve;
             hard onsets; close and dry
  SADNESS    like Hanging Tree (his v10 QOTSA preset: the Gothic Organ's slow swell, detuned celeste, cathedral): low, heavy, dark; small pitch
             movement that bends and sags (Huron 2014: pitch-bending the one cue that predicted sadness); breathy-dark tone; slow; far and wide
             (a big hall); the minor-third claim NOT used (contested: Buxó-Lugo & Slevc 2021)
  BITE THE HAND  his fourth (read as: betrayal turned to defiance — bitter, driven; his to confirm): between Anger and Sadness — low-mid,
             gritted (some roughness, not all), a driving pulse, falling-then-snapping contour, stabbing onsets, dark-bright
  between corners the cues interpolate — the in-between is where mixed feelings are (Eerola & Vuoskoski 2011: blends beat named categories)
per song (corner sets): a set = four corners (each corner a feeling: its cues, harmonics, timbre, name); the factory set is his four; a set is
  saved, swapped, shared (pack data — packs/sets/*), and a corner can be dragged from one set into another; RENAME any corner
irrational frequencies: each corner picks its ratio-set (φ, √2, √3, π/2, e/2, 2^(1/φ), φⁿ, n^φ, primes, stretched strings, membrane, bar,
  Bohlen–Pierce, beating clusters, or any numbers); between corners the partials glide from one set to the other (each partial to its nearest
  partner); tuning follows the timbre (Sethares): the dissonance curve is computed live for the blended timbre
patterns from feelings: ● CAPTURE records the path (x, y, speed over time); stop → (1) a FEELING LANE on the Timeline: the path itself, replayed,
  editable as a curve — the same feeling again, in time with the song; (2) notes: the pitches the blend sounded, as notes with their bends
  (pitch-path) — into any instrument; (3) out live as control_out: the four weights 0…1 (wire Love's weight into a filter, Anger's into a drive)
not_used (and why, from the research): breath cycles (his "no breathing") · song structure (his "no song") · binaural beats (Ingendoh 2023:
  inconsistent) · anything under 25 Hz (Soundless Music 2003: one small study; a 25–40 Hz "felt low" layer under its own control, off by default)
ports (replacing the list above): in note_in (moves the root) · transport_in (the pulse of Bite the Hand on the beat) · mod: x, y, speed and
  every knob · data_in (numbers → a corner's harmonics) — out audio_out · notes_out · control_out (love, anger, sadness, bite, speed) · event
  feeling:at {x, y, weights}
acceptance (added; the measured ones above stay):
  - at Anger the sound's roughness (envelope energy 30–150 Hz) is ≥ 6× Love's and its spectral centroid of the fundamental band < 120 Hz
  - at Love roughness ≈ 0 (≤ Love's own floor) and the partials sit at the dissonance-curve minima (±5 c)
  - at Sadness the pitch moves by bends (glide share ≥ 70 % of pitch motion) and the centroid is below Love's
  - halfway between two corners every cue is halfway (±10 %) — no jumps anywhere on the pad (max step per 10 ms ≤ 1 dB, ≤ 10 c)
  - a captured path replays to the same sound (null ≤ −60 dB) and its feeling lane edits like any curve
open_gaps: the tool's name (Four Feelings · Feelings · his) · "bite the hand that feeds you" read right? · what "looked and sounded horrible"
  (the Embodiment Lab in the app, or the spec) — if the Lab, it is a separate fix, shown first · the UI preview first (the pad, his four corners)

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 13 it stands on · 10 of 13 built (✓)
  layer 0: filter-formant ✓ · lfo ✓ · mod-tree ✓ · modal-resonator ✓ · osc-wavetable ✓ · pattern-store ✓ · pitch-path ✓ · random-source ✓ · ratio-set · reverb-fdn · scale-key ✓ · slew-lag · stereo-tools ✓
  tool: eravos.feeling-song ← ratio-set + pitch-path + modal-resonator + osc-wavetable + filter-formant + mod-tree + random-source + lfo + slew-lag + reverb-fdn + stereo-tools + pattern-store + scale-key
  build order: filter-formant ✓ → lfo ✓ → mod-tree ✓ → modal-resonator ✓ → osc-wavetable ✓ → pattern-store ✓ → pitch-path ✓ → random-source ✓ → ratio-set → reverb-fdn → scale-key ✓ → slew-lag → stereo-tools ✓ → feeling-song
  shared with: filter-formant 8 · lfo 29 · mod-tree 1 · modal-resonator 5 · osc-wavetable 12 · pattern-store 25 · pitch-path 1 · random-source 8 · ratio-set 0 · reverb-fdn 12 · scale-key 15 · slew-lag 11 · stereo-tools 18  (other tools on each)
  signal_dag check: every node is one of its components ✓

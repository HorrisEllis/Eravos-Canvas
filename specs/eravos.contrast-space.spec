# spec_id: eravos.contrast-space · version 0.1.0 · status SPEC + PREVIEW (2026-11-27; nothing built) · author of the direction: James Brooks
# his words (2026-11-27, verbatim): "look at the song rumble by skrillex. the frequencies how the collide. look deeply into the methods. the way it
#   creates ripples and tension. i want to be able to create what that song does. voice, sounds, all of it. like the contrast is where its at. like i
#   want a bunch of spacial tools and ui elements for components. tension, oscillations. wavelengths, emergence."
# Earlier, the same thread: "Like I contrast. The pendulum swing, highes and lows. Oscillatory." (2026-11-26, T-91) · "eravos makes it, not you.
#   only add capability. always capability first." (2026-11-24)
# Research: docs/research/rumble-techniques.md (techniques only; known / heard / uncertain kept apart; the voice is a made character, not Flowdan's).
# Preview (shown first, silent): docs/previews/contrast-space-preview.png, contrast-space-moved.png — `node docs/previews/contrast-space.shots.mjs`.

## the idea
  Contrast is where two things meet. ERAVOS gains the ability to MAKE those meetings and to SEE them:
  two close notes → a ripple · a low and a mid → a collision · near and far, mono and wide → space · held and let go → tension ·
  low and high → a pendulum · apart and together → emergence · a pitch → a length in the room.
  Every UI element belongs to a COMPONENT. It is the "element" in that component's contract (CG1), so every tool that holds the component shows
  it and nothing is copied (axioms 1, 2, 6). Contrast Space is a proposed TOOL where the seven elements meet. It is also the spatial tool he asked
  for: any sound in, split by band, each band given its own place, ripple, and duck.

## the elements (each with its component; preview 2026-11-27)
  E1 RIPPLE      unison-stack ✓ / oscillator-population ✓ — two (or N) waves and their sum, the beat envelope dashed, the rate in Hz, says
                 "a swell" (< 7 Hz) or "roughness" (≥ 7 Hz). Controls: Note, Beat (Hz), Voices.
  E2 WAVELENGTH  scale-key ✓ (any pitch control can show it) — the wave drawn to scale in a 12 m room, λ = 343 / f, the period in ms, and
                 where it sits ("felt more than placed" > 4 m). Pure display: no sound changes.
  E3 COLLISION   masking-analyzer (spec) + ducker (spec) — a low part's and a mid part's spectra, lit where both are loud, a split line and how far
                 the mid steps back under it. Controls: Split (Hz), Duck (dB).
  E4 SPACE       panner (spec) + stereo-tools ✓ + early-reflections (spec) — from above, you in the middle, each band a source: sub mono
                 (under Bass mono), growl a little wide, air far and wide. Controls: Distance, Width, Bass mono.
  E5 PENDULUM    lfo ✓ (a new "pendulum" shape) — the swing between LOW and HIGH, its trail; Swing = how far, Lean = which side it
                 lingers on (T-91: "the pendulum swing, highes and lows"). Controls: Rate, Swing, Lean.
  E6 TENSION     tension-meter (spec) + energy-curve (spec) — harmony, rhythm, spectrum, density and pitch stacked, climbing while held,
                 all falling at RELEASE (a primary button, and a mod input). Controls: Hold (bars), Release (s). Out: tension (mod).
  E7 EMERGENCE   oscillator-population ✓ + relationship-graph (spec) — the voices as dots on a circle, coupling pulls them together, the
                 arrow is how much they agree (the Kuramoto order parameter r, 0…1). Controls: Coupling, Spread, Count. Out: sync (mod).

## the tool: Contrast Space (tools/music/planned/contrast-space.spec, its DAG generated)
  in (audio) → multiband-splitter → [low: osc-sub-follow off · stereo-tools mono] [mid: waveshaper · unison-stack (Hz) · ducker (keyed by
  low or by a side input)] [high: panner · early-reflections] → stereo-tools → out. Mod outs: tension, sync. Mod ins: release, every knob.
  One tool, isolated, deletable whole (2026-11-24). Holds only components; nothing in it names another tool.

## phases (depends_on in [ ]; each new component proves its own numbers in a node test first; the UI is shown before it merges)
  CS0  [ ]          this spec, the research, the preview, his words mapped ................................................ DONE 3.238
  CS1  [CS0]        unison-stack + oscillator-population: detune in Hz (a "Hz" unit beside cents; 0 Hz = today, bit-identical) — test: two
                    voices at 49 / 50.6 Hz, the envelope's period measured 1/1.6 s ± 1 %
  CS2  [CS0]        lfo: the "pendulum" shape (a swing with gravity: slower at the ends, faster through the middle; Lean = an asymmetry) —
                    test: dwell at each end measured, Lean 0 symmetric, existing shapes bit-identical
  CS3  [CS0]        masking-analyzer (built from spec): per-band overlap of two inputs (log bands, ≤ 10 ms) + ducker keyed per band — test:
                    a 50 Hz sine vs a 300 Hz saw; overlap lit only where both > −30 dB; the duck reaches −9 dB under the split, 0 above
  CS4  [CS0]        panner + early-reflections (built from their specs): angle, distance (level, pre-delay, air loss together) — test:
                    distance 0→1 lowers level, delays the first reflection and darkens > 8 kHz, monotonic
  CS5  [CS0]        tension-meter (built from spec): five kinds as curves + one sum, from the transport, the notes, the spectrum — test:
                    a riser and a kick roll raise rhythm and spectrum; silence then a hit marks a release
  CS6  [CS0]        relationship-graph (built from spec) + oscillator-population's agreement (r) as an output — test: coupling 0 → r < 0.3,
                    coupling high → r > 0.9 within 2 s (24 voices, spread 0.6 Hz)
  CS7  [CS0]        the made voice's CHARACTER (Voice Lab CREATE, eravos.voice-lab.spec VL3): deep, dry, close, level pitch, consonants
                    forward — settings of vocal-tract, never a copied person; his own recorded voice through the same chain
  CS8  [CS5]        the song engine: silence and contrast as parameters (bars with nothing, held tension, one release) — a CAPABILITY:
                    ERAVOS makes a pressure-and-release song from his words or his picks; no hand-built "Rumble" (2026-11-24)
  CS9  [CS1..CS6]   Contrast Space, the tool (its UI = the preview he approves), and each element shown by every tool holding its
                    component (CG1's "element"; Swarm's coherence card first)
  graph: CS0 → {CS1, CS2, CS3, CS4, CS5, CS6, CS7} ; CS5 → CS8 ; {CS1..CS6} → CS9

## decisions
  D1 (coder, by axiom 2): elements belong to components, not to the tool — the tool only gathers them.
  D2 (coder, by "capability first"): no Rumble preset or song is made; ERAVOS gains what it takes to make one from his picks.
  D3 (coder, by the no-copies rule since 3.36 and no-toys): techniques only; no lyric, melody, sample or a real person's voice.

## open (his)
  - the preview: yes, or what changes? (the look is his: "always show me or add more themes before change")
  - Contrast Space as a tool of its own, or only the elements on the tools that already exist (Swarm, Wobble Bass, Sidechain)?
  - which first: CS1 (ripple in Hz) + CS2 (pendulum) reach Wobble Bass's contrast (T-91) soonest — proposed first.

ADDENDUM 2026-11-27 (2) — not one monolith (the original above kept verbatim)
his words (verbatim): "Okay but not one monolith. Against the design philosophy" · "needs an engine probably. look at the other tools. tool suite,
  each tool, then each component for each tool. look at the rest." · "like skrillex right?"
WITHDRAWN: Contrast Space as ONE tool holding seven elements (axioms 1–3). Instead, a SETUP "Contrast" (like Lofi) of whole tools, each its own
engine, each built from components:
  Ripple (new: unison-stack Hz · osc-va · osc-sub · saturator-tube · env-adsr · stereo-tools) · Collision (new effect: multiband-splitter ·
  masking-analyzer · ducker) · Spatial Organism (planned) · LFO (built) + the pendulum shape · Tension Field (planned) · Swarm (built) + the
  Emergence card · Groove / Pads (built) · Lyrics → Rhythm + Voice Lab (the voice, made). Wavelength: a display on any pitch control.
PREVIEW (in progress): docs/previews/contrast-elements.* — seven separate windows wired with ordinary wires (the wires register; the cards
  do not draw yet: a fault in mounting, being found). tools/music/planned/contrast-space.spec is superseded by this addendum.
NEXT: Ripple bottom up — unison-stack Hz (test) → the tool's engine → pictures shown before it merges (asked: "Shall I go ahead?").

ADDENDUM 2026-11-27 (3) — built (the originals above kept verbatim)
his words (verbatim): "yes build them use the null renderer to make sure its novel in relation to the rest of eravos" · "Continue."
BUILT 3.239 Ripple (tools/music/tools/bass/ripple) on unison-stack 1.1 (Hz) + saturator-tube; the LFO tool's Pendulum on lfo 1.1 — CS1, CS2 done.
BUILT 3.240 Collision (tools/music/tools/effects/band-collision) on multiband-splitter, envelope-follower, masking-analyzer (all new) — CS3 done
  (the per-band duck keyed by audio; the ducker component as specced — a triggered shape extracted from Sidechain — stays open).
MEASURED: null render of the tools whose components changed (Retro DCO, Swarm, Piano: unchanged); novelty gate on every new preset (Ripple 8/8
  novel; Collision 4 novel · 2 close (Channel, different role) · 0 twin — keyed effects measured with a kick in their key, survey.key).
NEXT (the setup's other tools): Spatial Organism (CS4: panner + early-reflections, built from their specs) → Tension Field (CS5: tension-meter)
  → Swarm's Emergence card (CS6) → the Contrast setup (Start › SETUPS, the tools wired) → the voice (CS7, Voice Lab).

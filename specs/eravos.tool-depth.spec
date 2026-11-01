# spec_id: eravos.tool-depth · version 1.0.0 · status D1 step 1 built (Wobble Bass 4.0) · 2026-10-31
# "like tools should should have more power, like wobble bass, full range of depth in all aspects."

## Rule
  Every instrument and effect reaches the FULL RANGE a professional plugin of its kind offers, in every aspect it has (source, filter,
  modulation, envelope, drive, space, stereo, pitch). Defaults and every saved preset sound exactly as before (new controls start at
  the value that reproduces today's sound; tested by rendering every factory preset before and after: null below −60 dB).
  Each tool gets a DEPTH AUDIT first: aspect → what it has → what a pro tool of its kind has → the gap. Built tool by tool.

## Wobble Bass — the audit (main cac8a74, its config read from wobble-bass.engine.js)
  aspect      has today                                                   missing for full depth
  source      saw/square (osc2 mix), sub (0/−1/−2), noise, spread, octave  wavetable with position + morph (its own tables: growl,
              −3…+3, transpose −36…+24                                      vowel, metal, FM), unison VOICES (1–16) with detune
                                                                            curve and blend, phase/retrigger per voice, sub wave
                                                                            shape (sine/tri/square), osc2 interval + detune
  filter      lowpass or formant (9 vowels, shift ±24), cutoff 40–8000,    types: HP · BP · notch · comb (+/−) · phaser · ladder
              res 0.5–20                                                   drive; slope 12/24/36 dB; cutoff to 20 kHz; key-track;
                                                                            its own envelope; a second filter (serial/parallel)
  wobble      9 divisions (1/1…1/32 incl. triplets), 5 shapes + draw,      dotted divisions and 1/64; shape morph and smoothing;
              depth 0–8, free 0.02–40 Hz, phase, amp-mod, vibrato,         stereo phase offset; a SECOND LFO (to pitch, pan, wave
              rate bend/glide, Wub Seq (1–16 steps)                         position, FM); per-step depth and shape in Wub Seq;
                                                                            LFO fade-in; envelope-follower mode
  growl       FM index 0–12, ratio 5 steps (0.5–3), FM wub, squash         continuous FM ratio 0.25–16 (+ fine), FM feedback,
                                                                            FM wave choice, ring mod, sync (hard sync sweep)
  drive       drive, shaper, 5 grit modes                                  pre/post filter choice, oversampling 2–8×, bit crush
                                                                            and downsample, tilt EQ after, multiband (OTT-style)
  envelope    attack 0.001–4, release 0.01–8, pitch dive ±48 st + time     full ADSR for amp, ADSR for filter and for wave
                                                                            position, curve shape, velocity → depth/cutoff
  stereo      width                                                       mono-below (bass mono under N Hz), Haas, M/S level
  output      level 0–1.5, squash                                          a clipper with ceiling, a true-peak meter
  Acceptance: every new control audible (a render with it at min vs max differs by ≥ 3 dB in some band) · every factory preset nulls
  against its old render · the face stays simple: new depth lives on the tool page tabs and behind "More" on the window, the main face
  keeps its current controls.

## Order
  D1 Wobble Bass (his example) · D2 Reese · D3 the Wub components (Wub Osc, Wub Filter, Wub Rate, Wub Sub) · D4 Supersaw / Retro Poly ·
  D5 Drum Machine (per-pad depth) · D6 the effects · then every tool, one per push, each audit written into its own .spec first.

## ADDENDUM 2026-10-31 — D1 step 1 built: Wobble Bass 4.0
  Built: filter types HP/BP/notch, slope 12/24/36, key track, filter envelope, velocity → cutoff · decay + sustain · FM ratios
  0.25…8 + fine, ring mod, 2/4/6/8 voices, sub wave, crush grit · LFO 2 (pitch, cutoff, FM, volume) · dotted rates + 1/64 ·
  output clipper. Details and proof: tools/music/tools/bass/wobble-bass/wobble-bass.spec ADDENDUM 2026-10-31.
  Still open in D1: wavetable source with morph, comb / phaser / ladder filters, a second filter, FM feedback, hard sync,
  oversampling choice, mono-below, a true-peak meter.

## ADDENDUM 2026-11-01 — depth is built as COMPONENTS that interconnect (his correction)
  His words: "what about decomposing tools into smaller tools that other tools can use. that was the intent with tools. that the
  components can interconnect," (and 2026-10-21: "anything form a tool that other tools can use need to be decomposed").
  What went wrong: Wobble Bass 4.0/4.1 put the new depth (multi-mode filter with slopes, key track and envelope, wavetables, comb,
  unison, ring, LFO 2, clipper, mono below) INSIDE one tool. Other tools cannot use any of it. Meanwhile components already exist
  that do much of it on their own: Syn Osc (banks + morph, FM, ring, unison, ADSR), Wub Filter (modes, comb, formant, slope 12/24),
  FX Filter (types, slope, its own env + LFO), Syn Env (DAHDSR), LFO, Destroyer (bits, downsample) — and Wobble duplicates them.
  The audit that says "Gaps (0)" (specs/eravos.decomposition.spec) matches group NAMES, not capabilities, so it cannot see this.
  RULE from now on: a capability is built ONCE, as a shared DSP block in the music core, and it is exposed as a COMPONENT tool
  (sovereign, its own window, audio and modulation ports so it wires to anything). All-in-one tools ASSEMBLE the same blocks, so
  depth added to a block lands in every tool and component that uses it, and a component can always replace that stage of an
  all-in-one by wiring. Wobble's 4.x controls stay (nothing taken away); their code moves into the blocks.
  PHASES (replace D2–D6 order; bass music still first)
    K1 BLOCKS — tools/music/core/blocks.js: filter (LP/HP/BP/notch/comb ±/formant, slope 12/24/36, key track, env + velocity
       inputs), wavetable (tables × frames, position), unison stack, FM/ring operator, ADSR, clipper, mono below. Extracted from
       Wobble 4.1 and the existing components with NO sound change (every factory preset of every touched tool nulls).
    K2 COMPONENTS at full depth through the blocks: Wub Filter + FX Filter get every filter mode, slope 36, key track and env
       inputs · Syn Osc gets the wavetables as banks · NEW components: Clipper, Bass Mono (mono below + width) · every block
       control is a modulation input (the motion core already gives each knob one).
    K3 ALL-IN-ONES ASSEMBLE BLOCKS: Wobble Bass first, then Reese, Supersaw, Retro Poly, Acid, Sub — each nulls against itself.
    K4 INTERCONNECT, proved: the Wub Lab suite built from components can reach every Wobble Bass sound (its default within 1 dB,
       rendered); "Open as components" on a tool's page opens its stages as wired components.
    K5 the decomposition audit rewritten to read capabilities (the blocks each tool uses vs the components that expose them).

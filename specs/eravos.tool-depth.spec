# spec_id: eravos.tool-depth · version 1.0.0 · status mapped (not built) · 2026-10-31
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

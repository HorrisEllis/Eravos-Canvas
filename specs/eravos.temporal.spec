# spec_id: eravos.temporal · version 0.1.0 · status proposed · 2026-11-03
# One temporal coordinate model under every engine and canvas. "Otherwise clip automation, MIDI events, audio warping and
# sample-accurate editing will eventually disagree about where something happens."
# Builds on: tools/music/core/precision-clock.js, master-transport.js (extract into a component: temporal-core)

## Coordinates
  musical    bars · beats · ticks (PPQ ≥ 960) — or exact rational beats for tuplets (e.g. 1/3, 1/5 beat) — what notes and grid live in
  absolute   seconds (double) — what tempo changes map to
  sample     integer sample index at the project rate — what audio, transients and DSP scheduling live in
  An object stores the coordinate it was AUTHORED in (a note in beats, a transient in samples, a cue in seconds) and the
  others are derived. Tempo changes therefore move beat-anchored objects in seconds and samples, and leave sample-anchored
  objects where they are (unless the clip is warped to follow tempo — then its warp markers hold beat ↔ sample pairs).
  Example: a note at beat 32 and a transient at sample 1,536,000 are different coordinates. At a steady 120 BPM / 48 kHz,
  beat 32 = 16 s = sample 768,000 and sample 1,536,000 = 32 s = beat 64; add one tempo ramp and both answers change. The
  relation is always computed through the tempo map, never assumed constant.

## Maps
  tempo map       piecewise segments: constant, linear ramp, curve; exact integration beat ↔ seconds (closed form per segment)
  meter map       time-signature changes on bar lines; bars ↔ beats
  warp maps       per audio clip: ordered (sample, beat) markers; stretch between markers by the clip's algorithm
  rate            project sample rate; sample ↔ seconds exact; resampling on import only

## Rules
  - one conversion library (temporal-core) used by all five engines: temporal, arrangement, event, automation, editing
  - conversions are exact and reversible within ± 0.5 sample; no engine keeps its own clock
  - event scheduling to the audio thread happens in samples, computed from the maps with look-ahead on the control thread
  - grids are views: several grids and snap resolutions at once (straight, triplet, quintuplet, user ratio, seconds, samples, frames)
  - microtiming is an offset in the object's own coordinate (beats or ms by user choice), never baked into its position

## Acceptance
  - a note at beat N and an audio transient warped to beat N stay within ± 1 sample through 1 000 random tempo-map edits
  - tempo ramp 90 → 180 BPM over 8 bars: beat ↔ sample round-trip error ≤ 0.5 sample everywhere
  - automation point, MIDI note and warp marker set at the same beat sound at the same sample (render test)
  - changing the sample rate on export moves no musical event by more than 0.5 output sample

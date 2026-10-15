# eravos.phase36-sequencer.spec — 3.36: the Sequencer drives the canvas to the beat · packs · her song
## The user's words
  "sequencer i feel is immensely important. improve it, make it dynamic, make packs — I need to make her that song.
  automating tools to the beat, expanding into as many tools as possible, novel, powerful, high leverage."
  "I literally have clips of her saying 'give your head a shake'. This is meant to be a real song. I want to paste my
  lyrics into the rhythm tool to map my rhythm so we can build music from it."  Priority chosen: automate tools first.
## Map (what existed — not rebuilt)
  Automation (eravos.macro-automation): breakpoint curves over SONG position · LFO: tempo-locked audio-rate mod ·
  Song Engine / Drop Builder / RhythmExpand (words → whole song on the Timeline).
  Gap: nothing tied knob motion to the PATTERN grid; the Sequencer could only play notes.
## Built (sequencer 2.1.0)                                                                  status
  A. AUTO lanes — kind 'auto' {target, param, mode hold|glide}; step.val 0..1 → denormalised against the target's
     own config (number/integer/enum/boolean) → ui:config_change:<target> {_auto} at the step's audio time;
     glide slides to the next set step (≤32 sub-steps).                                         DONE
  B. Step LOCKS on note lanes — step.locks {key: value}; base read once (registry_read), restored on the lane's next
     hit without that lock, and on stop.                                                        DONE
  C. CONDITIONS — step.cond ∈ '', a:b (pass mod b), fill, !fill, first, !first; FILL param (MIDI-learnable, pad
     action "✦ fill", Perform pad 8).                                                          DONE
  D. EVOLVE per lane + HUMANIZE — hash(seed, slot, lane, step, pass): pass 0 exact; melodic ±1–2 degrees / rests;
     drums ghost offbeats. Deterministic (same seed = same performance).                         DONE
  E. Compact pattern sets — {lanes, slots{steps strings, conds, locks}, chain}; lanes name tools by organism/role,
     resolved on load and on every mount; a named-but-absent tool's lane waits (never falls back to drum pads).    DONE
  F. Packs (data/seq-packs.js, PresetPacks "Sequencer songs"): "Give Your Head a Shake" (intro, verse, build with
     her line at step 24, pause, drop 1, breakdown, drop 2 talking; wobble rate/cutoff + DJ filter + reverb lanes;
     fill snare rolls; yoy / dive locks) · "Riddim talk (automation)".                         DONE
  G. Lyrics → Rhythm → ⇢ Sequencer: words → lanes (drums: kick/snare/hat/perc/clap; melody: one in-key lane), 4 bars
     per slot A–H, chained, song mode on; "her voice" lane on every line's first syllable → Sample Player.
     Limit (said in the status line): the grid is 16ths — triplet / nudged syllables round to the nearest 16th; >32
     bars truncates.                                                                             DONE
  H. Undo: changes marked _auto are not undo steps (also fixes the Automation tool flooding undo during playback).  DONE
## Next (ask before building)
  · Her clip auto-chop to words (detect syllable onsets in her recording → slices aligned to the lyric syllables).
  · Automation lanes at 1/32 resolution and per-lane length (polymetric modulation).
  · Scenes: snapshot every tool's knobs per slot and morph between them on the beat.
## Acceptance (tests/p25-sequencer-auto.test.js) · suite green

# ============================================================
# ERAVOS ORGANISM SPEC — WOBBLE BASS
# spec_id:      eravos.organism.wobble-bass
# version:      3.0.0 (Wub Lab stage 1 — P38)
# phase:        P2
# resolves:     F-11(wobble)
# status:       canonical
# ============================================================

identity:
  id: eravos.wobble-bass ; label: Wobble Bass ; icon: 🔊 ; accent: "#ff2266"
  comp_intent: >
    Dubstep wobble/talking bass whose filter movement is locked to
    the song tempo and can change rate per note.
  novelty: >
    Only organism with a formant (vowel) filter bank and a
    tempo-division LFO that retriggers per note. Monophonic legato.

engine:
  graph: [saw osc, square osc (−12 st opt), sub sine] → pre-drive → FILTER → post-shaper → amp → out
  FILTER modes:
    lowpass:  24 dB (two cascaded biquads), cutoff swept by wobble LFO on .detune (cents)
    formant:  3 parallel bandpass (F1,F2,F3) interpolated between vowel A and vowel B by wobble LFO
              vowels: {OO, OH, AH, EH, EE} table of F1/F2/F3 + gains
  wobble LFO: OscillatorNode or PeriodicWave (sine, saw-down, square, 'yoy' custom); rate = MusicTheory.divisionSec(div, bpm)
  retrigger: phase reset on each non-slide note-on (stop/restart LFO at note time)
  per-note rate: note:trigger may carry wobbleDiv (sequencer step param) overriding div for that note
  glide: slide notes ramp frequency over glideTime, no retrigger
  tempo: transport bpm change → LFO frequency updated with setValueAtTime at next tick

wub lab stage 1 (3.0.0):
  draw shape:  lfoShape 'draw' = shapePts [[x 0..1, y −1..1, bend −1..1] ×2..32], first x = 0, last segment wraps to the first
               point. bend > 0 = the segment moves late (u^(1+4b)), < 0 = early. Rendered as a 64-harmonic PeriodicWave with
               Lanczos σ; its DC term (dropped by PeriodicWave) is added back by a ConstantSource → the heard wobble = the drawing.
               The window and the engine share ONE function (descriptor.lib.drawFn) — the picture cannot drift from the sound.
  wub seq:     wubOn ; wubLen 1..16 ; wubStep 1/16|1/8|1/4|1/2|1/1 ; wubSeq[16] cells: '1/8' | '1/8:yoy' (rate + own shape) |
               'x' (stop: frozen on the shape's start point, shut for built-ins) | '' (hold: keeps rolling).
               On each step boundary of the bar grid (transport step16, sample-exact tick time) the cell restarts the wobble at
               phase 0. While on, the sequence owns phase and rate: notes play pitch only (no per-note retrig, wobbleDiv ignored).
               Off after a stop → the wobble un-freezes at Wobble rate.
  vowels:      + UH, AE, IH, ER (F1/F2/F3 from the Peterson–Barney averages, rounded)
  ui hooks:    shape_pts {points} (refused with RUNTIME_002 if < 2 valid points) ; wub_seq {cells[], on?} (unknown cells → hold)
  window:      SHAPE editor (drag, click adds, double-click removes, shift-drag / wheel bends — "up" always pushes the curve up,
               snap 1/32 × 1/8, starts: Yoi Talk Saw Hiccup Stair Gate) ; WUB SEQ rate roll (rows = rates fast→slow + stop,
               bottom row cycles that step's shape, live playhead, fills: Riddim Stair Brostep Halftime, seeded Tear,
               Faster / Slower, copy 1–8 → 9–16, Clear)

config:
  div:       enum [1/1,1/2,1/4,1/4t,1/8,1/8t,1/16,1/16t,1/32] def 1/8
  filterMode: enum [lowpass, formant] def lowpass
  vowelA / vowelB: enum [OO,OH,AH,EH,EE] def OO / AH
  cutoff:    40..8000 Hz def 300 ; depth: 0..6 oct def 3 ; res: 0.5..20 def 6
  lfoShape:  enum [sine, sawdown, square, yoy] def sine
  osc2:      0..1 def 0.5 ; sub: 0..1 def 0.6 ; drive: 0..1 def 0.4 ; shaper: 0..1 def 0.3
  glide:     0..0.5 s def 0.06 ; attack 0.001..1 def 0.005 ; release 0.01..2 def 0.12 ; octave −2..1 def −1

hooks:
  - wobble.hook.audio_out  STD.audio_out
  - wobble.hook.note_in    STD.note_in (+ optional wobbleDiv)
  - wobble.hook.midi_in    STD.midi_in
  - wobble.hook.theory_in  STD.theory_in (keyboard highlight only)
  - wobble.hook.transport_in STD.transport_in (bpm)
  - wobble.hook.mod_cutoff STD.mod_in(cutoff) → filter.detune ±4800 c
  - wobble.hook.mod_depth  STD.mod_in(depth)
  - wobble.hook.mod_drive  STD.mod_in(drive)

presets: factory pack (packs/factory/pack.json) — 29, incl. 3.0: Riddim Stair, Yoi Drawn Talker, Brostep Hiccup, Tearout Gnarl Seq,
         Half-time Throat, Robot Gate 1/16, Talking Neuro Roll, Triplet Chew, Deep Stair Sub, Stop-Start Drop

ui:
  hero: vowel/filter display — live curve of filter response with moving LFO position (reads kernel-owned analyser, not simulated)
  division ladder (clickable 1/1…1/32), vowel pickers, knobs, scale keyboard (audition)
  ui_hooks: standard_ui_hooks

tests:
  - standard_tests
  - div 1/4 at 120 BPM → LFO frequency 2 Hz
  - note-on at t resets LFO phase: output at t+ε equals shape(0)
  - formant OO→AH: band centres at LFO extremes equal vowel table ± 1 Hz
  - slide note: no amp retrigger, freq ramp duration = glide

# ---- dependencies (generated by build/specs.mjs — do not edit by hand)
dependencies:
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo, music.key, music.meter, music.midi]   # ui expansion when added: Audio engine · Transport · Tempo · Song key · Master meter · MIDI button
  services:
    - audio: Audio engine — makes sound
    - clock: Master clock & tempo — locks to the beat
    - key: Song key & scale — plays in key
    - midi: MIDI input — plays from a controller (arm with the MIDI button)
    - mod: 3 modulation inputs — LFO / XY / Macro can move them
    - notes: Notes from a sequencer, timeline or keys — or play its own keyboard
  inputs:
    - wobble.hook.note_in (note:trigger)
    - wobble.hook.midi_in (midi:note) — ambient broadcast
    - wobble.hook.theory_in (theory:key-change) — ambient broadcast
    - wobble.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
    - wobble.hook.mod_cutoff (modulation · port mod.cutoff)
    - wobble.hook.mod_depth (modulation · port mod.depth)
    - wobble.hook.mod_drive (modulation · port mod.drive)
  outputs:
    - wobble.hook.audio_out (audio · port out)
  permissions: [audio_out, midi_in, bus_publish, bus_subscribe]
  works_with: [eravos.timeline, eravos.sequencer, eravos.midi-mapper, eravos.lyric-rhythm, eravos.ratio-lattice]
  - 3.0: drawn shape passes exactly through its points; bend moves a segment late/early; < 2 points → RUNTIME_002, no change
  - 3.0: drawn gate renders open half / shut half at ±0.5 on the LFO bus (DC kept) — offline render
  - 3.0: wub seq [1/4, 1/16:yoy, hold, stop] at 1/4 steps restarts at 0.05, 0.55, (hold), 1.55 s … exactly, twice per 2 bars
  - 3.0: wub seq on → notes never restart the wobble; off → retrig per note as before ; off after stop → un-frozen

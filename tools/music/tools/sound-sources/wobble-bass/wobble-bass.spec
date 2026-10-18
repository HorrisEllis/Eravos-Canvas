# ============================================================
# ERAVOS ORGANISM SPEC — WOBBLE BASS
# spec_id:      eravos.organism.wobble-bass
# version:      3.1.0 (Wub Lab stage 1 — P38 · 3.1 low-end fix)
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

v3.1 (low-end fix + growl):
  - subOct [0, −1, −2] default 0: the sub plays at the wub's own pitch. Before, it sat an octave under it — with the
    default Octave −1 an A2 note put the sub at 27.5 Hz, below what most speakers play, and it took most of the energy
  - sqOct [0, −1] default 0: the Square layer plays at the saw's pitch (it sat an octave under: 27.5 Hz under an A2)
  - gritMode [auto, soft, asym, fold, hard] after the filter (auto = the old rule: asym above 0.6, else soft) ·
    depth max 8 oct (cutoff stays 40–8000 Hz: automation lanes map 0–1 onto it, so widening it would change saved songs)
  - presets: Bun Dem Growl (dancehall drop) · Sound-System Screech · Dancehall Yoi Stabs · Half-time Talk Roll ·
    Fold Growl Wub 1/8 — technique only (talking formant growl, rate switch-ups, folded grit), no record copied
  - tests (wobble-bass.test.js): sub at 55 Hz under an A2 · fold grit brighter than soft · the new presets carry ≥ 2×
    Classic Wub's energy above 800 Hz when open

# ---- 3.4 · toward the Make It Bun Dem growl (3.44)
growl:
  FM: sine modulator at fmRatio [0.5, 1, 1.5, 2, 3] × the note → the saws' and square's frequency; depth = note Hz × (fmIndex·(1 − fmWub) + fmIndex·fmWub·wobble)
      — in tune over the keyboard; FM WUB lets the wobble open the FM (the talking growl moves its harmonics, not only a filter over them)
  SQUASH 0..1: 3-band OTT-style — < 180 Hz clean at unity (the sub untouched) · 180–2400 Hz and > 2400 Hz each driven into a soft
      limiter (mids most) and made up · 12 kHz top cut · zero latency (no look-ahead) · switched, never blended
  defaults off (fmIndex 0, fmWub 0, squash 0): every older preset sounds exactly as before (survey identical to 3.3)
  tried and left out: a feedback COMB mode — Chromium mutes a feedback loop whose delay dips under 128 samples, the wobble's
      overshoot did that every cycle, and even fixed it put ~5 % of its energy in the growl band; not shipped
presets: Bun Dem Growl (dancehall drop) now FM 3.2 / ratio 1 / FM wub 0.7 · Bun Dem · FM Talker · Bun Dem · Half-time Yoi 1/4t ·
  Bun Dem · Sub Growl (ratio ½) ; every wobble preset in every pack carries the new keys
measured (A1, 140 BPM): Bun Dem Growl growl band (0.8–5 kHz) 36 % → 45 %, talking range 0.65 → 0.95 oct, level and crest ~unchanged
tests: FM + wobble widen the growl band and the talking range ; FM in tune ; squash: no latency, sub within 2 dB, same onset

# ---- 3.5 · power, control, fluidity (3.45)
found broken: the window built its own knob list and FM, FM ratio, FM wub, Squash (3.4), Grit type, Square oct and Sub in phase were
  not on it at all; and nine controls silently did nothing until another switch was on (Free rate ← Sync off, vowels / Formant ←
  formant filter, FM ratio / FM wub ← FM, Dive time ← Dive, Steps / Step ← Wub seq). Every engine control was swept and works in context.
window: every control placed (a check warns, and a test fails, if one is left off) · grouped RATE · MOUTH · GROWL · PITCH · TONE ·
  waiting controls dimmed with the reason in their tooltip · PERFORM pad: x = Rate bend (×¼…×4, log), y = mouth (cutoff in lowpass,
  formant shift in formant), spring back on release (toggle), double-click resets the speed
engine: RATE BEND ×0.25…4 (cents on every LFO's detune, glided by Rate glide) · RATE GLIDE 0…2 s (ladder / bend changes ramp; wub-seq
  steps glide the running wobble instead of restarting it) · PITCH WUB to 2400 c (was 100) · Octave to +2 · inputs: rate (±2400 c),
  fm (±6 index × note Hz), pitch (±2400 c on the wub layer; the sub stays on the note)
research (Make It Bun Dem, 2012, ~140 BPM half-time, F minor per a DJ promo listing): the drop trades a high SCREECH lead with
  low growls; the community recipes for this era are a vowel/formant movement (often FM), heavy pitch bends (±12 st), saturation,
  resampling with a pitched-down layer — Skrillex's own patch is not published
presets: Bun Dem · Screech (the drop lead) — octave +1, formant EE → AE, FM 5 at ×2, pitch wub 700 c, 1/16 rolls with glide ·
  Bun Dem · Talking Growl — octave −1, OO → AH, FM 3.2 with FM wub 0.8, pitch wub 150 c · Bun Dem · Rate Ramp (glide) — a stair of
  rates that swoops (Rate glide 0.3 s) ; every wobble preset in every pack carries rateBend 1 / rateGlide 0
tests: nothing off the window, Free rate dimmed under Sync ; Rate bend ×2 = twice as fast ; glided steps never restart ; Pitch wub
  1200 c bends > 1.7 octaves peak to peak ; an Envelope on the pitch input lifts the note an octave

# ---- matched to the track (3.45.1)
from a 0:38–1:04 excerpt of the user's own copy (analysed locally, never stored in the repo): drop at 0:43 · ~141 BPM half-time ·
  sub F#1 ≈ 46 Hz, mono (L/R 0.99), drifting ±20 c with short bends to F1 / G1 · growl movement peaks at 7.0 Hz = 3 per beat
  (1/8 triplets) plus the half-time pulse · median spectrum: sub at 46–63 Hz, a 20–28 dB scoop 80–500 Hz, a flat bright plateau
  1.6–10 kHz · growl L/R correlation 0.54 (wide)
matcher (offline renders of this tool, F#1 at 141 BPM, scored on the median ⅓-octave spectrum + the mid-band movement spectrum +
  width): random 300 + refine 480 → score 9.4 (default 19.8, Bun Dem Growl 22.7) — 1/8t, sawdown, formant ER → UH +8 st, res 18,
  squash 1, hard grit 0.52, noise 0.27, unison 32 c, width 0.56, no FM. Left over: a resonant bump near 800 Hz the track does not have
presets: Bun Dem · Matched to the track (1/8t) · Bun Dem · Matched + drop rhythm (the same tone, 1/8t rolls broken by 1/4t and stops)

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

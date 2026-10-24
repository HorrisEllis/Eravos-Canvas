# ============================================================
# ERAVOS ORGANISM SPEC — TIMELINE (arrangement)
# spec_id:      eravos.organism.timeline
# version:      2.1.0   (supersedes 2.0.0 — P9 tracks, see eravos.phase9-tracks.spec)
# phase:        P4
# resolves:     F-07, F-12
# status:       canonical
# ============================================================

identity:
  id: eravos.timeline ; label: Timeline ; icon: 📼 ; accent: "#00d4ff"
  comp_intent: >
    Arrange the song in bars: audio lanes play real clips (vocals,
    bounced loops, recordings); pattern lanes tell sequencers which
    pattern to play when; markers name sections (intro/build/drop).
  novelty: >
    Only organism that schedules AudioBuffers against song position
    and owns the loop region and arrangement length.

model:
  lanes: {id, kind: audio|pattern|marker, name, color, gain, pan, mute, solo, armed (audio)}
  audio clip: {id, lane, assetHash, startBar(float), offsetSec, lengthSec, gain, fadeIn, fadeOut, loop(bool)}
  pattern clip: {id, lane, target sequencer instanceId, slot A..H, startBar, bars}
  marker: {bar, name}
  instrument lane (2.1): {id, kind: inst, name, color, target (instanceId of any organism with a note:trigger receiver), mute, solo}
  note clip (2.1): {id, kind: notes, lane, name, startBar (1/16 grid), bars (int 1..128),
                    notes: [{s: step16 from clip start (float), l: length in steps (>= 0.25), n: midi 0..127, v: 0..1}]}
  lane output: per-lane gain → pan → lane bus → timeline out port (one port; lanes pre-mixed)
  playback:
    on transport:play at song position P: for every audio clip overlapping [P, ∞) → schedule BufferSource at t0 + (clipStart − P), offset adjusted
    on transport:loop: stop all scheduled sources, reschedule from loop start at loop time
    on seek while playing: same as loop
    pattern clip: at transport:tick where bar == clip.startBar and sixteenth == 0 − 1 bar lookahead → publish seq:pattern_cue {target, slot}
    note clip (2.1): on transport:tick step k → every note with floor(s) == k − clipStartStep emits
      note:trigger {target, note, velocity, time: tick.time + (s − floor s)·stepDur, duration: min(l, clipEnd − s)·stepDur·0.98}
      lane mute / solo gate notes; missing target → RUNTIME_003 once per target until remounted
  recording: armed lane receives transport:recorded WAV as a clip at record start bar
  snap: none | bar | beat | 1/8 | 1/16 (behavior.clip-snap semantics implemented internally; external behavior may also transform ui:clip_move)

config:
  pxPerBar 8..400 def 64 ; snap def bar ; loopOn bool ; loopStartBar/loopEndBar ; follow bool def true ; songBars 1..512 def 64

hooks:
  - tl.hook.audio_out       STD.audio_out
  - tl.hook.transport_in    STD.transport_in
  - tl.hook.recorded_in:    in ; transport:recorded
  - tl.hook.asset_in:       in ; asset:ready (sample-player "send to timeline")
  - tl.hook.cue_out:        out ; seq:pattern_cue {target, slot}
  - tl.hook.seek_out:       out ; timeline:seek {position_sec, bar, beat}
  - tl.hook.clip_play_out:  out ; timeline:clip_play {clip_id, lane_id, asset_id, position_sec}
  - tl.hook.note_out:      STD.note_out (2.1 — instrument lanes)
  - tl.hook.loop_out:       out ; ui:transport-loop (sets master loop region)

ui:
  header: play/stop (→ master) · position bars:beats · BPM · snap · zoom · loop toggle · bounce arrangement (→ ui:transport-bounce {bars: songEnd}) · export JSON
  ruler: bars/beats, click seek, drag to set loop region (shaded), markers row (dbl-click add, rename)
  lanes: header (name, M/S, arm, gain, pan) ; audio clips with real waveform (from asset peaks), drag move, edge drag trim, corner drag fades, alt-drag duplicate, S = split at playhead, Del = delete
  pattern clips: labelled slot letter, drag length in bars, target select
  drop audio on lane → clip at drop bar (snapped)
  instrument tracks (2.1): "＋ Track" spawns any instrument organism and adds a lane bound to it;
    lane header picks the instrument; dbl-click an instrument lane → new 4-bar note clip
  piano roll (2.1, own file): opens under the lanes for the selected note clip; scale rows shaded;
    click = note (or chord stamp: triad/7th/add9/sus2/power, key-relative), drag = move, right edge = length,
    right-click/dbl-click = delete, wheel on note = velocity; grid 1/16·1/8·1/4; audition on add;
    Fill: progression (anthem 1-6-3-7 · emotional 6-7-5-1 · rise 1-5-6-4 · heartbreak 4-6-1-7)
    × style (sustain · future-bass chops · pluck 8ths · bass roots)
  keyboard (focused only): S split, Del delete, Ctrl-D duplicate, L loop selection, Home seek 0
  ui_hooks: [ui:transport_play, ui:note_audition {lane, note}, ui:clip_fill {id, progression, style, voicing}, ui:seek {bar}, ui:loop_set {start, end, on}, ui:lane_add {kind}, ui:lane_edit, ui:lane_remove, ui:clip_add, ui:clip_edit {id, patch}, ui:clip_remove, ui:clip_split {id, bar}, ui:marker_edit, ui:bounce, standard_ui_hooks]
  org_hooks: [org:arrangement_sync, org:playhead_update {bar, beat, position_sec}]

exports: [json arrangement ; wav via transport bounce]
raises_faults: [ASSET_001, ASSET_002, RUNTIME_002, RUNTIME_003]

tests:
  - standard_tests (non-silent via a clip)
  - clip at bar 3 starts at t0 + 2·barSec ± 1 sample
  - play from mid-clip: offset = P − clipStart
  - loop 1–3: sources restarted at loop, no overlap duplicates
  - pattern clip bar 5 slot C → seq:pattern_cue emitted one bar ahead, applied on bar 5
  - fade-in 0.5 s: gain at start = 0, at +0.5 s = clip gain
  - split at bar 2.5 → two clips, offsets continuous
  - (2.1) see eravos.phase9-tracks.spec exit_criteria

## ADDENDUM 2026-10-23 (3.62, map specs/eravos.phase62-map.spec) — the adjustment works · repeat · split lanes · the whole timeline full screen
His words: "also the adjustment doesn't work. also adding a way to split the lanes. make it easier to repeat patterns, control a in full
screen, add songs that use the automation, arp, etc"
- FIXED (the knobs): the note inspector (3.58) and the selection held ARRAY POSITIONS; the engine hands a clip's notes back sorted
  (cleanNotes: start, then pitch). A Start/Pitch change that moved a note past a neighbour, then any knob, wrote over the neighbour (one note
  doubled, one lost). The roll now carries the open note and the selection by the note itself (pianoroll adopt()).
- FIXED (the clip inspector): Gain, Fade in/out, Loop, Slot, Sequencer and bars were rebuilt on every arrangement_sync, so the control
  under the pointer was replaced after its first step and the drag ended. They stay while the same clip is selected (drawInsp signature).
- REPEAT: a note clip may carry loop (1/16 steps, < its length): it plays its first `loop` steps again and again across its whole length.
  Notes at or past the loop point are kept but not played; a note running past it is cut there; the last repeat stops at the clip's end.
  0 / absent = plays once (every old clip unchanged). Inspector: ⟳ Repeat every (1 beat · ½ bar · 1 · 2 · 4 · 8 bars). The lane and the
  piano roll draw the repeats faded. MIDI export and Split write the repeats out (ctx.notesOf).
  ui hook clip_repeat { id, times }: copies laid end to end (⧉ Repeat ×… in the inspector) — separate clips, for when copies are wanted.
- SPLIT: ui hook lane_split { id, by: 'pad' | 'pitch', at? } (✂ in an instrument lane's header). pad: every pad that is played gets its
  own lane (the lowest stays); pitch: notes at or above `at` (MIDI) move to a new lane; no `at` = the widest gap between the pitches used.
  New lanes sit under the lane (after its curve lanes), play the same tool, keep the clips' start, length and repeat. One undo step.
- ⛶ in the toolbar: the whole timeline over the page (tracks, curve lanes, transport, inspector, piano roll); ⛶ again or Esc. The ask
  dialog and the knob menu now sit above both full screens (they opened behind the roll's).
- tests: timeline.test.js (3.62 suites) · tests/p23-timeline-ux.test.js (3.62 suite) · tests/p62-songs.test.js.

## ADDENDUM 2026-10-23 (later, 3.62 P62.7) — split at a frame
His words: "im saying you select a frame in the timine and clit split to cut a pattern in half"
- Drag on empty space in a track, or Shift+drag over clips: a frame (bars a–b × the lanes covered; a click = one line). ✂ Split / S cuts every
  clip in it at the frame's edges (ui hook clip_split_at { lanes, bars }, one undo step). Notes / pattern clips on whole bars; audio exact.
  Inspector: ✂ In half. Esc clears the frame. The ✂ lane split above was the coder's reading of "split the lanes" and is kept as an extra.

# ---- dependencies (generated by build/specs.mjs — do not edit by hand)
dependencies:
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo, music.meter]   # ui expansion when added: Audio engine · Transport · Tempo · Master meter
  services:
    - audio: Audio engine — makes sound
    - clock: Master clock & tempo — locks to the beat
    - mod: 8 modulation inputs — LFO / XY / Macro can move them
    - files: Your files — drop audio / MIDI on it
  inputs:
    - tl.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
    - tl.hook.recorded_in (transport:recorded) — ambient broadcast
    - tl.hook.asset_in (asset:ready)
    - tl.hook.pads_in (pad:bank-change)
    - tl.hook.marker_jump_in (ui:marker_jump)
    - knob.pxPerBar (modulation · port mod.knob.pxPerBar)
    - knob.snap (modulation · port mod.knob.snap)
    - knob.loopOn (modulation · port mod.knob.loopOn)
    - knob.loopStartBar (modulation · port mod.knob.loopStartBar)
    - knob.loopEndBar (modulation · port mod.knob.loopEndBar)
    - knob.follow (modulation · port mod.knob.follow)
    - knob.laneH (modulation · port mod.knob.laneH)
    - knob.songBars (modulation · port mod.knob.songBars)
  outputs:
    - tl.hook.audio_out (audio · port out)
    - tl.hook.note_out (note:trigger)
    - tl.hook.knob_out (knob:live)
    - tl.hook.cue_out (seq:pattern_cue)
    - tl.hook.seek_out (timeline:seek)
    - tl.hook.clip_play_out (timeline:clip_play)
    - tl.hook.loop_out (ui:transport-loop|ui:transport-seek|ui:transport-play|ui:transport-bounce|ui:transport-restart)
    - tl.hook.marker_out (timeline:marker)
    - tl.hook.length_out (timeline:song_length)
  permissions: [audio_out, bus_publish, bus_subscribe, filesystem_read, registry_read]
  works_with: [eravos.song-recorder, eravos.pads, eravos.sequencer, eravos.embodiment-lab, eravos.arp, eravos.coven, eravos.organ, eravos.retro-poly]

## 3.65 per-note curves and note behaviours (monophonic by design)
  note.c = { knob: [[t, value], …] }  t 0…1 over the note · number knobs only · ≤ 8 knobs · ≤ 64 points · sorted · sent as note:trigger.curves
  playback (sdk-music noteCurves): the knob follows the curve on the audio clock while the note owns it. Ownership = per-note settings:
    newer note wins · an older curve never writes over a newer note · a note's end hands back only a knob it still owns (to automation,
    else the tool's own) · Stop all clears every owner. The knob is the tool's: overlapping notes take it in turn (one line, a bass).
  editing: the note inspector's Curves (draw / shapes / audition); the roll's split tool and the timeline's clip split crop curves.
  behaviours: { id, name, bend?, curves: { role: [[t, f]] } }  role filter | drive | wobble | knob:<key> · f 0…1 in the knob's picture (log
    for a frequency knob). ui:behaviour_save / ui:behaviour_remove; saved in the timeline (saveExtra.behaviours); 6 built-in, sent in
    arrangement_sync.behaviours. Applied in the roll: role → this tool's knob, stretched to the note, intensity around the knob's setting,
    reverse; to the selection.

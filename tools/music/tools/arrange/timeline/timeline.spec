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

# ---- dependencies (generated by build/specs.mjs — do not edit by hand)
dependencies:
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo, music.meter]   # ui expansion when added: Audio engine · Transport · Tempo · Master meter
  services:
    - audio: Audio engine — makes sound
    - clock: Master clock & tempo — locks to the beat
    - files: Your files — drop audio / MIDI on it
  inputs:
    - tl.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
    - tl.hook.recorded_in (transport:recorded) — ambient broadcast
    - tl.hook.asset_in (asset:ready)
    - tl.hook.pads_in (pad:bank-change)
    - tl.hook.marker_jump_in (ui:marker_jump)
  outputs:
    - tl.hook.audio_out (audio · port out)
    - tl.hook.note_out (note:trigger)
    - tl.hook.cue_out (seq:pattern_cue)
    - tl.hook.seek_out (timeline:seek)
    - tl.hook.clip_play_out (timeline:clip_play)
    - tl.hook.loop_out (ui:transport-loop|ui:transport-seek|ui:transport-play|ui:transport-bounce|ui:transport-restart)
    - tl.hook.marker_out (timeline:marker)
    - tl.hook.length_out (timeline:song_length)
  permissions: [audio_out, bus_publish, bus_subscribe, filesystem_read, registry_read]
  works_with: [eravos.song-recorder, eravos.pads, eravos.sequencer, eravos.embodiment-lab, eravos.coven, eravos.organ, eravos.retro-poly, eravos.bass-forge]

# ============================================================
# PLANNED 3.0 — a Timeline you can read at a glance (P39 R5, order 5) · status MAPPED, not built
# "the timeline is hard to use, scrolling up, scrolling down, it feel cluttered" ·
# "the timeline, when tools are wired in, should add to the timeline right?"
# ============================================================
findings (2.2, 3.35):
  F1 a new Timeline starts with 4 EMPTY lanes (marker, pattern, audio, audio) — clutter before anything exists
  F2 lanes appear only by ＋ Track, a dropped clip or the Song Engine. Answer to the question: NO — today a tool on the
     canvas (wired or not) gets NO lane. The user expected it to; that expectation is the design (§A).
  F3 two scroll axes inside a window inside a scrolling canvas (vertical lanes scroll + horizontal time scroll + canvas
     pan) — the "scrolling up, scrolling down" pain. Wheel means time only "when the lanes fit".
  F4 the arrangement (sections) is a thin marker lane, the least visible thing on screen, though it is the song's shape
  F5 Timeline and Song Recorder overlap (both hold the song's audio) — phase33 §H planned to merge them; still open.
§A LANES FOLLOW THE CANVAS (answers F2): every sound-making tool on the canvas HAS a lane, automatically, in role order
  (drums · bass · chords · lead · fx · vocals/audio · automation) with its icon + accent colour. A lane with no clips is
  drawn folded (8 px, name only); it grows when it gets a clip. Remove the tool → its EMPTY lane goes (a lane with clips
  stays, marked "tool removed — re-add or delete"). Wiring a sequencer to a tool shows that pattern as blocks on the
  tool's lane (the pattern lane folds into the tools it drives — no separate abstract "pattern" lane).
§S SECTIONS ON TOP (answers F4): a section strip (intro · verse · build · drop · break · outro) 28 px tall, coloured
  blocks; drag edges to resize, drag a block to move the whole section with every clip under it, duplicate a section
  (Ctrl+D), click = loop it. Her-song (specs/eravos.p39-her-song.spec) writes these.
§N ONE SCROLL (answers F3): the Timeline fits ALL lanes vertically (folded lanes cost 8 px; lane heights share the
  window); no vertical scroll unless > 24 non-empty lanes. Wheel = time, Ctrl+wheel = zoom, Shift+wheel = lane height.
  Pop-out (P37.6) opens the Timeline full-window/second screen.
§C CALM: clips show name + waveform/notes only at the zoom where they are legible; grid lines fade with zoom; one toolbar
  row (Play-from-here · Snap · Zoom-fit · ＋ · Export), everything else in ⚙ (the shared SOUND/CONTROLS settings).
§R RECORDER merge (F5): the Song Recorder becomes the Timeline's audio lanes + REC (one place for the song) — keeps every
  current Recorder function (takes, export formats, stems, Save to Songs). Its own spec decides the migration; open.
acceptance 3.0:
  - fresh Timeline with 0 tools = 0 lanes + the section strip; add Wobble Bass + Drum Machine → 2 folded lanes, role order
  - removing a tool with an empty lane removes the lane; with clips → lane kept + marked
  - 12 tools, 4 with clips: every lane visible with no vertical scroll in a 1040×620 window
  - moving a section moves all clips inside it by exactly the same bars; undo restores positions exactly
  - an old 2.x project opens with its lanes (no auto-delete of user-made empty lanes in loaded projects)

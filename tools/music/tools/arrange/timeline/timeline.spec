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

# ============================================================
# 3.48 — PIANO ROLL PRECISION (phase P48.1 · BUILT 2026-10-19: P1 P2 P3 P4) — "the timeline adding notes isn't precise. make adding
#   the notes more precise. Like paint, expand notes, anything else."
# ============================================================
findings (timeline.pianoroll.js, read 2026-10-19):
  R1 rows are 11 px (PROW) with no vertical zoom — one pixel off is a different note; zoom (S/M/L = 8/14/22 px per 1/16)
     is horizontal only
  R2 grid is 1/16 · 1/8 · 1/4 only: no 1/32, no triplets, no "off" (free), no snap override key
  R3 a click ADDS and immediately starts a MOVE drag: the add snaps with floor() but the drag delta with round() — a hand
     that moves half a cell while clicking shifts the new note by a step or a semitone. The main "not precise" bug.
  R4 resize only from the right edge, 6 px wide — at S zoom a 1/16 note is 8 px, so the edge is most of the note;
     a new note's length is the Length menu, not the last note you drew
  R5 one note selected at a time: no box select, no shift-click, no copy/paste/duplicate, no left/right nudge
     (↑↓ moves pitch only), no quantize, no velocity lane (wheel per note only), no hover ghost showing where a click lands
  R6 the time ruler has no bar numbers; the playhead is the only time reference inside the roll

§P1 PLACE EXACTLY (fixes R1–R3, R6)
  - hover GHOST: a translucent note shows exactly where a click will land (cell, pitch name, bar.beat.tick in the bar)
  - a click adds; a drag only starts after the pointer moves > 4 px (dead zone), and add + drag use the same snap (round
    to the nearest grid line from where the note started, never floor-then-round)
  - grid: 1/4 · 1/8 · 1/16 · 1/32 · 1/64 · triplets (1/8t 1/16t 1/32t) · off (free, 1/128 resolution); Alt held = no
    snap while held; the grid also sets nudge size
  - vertical zoom: rows 8–28 px (Ctrl+Shift+wheel, or the ↕ slider); horizontal zoom continuous (Ctrl+wheel), keeps the
    point under the pointer fixed; "fit clip" button
  - ruler across the top: bar numbers, beats, the grid's subdivisions; click the ruler = move the playhead; the key row
    under the pointer and the time under the pointer read out in the toolbar
built (P1 + P2): ghost + readout (bar.beat.tick · note) · 4 px dead zone · moves follow the CELL and ROW under the pointer
  (a slide inside the clicked cell/row never moves the note — the root of "not precise") · grids 1/4–1/64, 1/8t 1/16t 1/32t,
  off · Alt = free · rows 6–28 px (Rows menu, Ctrl+Shift+wheel) · continuous zoom (Ctrl+wheel keeps the time under the
  pointer) · fit clip · ruler (song bars, beats; click/drag = seek) · tools Draw/Paint/Split/Erase (keys 1–4) · both-edge
  resize, edge zone max(4 px, 25 %) · Length "last" · engine keeps notes at 1/192 step (was 1/64: triplets drifted),
  minimum length 1/128 note (was 1/64)
built (P3 + P4): ⬚ Select tool (5) and Shift-drag box · Shift-click add/remove · Ctrl+A · Esc clears · dragging a selected
  note moves them all, Ctrl+drag copies (Alt stays "no snap") · an edge stretches every selected note by the same amount ·
  Ctrl+C / X / V (paste at the pointer, else the playhead; shared between clips) · Ctrl+D duplicates after the selection ·
  ← → nudge a grid step (Shift: a bar) · ↑ ↓ semitone/octave for the whole selection · Quantize (Q, 25–100 %) · Humanize
  (H, ±10 ticks, ±8 % velocity) · Legato (L) · velocity lane (drag draws, Ctrl-drag ramps; only the selection when there
  is one) · double-click = the note's KNOBS: Start (snaps to the grid, reads bar.beat.tick), Length, Pitch (reads the name; scale-locked), Velocity — live, one undo step, nothing to type (right-click deletes) · step input ⏎ (Z…M and
  Q…U an octave up; Space rest, Backspace back, ← → cursor; the ruler sets the cursor) · every edit = one undo step
not built: MIDI-keyboard step input (computer keys and the on-screen keys only), reverse / glue / transpose-to-scale
§P2 DRAW TOOLS (fixes R4)
  - tools (toolbar + keys): ✎ Draw (1) · 🖌 Paint (2): drag across = one note per grid cell along the path, the pitch
    following the pointer (scale-locked when lock is on) · ⬚ Select (3): box select · ✂ Split (4): click splits a note at
    the grid line · ⌫ Erase (5): drag across deletes
  - length: new notes take the length of the last note you drew or resized ("last length"), or the Length menu
  - resize from BOTH edges; the edge zone is max(4 px, 25 % of the note) so short notes stay movable; Shift-drag an edge
    = resize every selected note by the same amount; Alt-drag = no snap
  - velocity: a velocity lane under the grid (bars per note; drag to draw velocities across notes; Ctrl-drag = a ramp)
§P3 EDIT MANY (fixes R5)
  - selection: box select, Shift-click add/remove, Ctrl+A all, click empty = none
  - move/copy: drag moves the selection; Ctrl+drag copies (Alt is "no snap"); Ctrl+C / Ctrl+V pastes at the playhead or the hover cell;
    Ctrl+D duplicates the selection right after itself
  - nudge: ← → by one grid step (Shift: one bar), ↑ ↓ by a semitone (Shift: octave; in-scale step with scale lock)
  - quantize (Q): start to the grid, 0–100 % strength, optional end quantize; humanize (H): ± ticks and ± velocity
  - legato (L) · glue overlapping notes · reverse · transpose to scale
  - every edit is ONE undo step (a drag, a paste, a quantize), through clip_edit as today
§P4 PRECISE ENTRY
  - double-click a note opens its fields: start (bar.beat.tick), length (ticks or a division), pitch (name or MIDI),
    velocity (0–127) — typed values are exact
  - step input: with the roll focused, play notes on a MIDI keyboard / the computer keys → each lands at the step cursor,
    which advances by the grid (Space = rest)
acceptance 3.48:
  - a click with a 3 px wobble adds the note exactly at the ghost's cell (test: synthetic pointer down/move/up)
  - paint across 8 cells at 1/16 adds 8 notes, one per cell; erase drag removes exactly the notes crossed
  - 1/16t grid places notes at multiples of 2/3 of a 1/16 step; Alt-drag places off-grid
  - resize from the left edge keeps the end fixed; box-select + ← moves every selected note one grid step; one undo
    restores all of them
  - typed start 3.2.120 lands at bar 3, beat 2, tick 120 (480 ticks/beat), exactly

## ADDENDUM 2026-10-22 — note curves (map eravos.phase52-map P52.6a)
  James: "What about curvature? like bending notes, drawing." · "needs to have the timeline curves"
  - note field `b`: array of [x, st]. x is 0..1 across the note, st is semitones −24..24. Up to 64 points, x strictly rising.
    Absent means a straight note.
  - engine: note:trigger carries `bend` = b. cleanNotes keeps a cleaned b.
  - piano roll: tool 'bend' (key 6). A freehand drag over a note writes b. Shift snaps to semitones. Double-click clears it.
    One drag is one clip_edit.
  - acceptance: tests/p52-curves.test.js.

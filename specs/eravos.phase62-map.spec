# eravos.phase62-map.spec — 3.62: the adjustment works · faster · split lanes · repeat patterns · the whole timeline full screen · songs that use it
#   (mapped BEFORE building · 2026-10-23 · from his zip Eravos-Canvas-main-26 and GitHub main a1fcadd)

## His words (2026-10-23, verbatim)
  With the zip and a pasted toolkit list written by another assistant ("James, let's build Raven's music-making arsenal inside ERAVOS …"):
  "can you optimize performance? also what do you think? especially about the timeline additions?"
  "also the adjustment doesn't work. also adding a way to split the lanes. make it easier to repeat patterns, control a in full screen,
  add songs that use the automation, arp, etc"

## What the code shows (read 2026-10-23, not guessed)
  K1 The zip is GitHub main minus PR #34 (Arp 2.0, 3.61): only the arp folder, tools/catalog.js and the dependency map differ, and main
     has the newer copy of each. Nothing in the zip is lost by building on main.
  K2 3.53–3.61 (automation lanes, per-note knobs, curved notes, oscillation, sketch, the note inspector, the tool panel, Arp 2.0) are in
     the code and its tests, but not in PROGRESS.md, the timeline.spec or a phase map. That is drift (§12.5), and this map records it.
  K3 "the adjustment doesn't work": two defects in the code, both reproduced by tests before they were fixed:
     a) The note inspector (3.58, "click a note and edit it completely") held its note by ARRAY POSITION. The engine saves a clip's notes
        sorted by start, then pitch (timeline.engine cleanNotes). Move a note past a neighbour with Start or Pitch, wait for the save, then
        turn any knob, and the knob wrote over the neighbour: one note doubled, one lost. The selection had the same flaw.
     b) The timeline's clip inspector (Gain, Fade in/out, Loop, Slot, Sequencer, bars) was rebuilt on every arrangement_sync. Every edit
        sends one, so the control under the pointer was replaced after its first step and the browser ended the drag.
  K4 Performance, measured (specs/eravos.performance.spec, 2026-10-10): Pad Forge 36 %, Gothic Organ 28 %, Xen Synth 22 %, Supersaw 17 %,
     Coven 16.5 % of a core; budget 10 %. Pad Forge now plays in his song (P52.1). Read in the engines: Pad Forge, Gothic Organ and
     Coven stop a stolen voice (kill) without disconnecting it. Xen Synth, Retro Poly, Supersaw and the syn-* tools disconnect theirs.
  K5 A note clip plays its notes once (playNotes). Repeating a pattern means Duplicate (one copy) or Ctrl-D in the roll.
  K6 Full screen exists for the piano roll only (3.53). The timeline window can be maximized inside the canvas (CanvasWM ⤢), not over the page.
  K7 The Song Engine already writes curve lanes (G.curves, 3.59: Heavy Drops) and wires mod tools into parts. No song uses the Arp.

## The coder's reading (to confirm where marked)
  R1 "the adjustment doesn't work" = the knobs in the note inspector and the clip inspector (K3). Both are fixed and guarded by tests. To
     confirm: if he meant another adjustment, name the control and it is traced the same way.
  R2 "a way to split the lanes" = take one instrument lane apart into several: drums one lane per pad (kick, snare, hats …), or a pitched lane
     split at a note (low notes stay, high notes get a lane of their own: chords above, bass below). Each new lane can then play its own
     tool. To confirm: a split VIEW of two lanes side by side is another reading.
  R3 "make it easier to repeat patterns" = a note clip can REPEAT its first N bars across its whole length (Repeat every 1/2/4/8 bars,
     the way a loop clip works in a DAW). Stretch the clip and the pattern keeps going. Edit the first bars and every repeat follows. Plus
     "Repeat ×2 / ×4 / ×8" lays copies end to end.
  R4 "control a in full screen" = the coder reads "control all in full screen": the whole timeline (tracks, curve lanes, transport, the
     clip inspector and the piano roll) fills the screen, not only the piano roll. TO CONFIRM: "a" could also mean the Arp or the automation.
  R5 "add songs that use the automation, arp, etc" = a songbook whose songs are built from the Arp (a lane plays chords into the Arp, the
     Arp plays a synth), automation curves (on the Arp's gate and octaves, the synth's filter, the pad's pitch), repeating clips (R3),
     note bends and oscillation.

## Decisions (decided by his axioms; he can overturn any of them, §0.3)
  D-62.1 Fix both inspector defects at the root (the roll carries its selection by the note itself; the clip inspector keeps its controls
         while the same clip is selected), not by debouncing. §0.1, §1.2: the evidence is the reproduced failure.
  D-62.2 Performance is measured before and after on this machine. No change ships without a number (§0.1 truth over coherence).
  D-62.3 Repeat lives in the clip (clip.loop, in 1/16 steps), not as copies. Copies would drift apart when one is edited. Old clips
         have no loop and play exactly as before. Repeat ×N stays for when copies ARE wanted.
  D-62.4 Split makes new lanes and clips through the engine's own addLane / clip shape. It is one undo step (history snapshots the timeline).
  D-62.5 Songs are data on the Song Engine (§8.6 reuse: G.bar, G.curves, mods with wireFrom), like Heavy Drops. No new song machinery.

## Phases                                                                                                     status
  P62.1 THE ADJUSTMENT WORKS (K3)                                                                             BUILT
        depends_on: []
        files: tools/music/tools/arrange/timeline/timeline.pianoroll.js (adopt, edNote) · timeline.ui.js (drawInsp) ·
               timeline.test.js (3.62 suite) · tests/p23-timeline-ux.test.js (3.62 suite)
  P62.2 PERFORMANCE (K4), measured — SLEEP: a silent tool is unplugged after its tail, any note plugs it back in   BUILT
        The first hypothesis (stolen voices left connected) was MEASURED AND REJECTED: cost per second stays flat from 8 s to 32 s of
        steal-heavy chords (Pad Forge ×0.92, Organ ×1.01, Coven ×0.95, Xen ×0.94). Nothing was changed for it (D-62.2).
        What the measurement found instead: silent tools keep rendering (reverbs, chorus LFOs, worklets). Unplugged, they cost ≈ 0.
        depends_on: []
        files: tools/music/core/sdk-music.js (ctx.sleepWhen / wake / sleepCheck) · pad-forge.engine.js · organ.engine.js ·
               wobble-bass.engine.js · tests/p62-sleep.test.js · build/perf-idle.mjs · build/perf.mjs (keeps addenda) ·
               specs/eravos.performance.spec (addendum)
  P62.3 REPEAT PATTERNS (R3): clip.loop in the engine (playNotes, MIDI export), the inspector's "Repeat every", Repeat ×N, the repeats   BUILT
        drawn ghosted in the lane and the roll
        depends_on: [P62.1]
        files: timeline.engine.js · timeline.ui.js · timeline.pianoroll.js · timeline.test.js
  P62.4 SPLIT LANES (R2): ui hook lane_split { id, by: 'pad' | 'pitch', at }. Lane header ✂.                     BUILT
        depends_on: [P62.1]
        files: timeline.engine.js · timeline.ui.js · timeline.test.js
  P62.5 THE WHOLE TIMELINE FULL SCREEN (R4): ⛶ in the timeline's toolbar moves the timeline over the page (as the roll does, 3.53); Esc   BUILT
        or ⛶ again puts it back.
        depends_on: [P62.1]
        files: timeline.ui.js · timeline.test.js
  P62.6 SONGS (R5): "Arp & Motion" songbook: an Arp part feeding a synth, curve lanes on the Arp and the synth, repeating clips   BUILT
        depends_on: [P62.3]
        files: tools/music/data/arp-motion-songbook.js (new) · tools/music/index.js · tools/music/data/songbook.js (🪜 shelf) ·
               tools/music/data/song-engine.js (P.repeat → clip.loop when every turn is the same; G.wires part → part) · tests/p62-songs.test.js
  Order: P62.1 → P62.2 → P62.3 → P62.4 → P62.5 → P62.6.

## Open (carried)
  O3 The Arp reads its knobs when a tick is scheduled (≈ the transport's look-ahead before the sound); a curve on an Arp knob lands on
     the audio clock. So an Arp curve takes effect up to one look-ahead late. Found while testing P62.6 (the test now schedules the
     way the live transport does). Not fixed: measure the look-ahead on his machine first.
  O4 Sleep covers Pad Forge, Gothic Organ and Wobble Bass, the three heaviest that have a clear "silent" state. Embodiment Lab (10 %
     idle) is a drone by design; the effects (Phaser 3.6 %, Haunt 2.4 % idle) need a "no input" test instead. Next, by the same table.
  O1 R1, R2 and R4 are readings, to confirm with him.
  O2 K2: the 3.53–3.61 work still needs its own addendum in timeline.spec (what each version added, with his words). Only he has the quotes
     from those sessions that are not already in code comments. The comments carry some of them: they are copied into this map's
     PROGRESS entry, not invented.

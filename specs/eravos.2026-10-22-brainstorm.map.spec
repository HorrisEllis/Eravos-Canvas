# eravos.2026-10-22-brainstorm.map.spec — mapping and brainstorming only (nothing here is built; one item is parked as a patch)
# 2026-10-22 · his words, verbatim:
#   "just mapping and brainstorming right now. using siso, events fed through a gate via a stream. could this be implemented for the
#    canvas. eventually replace electron?
#    First can you make it borderless windowed?
#    the coven, I like it but can you make it look better? and the gothic organ? and the dub station? and then can you check all the
#    songs, since most of the tools were updated. also the canvas needs to shrink when a tool that depends on a ui element."
#   then, while the coder had started building: "supposed to be mapping and brainstorming." · "im saying if you delete a tool and the
#    relevant ui element is no longer needed needs to contract."
# Correction, the coder's: the coder read "First can you make it borderless windowed?" as a request to build, and built most of it.
# His word is that the whole message was mapping. The work is parked as a patch (B below), and the source is back as it was.

## A. LOOKING GLASS × ERAVOS: SISO for the canvas, and replacing Electron (his bundle: looking-glass-bundle-v0.4)
### What the bundle is (read, 2026-10-22)
  - A design, not a program. SPEC v0.3 says "concept stage, nothing built yet". The Rust is stubs: lg-shell main() prints one line,
    lg-core has a 46-line schema, lg-render a 6-line rect. The design is strong and his: a renderer and app host with no browser, UI
    as typed data (no markup), layers added and removed at runtime, layers isolated by an event bus (the "interaction contract"),
    variables and motion as data, signal providers, borderless GPU windows, one native exe.
  - A finding to show him, not to smooth over: proof/PROOF-REPORT.md says "READY. All 1 condition met", and the one condition
    checked is "lib/title.js exists". That proves a file exists, not what it does: his own §0.1/§1.1 rule (declared ≠ served).
    The "Gemini said" files are an outside model's plan (JSON), named as if they were tests.
### What ERAVOS already has that is the same idea
  - SISO is already here twice. host/siso.js (Stream + gates, 56 lines) runs ERAVOS Glass: every outside command is a gated event on a
    stream, out as SSE. canvas/kernel/kernel.js has the bus (publish/subscribe), typed hooks with event types and schemas, and wires
    that are checked. That is Looking Glass's "interaction contract" (2.3), already working.
  - Looking Glass's "element + target + action" (2.3) is ERAVOS's ui:<action>:<instanceId> and note:trigger { target }.
  - Looking Glass's layers (2.2) is the canvas plus overlays (tool pages, ＋ Add, the knob menu) and mods hosted inside tools.
  - Looking Glass's variables driving props (2.6) is params plus P49.1's live values (a mover drives a knob without saving it).
### The measured cost of "replace Electron" (2026-10-22)
  - 59 of 67 tool engines are written on the browser's Web Audio (10,866 lines). Without a browser, ERAVOS needs an audio engine
    of its own: a node graph (oscillator, gain, biquad, waveshaper, convolver, analyser, constant source, buffer source, worklets)
    with the same timing (sample-accurate scheduling).
  - 60 of 67 tool faces draw their own canvas or DOM (4,651 lines). Only the parts drawn through UIKit (knobs, faders, toggles,
    panels, keyboards) are a clean seam today.
  - So the browser is not the shell's problem. It is the audio engine's and the tool faces'. A borderless native window that still
    hosts the web canvas gains little. Replacing what the canvas stands on is the real work.
### The coder's brainstorm: a path, each step useful on its own (his to choose; nothing decided)
  A1 SISO the canvas (small, no Electron change). Every canvas action becomes an event through a gate on one stream: spawn, wire,
     config_change, preset, move, close. Today these are bus messages; gates would add validation, the log and replay in one place.
     ERAVOS Glass already does this for outside commands, so this moves the same stream inward. Gains: replay a session from its
     event log, undo built on it, an agent and a person on the same door.
  A2 The tool face as typed data (Looking Glass 2.1). UIKit becomes the element schema (knob, fader, toggle, keyboard, spectrum, pad
     each with props, states and events). A tool face is data in UIKit terms, and the browser is one renderer of it. Measure first
     how many of the 60 own-canvas faces could become UIKit elements.
  A3 Looking Glass as the shell. The borderless window, top bar, toasts and overlays (its "meta" and "interaction" layers) are drawn
     by Looking Glass, which hosts the canvas page for now. This is where "borderless windowed" belongs long-term (B is the short-term
     version inside Electron).
  A4 A native audio engine behind the same node API (Rust or Zig, one binary: his "executable_goal"). Tool engines keep calling
     ctx.ac.createX(). An adapter maps those calls to the native graph. Proof: one tool (Wub Osc) renders the same samples on both
     engines (an offline render, compared).
  A5 Faces rendered natively from A2's data. Then no browser is left, and Electron is gone.
  Open, his: (1) Is the goal "no browser at all", or "no Electron" (a lighter host for the same web canvas)? A1–A3 serve both;
  A4–A5 only the first. (2) Is Looking Glass its own product that ERAVOS is its first app, or a part of ERAVOS? The bundle says its
  own thing ("a UI renderer and app host, nothing more"). (3) His open question 9 in the bundle (the visual feel: frosted glass or
  neon) decides A3's look.

## B. BORDERLESS WINDOWED (ERAVOS.exe): parked as specs/patches/2026-10-22-borderless-window.patch (git apply)
  What it does: desktop/main.js frame:false plus one IPC message (min / max / close / state). The preload passes window.min/max/close/
  onState. desktop-bridge.js draws − ▢ ✕ (▢ becomes ❐ when maximized). The top bar is the drag region and its buttons are not. F11
  full screen is kept. Plus tests/frameless.mjs (the page side, with a stand-in for the preload).
  State when parked: the page side passed 8/8 with the controls inside #topbar. Then the driver showed them dimmed under the start
  screen: #topbar's stacking context (z 100000) sits under every overlay (z 200000), so the window could not be closed while one is
  open. They were moved to <body>, and the test's selector had not been updated yet. Not run: Electron itself (it is not installed
  here). To finish: fix the test selector, run it, then run ERAVOS.exe on Windows (drag, double-click to maximize, edge resize, the
  close prompt on unsaved changes).

## C. COVEN, GOTHIC ORGAN, DUB STATION: look better (screenshots taken 2026-10-22 at their opening size)
  Coven (560 × 653): the pentagram and vowel stage carry the identity. Against it: a paragraph of help text takes the centre beside
    the stage; the knob groups are the generic boxes; the spectrum is generic. Idea: the stage is the window. The circle with the
    vowels around it, the chant typed as runes along its rim, the six choir and dark knobs placed around the circle, the help behind a ?,
    blood-red on black throughout, candle-flicker light from --live (the 3.33 "alive" layer).
  Gothic Organ (600 × 824): the drawbars and the breathing arched window are right. Against it: half-empty generic panels (PIPES,
    AMP, ROTARY, PULSE), and MOTION and GOTHIC are cut off below the fold at its opening size. Idea: an organ console. Stop tabs (round
    labelled pulls) instead of segmented buttons. Pipe tone, percussion and rotary as one row of stops under the drawbars. Pulse and
    motion as a "tremulant" strip. Stone and brass palette. Everything above the keys at 600 × ~640.
  Dub Station (620 × 640): already the most designed (speaker, pads, big knob). Polish only: labels collide ("Echo send" into
    "Feedback"), the skank choices wrap unevenly, the chord menu is a plain select. Idea: fix spacing, use a pad grid for the skank,
    and draw the chord choice as two buttons ("i–iv" style).
  Each one when built: before/after screenshots through the driver, its tool contract, and every preset still loads.

## D. CHECK EVERY SONG (285 songs, 77 genres, 85 recipes: counted in the canvas 2026-10-22)
  Today's coverage: Odd Couples genres write without faults (tests/p43), the song-click test (p42), one offline render
  (tests/offline-song.mjs). No sweep plays every song.
  A song survey (build/song-survey.mjs, the driver, offline render), per song: it loads with no fault; every tool and preset it names
  exists; its wires all register; it is neither silent nor clipping (an RMS and peak window); every part it mounts makes sound (each
  part's own output tapped); the time it takes. Output: specs/eravos.songs.spec (generated). Failures are fixed one family at a time.
  Why now: P48–P49 changed tools that songs use (EDM Lab relabelled, Wobble Bass, every tool's hooks gained knob inputs, the Bassline).
  Risk found while mapping, the coder's own (P49.1): every knob is now a modulation input. Anything that joins two tools "by the first
  ports that fit" (suites' Mix in, the tool page's linked partner, ToolPage.autoWire, Suites.fitWire) could wire a modulator to an
  arbitrary knob on a tool with no modulation input of its own. Songs wire by named hooks or by key ('modulate'), so they should be
  safe. The survey and a check on those join paths confirm it. Fix if real: the join-by-fit paths skip knob.* hooks.

## E. THE CANVAS CONTRACTS WHEN A TOOL IS DELETED
  His words now: "if you delete a tool and the relevant ui element is no longer needed needs to contract". On P39 (2026-10-1x):
  "i want the canvas ui to shrink when the tool that depends on an aspect of it is removed from the canvas."
  The same ask twice. specs/eravos.p39-canvas-shrink.spec maps it in full: units are HELD by tools, modes, pins and running services;
  when nothing holds a unit it RETRACTS after a 4 s grace (so undo can keep it), via a retract(S) hook per unit, and its state stays
  in the session. Checked in the code today: it was never built. canvas/runtime/expansion.js only grows (no retract, no hold or release).
  So this has been open since P39 and he has asked twice. The coder proposes it first when building resumes: it is fully specced, and
  the spec's acceptance list is ready to become its tests. One decision in that spec is still his: D1, whether the active mode holds
  its units only while no tool of that mode is on the canvas.

## Order the coder would propose (his to set)
  E (asked twice, specced, small) → D survey (finds what P48–P49 broke) → B finish (the patch, plus a Windows run) → C one tool per
  push → A1 (SISO the canvas) → the A2 measure → his answers to A's open questions decide A3–A5.

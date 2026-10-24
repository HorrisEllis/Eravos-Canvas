# eravos.phase70-map.spec — 3.70: more Floor Falls Out and Raven Drop (deep drops, curves) · a right-click menu on the canvas, per tool ·
#   his #5901 session optimized   (mapped BEFORE building · 2026-10-24)

## His words (2026-10-24, verbatim)
  On We've Got Ripples (his bounce of Heavy Drops #5901) and the coder's measurements: "i mean it sounds good to me, but any optimization the
  better." · "also more songs like floor falls out. like the part after 24. bass drops, curves. describe it" · "maybe? bass synthesis
  modulation synthewave" · "more floor falls out and raven drop. curves and deep bass drops," · "also right clikc on the canvas for context
  menu. tool dependant context menu" · "merge that branch" (claude/nice-dirac-t64qeo: merged, fast-forward, 45dd40c).

## What the code and his files show (measured 2026-10-24)
  K1 After bar 24 of Floor Falls Out (Heavy Drops #5901): bar 25 the pause, the sub alone diving two octaves late in the bar; bar 26 the
     half-time drop: the sub holds the root and dives an octave at each 4-bar turn, the Wobble changes rate per note (1/8 · 1/16 · 1/8t ·
     1/4t), slides in from a 4th/5th above, holds the phrase's last note bending down while its wobble speeds up 1/8 → 1/32; the screech
     answers with glides; the Wobble depth curve swings (triangle, 1/2). Raven Drop ("Make a song for her"): the Reese "Her Drop" is the
     bass, 140, her voice on the drop.
  K2 THE SUB'S NOTE IS INAUDIBLE in every Heavy Drops song: Sub Engine presets play Octave −2, the genre writes sub notes at octave 1, so the
     fundamental is 8.7–23 Hz, under the tool's own 24 Hz floor. In his #5901 session a third of the sub's energy was under 20 Hz; what is
     heard is only its Phantom overtones (his session: the Phone-Speaker preset, Phantom 1). Sub at Octave 0, level 0.20: under 20 Hz in the
     drop −8.4 → −29.2 dB, the real sub (30–60 Hz) −4.7 → −2.3 dB of the mix, the master's clipper no busier (0.07 → 0.06 %).
  K3 The master's "limiter" is a DynamicsCompressor (ratio 20, 1 ms): peaks pass it and a soft clipper holds 0 dBFS. Every render peaks at 0.0.
  K4 Right-click: knobs open "Move with" (ui-music knobMenu); the timeline and piano roll use right-click themselves (delete point / note,
     preventDefault). Nothing else has a context menu; the browser's own opens.

## Decisions (by his axioms; his to overturn)
  D-70.1 New songs are a new genre on the Song Engine (data only, §8.6), with the sub at its real note and every dive stopped at ~18 Hz.
         Heavy Drops itself is NOT changed: it is his song and he likes it (USER_AUTONOMY); the fix is offered for it, not applied.
  D-70.2 His session is optimized as a COPY (his file never overwritten, §0.3): Sub Octave 0 + level 0.20; the Wub Lab chain that plays no
         notes removed (null-tested: the mix measures the same without it). Proven by renders of both, given to him to hear.
  D-70.3 The context menu is domain-free in the canvas (canvas/runtime/context-menu.js): generic canvas and window items there; tool items
         come from the tool's own UI (view.contextMenu) and from a domain (ContextMenu.contribute). It opens only where nothing else took
         the right-click (e.defaultPrevented), and never over a text field (the browser's own menu stays there).
  D-70.4 "maybe? bass synthesis modulation synthewave": read as tool categories in ＋ Add (Bass was made in the branch he just merged;
         Synthesis and Modulation exist; Synthwave would gather Retro Poly and the 80s tools). TO CONFIRM — not built.

## Phases                                                                                                    status
  P70.1 FLOOR FALLS songbook (hd-floor-falls, 8 songs, a move per song: falls · stairs · freefall · rises)   BUILT
        depends_on: []
        files: tools/music/data/floor-falls-songbook.js · tools/music/index.js · tools/music/data/song-engine.js (cx.seed, curves(…, {key,
               prog, bpm, seed})) · tests/p70-floor-falls.test.js
  P70.2 CONTEXT MENU — canvas: ＋ Add · Paste? no (no copy yet) · ⊞ Tidy · ⤢ Show everything · ↶ ↷ · ■ Stop all; window: tool items, presets,
        ⧉ Duplicate (same settings), 📘 page, ⚙ settings, ⤢ expand, × close; timeline items; music: ▶ hear it, ■ release
        depends_on: []
        files: canvas/runtime/context-menu.js (new) · canvas/runtime/eravos.css · canvas/scripts.js (load order) · tools/music/core/ui-music.js
               (contribute) · tools/music/tools/arrange/timeline/timeline.ui.js (view.contextMenu) · tests/p70-context-menu.test.js
  P70.3 HIS SESSION, OPTIMIZED (a copy) + A/B renders                                                         BUILT
        depends_on: []
        files: none in the repo (his data; delivered as files)

## ADDENDUM 2026-10-24 (later) — "what about instead of so much songs, we have a pattern library" → "continue"
  The 8 Floor Falls songs leave the shelf (their genre stays a Song Engine generator, their moves become patterns). The library is built here
  as 3.71 (specs/eravos.pattern-library.spec addendum). The right-click menu goes to main with it.
  P71.1 PATTERN LIBRARY, first slice                                                                            BUILT
        depends_on: [P70.1]
        files: tools/music/data/pattern-library.js (new) · tools/music/data/floor-falls-songbook.js (no shelf songs) · tools/music/index.js ·
               tools/music/domain.js (toolbar "Patterns") · tools/music/core/music.css · tests/p71-pattern-library.test.js

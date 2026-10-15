# eravos.phase35-timeline.spec — 3.35: the Timeline is easier to use ("hard to use · pop out or expand better")
## RCA (from the code, not guesses)
  1. One canvas = the whole song wide (cap 30000 px → 60000 device px at 2× DPR). Browser canvas limit ≈ 32767 → long
     songs / high zoom render BLANK; every playhead tick repainted the whole song.
  2. ⤢ filled the canvas AT the canvas zoom → zoomed-out canvas = tiny "maximized" tool.
  3. Piano roll fixed at 240 px under the lanes; no way to trade space.
  4. 17 toolbar controls → wrapped into 2–3 rows, eating lane height.
  5. Plain wheel did nothing when all lanes fit (body had no vertical overflow; CanvasWM yields wheel to .wm-body).
## Fix                                                                       status
  A. Viewport canvas: sticky, viewport-wide; `inner` spacer carries song width; draw culls bars/clips/waveform
     columns to [scrollLeft, scrollLeft+VW]; toContent adds scrollLeft. No width cap.            DONE
  B. CanvasWM ⤢ (runtime, domain-free): fills canvas at 1:1 (scale 1/z), re-fit on pan/zoom/resize,
     no move/resize while maximized, title dbl-click or Esc restores the exact rect.             DONE
  C. Splitter lanes ↕ piano roll (drag, dbl-click = half), shown only with the roll (:has).     DONE
  D. Exports → one "⤓ Export…" menu (WAV, MIDI, stems, JSON).                                   DONE
  E. Plain wheel scrolls time when lanes fit · + / − zoom around playhead · F fit.               DONE
  Rejected: middle-drag pan in the timeline — middle-drag is CanvasWM's global pan (collision).
  Not done: a separate OS window (window.open + adoptNode) — breaks windowOf/wires/save lookups that assume
  the world parent; would need a WM-level "host" abstraction first. Ask before building.
## Acceptance (tests/p23-timeline-ux.test.js)
  ⤢ at z 0.5 = canvas−16 px on screen, holds after pan+zoom, Esc restores rect · 90 000 px song keeps a
  viewport canvas and clicks hit the far clip after scrolling · wheel scrolls time · +/− zoom · Export menu ·
  splitter visibility. Suite 560/560.

## 3.35.1 — ⏮ restart · pads do more (user: "map drum pad to more things · restart from the start of the loop or timeline")
  F. Transport owns restart + tap: ui:transport-restart {to?:'start'|'loop', play?} → loop start if loop on else bar 1;
     ui:transport-tap. ⏮ in the top bar + Timeline, Home key.                                             DONE
  G. MIDI Map 1.1 pad roles (hardware index → role; null = drum, exactly as 1.0): drum-on-tool · note · chord
     (song key, octave, chord type, length) · action (restart, play, stop, record, loop, metronome, tap,
     marker prev/next, drop, pattern A–H, octave ±, next bank). Layouts drums/keys/chords/split/perform/custom;
     ✎ per-pad editor; roles saved with the mapper.                                                       DONE
  H. Timeline answers ui:marker_jump {dir} from the live playhead.                                       DONE
  Fixed on the way: the MIDI Map grid lit the screen-order pad (top-left) for factory maps; it now lights
  the pad you hit, and ▶ test plays what the hardware pad plays.
  Acceptance: tests/p24-pads-restart.test.js. Suite 567/567.

# spec_id: eravos.p39.canvas-shrink · version 1.0.0 · phase P39 · status MAPPED · order 2 · amends eravos.shell-expansion
# "i want the canvas ui to shrink when the tool that depends on an aspect of it is removed from the canvas."

## Finding (canvas/runtime/expansion.js, 3.38)
  The canvas GROWS on demand (a unit — toolbar group, key binding, service — is built the first time a tool needs it) but
  NEVER shrinks: `built` only gains ids; units have build(S) and no teardown. Remove the last music tool and the transport,
  BPM, key, meter, MIDI button, Song Recorder dock and Songs/Sounds/Learn buttons all stay.

## Model: units are HELD, not just built
  holders of a unit (any one keeps it alive):
    T  a live tool whose deps(id).units (incl. the requires-closure) contain it        — counted per instance
    M  the active mode, ONLY while no tool of that mode is on the canvas (a mode is a starting view; once tools are on
       the canvas they decide)  — D1 confirm with the user
    P  a user pin (right-click a toolbar group → "Keep this") — remembered per profile
    S  a running service that must finish (recording in progress, export rendering) — held until it ends
  release: when a unit's holder count reaches 0 it is RETRACTED after a grace period (default 4 s — long enough for
  "remove → undo", short enough to feel immediate); requires-closure releases bottom-up (meter before engine).
  retract(S) — new optional hook on unit(): removes exactly what build(S) added (DOM, key bindings, bus subscriptions);
  a unit without retract stays (old domains keep working — compatible by default). Built-in music units all get one.
  state is never lost: what a unit SHOWS lives in the session, not in the unit (BPM, key, loop, recorder takes are
  workspace data). Re-growing the unit shows the same values. The audio engine retracts its UI only — the AudioContext is
  suspended, not closed (no click, no re-permission).
  motion: grow and shrink animate 160 ms (width/opacity), reduced-motion = instant; the toolbar never jumps under the
  pointer (a shrink that would move the hovered button waits until the pointer leaves the bar).
  explain (invention I9): hover any toolbar group → "here because: Wobble Bass, Sequencer (needs the clock)"; a retracting
  group shows "leaving — nothing needs it (Undo keeps it)" during the grace period.

## §W Wire calm (candidate answer to R9 a/b — build only if confirmed)
  wires of tools that are not selected/hovered draw at 25 % opacity and 1 px; hover or select a tool → its wires full;
  a "wires" toggle in the canvas corner: all · selected · none. Port dots grow to 14 px under the pointer (hit target).

## API (domain-free; kernel/runtime only — the boundary test keeps it so)
  S.unit({ id, …, build(S), retract?(S) }) · S.hold(unitId, holderKey) · S.release(unitId, holderKey) · S.pin(unitId, on)
  · S.holders(unitId) → [{kind, key}] · bus: shell:expanded (exists) + shell:retracted { units[] }
  factory: onBeforeSpawn → hold (exists as expand) ; NEW onAfterClose → release ; workspace restore holds for restored tools.
## Acceptance
  - add Wobble Bass → transport, tempo, key, meter, MIDI appear; close it → after 4 s all retract; Undo within 4 s → nothing
    retracts; Undo after → they grow back with the SAME BPM/key
  - two tools need the transport; closing one keeps it; closing both retracts it
  - a pinned unit survives with zero tools; unpinning with zero holders retracts it
  - recording in the Song Recorder holds the dock until the take ends, even if every tool is closed
  - DOM after retract equals DOM before the unit was built (no leftover listeners: bus subscriber count back to baseline)
  - boundary test: expansion.js still names no domain term

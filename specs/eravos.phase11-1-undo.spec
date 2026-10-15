# ============================================================
# ERAVOS P11.1 — UNDO (production gate U)
# spec_id:      eravos.phase11-1-undo
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# created_at:   2026-09-28
# pack:         3.24.0-alpha.1
# ============================================================
# Gate U: "Ctrl+Z / Ctrl+Shift+Z across the whole canvas". Lives in the skeleton (runtime/history.js), domain-free:
# it must undo tools that do not exist yet (anything a future pack adds) without knowing what they are.

model:
  state steps:  a user action on a window = any ui:<hook>:<instance> the window publishes. History snapshots that
                organism (ctx.serialize) BEFORE the action is delivered (kernel bus tap), coalesces the burst
                (a knob drag, a note drag) until 450 ms of quiet, snapshots AFTER; equal → no step (play, audition,
                learn… leave no trace). Undo = ctx.deserialize(before); redo = deserialize(after).
  structure:    spawn a window · close a window (state + position + its wires captured before unmount) ·
                connect / disconnect a wire. Wires removed BY a close belong to that close.
  grouping:     steps starting within 150 ms of each other are one undo (e.g. ＋ Track = new instrument + lane + clip)
  not recorded: anything during a recipe or a workspace restore (history is cleared after them — a fresh start);
                hardware/automation param changes (they do not come through the window's ui: hooks);
                window moves/resizes (layout, not content — deliberate, may be added later)
  limits:       200 steps; snapshots are JSON of the organism's own state (sounds are referenced by asset hash, not copied)

skeleton hooks added: kernel bus.tap(fn) (pre-delivery observer; errors isolated) · factory 'before-unmount' change event ·
  recipes publish recipe:start · workspace publishes workspace:restoring
shell: ↶ ↷ buttons (tooltip names the step) · Ctrl/Cmd+Z undo · Ctrl/Cmd+Shift+Z and Ctrl+Y redo · ignored while typing
  in a field · a window's own undo (Clip Maker's audio editor) wins when it handles the key (defaultPrevented)

evidence (3.24.0-alpha.1):
  suite 262/262 — 9 undo tests: knob burst = one step · no-op actions leave none · timeline clip · window add/redo keeps id+state ·
    close restores state AND wires AND routing · wire connect · 150 ms grouping · recipes not recorded · an organism defined
    at test time (unknown to the skeleton) undoes, with its own step name (ui_hook_labels)
  real UI (Chromium, Future Bass): recipe → 0 steps; play/stop → 0 steps; piano-roll note 32→33, Ctrl+Z 32, Ctrl+Shift+Z 33,
    tooltip "Undo: Timeline — edit clip / notes"; close Tape Echo (1 wire gone) → Ctrl+Z → window, preset and wire back; 0 errors
  found while building: the kernel registry keeps a normalised descriptor (unknown fields dropped) — step names are read from
    the factory's full definition

# eravos.settings-buttons-dag.map.spec — button styles in the themes · a real Settings · a DAG for every tool and part (mapped 2026-11-01)

## His words (2026-11-01)
  "b is also nice. why not add all of those to the themes. also need a real settings. not a small menu. also every tool needs to have a dag
  for the relation to what it needs from the ui and its parts also need to know its relation to the tool" (before it: "i chose d", and the
  four designs in the Glass Buttons preview: A clear glass · B glowing edge · C frosted pill · D RGB edge).

## What exists (main, 2026-11-01)
  Themes (canvas/runtime/themes.js, 3.91): Dusk (default) · Studio · Midnight, each a whole look on <html data-theme>, chosen in ⋯ Options.
  Settings: ⋯ Options (a small menu) with sections added by each feature (Theme, Reactive colours, Dependencies, Hear by place …); each
  tool's ⚙ (tool-settings.js). dag.json: built only inside a tool's zip (desktop/packs.mjs, 3.76): needs (core pack, units, tools,
  permissions), hooks in/out, works-with, files. Nothing records what a tool needs from the UI, nor its parts; a part does not know its tools.

## S1 · BUTTON STYLES IN THE THEMES
  A second choice beside the theme: Buttons — "the theme's own" · Clear glass (A) · Glowing edge (B) · Frosted pill (C) · RGB edge (D).
  Any theme with any button style (data-buttons on <html>, canvas/runtime/buttons.css, every rule scoped to it). Same sizes as today, so no
  window moves. D (his pick): smoked glass, a rainbow rim travelling like RGB lighting while nothing plays, the text and icons the same
  rainbow; with sound the glow grows. B: dark glass, a glowing gradient edge, text in the accent. All four follow the reactive colours.
  Covers: top bar buttons, tool buttons and toggles, segmented switches, chips, icon buttons, disabled. Remembered (localStorage).
  Tests: switching sets data-buttons; a button's computed look changes per style and returns with "the theme's own"; sizes unchanged.

## S2 · A REAL SETTINGS (a page, not a menu)
  ⋯ Options opens SETTINGS: a full page over the canvas (the tool-page look) with a side list and a search box:
    Appearance   theme (live pictures) · buttons (S1) · reactive colours (the four modes, amount, idle rainbow, draw with)
    Sound        audio in / out (eravos.phase75-map A2 when built) · hear by place · master level
    Canvas       grid, snapping, zoom, window behaviour, tidy order
    Tools & packs  installed tools, packs on/off, dependencies (the graph), remove what nothing needs
    Keys         every shortcut, rebindable later
    Data         saves, back up all, restore, reset
    About        version, licences, the test status
  Every existing ⋯ Options section moves in (nothing lost); the ⋯ menu keeps quick actions only (undo, stop all, fit, clear). Settings a
  feature adds register a section (one API), so new settings land on the page, not in a menu. Tests: every old Options control is reachable
  in Settings; search finds a setting by any word of its label.

## S3 · A DAG FOR EVERY TOOL AND PART (committed, built, checked)
  <tool>/dag.json (schema eravos.tool-dag/2) in every tool folder, built by build/tool-kit.mjs from the running definition and the UI it
  mounts, checked by build/validate.mjs:
    needs.ui     what the face uses from the UI: UIKit controls (knob, fader, toggle, segmented, keyboard, spectrum, preset bar, canvas …),
                 runtime pieces (tool page, mods rack, links, glass layer elements), theme tokens it reads
    parts        the components it is built from (eravos.components.spec: filter, wavetable, envelope, clipper …) with what each does in it
    needs        (as tag/1) core pack, units, tools, permissions · hooks in/out · works-with
  and the other direction, so a part knows its tools:
    components/<name>/uses.json (built): every tool that uses it, and how; the UI kit gets the same (ui-uses.json: each control → tools).
  The graph (⋯ Settings › Tools & packs › Dependencies) shows tool → UI and tool → parts, and part → tools when a part is selected.
  Tests: every tool has a dag.json that matches what it actually mounts (spawn, mount the face, record the UIKit calls); every part named in
  a dag lists that tool in its uses.json; a change to a tool's face that adds a control fails validate until the dag is rebuilt.

## Order
  S1 buttons (small, his pick, now) → S3 the DAGs (needed by the components work and Looking Glass LG4) → S2 Settings (the page that shows them).

## ADDENDUM 2026-11-24 — Settings is THE one menu; it grows from the tools' contracts (the original above kept verbatim)
His words (2026-11-24, verbatim; the whole messages: specs/eravos.2026-11-24-session.map.spec 20–22):
  "also the settings needs to be a real menu, that expands from the tools dag contract, like what is needed expands the options."
  "okay well no options and settings."
  Asked "Options and Settings: you don't need both. Where should Options' actions go (Stop all, Show ports, Fit all, Clear canvas)?" —
  options Into Settings · Into right-click · Both — he answered: "first one, beyond removing the undo and redo, and redundany options."
Decided:
  - ST1 ONE BUTTON: ⚙ Settings. The ⋯ Options button and its drop-down are removed; their actions (Stop all — Shift+Esc stays, Show ports,
    Fit all, Clear canvas) become a section of Settings (and stay on their keys). The Undo / Redo toolbar buttons are removed (Ctrl+Z,
    Ctrl+Shift+Z / Ctrl+Y stay; HISTORY stays where it is shown). Redundant entries removed — Organize and Tidy up are the same action
    (CanvasWM.tidy) on two buttons: one stays (see specs/eravos.bare-canvas.spec ADDENDUM 2026-11-24, TB2).
  - ST2 A REAL MENU: the sections down the side, search across every option, each option saying what it does.
  - ST3 SECTIONS FROM THE CONTRACTS (agnostic): a section appears because a tool on the canvas needs it — tool.json needs.resources
    (specs/eravos.performance-plan.spec RP1): Audio (device, latency, buffer, sample rate) with 'audio-realtime'; MIDI with 'midi-in';
    GPU / image memory / colour with 'draw-gpu' / 'image-memory'; Files with 'files'. Always there: Look, Performance, Library, Updates,
    Canvas (the former Options' actions). Each option lists the tools that asked for it ("Latency — needed by Wobble Bass, Retro DCO"). The
    last tool needing a section removed → the section hides; its values are kept for when it comes back.
  - ST4 a tool's own ⚙ settings stay on the tool (tool-settings.js) and are reachable from its entry in Settings.
  - ST5 a LOOK CHANGE → a preview he approves first (the rule), then built.
Order: ST1 (with the toolbar clean-up, shown first) → RP1 (needs.resources) → ST3 → ST2. Tracked: docs/TODO-LEDGER.md T-04, T-05, T-12.

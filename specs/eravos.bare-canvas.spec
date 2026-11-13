# spec_id: eravos.bare-canvas · version 0.1.0 · status SPEC (mapped 2026-11-13; nothing moved) · canvas
# his words (2026-11-13T12:36:57Z, verbatim): "should we have that in the workshop, the canvas? i feel the workshop should be a tool on its own.
#   like can we make the canvas more bare?" · (12:42:48Z) "lets begin. map and update the specs first. add addendums. and record decisions in
#   the proof of componency doc". Session map: specs/eravos.2026-11-13-session.map.spec.
# Stands on: the rule "Canvas and content stay separate" (CLAUDE.md, 2026-11-05: "i want to keep the canvas and content seperate"; enforced by
#   tests/boundary.test.js), axiom 1 "Parts, not monoliths", the store (specs/eravos.store.spec: the canvas installs, everything else is a zip).

purpose: the canvas is the HOST and nothing else — windows, wires, the tool host, the kit and themes, menus, history, save / open, settings,
  updates. What is a tool (something you could add, remove, swap or mutate) leaves canvas/ for tools/, one PR at a time, each proved to
  change nothing he sees or hears. First to leave: the Field.

## the map (measured 2026-11-13: canvas/runtime, 36 files, 6,072 lines of JS; "used by tools" = tool files naming its global)
| file | lines | global | used by tools | verdict (proposed) |
|---|---|---|---|---|
| organism-factory.js | 204 | OrganismFactory | 203 | HOST — the tool host |
| organism-sdk.js | 290 | OrganismSDK | 93 | HOST — what every engine is written against |
| content-packs.js | 150 | ContentPacks | 75 | HOST — packs are data beside a tool; this loads them |
| catalog.js | 106 | Catalog | 16 | HOST — what is installed |
| canvas-wm.js | 452 | CanvasWM | 11 | HOST — windows, pan / zoom |
| ui-kit.js | 460 | UIKit | 10 | HOST — the kit (the UI is the canvas's: axiom 2) |
| workspace.js | 181 | Workspace | 10 | HOST — save / open |
| recipes.js | 106 | Recipes | 8 | HOST — runs recipe specs (kernel layer 7: mount, wire) |
| icons.js · icons.gen.js | 80 | Icons | 6 | HOST — the interface glyphs |
| context-menu.js | 105 | ContextMenu | 5 | HOST — right-click |
| wire-system.js | 251 | WireSystem | 3 | HOST — wires and their type check |
| tool-page.js | 538 | ToolPage | 3 | HOST — every tool has a page (the page's tabs are filled by domains) |
| tool-settings.js | 78 | ToolSettings | 2 | HOST — ⚙ on each window |
| app-settings.js | 63 | AppSettings | 2 | HOST — the Settings page (sections contributed) |
| mods.js | 193 | Mods | 2 | HOST — the mechanism by which a mod goes in and comes out |
| links.js | 95 | Links | 1 | HOST — small tools grow links (links-and-mods) |
| themes.js · black-surfaces.js | 208 | Themes · BlackSurfaces | 1 · 0 | HOST — themes are the canvas's (axiom 2); black surfaces a standing rule |
| canvas-prefs.js · plain-errors.js | 145 | CanvasPrefs · PlainErrors | 1 · 1 | HOST |
| history.js | 106 | History | 0 | HOST — undo / redo for any tool |
| add-menu.js · expansion.js | 447 | AddMenu · Expansion | 0 | HOST — adding tools; the canvas grows units as domains arrive |
| erv.js | 107 | Erv | 0 | HOST — the .erv file |
| desktop-bridge.js · glass-link.js · updates.js | 306 | — · GlassLink · Updates | 0 | HOST — the app shell |
| preview.js | 86 | Preview | 4 | HOST (proposed) — hearing a preset before loading it is part of packs |
| **workshop.js** (+ workshop.css) | 428 | Workshop | 16 (music's Timeline, piano roll, patterns, Pattern tool, InstrumentWorkshop; agents' Step) | **LEAVES — BC1: the Field, a tool** |
| dep-graph.js | 74 | DepGraph | 0 | LEAVES (proposed) — a view of what needs what: a tool |
| pack-editor.js | 136 | PackEditor | 0 | LEAVES (proposed) — editing packs: a tool |
| mods-rack.js | 91 | ModsRack | 0 | LEAVES (proposed) — the rack's UI is a tool; Mods (the mechanism) stays |
| suites.js | 281 | Suites | 6 | his call — saving / opening suites and setups is close to save / open (host); the suite maker could be a tool |
| colour-field.js · glass-layer.js | 305 | ColourField · GlassLayer | 0 · 2 | his call — the reactive look as a look mod you add (axiom 1), or the canvas's own (themes are the canvas's). Moving them must not change the look (his rule: show first) |
Note a name clash to settle: colour-field.js is "the Field theme" (3.98) — the Field (the editor) will own the word; the theme keeps its
code name (ColourField) and is shown as it is shown today.

## where tools that belong to no domain live
  proposed: tools/core/ — a domain-free domain (schema eravos.domain/1, like tools/dataflow: "Text, JSON, numbers and triggers every domain
  can share"), loaded first in ERAVOS_DOMAINS, installed like any domain (a store zip later). It names no music word (tests/boundary.test.js
  applies to it as to canvas/). The Field: tools/core/field/ (field.js, field.css, field.spec, tool.json). The compatibility graph's checker
  and builder: tools/core/compat-graph/ (specs/eravos.compat-graph.spec).
  alternative (his call): inside tools/dataflow/ (already domain-free and shared) — rejected as proposed: dataflow is a port kind, not a home.

## the Field as a tool (BC1, then BC2)
BC1 — moved, nothing changes: canvas/runtime/workshop.{js,css} → tools/core/field/; window.Workshop kept as the global (16 files call it;
  renamed later, or never — code names are not what he sees); the kinds (music.notes, music.pattern, InstrumentWorkshop, agents' step) are
  unchanged; it opens exactly as today (from a note, a pattern, ⇥ Field, Open in Field). Proof: P150 P154 P156–P162 P165 P167–P176 unchanged
  and green; boundary 10/10; design check no worse; a canvas started with no domains still starts (the bare universe test).
BC2 — wired (new UI: a preview shown to him before it is built): a Field window you add from ＋ Add like any tool, wired to what it edits
  (its in-port takes "editable" — a tool's declared contract: its layers, stages, ports, variables); wired to one tool it edits that tool,
  wired to several it is the merged surface (specs/eravos.ui-field.spec ADDENDUM 2026-11-13); opening from a note keeps working.
  The tool's side: a kind (Workshop.addKind) is the "editable" contract today; BC2 names it as a port type.

## the rule this adds (a guard, with BC1)
  tests/bare-canvas.test.js: every file in canvas/runtime is in the HOST list above (with its why); a new file fails until it is listed —
  so the canvas only grows by a decision. The list lives in this spec and the test reads it.

## phases
  BC0  this spec + the map                                          (2026-11-13)
  BC1  the Field → tools/core/field/, nothing changes; the guard
  BC2  the Field wired (preview first)
  BC3  dep-graph, pack-editor, the mods rack's UI → tools/core/ (one PR each, nothing changes)
  BC4  suites, the reactive look — only if he decides they leave

## decisions
  - D1 (2026-11-13, his words above): the Field leaves the canvas and becomes a tool. The canvas is the host only.
  - D2 (proposed): tools/core/ as the home of domain-free tools.
  - D3 (proposed): each move is its own PR with a no-change proof; nothing he sees changes in BC1, BC3.
  - D4 (his call): suites.js and the reactive look (colour-field, glass-layer) — host or tools.
open gaps: the Field's global name; whether tools/core is listed in the Start menu's domains (proposed: no — it is always there, like the canvas);
  how the store ships tools/core (with the canvas, or as the first zip).

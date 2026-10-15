# eravos.playground.spec — ERAVOS as a playground for anything you can make on a canvas (3.30)
# Music is the first domain, not the product. Axioms hold: nothing pretends to work; each tool is its own first.

## 1. The shell is blank and domain-free
  On open: Start · Add · Options — nothing else. Options holds undo/redo, stop all, ports, fit, clear, library.
  The start page opens on Start (or by itself only when no tools are installed). The fault dot shows only when
  something failed. Everything else is added by what you choose: entering a mode or adding a tool builds only the
  toolbar units that thing needs (eravos.shell-expansion).
  Boundary (tests/boundary.test.js): kernel/, runtime/, index.html, scripts.js never name a domain or a tool.

## 2. Domains live in their own folder — sovereignty by folder
  source:  domains/<domain>/          everything a domain is: domain.js (units, modes, needs), its runtime pieces, data/,
                                      organisms/<tool>/ (engine + ui + spec), its css. Nothing outside reads inside it.
  exe:     ERAVOS Library/Mods/<Domain>/*.zip   — one folder per domain; each .zip is a pack (manifest + files).
           Mods/*.zip also loads; the old Packs/ folder still loads (same pack name in two places loads once, Mods wins).
  A domain talks to the shell only through the shell contract (unit, mode, needs, slot, toast, recipes, workspace
  contributors) and to other domains only through the bus (events with schemas) and wires (typed ports).

## 3. Capabilities, not clumps
  A tool declares: permissions (what it may touch), provides (capability.*), hooks (typed in/out ports: audio,
  modulation, event topics, assets). Anything that speaks the same port type can be wired to anything else, across
  domains. Services (spawn {service:true}) are capabilities without a window — e.g. the pad controller input runs as
  a background service; the MIDI button gives it a window only when you want to edit it.
  Use only what you need: remove a .zip and its tools, units and recipes are gone; nothing else changes.

## 4. Pages off the canvas
  Domain pages (full-screen overlays, not canvas windows) for browsing and learning: Songbook, Sounds (presets ·
  kit packs · capture any sound to a pad), Learn. They act on tools only through the tools' own ui:* events.

## 5. Domains this shape can hold (not built — each would be its own folder + pack)
  image   — layers as tools (load, crop, curves, blend, mask, filter); ports: image, mask, number. Capture → asset.
  video   — clips, cuts, transitions, a timeline tool; ports: video frames, audio (shares the music engine's audio type).
  ui      — page canvas: components as tools, a live preview tool, export HTML; ports: style tokens, layout.
  agents  — automation: triggers, steps, LLM/tool calls as tools; ports: events, text, json. Runs as services.
  Each brings its own units (toolbar groups), modes, Learn tracks and preset packs — and nothing else changes.

## 5b. Open, not boxes (3.31)
  Everything a person picks from is DATA that anyone can add to without touching code paths: genres (genre packs),
  songs (Songbook.add), kits (KitPacks.add), presets (PresetPacks.add), lessons (Learn.addTrack), goals. A new genre
  pack shows up as a Start card, a Songbook card and an EDM-tour lesson by itself.
  Skill is never a gate: every lesson step has "Do it for me" (the real action), every song can be written in one press,
  and nothing is locked except bonus songs that reward finishing a lesson.
  The full map of domains and their tools: eravos.domains.map.spec (generated from specs/src/domains.mjs).

## 6. Next
  P30.1 domain template: domains/_template (one working tool, one unit, one lesson, a pack manifest) + build/new-domain.mjs
  P30.2 cross-domain port types registry (audio · modulation · event · asset · image · text) with converters as tools
  P30.3 browser mode loads Mods from a dropped folder (File System Access API) the way the exe loads Mods/

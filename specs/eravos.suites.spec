# spec_id: eravos.suites · version 1.0.0 · phase P48 · status mapped (not built)
# "I want tool suites. Like you have a tool suite, with its respective tools. Like the wub tools with a synthesizer or
#  something. Each suite has a full page, showing tabs of tools, packs, mods, etc. where you can pick them individually.
#  Like each suite is a system with its respective parts that can also be used. Like the 4 wub tools."

## What changes (from 3.46 tool pages)
  3.46: a suite belongs to ONE tool (descriptor.suite on Wobble Bass, Wub Osc, Morph Osc, Destroyer) and shows as a section
        on that tool's 📘 page.
  3.48: a SUITE is its own thing — a SYSTEM of tools, each still usable alone. It has its own page with tabs, its own packs
        (scenes that set every part at once), and its own place in the tree (COS: domain › suite › tools).
  The 3.46 descriptor.suite stays as a tool's "starter rig" and is shown on the tool page as "Part of: <suite>" + its rig.

## The suite file (data, no code) — tools/<domain>/suites/<id>/suite.json  (schema eravos.suite/1, schemas/suite.schema.json)
  { schema, id: "<domain>.<name>", label, icon, accent, blurb, version,
    parts:  [{ tool, role, required?: bool, why }]          role: a short name shown on the tab ("voice", "mouth", "rhythm", "low end")
    wiring: [{ from: [part tool, hook], to: [part tool, hook] }]   how "Load the whole system" wires it
    scenes: { "<name>": { "<tool>": { preset?: name, params?: {…} }, … } }   one click sets every part
    starter?: scene name loaded with the whole system
    layout?: { "<tool>": [dx, dy] }                           where each window lands, relative to the first }
  A tool may belong to several suites. Suites reference tools by id only — a suite never holds code.
  build/index-tools.mjs indexes suites into tools/<domain>/suites/index.js (generated, like the tool list).

## Shipped suites (first wave)
  music.wub-lab        WUB LAB — the wub, built from parts
    parts: wub-osc (voice) · wub-filter (mouth) · wub-rate (rhythm) · wub-sub (low end) · syn-osc (second voice / FM) ·
           fx-destroyer (grit, as a mod in wub-osc's tone slot) · syn-env (shape)
    wiring: wub-osc → wub-filter · wub-rate → wub-filter.mod_wub · syn-env → wub-osc.mod_fm · syn-osc → wub-osc (FM in when present)
    scenes: Classic Wub · Yoi Talker · Riddim · Bun Dem Growl · Screech · Half-time Roll
  music.synthesis-lab  SYNTHESIS — Morph Osc · Envelope · Partials · Granular (+ LFO)
  music.drop-rig       THE DROP — Wobble Bass · Bass Drop Builder · Reese Bass · Sub Engine · Sidechain · Destroyer
  music.synthwave      SYNTHWAVE — Retro Poly · Supersaw · Mod Delay · Phaser · Echo · Dynamics
  music.gothic         GOTHIC — Gothic Organ · Coven · Haunt · Pad Forge · Echo
  music.sound-system   SOUND SYSTEM — Dub Station · Echo · Filter · Sidechain · Sample Player
  music.xen            XEN — Xen Synth · Ratio Lattice · Recursive Spectra

## The suite page (canvas/runtime/suite-page.js → window.SuitePage, domain-free; opened from ＋ Add › Suites, a tool
## page's "Part of", or 🧰 on any window that belongs to a suite)
  header: icon · label · blurb · "＋ Load the whole system" (every required part, wired, starter scene) · "Works on: <windows>"
  tabs:
    Tools      one card per part: role, what it does, ▶ hear it, ＋ add just this one (wired to whatever parts are already
               open), ↗ go to it if open, 📘 its own tool page
    Scenes     suite packs: ▶ hear the whole system (an offline preview of every part together), Load (sets every open part;
               opens missing required parts first), Save current as a scene (your pack)
    Packs      every preset of every part, grouped by part (the 3.46 pack lists, one per part)
    Mods       per part, per slot: what fits, ＋ one by one (Mods.add), what is inside now
    Controls   every knob of every part, grouped by part, live (a view on the open windows) — a whole-system mixing desk
    Wiring     the suite's wires drawn as a small graph; missing ones offered with ＋
  every action is the normal undoable action (spawn, ui:*, kernel wires, Mods.add) — the page never owns state

## COS (host/cos.js)
  eravos.domain.<d> › eravos.suite.<d>.<name> (a grouping compartment; it holds no files of its own beyond suite.json)
  gates: members (every part tool exists in this domain or another installed one) · wiring (every hook named exists) ·
         scenes (every preset named exists; every param key exists on that part)
  a suite is integrated when its gates pass and every part tool is integrated (it does not move the tools in the tree:
  tools stay children of their domain; the suite lists them)

## Acceptance
  a suite page opens for each shipped suite with all six tabs · Load the whole system opens every required part, wired,
  on the starter scene · each part adds alone and wires into what is open · a scene sets every part · scenes and wiring
  pass the COS gates · tests: tests/p48-suites.test.js

## ADDENDUM 2026-10-21 — the suite is the primary system; parts are tools; mixed and matched
  James, 2026-10-21: "then need the tool suites to connect each tool with the mods. like how there is 4 wub tools, but no primay
  system. like i want each tool to have its components as tools, then they all connect to the suite, but can be mixed and matched."
  Context: the four wub tools existed, joined only by wub-osc's starter rig on its 📘 page (3.46 descriptor.suite). Map:
  eravos.phase48-map.spec ADDENDUM 2026-10-21 (P48.5a/b built, P48.5c mapped). Decision D-48.5 there is the coder's reading,
  marked to confirm.

  The suite file gains (all optional, schema eravos.suite/1 unchanged in shape):
    parts[].as: 'linked' (default, its own window) | 'mod' (lives in another part's slot: { slot, in: <part tool> })
    parts[].preset: the preset it opens on
    output: [<part tool>, ...]   the parts whose sound ends in the suite (default: every linked part with an audio out and no
                                 audio wire to another part in `wiring`)
  THE SUITE WINDOW — tool eravos.suite (music domain, tools/music/tools/suites/suite/). Its config `suite` names the suite id.
    engine: audio in (every part's last sound) → level → audio out (Master by default). No sound of its own.
    tabs:
      Parts    each part: role, label, state (here and wired / here, not wired / not here), ＋ add / ↗ go / ⤓ wire it in;
               "＋ Build the whole system" (every required part, wired, starter scene); "Mix in" lists the parts of every
               other suite and any tool, ＋ adds it wired into what is here
      Scenes   ▶ Load a scene: sets every part that is here (opens missing required parts first)
      Wiring   the suite's wires, each ✓ when it is on the canvas, ＋ when it is not
    membership: a part is any window wired into the suite window, or opened by it (kept in its state `members`, saved).
    every action is the normal undoable action (spawn, ui:preset_load, kernel wires, Mods.add).
  The 3.46 descriptor.suite stays (a tool's starter rig). wub-osc's rig and music.wub-lab name the same tools, and both are kept.
  Built 2026-10-21: canvas/runtime/suites.js · tools/music/tools/suites/suite/ · tools/music/suites/{wub-lab,synthesis-lab}/suite.json ·
  schemas/suite.schema.json (adds parts[].notes and hub, which the 1.0.0 file format above did not have) · ＋ Add cards · Glass
  canvas.suite.* commands. Rule found while building: a part that joined the suite directly because the part it feeds was missing
  (Wub Osc before Wub Filter) is unwired from the suite when that part arrives. Without it the voice is heard twice
  (tests/p48-suites.test.js, "one part at a time").

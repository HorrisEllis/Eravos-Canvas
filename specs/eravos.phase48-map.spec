# eravos.phase48-map.spec — 3.48: tool suites as systems · motion for every knob · a precise piano roll
#   (mapped BEFORE building · status mapped · 2026-10-19)

## The user's words (2026-10-19)
  "I want tool suites. Like you have a tool suite, with its respective tools. Like the wub tools with a synthesizer or
  something. Each suite has a full page, showing tabs of tools, packs, mods, etc. where you can pick them individually.
  Like each suite is a system with its respective parts that can also be used. Like the 4 wub tools. I also want to be
  able to manipulate any of the static tools. Like the destroyer, retro synthwave tool. Like I want more dynamic, control
  and fluidity for the static tools. The gothic organ, and dub station. Also the timeline adding notes isn't precise. And
  can you make adding the notes more precise. Like paint, expand notes, anything else."
  "map it, update the specs for each tool that needs it. then phase it." · "spec it. update current specs. then phasemap"

## Findings from the code (not guesses)
  C1 Piano roll (timeline.pianoroll.js): a click adds AND starts a move; add snaps with floor(), the drag with round() —
     a small hand movement shifts the new note. Rows 11 px with no vertical zoom; grid 1/16 · 1/8 · 1/4 only; right-edge
     resize only (6 px); one note selected at a time; no paint, box select, copy, nudge in time, quantize, velocity lane,
     ruler or typed values.  → timeline.spec § 3.48
  C2 Static tools: knobs move only by hand. Mod inputs: Destroyer 3 of 13 settings, Retro Poly 2 of 31, Gothic Organ 1 of 27,
     Dub Station 2 of 21. Preset changes jump. Only Wobble Bass has a perform pad.  → eravos.motion.spec + each tool's spec
  C3 Suites exist only inside one tool's page (descriptor.suite, 3.46): no suite page, no scenes that set every part, no
     suite in the COS tree.  → eravos.suites.spec

## Specs written / updated for this map
  new      specs/eravos.suites.spec · specs/eravos.motion.spec · this map
  updated  timeline.spec (§ 3.48 piano roll precision) · fx-destroyer.spec · retro-poly.spec · organ.spec ·
           dub-station.spec (§ 3.48 motion) · wub-osc / wub-filter / wub-rate / wub-sub / wobble-bass / syn-osc / syn-env /
           syn-partials / granular (§ 3.48 suite membership) · eravos.tool-pages.spec · eravos.host.spec (suite compartments)

## Phases — one at a time, each tested and pushed before the next                                   status
  P48.1 PIANO ROLL PRECISION (timeline.spec § P1–P4)                          built (2026-10-19)
        P1 place exactly (hover ghost, 4 px dead zone, one snap rule, 1/32 · 1/64 · triplets · off, Alt = free,
           vertical + continuous zoom, ruler) → P2 draw tools (draw · paint · select · split · erase, both-edge resize,
           last length, velocity lane) → P3 edit many (box/shift select, copy/paste/duplicate, nudge, quantize,
           humanize, legato, one undo per edit) → P4 typed note fields + step input
        first because it is a bug the user hits now, and it is contained in one file (+ its CSS and tests)
        acceptance: timeline.spec "acceptance 3.48" · tests in timeline.test.js + tests/p48-pianoroll.test.js (synthetic
        pointer input at several canvas zooms)
  P48.2 MOTION CORE (eravos.motion.spec M1, M4)                                                         mapped
        ctx.params.live(key, v) (a live value: engine sees it, not saved, not undoable, not echoed) · runtime/motion.js
        (domain-free: the motion engine at 60 Hz, the knob right-click menu, the knob ring) · the audio-rate path through
        existing mod buses (sdk-music) · smoothing on every knob · preset morph
        acceptance: any knob on any tool takes an LFO and audibly moves, both paths; the saved value never changes;
        undo history stays clean · tests/p48-motion.test.js
  P48.3 MACROS + PERFORM PAD for every tool (motion M2, M3) and DESTROYER 2.1 (its spec § 3.48)         mapped
        macros strip + assign-from-knob · the generalised pad (from Wobble Bass) · Destroyer: macros, pad, tilt/postLP/
        asym buses, follow, curve morph — the first static tool done end to end, to prove the pattern
  P48.4 THE STATIC TOOLS (their specs § 3.48)                                                           mapped
        Retro Poly 1.1 (velocity routing, LFO 2, new buses, macros, pad) → Gothic Organ 1.2 (expression, registrations
        A↔B, rotary inertia, macros, pad) → Dub Station 1.1 (throw, feedback ride with a safe loop, siren bend, macros,
        pad) — one tool per push, each with its own acceptance from its spec
  P48.5 SUITES AS SYSTEMS (eravos.suites.spec)                                                          mapped
        suite.json schema + indexer · suite-page.js with six tabs (Tools · Scenes · Packs · Mods · Controls · Wiring),
        sharing one module with tool-page.js · ＋ Add › Suites · 🧰 on member windows · COS suite compartments + gates ·
        first wave: wub-lab, synthesis-lab, drop-rig, synthwave, gothic, sound-system, xen (scenes for each)
        last because it shows off P48.2–4 (scenes set macros and motion too) — but it does not depend on them; it can
        move ahead of P48.4 if wanted
  P48.6 POLISH                                                                                          mapped
        README · PROGRESS · the full browser suite + tool-audio survey + COS gates green · screenshots of each new page

## Order and why
  P48.1 → P48.2 → P48.3 → P48.4 → P48.5 → P48.6. The piano roll is the live bug. Motion core before any tool work, so
  the four static tools get it for free and only add what is theirs. Destroyer first among them to prove the pattern.
  Suites last because their scenes are richer once tools have macros and motion.

## Not in this map (parked)
  Ollama DJ on Glass · the two Quest For Fire presets (PROGRESS.md) · Sound Match tool · Electron run of the desktop Glass

## ADDENDUM 2026-10-21 — windows that grow, suites as the primary system, tests on Clear Glass
### His words (2026-10-21, verbatim)
  "i want to make it so the tools expand when resized, like that way it can expand to capture the full range of piano keys,
  and anything else that can be expanded per tool. then need the tool suites to connect each tool with the mods.
  like how there is 4 wub tools, but no primay system. like i want each tool to have its components as tools, then they all
  connect to the suite, but can be mixed and matched."
  And, when the coder started the test run on Playwright: "not playright. isn't clearglass in this project"

### What the code showed (read before mapping)
  E-a  Every window resizes (canvas-wm.js grip → canvas:resize), but what is inside only stretches. 15 tools draw a keyboard
       through one function, UI.Keyboard (tools/music/core/ui-music.js). It shows a fixed range (wub-osc C1–C3, organ C2–C5,
       …). White keys are flex: 1, so a wider window gives wider keys, not more keys.
  E-b  Displays already follow their size (Spectrum and Scope call c.fit()). The piano roll observes resize (timeline.ui.js).
  S-a  The four wub tools exist (wub-osc, wub-filter, wub-rate, wub-sub). The only thing tying them is wub-osc's descriptor.suite,
       a starter rig on wub-osc's 📘 page. There is no suite of its own, and nothing on the canvas is "the system".
  T-a  ERAVOS Glass (host/glass.js) came from Nexus without its page driver. tests/run.mjs and 17 other scripts loaded
       Playwright.

### Phases (each tested and pushed before the next)                                                   status
  P48.0 TESTS ON CLEAR GLASS                                                                            built (2026-10-21)
        depends_on: []
        files: host/driver/glass.js, host/driver/glass-host/{main.js,package.json}, tests/*.mjs, build/*.mjs, tests/no-playwright.mjs
        Nexus's clear-glass/src/driver/glass.js is brought in as host/driver/ (the same page API, so each script changes
        one import line). It runs Clear Glass's Electron when installed (desktop/node_modules/electron), else any Chromium
        over DevTools. ERAVOS changes: launch({ args }) passes switches, and 'crash' is emitted. tests/no-playwright.mjs fails
        any script that imports Playwright.
        Open: desktop/test/{bare,skel}.mjs drive the packaged Electron app (Playwright's _electron) — the driver has no
        app-launch mode yet. They are listed in the guard as the two known exceptions, not hidden.
  P48.7 WINDOWS THAT GROW                                                                               built (2026-10-21)
        depends_on: [P48.0]
        files: canvas/runtime/ui-kit.js (UIKit.fit), tools/music/core/ui-music.js (Keyboard, keyRange), tests/p48-grow.test.js
        UIKit.fit(el, fn): a domain-free ResizeObserver; it calls fn({ w, h }) once per frame while the size changes and
        stops when el leaves the page. UI.Keyboard grows: the tool's own range is the least it shows. Each white key wants
        about 24 px, and keys are added below and above in turn (its register stays in the middle) up to the 88 keys of a
        piano (A0–C8). A shrinking window gives the keys back. When it shows more than its own range, each C is labelled
        with its octave. All 15 keyboard tools get it from this one change (o.grow === false keeps a fixed range).
        Proof: tests/p48-grow.test.js. A Wub Osc window is C1–C3 at 400 px and A0–C8 (88 keys) at 1400 px, a new key plays
        in key, and narrow again gives the keys back. Displays already followed their size (E-b), so nothing changed there.
        Not built: a "Grows with its window" line on the tool page (descriptor.grows). Dropped until a second thing grows.
        Mapped, not built (the per-tool audit, each its own small phase when wanted): sequencer and wub-rate steps shown
        to fit · mixer channels without scrolling · pads grid · harmonic-analyzer range · drop-builder lanes.
  P48.5 SUITES AS SYSTEMS — promoted ahead of P48.2–4 (its own entry allowed it: "it can move ahead of P48.4")
        depends_on: [P48.0]
        Amended by his words above; see eravos.suites.spec ADDENDUM 2026-10-21. Built in three parts:
        P48.5a  suite data: schemas/suite.schema.json · canvas/runtime/suites.js (window.Suites, domain-free) · the indexer
                writes every tools/<d>/suites/<id>/suite.json into tools/catalog.js · first suite: music.wub-lab.  built
        P48.5b  THE SUITE WINDOW — the primary system: tool eravos.suite-hub (tools/music/tools/suites/suite-hub/; first named eravos.suite, renamed the same day because a tool named "suite" made the domain-free canvas unable to say the word — tests/boundary.test.js). One window per
                suite, which any number of parts connect to. The parts' sound ends in it. Tabs: Parts · Scenes · Wiring. built
                Also built: each suite is a card in ＋ Add (canvas/runtime/add-menu.js, category Suites); ERAVOS Glass gained
                canvas.suites · canvas.suite.open {suite, build?} · .build · .add · .scene · .state (glass-link.js, host/glass.js,
                tests/host.test.mjs), so an agent has every suite action a person has. Second suite shipped so "mix and match"
                has something to mix from: music.synthesis-lab (Morph Osc · Envelope · LFO · Partials).
                Proof: tests/p48-suites.test.js (6), tests/host.test.mjs (suites through the door). Seen in the real canvas through
                the driver: ＋ Add › "wub lab" › Open › Build the whole system → 4 connected, wires drawn into the suite.
        P48.5c  the suite page (📘 on the suite window, the six tabs of the suites spec: Packs, Mods, Controls still to add) ·
                "Part of: <suite>" on each part's 📘 page · COS suite compartments and gates · the other five suites of the
                first wave (drop-rig, synthwave, gothic, sound-system, xen).                                    mapped
  Order now: P48.0 → P48.7 → P48.5a → P48.5b → (P48.5c) → P48.2 → P48.3 → P48.4 → P48.6.

### decisions (decided by the axioms; his to overturn)
  D-48.0  Playwright out, Clear Glass's driver in, copied into host/driver rather than required from a Nexus checkout.
          ERAVOS runs without Nexus (eravos.host.spec: "no Nexus dependency"). This is his call: "not playright".
  D-48.7  The keyboard grows in whole white keys, below and above in turn. Reason: the tool's register stays centred (the
          wub tools sit low, the organ in the middle), and a resized window never shifts the note under your finger by
          more than one key. The tool's own range is the floor, so no tool shows fewer keys than it does today (§0.3,
          nothing lost).
  D-48.5  "no primay system" read as: the suite is a thing on the canvas that its parts connect to. The coder's reading
          (to confirm): a SUITE WINDOW (eravos.suite-hub) with an audio input that every part's last sound goes into, a level,
          and an output to Master. Every part stays a tool of its own (its own window, presets, mods). "Connect" is then a
          real wire you can see and pull. "Mixed and matched" means three things: ＋ any part of any suite into this one
          (it joins by the first ports that fit), any tool dropped on the suite window joins it, and closing a part never
          breaks the others.
          Why a window and not only a page: the page (P48.5c) never owns state (suites spec). A system you play needs one
          place that holds it and stays on the canvas. The window maximised (⤢) is that system full-screen.
  Run 2026-10-21, after commit 1f584d0: the full suite was 1021/1024. Two causes, both the coder's:
    (1) The tool was named eravos.suite, which made "suite" a tool name. tests/boundary.test.js then refused the word in canvas/,
        where it is a canvas idea (tool-page had it since 3.46). Fix: the tool is eravos.suite-hub.
    (2) tests/p43-odd-couples.test.js wants an Odd Couples pack and a song part for every music tool. The suite window has no
        sound and no presets, so it declares noPacks. The test lists what it skips, and it joins the "not song material" list with
        the mixer and the recorder.
  After the fix: 1024/1024 on Clear Glass's driver · host 15/15 · tests/no-playwright.mjs ✓ · build/validate.mjs 214 manifests ✓.

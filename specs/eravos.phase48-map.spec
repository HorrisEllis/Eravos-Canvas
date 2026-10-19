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
  P48.1 PIANO ROLL PRECISION (timeline.spec § P1–P4)                          P1+P2 built (2026-10-19) · P3+P4 mapped
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

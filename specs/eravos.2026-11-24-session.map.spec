# spec_id: eravos.2026-11-24-session · status: mapped (each line: built / rule / open / answered) · author: James Brooks
# His words, verbatim, in the order he sent them on 2026-11-24 (this session had no per-message timestamps — the order is exact, the times
# are not recorded). "Map, spec first" (2026-11-06) · "Update the specs so nothing is lost." · today: "also log all of this, don't lose
# anything, update the specs, phases. and add that to a to do ledger". The same list, kept current: docs/HIS-WORDS-MAP.md (N-X97 … N-X125)
# · the evidence register: docs/competence/ · what is still to do: docs/TODO-LEDGER.md.

## 1 — verbatim:
  > can you merge branches. figure out why it keeps telling me error writing eravos.exe
  - ANSWERED: every branch on origin was already in main. BUILT 3.213 (PR #211, 0.2.32): a running ERAVOS was never seen by the Setup
    or the updater (tasklist /NH starts with an empty line) — fixed. Not his cause (see 2).

## 2 — verbatim:
  > its not running. eravos isn't even installed.

## 3 — verbatim:
  > windows defender is turned off.

## 4 — verbatim:
  > so have actually done something right? it didnt have this problem pre 2.30.
  - BUILT 3.214 (PR #212, 0.2.33): when the Setup's own window (0.2.30) cannot write the app, the Setup writes it the 0.2.29 way.

## 5 — verbatim:
  > need to realease 2.32
  - DONE: v0.2.32 released.

## 6 — verbatim (with two screenshots: "ERAVOS Update.exe: EBUSY: resource busy or locked" · "ERAVOS.exe (missing) …"):
  > trying to update it. fails to close eravos. also broke my current version.
  - BUILT 3.215 (PR #213, 0.2.34): the updater runs from a copy; a held updater kept and replaced at restart; the fallback by robocopy
    (3.214's CopyFiles had left ERAVOS.exe out — said plainly). Repair: run the Setup by hand.

## 7 — verbatim (with a screenshot of a component tile framed alone):
  > it works. but i want to be able to mutate the tools, synthesize two or more cores, and make something completely new. like my goal is to add the capability to create a mix of the retro dcs and the wobble bass to make the retro wobble or something. like it would play synthewave style wobble bass. like combine the sound of retro dcs with the rest of wobble bass. also want to be able to swap components better, like moving, them around and moving parts from one to another tool. like maybe when you hover tells you what it is and the point of it and how it effects sound, in the simplest ways, so even a child could understand it. like i want THE MUTATION explotion view on the canvas, to be able to create new tools from current ones, then the workbench to be able to build from scratch from components and the broad selection of ui elements, with different control types, and themes, like a tool builder. built completely in relation to the tool builder and mutation lab. like you open the mutation lab, and it has all the components, and cores to play with. What do you think? also
  >
  > the screenshot, the purple box should surround the entire component ui. also right click to replace. this is meant to be like creative space to create creative tools to create creatively, infinitely possibility possibly.
  - BUILT 3.216 (PR #214): the box framed whole; the hover card in the simplest words (tools/music/data/part-words.js); right-click › REPLACE WITH.
  - BUILT 3.217 (PR #215): the voice pickable; right-click › "◆ … the rest from <tool>" — ERAVOS makes "Retro DCO × Wobble Bass" from his picks.
  - OPEN: synthesize two or more CORES (whole tools) at once · the Mutation Lab's shelf (every component and core) · the Workbench / Tool
    Builder (from scratch: components, UI elements, control types, themes) — specs/eravos.assembled-tool.spec ADDENDUM 2026-11-24 (ML1–ML6).
  - OPEN: more tools able to swap parts (part-exchange profiles beyond Wobble Bass and Retro DCO) — the same addendum.

## 8 — verbatim:
  > like this is meant to be dynamic and fluid. also tools are isolated so if they cause instability they can be deleted.
  - RULE (CLAUDE.md): dynamic and fluid; tools isolated.

## 9 — verbatim (the first paragraph is a line of the AI coder's, quoted back; the second is his):
  > Retro Wobble: synthesizing keeps one tool's voice and the other's motion, and you choose which by what you pick. Proven by a render you can listen to.
  > eravos makes it, not you. only add capability. always capability first.
  - RULE (CLAUDE.md): capability first — ERAVOS makes it, not the coder.

## 10 — verbatim:
  > Yes.
  - his yes to 3.216 (merged, PR #214).

## 11 — verbatim:
  > Also update the readme, with images if possible.
  - BUILT 3.218 (PR #215): the README current, with pictures; every older note kept under Release history.

## 12 — verbatim:
  > okay do the exploded note view for the screenshot also. marge and publish.
  - BUILT 3.219 (PR #216, 0.2.35).

## 13 — verbatim:
  > okay but did we choose to do the exploded view on the canvas for existing tools?
  - ANSWERED: yes — 3.196 / 3.201: every tool explodes on the canvas with MUTATE; swapping parts only between Wobble Bass, Retro DCO and
    made tools (part-exchange.js). OPEN: profiles for the rest (Supersaw, Swarm, Retro Poly, Piano, Tape Memory first).

## 14 — verbatim (with a screenshot of today's Start and a notification of the Claude app):
  > what is that? also the start from should only show after you pick music. like only show the domains at first.
  - ANSWERED: the notification was the Claude app's (this session's title), not ERAVOS.
  - BUILT 3.220 (PR #217, 0.2.36): Start in two steps — the domains first; a domain picked → its modes, songs, START FROM.

## 15 — verbatim (with a screenshot: a note in 3D · EXPLODED):
  > like this
  - BUILT 3.220: the README's picture of a note blown apart in 3D.

## 16 — verbatim:
  > also borderless windows please?
  - BUILT 3.220 (0.2.36): no Windows title bar; the toolbar is the window's top (titleBarOverlay). Unconfirmed on Windows.

## 17 — verbatim:
  > i want beautiful animations in eravos. also can we optimize the performance even more? like is it using my graphics card? like offloading? using all my cpu cores, ram? like is it optimized? at least until looking glass replaces electron.
  - ANSWERED (nothing built): the GPU composites by default (no flags set); one tool uses WebGL; sound is one audio thread, the UI one main
    thread (~3–4 cores used); no tuning set; 15 files run their own animation loop.
  - OPEN: specs/eravos.performance-plan.spec (PF0–PF8) · animations: the same spec, AN1–AN3 (shown as a video first).

## 18 — verbatim:
  > dont build just tell me

## 19 — verbatim:
  > i mean i have a 3700x, rtx 1650, 16 gbs or ram, like disabling animations, transitions. like lazy load, like real pixelated when zooming out, gpupu, like what about a simplified ui for tools. then they expand as you resize them?
  > good idea?
  - ANSWERED: yes — each placed as a phase in specs/eravos.performance-plan.spec (performance mode, lazy / off-screen pause, a simpler look
    zoomed out, tools that grow as they are resized — preview first, GPU for pictures not for sound).

## 20 — verbatim:
  > also:
  > what ever is on the canvas, is priority, like if its music, its audio, if its image manipulation, its images and audio if there is more, like it needs to remain agnostic. also the settings needs to be a real menu, that expands from the tools dag contract, like what is needed expands the options.
  - RULE (CLAUDE.md): priority follows what is on the canvas, agnostic — from the tools' declared needs, never a domain named by the canvas.
  - OPEN: specs/eravos.performance-plan.spec RP1–RP3 (resource needs in the contract, priority) · specs/eravos.settings-buttons-dag.map.spec
    ADDENDUM 2026-11-24 (ST1–ST5: Settings a real menu, its sections from what the tools on the canvas need).

## 21 — verbatim:
  > okay well no options and settings. organize or tidy up, don't need both. sounds or rhythms, and songs. metronome loop region in the canvas ui. need to clean up the noise. need to when choosing a domain. remove the start button from the corner and just have the add button, with a back to domain, in the top left corner of the catalog.
  - asked (four questions); he answered the first (22). The rest: OPEN with the reading recommended, in docs/TODO-LEDGER.md (T-06 … T-10)
    and specs/eravos.bare-canvas.spec ADDENDUM 2026-11-24 (TB1–TB7).

## 22 — verbatim (his answer to "Options and Settings: you don't need both. Where should Options' actions go?" — options were: Into Settings · Into right-click · Both):
  > first one, beyond removing the undo and redo, and redundany options. also log all of this, don't lose anything, update the specs, phases. and add that to a to do ledger
  - DECIDED: Options' actions go INTO SETTINGS; the Undo / Redo buttons are removed (Ctrl+Z / Ctrl+Shift+Z stay); redundant options removed.
  - DONE 3.221: this map, the specs' addenda and phases, docs/TODO-LEDGER.md (the to-do ledger), the his-words map, the register.

## 23 — verbatim:
  > needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu cores, animations, graphics acceloratoin. maybe invent a better driver
  - MEASURED (10 tools playing): main thread blocked ~46 % of each second, ~32 fps, stalls to 150 ms; the reactive colours nearly all of it
    (off: 60 fps, no long task). Inside them: one `offsetParent` read per window per frame forced the whole page's layout.
  - BUILT 3.222: the forced layout removed (IntersectionObserver); Settings › Performance (live numbers; Display rate, Reactive colours &
    glow, Animations, Resolution, Blur & shadows, Graphics acceleration on the next start); AUTO — "a better driver": the effects step down
    while the screen lags and come back with room. CPU cores: shown; spreading background work over them is PF6 (next).

## 24 — verbatim:
  > that is still not great. what about the audio driver or engine that electron uses?
  - ANSWERED: Chromium's Web Audio — one real-time thread for every tool, WASAPI shared mode (~10 ms), no ASIO / exclusive / device / buffer
    choice. Asked: is "still not great" the screen or the sound? (not answered yet)

## 25 — verbatim:
  > invent our own? specifically made more eravos?
  - ANSWERED: an engine of ERAVOS's own (not a driver): the DAG as the schedule across cores, tools isolated, everything live, synthesis in
    the engine, agnostic, live = offline, its own process.

## 26 — verbatim:
  > dynamic, load balancing, signal to noise? wait for emerge
  - DECIDED: the native engine is written in Emerge and waits for it (E2 / E3). DYNAMIC, LOAD BALANCING and SIGNAL TO NOISE written into
    specs/eravos.engine.spec (NEW, EN0–EN6); docs/TODO-LEDGER.md T-33 … T-38. Open: EN1 (today's stack) now?

## 27 — verbatim (2026-11-25):
  > i love the mutation and synthesis. can you expand to the rest of eravos?
  - BUILT 3.224 (shown first): Supersaw, Swarm Oscillator, Retro Poly, Piano and Tape Memory trade parts (part-exchange.js) and can be
    synthesized (tool-blend.js); what the engine cannot run yet is named, never faked. P218. ML1 continues for the rest.

## 28 — verbatim (2026-11-25; the first part quotes the AI coder's question, "just spec it" is his):
  > 1. EN1, now? Part of this needs no new language and works in today's ERAVOS: measure the audio thread's load, let silent tools sleep, end tails nobody can hear, add dither to exports, and add latency, sample-rate and output-device settings. It would help now and carries straight over to the Emerge engine. just spec it
  - SPECCED 3.224: specs/eravos.engine.spec ADDENDUM 2026-11-25 — EN1.1 measure · EN1.2 silent tools sleep · EN1.3 end what nobody hears ·
    EN1.4 clean exports (dither) · EN1.5 latency / sample rate / output device · EN1.6 denormals + headroom in every component. Nothing built.

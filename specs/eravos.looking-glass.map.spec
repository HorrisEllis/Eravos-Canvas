# eravos.looking-glass.map.spec — LOOKING GLASS replaces Electron, with a layered UI builder (mapped 2026-11-01 · status mapped)

## His words (2026-11-01)
  "the music changes the colors can you keep adding this stuff to looking glass." · "no im saying with looking glass its meant to replace
  electron completley, also have a ui builder, layered." · on the buttons preview: "i like edge, but the border and the white text should
  be the same." · "i chose d".
  This answers the open question in eravos.2026-10-22-brainstorm.map.spec (A, open 1): the goal is NO ELECTRON — Looking Glass is the
  desktop host. The path A1–A5 stands; this map turns A3–A5 into phases, and adds the UI builder.

## What exists (main, 2026-11-01)
  ERAVOS.exe = Electron (desktop/main.js, preload.js, build.mjs) hosting the canvas page, served by ERAVOS Glass (host/glass.js, Node).
  Looking Glass inside the page: canvas/runtime/glass-layer.js (3.82) — typed elements ('wash', 'glow', and 3.96 'rim': a gradient or
  rainbow ring that travels like RGB lighting), variables, layers made and removed at runtime, a motion budget, WGSL shaders (wgpu's
  language) + a 2D fallback. The Looking Glass bundle (README, SPEC v0.3, PHASEMAP v0.3) was shared in chat; it is not in the repo.
  Rust toolchain present in the build container (cargo, rustc).

## Decisions (the coder's, by his words; his to overturn)
  D-LG.1 Looking Glass is a native app host: Rust + winit (window) + wgpu (GPU, the same WGSL as glass-layer.js). One binary.
  D-LG.2 Electron goes FIRST, the browser engine goes LAST: the first Looking Glass build hosts today's canvas page in the system web view
         (WebView2 on Windows, WebKit on macOS/Linux, through wry) as ONE of its layers, so ERAVOS keeps working on day one; layers move
         from the page into Looking Glass one at a time; the web view is removed when nothing is left in it (A5).
  D-LG.3 The page's typed UI (glass-layer.js elements) is the SAME data Looking Glass draws natively — one schema, two renderers — so
         everything built now in the browser carries over.
  D-LG.4 The buttons: design D (RGB edge) is the first Looking Glass element style: smoked glass, a rainbow rim that travels while nothing
         plays, the text and icons the same rainbow as the rim, the glow growing with the sound. It ships in the browser first (as a
         theme part, his pick) and is rebuilt as a native element in LG3.

## Phases — each: build → tests → measured against Electron → pushed                                        status
  LG1 THE HOST. looking-glass/ (Rust): a borderless window, the wgpu renderer drawing layers, the canvas page in a web view layer,     mapped
      the file and process services Electron's preload gave the page (open/save, drag and drop, the Glass host, MIDI permission).
      ERAVOS Glass's serving moves into the binary (static files + the Glass API), so no Node either.
      Acceptance: ERAVOS.exe built with no Electron and no Node; it opens the canvas; desktop/test passes against it; size, start
      time and memory measured beside the Electron build (expected: tens of MB instead of ~150).
  LG2 NATIVE LAYERS. The shell — top bar, toasts, overlays, the window chrome — and the glass layer's elements (wash, glow, rim) drawn by mapped
      Looking Glass above the web view, from the same typed data; the page stops drawing them. Reactive colours become variables
      Looking Glass reads every frame (no page restyle at all).
  LG3 THE UI BUILDER (layered). A Looking Glass app for building UI as typed data:                                                 mapped
        layers   a stack (add, reorder, hide, lock, blend) — the shell, the canvas, overlays, effects
        elements typed: box, text, icon, button, toggle, segmented, knob, fader, keyboard, display, glow, rim — each with props
        states   rest · hover · on · pressed · disabled, each its own props
        variables bind any prop to a live value (sound level, a knob, the colour of the moment); motion as data (ease, travel)
        actions  element + target + action (ERAVOS's ui:<action>:<id>), so what is built is wired, not a picture
        preview  live, with sound driving the variables; save as data (.lg.json) that ERAVOS loads
      First things built with it: the D button set, then the top bar.
  LG4 FACES AS DATA (A2). UIKit's controls become Looking Glass element types; tool faces are converted (measured first: how many of the  mapped
      ~60 own-canvas faces fit), the rest keep their canvas as a 'display' element.
  LG5 NATIVE AUDIO (A4). The audio engine behind the same node API in Rust; one tool renders the same samples on both engines first.      mapped
  LG6 NO BROWSER (A5). The web view layer is empty and removed.                                                                     mapped

## Open, his
  (1) Is Looking Glass its own product (its own repo, ERAVOS its first app), or a folder inside ERAVOS? This map assumes looking-glass/
      inside ERAVOS until he says. (2) Does a web version of ERAVOS stay (in a browser, for sharing), drawn from the same typed data? This
      map keeps it possible (D-LG.3). (3) The look of the shell beyond the buttons (his Q9 in the bundle: frosted glass or neon).
  The bundle (SPEC v0.3, PHASEMAP v0.3) should be added to the repo (specs/looking-glass/) so the phases above can cite it.

## ADDENDUM 2026-11-01 (later) — Looking Glass is for ALL the projects; a UI editor agents use (Nexus); an extensive editor; more depth
  His words: "looking glass is for all of it. i also want a ui editor for nexus so i can cut down on tokens by having agents use it, but also
  having an extensive editor for all the rest of the proijects, also more deptj" — and before it: "b is also nice. why not add all of those to
  the themes".
  This answers open question (1): Looking Glass is ITS OWN PRODUCT — the UI host and UI editor for every project (ERAVOS, Nexus and the
  rest). ERAVOS is one app on it, not its owner. It lives in its own repo; ERAVOS consumes a released version. (Until that repo exists, the
  work starts in looking-glass/ here and moves out with its history.)

### Why an editor cuts tokens (the agent case, Nexus)
  Today an agent changes a UI by reading and writing code: whole files in, whole files out, every time. With Looking Glass the UI is DATA
  with a schema, and an agent sends small typed operations instead:
    { op: "set", el: "transport.play", prop: "variant", value: "rgb-edge" }      — a few dozen tokens, not a file
  The editor validates every operation against the schema (no broken UI), shows the result live, and keeps history, so an agent never has to
  read the whole UI to change one part: it asks for the slice it needs (query) and edits by id.

### The model (the same for people and agents)
  DOCUMENT   a project's UI: screens → layers → elements (a tree), plus tokens, components and data bindings; saved as .lg.json (text,
             diffable, reviewable in a pull request)
  LAYERS     ordered, each with blend, opacity, visibility, lock, a z-band (shell · content · overlay · effects · debug), and what may draw
             there; layers are created and removed at runtime (SPEC 2.2)
  ELEMENTS   typed, each with props, states and slots:
             layout   frame · stack (row/column, gap, align, wrap) · grid (tracks, areas) · scroll · split · dock · overlay
             content  text · icon · image · video · canvas (an app draws into it) · web (a web view, for what is not native yet)
             controls button · toggle · segmented · chip · menu · select · slider · knob · fader · xy · keyboard · stepper · input · tabs
             data     list · table · tree · graph · chart · meter · scope · timeline
             effects  wash · glow · rim · blur/frost · shadow · particle field
  STATES     rest · hover · pressed · focus · on · disabled · busy, each a set of prop overrides, with transitions between them
  VARIANTS   one element, several looks (the four button styles A–D are variants of `button`, with "the theme's own" as default)
  COMPONENTS reusable element trees with inputs (props) and slots; instances override; a change to the component updates every instance
  TOKENS     colour, type, space, radius, shadow, motion; themes are token sets (Dusk, Studio, Midnight …); per-project overrides
  VARIABLES  live values any prop can bind to (a sound level, a knob, the colour of the moment, an agent's status); typed, with ranges
  MOTION     data: eases, springs, keyframes, travel (the RGB rim), all on the variables; a motion budget (only what moves draws)
  ACTIONS    element + event + target + action (SPEC 2.3): what a control DOES, wired to the app's commands (ERAVOS ui:<action>:<id>,
             Nexus's agent commands), checked against what the app declares it accepts
  ACCESS     every control has a role, a label, a keyboard path and a focus order; contrast checked against the tokens
  VERSIONS   every change is an operation in a log (undo, redo, replay, blame: person or agent); branches for trying a layout

### The editor (people) — extensive
  Panels: layers · element tree · canvas (live, zoom, rulers, snapping, multi-select, align/distribute) · inspector (props, states, variants,
  bindings) · tokens · components · assets · actions · history (the operation log, filter by agent) · preview (with live variables: play a
  sound, simulate an agent) · problems (schema, contrast, missing labels, unbound actions). Device frames and window sizes; responsive rules.

### The agent interface (Nexus) — small, typed, safe
  A protocol both the editor and agents speak (an MCP server and a local socket):
    query(path | selector, fields)      → just the slice asked for (ids, types, the props named)
    op(list)                            → set · add · remove · move · wrap · bind · state · variant · style (token) — validated, atomic
    preview(screen, variables)          → a picture (for an agent that checks its work) and the problems list
    explain(id)                         → what this element is, what it is bound to, what uses it (from the DAGs, eravos.settings-buttons-dag S3)
    history(since)                      → the operations since a point; revert(op)
  Budgets: an agent's operations are limited to the screens and layers it is given; every op is logged with who made it.
  Measured goal: changing one control costs an agent under 200 tokens of UI traffic (today: the whole file it lives in).

### Renderers
  native (wgpu, the WGSL already in glass-layer.js) · web (the browser, for sharing and for ERAVOS today) · a test renderer (headless,
  pixel and layout checks). One document, three renderers, the same picture (tested).

### Phases (replace LG1–LG6 order; ERAVOS's path A1–A5 stays inside them)
  LG0 the repo and the schema: the document format (.lg.json), element types, tokens, operations — with validators and examples         mapped
  LG1 the host: the native window + wgpu renderer + a web view element; ERAVOS runs in it (no Electron)                                 mapped
  LG2 the agent interface first (query / op / preview / explain / history) over the schema, with the web renderer — so Nexus agents can   mapped
      edit UI before the editor exists; measured token cost per change
  LG3 the editor (people): layers, tree, canvas, inspector, tokens, components, history, preview, problems                              mapped
  LG4 ERAVOS's shell and buttons as Looking Glass documents (the four button variants, the themes as token sets)                        mapped
  LG5 Nexus's UI as Looking Glass documents, edited by its agents                                                                       mapped
  LG6 tool faces as data (A2), native audio (A4), no browser (A5)                                                                       mapped

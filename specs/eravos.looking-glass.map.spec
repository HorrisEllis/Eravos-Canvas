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

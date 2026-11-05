# ERAVOS — notes for Claude

Read this first, then `PROGRESS.md` (the detailed log, newest first) and the spec of whatever you touch (`specs/`, each tool's `.spec`).

## Direction

**Now (2026-11-05): build ERAVOS v1 — a creative canvas to create creatively, and to connect with people.**
> "i feel like we should build this. then keep note for eravos v2. i want to cotinue and build something that i can connect with
> people with. thats the point of it also. creative canvas to create creatively"
- v1 = today's stack (Electron + JS + Web Audio), shipped and updated through releases. All new work goes here.
- v2 = ERAVOS on Emerge + Looking Glass — **a note, not the current work**: `docs/eravos-v2-emerge-looking-glass.md`.

### ERAVOS v2 (kept as a note) — his words, 2026-11-04

> "i want to replace all the js with emerge and looking glass to make a full bottom up fully integrated program for eravos to beat ableton."

- **Emerge**: his language (`.eg`), in `HorrisEllis/Nexus` → `emerge/`. Compiles to CommonJS today (`eg build`); a native compiler
  (Linux x86-64 ELF) builds itself; the Windows target is the next step in its own spec (`cie-eg.spec`, `native_windows`).
- **Looking Glass**: his own UI renderer and app host (not Chromium): UI as typed data, layers as a runtime operation, variables,
  motion as data, GPU. Spec v0.3 + phase map, **nothing built yet**. Kept here as `docs/looking-glass/` (SPEC.md, PHASEMAP.md).
- **Decided 2026-11-05:** Looking Glass replaces Electron and is written **all in Emerge**; Emerge is finished first, bottom up
  ("Emerge needs to get finished to the point of being able to have you code with it"). The road: E1–E4, LG1+, C1 in the plan below.
- The plan from today's ERAVOS (Electron + 52 k lines of JS + Web Audio) to that: `docs/eravos-v2-emerge-looking-glass.md`.
  Bottom up, one proven layer at a time; the sound must not change (the null render) at any step.

## Rules that hold

- **Show him first, or add — never change the look over him** (2026-11-05: "always show me or add more themes before change"): a visual
  change is shown to him (screenshots / a preview) before it merges, or it arrives as a new choice (a theme, a button style, a material)
  with today's look as the default. Bug fixes that put a look back to what it was are not changes.
- **Canvas and content stay separate** (2026-11-05: "i want to keep the canvas and content seperate"): `canvas/` is the host — windows,
  wires, kit, themes, reactive surfaces, tool pages — and names no tool, topic or domain word; `tools/<domain>/` is the content — tools,
  components, packs, suites, data, and the words a domain gives the canvas (e.g. ToolPage.ioWords). `tests/boundary.test.js` enforces it.
- **Design guide** (2026-11-05: "i want consistency across all of them. and a template or schema for a design guide or philospophy to
  maintain consistency"): `docs/DESIGN-GUIDE.md` is the one place the look is decided; a new tool's UI is written with
  `docs/templates/TOOL-UI.md` and shown to him first; `node tests/design-check.mjs` must not get worse (and must be clean for a new tool).
- **Black surfaces, colours as they are** (2026-11-05: "i dont like the tint. everything but the colors should be what they are. make
  them darker even. like black"): no surface carries a tool's colour or a cast; only what is a colour has colour. BlackSurfaces enforces it.

- **Systems all the way down, fluid, not boxes** (2026-11-05): component → tool → suite → project, one mechanism (wires) at every
  scale, each level opens as a canvas; membership is wiring, overlap is normal, depth added to a component reaches everything
  holding it. `specs/eravos.suites.spec` ADDENDUM 2026-11-05 (F1–F5).

- **No toys** (his words, 2026-11-05: "It's not a toy replaying sounds … I want it to stay that way. No toys."). Every instrument makes
  its sound live — oscillators, filters, shapers, modulation — like Wobble Bass: no shipped recordings, no sample playback dressed up
  as an instrument, every preset is settings the engine rebuilds. Samplers work only on the user's own audio. Full depth, nothing
  outside the user's control. `node tests/no-toys.mjs` guards it (in the release build).

- Windows is the real target; one-run install (`Install ERAVOS.bat`). Your work lives in `Documents\ERAVOS`, never in the app folder.
- No Playwright. Pages are driven by Clear Glass's driver, `host/driver/glass.js` (also app mode: `electron.launch`). `node tests/no-playwright.mjs`.
- Refactors prove "no change in sound": `node tests/components.mjs` (plain node) and the null render (`Null Render.bat`, needs a browser).
- Tests: `node tests/run.mjs <phase or name>` (the in-page suite, through the driver). New behaviour gets a `tests/pNN-*.test.js`.
- Releasing: set `"version"` in `desktop/package.json`, merge, then Actions › release › Run workflow with **release** on (or push tag vX.Y.Z).
- **Proof of competency** (his ask, 2026-11-05): every finished piece adds an entry to `docs/PROOF-OF-COMPETENCY.md` — merge time,
  his words dated, his call, what was built (by the AI coder to his direction), the proof measured, where to check. No claim without a pointer.
- Commit messages and PRs carry no model names. Do not push to `main` directly: branch, PR, merge.

## Ledger — completed work

Newest first. One line per piece; the detail is in `PROGRESS.md` and the commit.

| Date | Work | Where | Proof |
|---|---|---|---|
| 2026-11-05 | **Piano roll easier + Timeline right-click**: one row of controls (rest under More ▾); Pattern picker replaces Fill; easier sizing (6–12 px ends, grips, offset kept, Ctrl+←/→); options Clip look (notes like Song Recorder clips, waveform inside) and Canvas zoom (wheel zooms time + pitch, 4–40 px rows, middle-drag pans); Timeline: ✂ Split button removed, right-click a selected stretch / clip / spot (Split here, Loop this stretch, Delete what is in it — clip_clear_at) | `timeline.pianoroll.js`, `timeline.ui.js`, `timeline.engine.js` | P113 3/3, P114 2/2, P115 2/2; Timeline 86/86, piano 35/35, boundary 10/10; full suite on main before: 1379/1382 (P84 fixed here; P82 ×2 known) |
| 2026-11-05 | **Release v0.2.3** — Settings page, Connect edges + the roll as a proper window (3.112, from the other session's unmerged branch), background updates (3.111) | `desktop/package.json`, `docs/release-notes.txt` | P112 3/3, P109 2/2, P76 4/4, P110 2/2, boundary 10/10; the release run's Setup exe + zip |
| 2026-11-05 | **Settings is a page, not a dropdown**: ⚙ Settings (toolbar, Ctrl+,) — one page like the tool pages, a tab per section (Look, Reactive colours, Sound, About & updates); sections contributed (AppSettings.addSection); ⋯ Options keeps only actions | `canvas/runtime/app-settings.js`, `themes.js`, `updates.js`, `tools/music/core/react-panel.js`, `proximity.js` | `tests/p110-settings.test.js` 2/2; P77 P91 P99 moved to the page; boundary 10/10; design check no worse · PR #88 |
| 2026-11-05 | **Release v0.2.2** — Timeline: Sketch draws one smooth connected note (pitch-path component); the piano roll fills its width; option: the roll in its own borderless window (CanvasWM.openPanel) | `tools/music/components/pitch-path/`, `timeline.pianoroll.js`, `timeline.ui.js`, `canvas/runtime/canvas-wm.js` | P108 2/2, P109 2/2, pitch-path 214 checks; Timeline 84/84, piano 27/27, bend 16/16, boundary 10/10; design check no worse · PR #87 |
| 2026-11-05 | **Release v0.2.1** (the colour fix, Material, dice gone) | `desktop/package.json`, `docs/release-notes.txt` | the release run's Setup exe + zip |
| 2026-11-05 | **Reactive colours no longer compound**: mode changes / switching off left each window's lit palette (the plug, --rcs-*) behind and the next lighting took it as its base; black-surface darkening was applied again on already-neutral colours. Both fixed; borders, outlines and shadows treated as surfaces from the start. Dice icons removed (words instead). **Material** (None · Grain · Brushed · Carbon) added beside the theme, default None | `tools/music/core/sound-css.js`, `canvas/runtime/black-surfaces.js`, `themes.js`, `eravos.css` | `tests/p106-reactive-drift.test.js` 2/2 (fails on the old code: the plug's amber crept, darkening applied twice); real playback path 0 of 3,017 colours changed (was 6+), synthetic 221 → 0 visible |
| 2026-11-05 | **Release v0.2.0** (black surfaces, Beat colour, tool pages, consistency, design guide); canvas/content separation made a standing rule | `desktop/package.json`, `docs/release-notes.txt`, CLAUDE.md | the release run's Setup exe + zip |
| 2026-11-05 | **Design guide + design check**: philosophy, rules S/C/K/W/N each with his words; the new-tool UI template; every tool opened and measured (D1 surfaces · D2 kit sizes · D3 labels · D4 kit buttons · D5 one primary · D6 colour family), baseline can only improve, runs on every PR. Fixed: Dusk gradients from the tool's own colour family (Tape Echo's Throw), kit `sm` size (Timeline/Sequencer), one primary per window, MIDI Map / Session / piano roll on tokens | `docs/DESIGN-GUIDE.md`, `docs/templates/TOOL-UI.md`, `tests/design-check.mjs`, `.github/workflows/checks.yml` | 45 → 52 of 69 tools pass every rule; D1 D2 D3 D5 D6 at 0; D4 119 (play surfaces, baseline); full suite 1,367/1,371 (the 4: P82 ×2 and P74 on main too; boundary fixed) |
| 2026-11-05 | **Black surfaces**: every surface (page, canvas, windows, cards, wells, button fills, drawn display backgrounds) is neutral near-black — no tool colour, no blue cast, no dusk sky; colours untouched. Stylesheets, inline styles and canvas drawing all pass through BlackSurfaces (new tools too). "Light over the tools" (opt-in) still washes | `canvas/runtime/black-surfaces.js`, `eravos.css`, `ui-kit.js` | `tests/p103-black-surfaces.test.js` 3/3; tinted surfaces across all tools 1,000+ → 30 (served build); P91/P83 updated to the new rule |
| 2026-11-05 | Reactive colours › **Beat**: every tool, the toolbar and tool pages share one colour (the theme's own accents, in turn), moving on the transport's beat (when heard), every beat / 2 beats / bar, flash = Amount; surfaces and greys keep theirs; no restyle | `tools/music/core/sound-css.js`, `react-panel.js`, `eravos.css` | `tests/p102-beat-colour.test.js` 1/1 (13 checks); P48c P58 P73 P77 P83 P84 green; P82's 2 failures are on main too |
| 2026-11-05 | Phase 1 begins: **filter-svf** (35 planned tools stand on it) — Simper's zero-delay-feedback SVF, 9 modes, 12/24/36 dB, detune input, AudioWorklet = the tested kernel | `tools/music/components/filter-svf/` | 29 measured checks (−3.01 dB at cutoff, slopes ±1.2 dB, notch < −60 dB, bell/shelves, 20 s self-oscillation bounded, denormals, no allocation); worklet = kernel in the engine (< −60 dB); 193 ns/stereo sample |
| 2026-11-05 | Tool pages cleaned up (fixed size, compact head, no nested scroll, packs, controls, in/out in words); knob labels no longer collide (89 → 17) | `canvas/runtime/eravos.css`, `tool-page.js` | before/after shown, approved ("that looks nice as hell"); P21 P45 P48 P49 P58 P63 P70 P91 green · PR #81 |
| 2026-11-05 | The next phases as a dependency graph from the specs | `build/eco-graph.mjs` → `docs/eco-graph.md` | 107 components, 107 tools; leverage computed |
| 2026-11-05 | Proof-of-competency record: credit stated plainly, checkable numbers, resume lines, a timestamped ledger with provenance (merge times, his dated words, proof, where to check), every merged PR since 2026-10-15 | `docs/PROOF-OF-COMPETENCY.md` | every figure has the command that counts it |
| 2026-11-05 | Decided: Looking Glass in Emerge, Emerge first; the road E1 (native_lang F5) · E2 (native_windows) · E3 calling Windows (multi-DLL imports, Win64 calls, memory, callbacks, COM) · E4 axiom · LG1 window + rect from data (software, then GPU) · C1 canvas | `docs/eravos-v2-emerge-looking-glass.md` | — (a plan, measured against Emerge f023240) |
| 2026-11-05 | P0.5 filter-formant: one vowel table (10 vowels) + one formant bank for Wobble Bass and Wub Filter (they had drifted: UH IH ER / YOI / AE −14 vs −12 dB). Wobble Bass gains YOI; Wub Filter gains UH, IH, ER (its AE kept −12 so nothing changes — his call) | `tools/music/components/filter-formant/` | 5,220 checks bit-identical; null render Wobble Bass 38/38 (worst −87.6 dB), Wub Filter 8/8 (7 presets unstable, unproven); Wobble 39/39, Wub 59/59, P94 2/2 |
| 2026-11-05 | P0.4 duplicate finder: every tool's code tokenised, shared blocks code vs settings, report | `build/duplicates.mjs` → `docs/duplicates.md` | ~9 % of tool code repeats another tool (40-token windows) |
| 2026-11-05 | Null render: `--record <tool>` no longer wipes other tools' baselines | `tests/null-render.mjs` | recorded two tools, both checked |
| 2026-11-05 | No toys: the rule, and a guard — no recordings shipped or baked into code, no instrument loads recorded audio (5 samplers work on your own audio only) | `tests/no-toys.mjs`, release build, CLAUDE.md | passes today; a planted `decodeAudioData` in Wobble Bass fails it |
| 2026-11-05 | Specs: ecosystem v0.2.0 + object model, temporal, timeline depth, canvas family, product vision; 113 tool specs, 104 component specs (targets, not built). scene-morph, macro-rack, contrast-engine: new entry on top, the original kept verbatim below | `specs/`, `tools/music/planned/`, `tools/music/components/*/`, `docs/specs/README-ecosystem-0.2.0.md` | `node build/validate.mjs` 234 valid; `node tests/components.mjs` pass |
| 2026-11-04 | Release v0.1.0: Actions › release › Run workflow with "release" on makes the tag + release (a session cannot push tags) | `.github/workflows/release.yml` | the run's Setup exe + zip on the release |
| 2026-11-04 | Plan: ERAVOS onto Emerge + Looking Glass, bottom up (phases EL0–EL9, decisions open) | `docs/eravos-v2-emerge-looking-glass.md`, `docs/looking-glass/` | — (a plan) |
| 2026-11-04 | Delete packs, presets, kits and patterns for good (shipped ones too), remembered across restarts | `canvas/runtime/content-packs.js`, `pack-editor.js`, `tool-page.js`, `tools/music/data/pattern-library.js` | `tests/p100-delete.test.js` 3/3; P21, P71, P73, P76 green · PR #72 |
| 2026-11-04 | Playwright removed: the driver gained app mode (`electron.launch`, `firstWindow`, dialogs); desktop tests + sound audit moved to it | `host/driver/glass.js`, `desktop/test/*.mjs`, `build/sound-audit.mjs` | `tests/no-playwright.mjs` 0 exceptions · PR #72 |
| 2026-11-04 | One-run system install: `Install ERAVOS.bat` elevates, builds, installs to Program Files, shortcuts, Settings › Apps, starts | `Install ERAVOS.bat`, `packaging/windows/install.ps1`, `uninstall.ps1` | PowerShell parser clean; not yet run on Windows · PR #71 |
| 2026-11-04 | `ERAVOS-Setup-<version>.exe` (NSIS), built by `make-exe.ps1`, attached to releases; updater runs it elevated | `packaging/windows/eravos.nsi`, `.github/workflows/release.yml`, `desktop/updater.js` | compiles with makensis 3.09 · PR #71 |
| 2026-11-04 | Library = `Documents\ERAVOS` (projects, exports, packs, tools, drop, .appdata); old folders move in once | `desktop/main.js` | exercised with a stubbed Electron · PR #71 |
| 2026-11-04 | P0.1–P0.3 shared music components (wave-table, note-release, progression) + null-render harness | `tools/music/components/`, `tests/null-render*.mjs` | `node tests/components.mjs` all pass · PR #70 |

## Next (the build order) — 2026-11-05

> "show the the ui before any tools get built. they should be consistent. also reactive … like i want them to be the same color and
> change to the beat. just contirnue. start bottom up, then the highest leverage. use a dependancy graph"
> Then: "i meant for the work one the next phases. hell no on that ui. i like what it is now."

- **The UI stays as it is.** No restyle, no new kit. (A unified-kit preview was shown and rejected, 2026-11-05.)
- **Every NEW tool's UI is shown to him before the tool is built** (a preview he approves), consistent with the tools as they are.
- **Beat colour** — built (3.102, Reactive colours › Beat).
- **Phase 1 order** (docs/eco-graph.md): filter-svf ✓ → lfo (24) → osc-va (20) → waveshaper (19) → env-adsr (17) → env-msseg (14) → … then its 7 tools, each shown to him as a UI preview first.
- **Next phases, bottom up, highest leverage first, from a dependency graph built from the specs**: `node build/eco-graph.mjs` →
  `docs/eco-graph.md` (which components the planned tools stand on, how many each reaches, what is ready to build).

## Open (asked, not done)

- Connecting with people (share as a link, remix with credit, play together, share packs) — pinned 2026-11-05.
- Songs as a rhythm-exploring tool only (not usable for making music).
- Patterns for each tool with variety: presets, depth, curves, per-note editing — everything the timeline can do.
- Delete the merged branch `claude/nice-dirac-t64qeo` (a session could not: deleting a remote branch needs his permission).
- Emerge work (E1–E3) needs a session with push access to `HorrisEllis/Emerge`. E4: widen Emerge's "only kernel32" axiom for the UI host? (his call)
- AE vowel: Wub Filter's third band −12 dB vs the table's −14 dB (his call).

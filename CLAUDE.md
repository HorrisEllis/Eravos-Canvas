# ERAVOS — notes for Claude

Read this first, then `PROGRESS.md` (the detailed log, newest first) and the spec of whatever you touch (`specs/`, each tool's `.spec`).

## Direction (his words, 2026-11-04)

> "i want to replace all the js with emerge and looking glass to make a full bottom up fully integrated program for eravos to beat ableton."

- **Emerge**: his language (`.eg`), in `HorrisEllis/Nexus` → `emerge/`. Compiles to CommonJS today (`eg build`); a native compiler
  (Linux x86-64 ELF) builds itself; the Windows target is the next step in its own spec (`cie-eg.spec`, `native_windows`).
- **Looking Glass**: his own UI renderer and app host (not Chromium): UI as typed data, layers as a runtime operation, variables,
  motion as data, GPU. Spec v0.3 + phase map, **nothing built yet**. Kept here as `docs/looking-glass/` (SPEC.md, PHASEMAP.md).
- **Decided 2026-11-05:** Looking Glass replaces Electron and is written **all in Emerge**; Emerge is finished first, bottom up
  ("Emerge needs to get finished to the point of being able to have you code with it"). The road: E1–E4, LG1+, C1 in the plan below.
- The plan from today's ERAVOS (Electron + 52 k lines of JS + Web Audio) to that: `docs/emerge-looking-glass-migration.md`.
  Bottom up, one proven layer at a time; the sound must not change (the null render) at any step.

## Rules that hold

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
- Commit messages and PRs carry no model names. Do not push to `main` directly: branch, PR, merge.

## Ledger — completed work

Newest first. One line per piece; the detail is in `PROGRESS.md` and the commit.

| Date | Work | Where | Proof |
|---|---|---|---|
| 2026-11-05 | Decided: Looking Glass in Emerge, Emerge first; the road E1 (native_lang F5) · E2 (native_windows) · E3 calling Windows (multi-DLL imports, Win64 calls, memory, callbacks, COM) · E4 axiom · LG1 window + rect from data (software, then GPU) · C1 canvas | `docs/emerge-looking-glass-migration.md` | — (a plan, measured against Emerge f023240) |
| 2026-11-05 | P0.5 filter-formant: one vowel table (10 vowels) + one formant bank for Wobble Bass and Wub Filter (they had drifted: UH IH ER / YOI / AE −14 vs −12 dB). Wobble Bass gains YOI; Wub Filter gains UH, IH, ER (its AE kept −12 so nothing changes — his call) | `tools/music/components/filter-formant/` | 5,220 checks bit-identical; null render Wobble Bass 38/38 (worst −87.6 dB), Wub Filter 8/8 (7 presets unstable, unproven); Wobble 39/39, Wub 59/59, P94 2/2 |
| 2026-11-05 | P0.4 duplicate finder: every tool's code tokenised, shared blocks code vs settings, report | `build/duplicates.mjs` → `docs/duplicates.md` | ~9 % of tool code repeats another tool (40-token windows) |
| 2026-11-05 | Null render: `--record <tool>` no longer wipes other tools' baselines | `tests/null-render.mjs` | recorded two tools, both checked |
| 2026-11-05 | No toys: the rule, and a guard — no recordings shipped or baked into code, no instrument loads recorded audio (5 samplers work on your own audio only) | `tests/no-toys.mjs`, release build, CLAUDE.md | passes today; a planted `decodeAudioData` in Wobble Bass fails it |
| 2026-11-05 | Specs: ecosystem v0.2.0 + object model, temporal, timeline depth, canvas family, product vision; 113 tool specs, 104 component specs (targets, not built). scene-morph, macro-rack, contrast-engine: new entry on top, the original kept verbatim below | `specs/`, `tools/music/planned/`, `tools/music/components/*/`, `docs/specs/README-ecosystem-0.2.0.md` | `node build/validate.mjs` 234 valid; `node tests/components.mjs` pass |
| 2026-11-04 | Release v0.1.0: Actions › release › Run workflow with "release" on makes the tag + release (a session cannot push tags) | `.github/workflows/release.yml` | the run's Setup exe + zip on the release |
| 2026-11-04 | Plan: ERAVOS onto Emerge + Looking Glass, bottom up (phases EL0–EL9, decisions open) | `docs/emerge-looking-glass-migration.md`, `docs/looking-glass/` | — (a plan) |
| 2026-11-04 | Delete packs, presets, kits and patterns for good (shipped ones too), remembered across restarts | `canvas/runtime/content-packs.js`, `pack-editor.js`, `tool-page.js`, `tools/music/data/pattern-library.js` | `tests/p100-delete.test.js` 3/3; P21, P71, P73, P76 green · PR #72 |
| 2026-11-04 | Playwright removed: the driver gained app mode (`electron.launch`, `firstWindow`, dialogs); desktop tests + sound audit moved to it | `host/driver/glass.js`, `desktop/test/*.mjs`, `build/sound-audit.mjs` | `tests/no-playwright.mjs` 0 exceptions · PR #72 |
| 2026-11-04 | One-run system install: `Install ERAVOS.bat` elevates, builds, installs to Program Files, shortcuts, Settings › Apps, starts | `Install ERAVOS.bat`, `packaging/windows/install.ps1`, `uninstall.ps1` | PowerShell parser clean; not yet run on Windows · PR #71 |
| 2026-11-04 | `ERAVOS-Setup-<version>.exe` (NSIS), built by `make-exe.ps1`, attached to releases; updater runs it elevated | `packaging/windows/eravos.nsi`, `.github/workflows/release.yml`, `desktop/updater.js` | compiles with makensis 3.09 · PR #71 |
| 2026-11-04 | Library = `Documents\ERAVOS` (projects, exports, packs, tools, drop, .appdata); old folders move in once | `desktop/main.js` | exercised with a stubbed Electron · PR #71 |
| 2026-11-04 | P0.1–P0.3 shared music components (wave-table, note-release, progression) + null-render harness | `tools/music/components/`, `tests/null-render*.mjs` | `node tests/components.mjs` all pass · PR #70 |

## Next (the build order)

From `docs/specs/README-ecosystem-0.2.0.md` and `specs/eravos.music-ecosystem.spec` §13:
1. `specs/eravos.object-model.spec` + `specs/eravos.temporal.spec` — one store, one time model — before anything is built on them.
2. Components phase 0: extract the shared parts with no sound change. Exit: Wobble Bass, Reese, Supersaw, Retro Poly, Acid, Sub
   re-assembled from components and nulling; a 20-tool scene ≤ 50 % CPU. P0.1–P0.3 done; P0.4 = a real duplicate finder first.
3. Then phases 1–7 of §13 (foundation, rhythm, signature, scenes, space, environment, inventions).
Note §11/§7: Emerge describes graphs and never runs per sample; DSP goes to a WASM worklet tier. The migration plan's EL7 follows that.

## Open (asked, not done)

- Songs as a rhythm-exploring tool only (not usable for making music).
- Patterns for each tool with variety: presets, depth, curves, per-note editing — everything the timeline can do.
- Delete the merged branch `claude/nice-dirac-t64qeo` (a session could not: deleting a remote branch needs his permission).
- Emerge work (E1–E3) needs a session with push access to `HorrisEllis/Emerge`. E4: widen Emerge's "only kernel32" axiom for the UI host? (his call)
- AE vowel: Wub Filter's third band −12 dB vs the table's −14 dB (his call).

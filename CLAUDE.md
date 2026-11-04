# ERAVOS — notes for Claude

Read this first, then `PROGRESS.md` (the detailed log, newest first) and the spec of whatever you touch (`specs/`, each tool's `.spec`).

## Direction (his words, 2026-11-04)

> "i want to replace all the js with emerge and looking glass to make a full bottom up fully integrated program for eravos to beat ableton."

- **Emerge**: his language (`.eg`), in `HorrisEllis/Nexus` → `emerge/`. Compiles to CommonJS today (`eg build`); a native compiler
  (Linux x86-64 ELF) builds itself; the Windows target is the next step in its own spec (`cie-eg.spec`, `native_windows`).
- **Looking Glass**: his own UI renderer and app host (not Chromium): UI as typed data, layers as a runtime operation, variables,
  motion as data, GPU. Spec v0.3 + phase map, **nothing built yet**. Kept here as `docs/looking-glass/` (SPEC.md, PHASEMAP.md).
- The plan from today's ERAVOS (Electron + 52 k lines of JS + Web Audio) to that: `docs/emerge-looking-glass-migration.md`.
  Bottom up, one proven layer at a time; the sound must not change (the null render) at any step.

## Rules that hold

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
| 2026-11-04 | Release v0.1.0: Actions › release › Run workflow with "release" on makes the tag + release (a session cannot push tags) | `.github/workflows/release.yml` | the run's Setup exe + zip on the release |
| 2026-11-04 | Plan: ERAVOS onto Emerge + Looking Glass, bottom up (phases EL0–EL9, decisions open) | `docs/emerge-looking-glass-migration.md`, `docs/looking-glass/` | — (a plan) |
| 2026-11-04 | Delete packs, presets, kits and patterns for good (shipped ones too), remembered across restarts | `canvas/runtime/content-packs.js`, `pack-editor.js`, `tool-page.js`, `tools/music/data/pattern-library.js` | `tests/p100-delete.test.js` 3/3; P21, P71, P73, P76 green · PR #72 |
| 2026-11-04 | Playwright removed: the driver gained app mode (`electron.launch`, `firstWindow`, dialogs); desktop tests + sound audit moved to it | `host/driver/glass.js`, `desktop/test/*.mjs`, `build/sound-audit.mjs` | `tests/no-playwright.mjs` 0 exceptions · PR #72 |
| 2026-11-04 | One-run system install: `Install ERAVOS.bat` elevates, builds, installs to Program Files, shortcuts, Settings › Apps, starts | `Install ERAVOS.bat`, `packaging/windows/install.ps1`, `uninstall.ps1` | PowerShell parser clean; not yet run on Windows · PR #71 |
| 2026-11-04 | `ERAVOS-Setup-<version>.exe` (NSIS), built by `make-exe.ps1`, attached to releases; updater runs it elevated | `packaging/windows/eravos.nsi`, `.github/workflows/release.yml`, `desktop/updater.js` | compiles with makensis 3.09 · PR #71 |
| 2026-11-04 | Library = `Documents\ERAVOS` (projects, exports, packs, tools, drop, .appdata); old folders move in once | `desktop/main.js` | exercised with a stubbed Electron · PR #71 |
| 2026-11-04 | P0.1–P0.3 shared music components (wave-table, note-release, progression) + null-render harness | `tools/music/components/`, `tests/null-render*.mjs` | `node tests/components.mjs` all pass · PR #70 |

## Open (asked, not done)

- Songs as a rhythm-exploring tool only (not usable for making music).
- Patterns for each tool with variety: presets, depth, curves, per-note editing — everything the timeline can do.
- Delete the merged branch `claude/nice-dirac-t64qeo` (a session could not: deleting a remote branch needs his permission).
- The migration's open decisions (EL0 in the plan).

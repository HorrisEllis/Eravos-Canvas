# ERAVOS on Emerge + Looking Glass — migration plan (v0.1, draft)

Asked 2026-11-04: *"replace all the js with emerge and looking glass to make a full bottom up fully integrated program for eravos to
beat ableton."*

## Where things stand (measured, not assumed)

| Piece | Today | What it means for the move |
|---|---|---|
| ERAVOS | 519 JS files, ~52 k lines; Electron (Chromium) window; sound = Web Audio (268 node creations: filters, oscillators, worklets); UI = DOM + CSS | Three things to replace, not one: the **logic** (JS), the **window and UI** (Chromium/DOM), the **sound engine** (Web Audio) |
| Emerge (`Nexus/emerge`) | Language with checker, interpreter, compiler to **CommonJS for Node**; native compiler for **Linux x86-64** builds itself; Windows target is the next item in `cie-eg.spec` | ERAVOS logic can move to `.eg` once Emerge emits code the app's page can load (no `require`, no `__filename`). Native ERAVOS on Windows waits for Emerge's Windows target |
| Looking Glass (`docs/looking-glass/`) | Spec v0.3 and a 12-phase map; **nothing built**; spec says a single native exe (Rust, Zig or C++) | Replaces Electron + DOM. It has to be built first, phase 1 upward |

So "replace all the JS" is a sequence, and each step must leave a working ERAVOS that sounds identical (null render PASS).

## The order — bottom up, each layer proven before the next

| Phase | What | Depends on | Exit test |
|---|---|---|---|
| **EL0** | Decisions (below) | — | his answers written here |
| **EL1** | Emerge **browser target**: `eg build --target page` emits a script the ERAVOS page loads (an IIFE/ESM bundle of the runtime, no Node APIs). Built in the Emerge repo, used here | Emerge | an `.eg` file loaded in `tests/run.html` passes its own `test` blocks |
| **EL2** | First ERAVOS code in Emerge: `tools/music/components/` (wave-table, note-release, progression) rewritten in `.eg`, compiled with EL1, swapped in | EL1 | `node tests/components.mjs` — the same 14 000 checks, bit-identical — and null render PASS |
| **EL3** | Pure logic → `.eg`, leaf first: music theory, pattern library, song engine data, content packs, intake, the kernel bus | EL2 | each module's existing tests unchanged and green; null render PASS |
| **EL4** | Tool engines → `.eg` (control logic only; DSP still Web Audio). One category at a time | EL3 | per tool: its tests + null render for every preset |
| **EL5** | Emerge **native Windows target** (PE, kernel32) — in the Emerge repo (`native_windows`) | Emerge | `emerge.exe` rebuilds itself byte for byte on Windows |
| **EL6** | **Looking Glass** phases 0–4 (window + rectangle from data → elements, variables → layers → motion), in the language decided at EL0 | EL5 (if in Emerge) | its own phase-map exit tests; then one ERAVOS tool face drawn from its `define()` descriptor (tools are already data: config schemas) |
| **EL7** | **Native sound engine**: audio device (WASAPI on Windows), a graph with a sample-accurate clock, then every DSP block ported (filters, oscillators, wave tables, effects) | EL5 | null render against the Web Audio baselines: every preset PASS (≥ 60 dB under), CPU budget per voice |
| **EL8** | ERAVOS UI on Looking Glass: canvas, windows, wires, timeline, piano roll as typed data; Glass (host) speaks to it | EL6, EL4 | the in-page suite's behaviour tests re-pointed at Looking Glass, green |
| **EL9** | Drop Electron and Chromium. One native `ERAVOS.exe`, the same installer and library | EL7, EL8 | install on a clean Windows PC, open, play the Future Bass song, bounce a WAV identical to today's |

"Beat Ableton" sits on EL7 + EL8: latency, a timeline/arrangement that is data all the way down, and tools that grow live.

## EL0 — decisions only he can make

1. **Looking Glass's language.** Its spec says Rust/Zig/C++ for one static exe. "All Emerge" means writing it in Emerge, which needs
   Emerge native on Windows (EL5) plus GPU and window bindings first. Proposed: Emerge, with EL5 first.
2. **Where Looking Glass lives.** Its own repo, Nexus, or inside ERAVOS. Proposed: its own repo (it hosts more than ERAVOS).
3. **The sound engine's home.** Inside Looking Glass's host, or a separate ERAVOS audio process. Proposed: an ERAVOS module on the host.
4. **Keep shipping meanwhile?** Proposed: yes — every phase up to EL8 runs inside today's Electron app, so ERAVOS keeps working and
   updating while it moves.

## Rules for every phase

- Never a big-bang rewrite: one module at a time, old and new side by side until the new one proves identical.
- Sound is proven, not listened to: `tests/components.mjs`, the null render (`Null Render.bat`).
- The ledger in `CLAUDE.md` gets one line per finished phase.

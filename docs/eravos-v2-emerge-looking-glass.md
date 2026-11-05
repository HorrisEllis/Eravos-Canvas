> **ERAVOS v2 — kept as a note (2026-11-05).** James: "i feel like we should build this. then keep note for eravos v2. i want to
> cotinue and build something that i can connect with people with. thats the point of it also. creative canvas to create creatively"
> v1 (today's stack: Electron + JS + Web Audio) is what gets built now. Everything below is the v2 plan, ready when Emerge is.

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

## EL0 — DECIDED 2026-11-05

> "I want to replace electron with this. Emerge rebuild the canvas." · Looking Glass's core: **all Emerge** · "I'm building bottom up.
> Emerge needs to get finished to the point of being able to have you code with it. I am trying to reduce as much friction."

So the order is Emerge first, then Looking Glass written in Emerge, then the canvas rebuilt on it. ERAVOS keeps shipping on Electron
until Looking Glass can host it. The work below happens in the Emerge repo (`HorrisEllis/Emerge`, read 2026-11-05 at `f023240`).

### The road, measured against Emerge's own build plan (`emerge/spec/cie-eg.spec`)

| Step | What Emerge has today | What Looking Glass needs | Where |
|---|---|---|---|
| E1 native_lang | closures, try, `**`, prelude, fractional nums natively (1.9.0); F5 open (`**` with a fraction) | finish F5 | `lang/native/codegen.eg`, `rt.eg` |
| E2 native_windows | `pe.eg` writes a runnable .exe importing from **one** DLL (kernel32: the `hello.exe` milestone) | the runtime's I/O through kernel32, `emerge.exe` rebuilds itself (GATE-NW-001…003) | `lang/native/pe.eg` |
| E3 **calling Windows** (new) | none | imports from **several** DLLs (user32, gdi32, later d3d11/dxgi/dwrite); Win64 calls with ints, pointers and doubles; raw memory (structs, buffers, UTF-16); a C-callable entry for the window procedure (callbacks); calls through COM vtables (for the GPU later) | `pe.eg` multi-DLL `.idata`, `codegen.eg` |
| E4 the axiom | spec: "Only kernel32 and the OS crypto library are imported (section 0)" | Looking Glass must import user32/gdi32 (and the GPU's DLLs) — **his decision: widen the axiom, or a named exception for the UI host** | `cie-eg.spec` §0 |
| LG1 | — | Looking Glass phase 1 in Emerge: one borderless window that draws one rectangle **from data** — software first (a pixel buffer blitted with gdi32), the GPU after | new, in Emerge's tree or its own repo |
| LG2+ | — | Looking Glass phases 2–4 (elements + variables, layers, motion) | its phase map |
| C1 | — | the canvas rebuilt in Emerge on Looking Glass, bottom up: object model + time model first (specs/eravos.object-model, eravos.temporal), then windows, wires, tools as UI data | ERAVOS |

E3 and E4 are the new pieces; E1 and E2 were already on Emerge's plan. Sound stays where the ecosystem spec puts it: Emerge describes
the graph, never runs per sample (§7, §11).

### What blocks it now

A session needs **push access to `HorrisEllis/Emerge`** to do E1–E3; this one has it only for Eravos-Canvas (attaching Emerge was
refused here). To remove that friction: start a session on the Emerge repo, or allow this session to add it (repository access for
`mcp__claude-code-remote__add_repo`).

## EL0 (as first proposed, kept for the record)


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

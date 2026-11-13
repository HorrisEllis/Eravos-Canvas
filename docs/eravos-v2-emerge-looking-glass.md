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

## ADDENDUM 2026-11-13 — the compatibility graph, tools that mutate, a bare canvas: built in v1 now, as data Emerge takes over

His words, 2026-11-13, in order:
- "what about having tools combined when connected into a large interface? not just listing mods but using field to change the ui
  dynamically. to make something completely new. that would be sick. what about have seperate ui elements for each tool that can merge
  automatically. dynamic ui synthesiss"
- "what about a compatability graph? i want tools to mutate into new ones. yes the workshop. component integration, ive wanted this for a
  long time. especially with emerge. like variable driven innovation."
- "should we have that in the workshop, the canvas? i feel the workshop should be a tool on its own. like can we make the canvas more bare?"
- "is emerge worth waiting for on this?"
- "add that to the eravos v2 spec"

### The idea
- **A compatibility graph.** Nodes: components (111 today) and tools. Edges: this output can feed that input, by typed ports (audio mono /
  stereo, control, pitch, gate, note events, modulation; units and ranges). "Fits the same slot": the same port shape (filter-svf ·
  filter-ladder · filter-formant; osc-va · osc-wavetable · oscillator-population). Bridges: an adapter the graph inserts when types differ
  (an envelope's control into a pitch input through a scaler).
- **Tools that mutate.** A tool is a DAG of components (every tool spec carries one, checked), so a mutation is an edit of the DAG: swap a
  component for a compatible one · insert one where the types allow · rewire (a modulator to another destination, one tool's envelope into
  another) · graft (part of one tool's DAG into another) · change its variables (a component's ranges and options). Each mutant: the types
  fit, it plays without blowing up, the novelty gate says whether it is new; his ear decides the rest; a kept mutant is a new tool with its
  lineage (what it came from, which mutation).
- **Dynamic UI synthesis.** Each tool's UI as separate parts with roles (a rate, a key / scale, a keyboard, a step grid, a tone, a level);
  wired tools merge what they share (one tempo, one key, one keyboard — no duplicates) and keep what is their own, laid out in signal order
  (the UI field, `specs/eravos.ui-field.spec`); the Field reshapes the merged surface live; unwiring splits it back; a merged surface you like
  saves as a suite.
- **The Field, a tool of its own; the canvas, bare.** The Field (today `canvas/runtime/workshop.js`) becomes a domain-free tool
  (`tools/core/field/`, proposed) that is wired to what it edits — wired to several tools, it is the merged surface. The compatibility graph
  and mutation live in the Field; a domain supplies its port types and words. The canvas keeps only the host (windows, wires, the tool host,
  the kit and themes, menus, history, save / open, settings, updates); what is a tool leaves it, one PR each, each proved to change nothing.

### Decided (proposed 2026-11-13, his "add that"): do not wait for Emerge
- The hard part is design and data (port types, the slot relation, the mutation ops, what a tool declares to the Field); it is the same in JS
  or Emerge. Emerge today compiles to CommonJS; E2 (Windows), E3 (calling Windows) and Looking Glass are still ahead.
- Built in v1 now it gives Emerge real requirements: types taken from ports that were used, variables from variables that were mutated and
  heard — not a type system designed by guessing.
- Kept Emerge-ready: ports, DAGs and variables are declarative data (specs, tool.json), never JS behaviour; the graph checker is a pure
  function (data in → verdict out, no DOM, no audio); every type, slot and mutation is defined in its spec.

### v1 → v2: what each piece becomes
| v1 (data + a checker run over it) | v2 (Emerge) |
|---|---|
| a port's type (in a component spec / tool.json) | a type |
| "fits the same slot" (same port shape) | a component implements a typed interface |
| a bridge (adapter) | a typed conversion |
| a tool's DAG (spec `dag:` / `signal_dag`) | a typed composition — a wrong wire does not compile |
| a component's ranges and options | variables in its definition (variable-driven innovation) |
| a mutation (swap / insert / rewire / graft / vary) | a program transform, checked by the compiler |
| a mutant's lineage | provenance kept with the built tool |
| the checker's verdict at test time | the verdict at compile time |
| the Field (a domain-free tool in JS) | a Looking Glass surface — UI as typed data, layers as a runtime operation |

### Open (his call)
- The graph checker as the first piece of ERAVOS written in Emerge (it already compiles to CommonJS, so it runs inside v1) — needs a
  session with push access to `HorrisEllis/Nexus`; otherwise JS now, ported later.
- Order in v1: bare canvas + the Field as a tool → the compatibility graph and mutation in the Field → Bassline's depth as the first tool
  written natively against the graph (or Bassline first).

## ADDENDUM 2026-11-13 (2) — the name, and UI synthesised from components

His words (2026-11-13): "Each component of each tool has a element for the ui to synthesis. Should we call Eravos 2: synthesis, or field?"
(13:07:08Z) · "Okay. Each tool needs that. Dag. It has to anounce what it needs to the canvas. The canvas needs to import it from the zip."
(13:08:14Z)

- **The name — proposed, to confirm:** **ERAVOS 2: Synthesis**. One word for what v2 does three times: sound synthesised from components,
  tools synthesised from components (mutation), UI synthesised from each component's element. **Field** stays the name of the surface inside
  it (v1's editor already carries it, and the Field theme shares the word). His reply began "Okay." — recorded as proposed until he confirms.
- **For v2:** a component's element becomes Looking Glass data (UI as typed data, its spec), its variables Emerge variables; a tool's UI is
  composed by the compiler from its components' elements, as v1 composes it from the DAG (specs/eravos.ui-field.spec ADDENDUM 2026-11-13 (2)).
  The announcement (a tool's needs from its DAG) and import from the zip are v1 work (specs/eravos.store.spec ADDENDUM 2026-11-13) that
  carries over unchanged as the v2 package format.

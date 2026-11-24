# ERAVOS — the to-do ledger

His words (2026-11-24): "also log all of this, don't lose anything, update the specs, phases. and add that to a to do ledger".

One list of everything asked and not finished. Each line: what, his words (dated), where it is specced, its state. **States:** `decided`
(his call made, to build) · `open` (a question of his still to answer, with the recommended reading) · `specced` (phases written, not
started) · `built, unconfirmed` (shipped, not yet seen on his PC) · `waiting` (on his yes to a preview). A line is never deleted. When done,
it moves to **Done**, and says where and the proof. His words in full, with what came of each: `docs/HIS-WORDS-MAP.md`, and the session maps
`specs/eravos.*-session.map.spec`. Finished work: the Ledger in `CLAUDE.md` and `PROGRESS.md`.

## Now: the toolbar and Settings (2026-11-24) · `specs/eravos.bare-canvas.spec` + `specs/eravos.settings-buttons-dag.map.spec` ADDENDA 2026-11-24

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-04 | **Options into Settings** (ST1 / TB1): the ⋯ Options button and drop-down go; Stop all, Show ports, Fit all, Clear canvas become a section of ⚙ Settings (their keys stay). **Undo / Redo buttons removed** (Ctrl+Z / Ctrl+Shift+Z stay). Redundant options removed. Preview first. | "okay well no options and settings." · "first one, beyond removing the undo and redo, and redundany options." | decided |
| T-05 | **Settings a real menu** (ST2): sections down the side, search across every option. Preview first. | "also the settings needs to be a real menu" | decided |
| T-06 | **The Start button leaves the toolbar** (TB6): top-left is Add only; the domains still open on launch. | "remove the start button from the corner and just have the add button" | decided |
| T-07 | **Organize / Tidy up: one** (TB2), the same action today. Recommended: keep **Organize** on the toolbar. | "organize or tidy up, don't need both." | decided (which name: recommended Organize) |
| T-08 | **Sounds · Rhythms · Songs (· Learn): one entry** (TB3). Recommended: one **Library** button, one browser with tabs. Other readings: keep Songs only; all into Add. | "sounds or rhythms, and songs." | open |
| T-09 | **Metronome and loop region** (TB4). Readings: out of the agnostic toolbar into the music transport (recommended) · onto the canvas as a loop-region bar · the Timeline only. | "metronome loop region in the canvas ui." | open |
| T-10 | **The toolbar's noise when choosing a domain** (TB5): before a domain, only Add · Settings · the fault light; after, recommended: only what the tools on the canvas need (not the domain's whole set). | "need to clean up the noise. need to when choosing a domain." | open |
| T-11 | **The catalog (Add) gets "← Domains" in its top-left corner** (TB7): back to the domain screen. | "with a back to domain, in the top left corner of the catalog." | decided |
| T-12 | **Settings' sections grow from the tools' DAG contracts** (ST3), agnostic: Audio with real-time audio, MIDI with MIDI in, GPU / image memory with image tools; each option names the tools that asked; hides when none needs it, values kept. | "that expands from the tools dag contract, like what is needed expands the options." | specced |

## Performance and animations · `specs/eravos.performance-plan.spec` (his PC: Ryzen 7 3700X · GTX 1650 · 16 GB)

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-13 | **PF0 measure** (live numbers built in 3.222; the saved report still to do): Settings › Performance — GPU status, frame times, main-thread busy %, audio load, workers, memory; a saved report. Gate for the rest. | "like is it optimized?" | specced |
| T-14 | **PF1 pause what is not seen + lazy load**: one shared frame scheduler (15 loops today); off-screen / covered / minimised windows draw nothing; a tool's face built on first sight. | "like lazy load" | specced |
| T-15 | **PF2 Performance mode** (3.222: the custom settings + Auto cover it; a one-switch mode still possible): no transitions, no reactive colours / glow, slower meters; follows reduce-motion. Off by default. | "like disabling animations, transitions." | specced |
| T-16 | **PF3 simpler when zoomed out**: a tool becomes one cached picture (or name, colour, level) below a zoom level; live again zoomed in. | "like real pixelated when zooming out" | specced |
| T-17 | **PF4 tools that grow as they are resized**: small = the essentials, wider = more, up to today's full face. Preview first. | "what about a simplified ui for tools. then they expand as you resize them?" | specced (waits a preview) |
| T-18 | **PF5 displays on the GPU** (WebGL / OffscreenCanvas): spectra, scopes, meters, waveforms, wires. | "like is it using my graphics card? like offloading?" · "gpupu" | specced |
| T-19 | **PF6 a worker pool across the cores** for offline work (synthesizing + judging, mutation, bouncing, analysis). | "using all my cpu cores, ram?" | specced |
| T-20 | **PF7 faster sound per core** (moved to the engine, 2026-11-24: kernels in Emerge, EN3): shared DSP kernels in WebAssembly + SIMD; proven by components.mjs + the null render. | "can we optimize the performance even more?" | specced |
| T-21 | **PF8 safe Chromium switches** (GPU rasterization / zero-copy; never ignore-gpu-blocklist). | "at least until looking glass replaces electron." | specced |
| T-22 | **RP1 resource needs in every tool's contract** (`needs.resources`, from its DAG; a CI check). | "what ever is on the canvas, is priority … it needs to remain agnostic." | specced |
| T-23 | **RP2 priority follows the canvas**: the canvas sums the needs of what is on it (audio first for music, GPU / images for image tools, both when both); names no domain. | same | specced |
| T-32 | **Lag fixed at its cause + Settings › Performance + Auto** (3.222): measured; the forced layout in the reactive colours removed; custom settings (display rate, effects, animations, resolution, blur, GPU on next start); Auto steps effects down while lagging. Shown first — waits his yes to merge. | "needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu cores, animations, graphics acceloratoin. maybe invent a better driver" | built, shown first |
| T-24 | **AN1–AN3 beautiful animations**: one motion language (FieldMotion) for windows, tools landing, wires, menus, Start's steps; transform + opacity only; **shown as a video first**. | "i want beautiful animations in eravos." | specced (waits a video) |

## The Mutation Lab, the Workbench, the Tool Builder · `specs/eravos.assembled-tool.spec` ADDENDUM 2026-11-24

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-25 | **ML1 more tools trade parts**: profiles for Supersaw, Swarm Oscillator, Retro Poly, Piano, Tape Memory first; hover words for every part they hold. | "okay but did we choose to do the exploded view on the canvas for existing tools?" · "swap components better" | specced |
| T-26 | **ML2 two or more cores at once** → one made tool. | "synthesize two or more cores, and make something completely new." | specced |
| T-27 | **ML3 more slots in the engine** (unison, sub, envelopes, the formant mouth, the wub sequence …) so fewer parts are left behind. | "combine the sound of retro dcs with the rest of wobble bass." | specced |
| T-28 | **ML4 the Mutation Lab**: a shelf of every component and core; spec + preview first. | "you open the mutation lab, and it has all the components, and cores to play with." | specced (waits a preview) |
| T-29 | **ML5 the Workbench / Tool Builder**: from scratch — parts, then each control's UI element and the theme; saved as a tool of its own. Spec + preview first. | "the workbench to be able to build from scratch from components and the broad selection of ui elements, with different control types, and themes, like a tool builder." | specced (waits a preview) |
| T-30 | **ML6 a made tool as its own zip** (isolated: deleted whole if unstable). | "also tools are isolated so if they cause instability they can be deleted." | specced |

## ERAVOS's own engine · `specs/eravos.engine.spec` (decided 2026-11-24: written in Emerge — "wait for emerge")

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-33 | **EN1 today's stack** (no new language): the audio thread's load measured; silent tools sleep; voices / tails below the floor ended; denormal guards + headroom checked in every component; TPDF dither on export; latency / sample rate / output device settings. Null render proves no change. | "dynamic, load balancing, signal to noise? wait for emerge" | open (asked: now?) |
| T-34 | **EN2 Emerge prerequisites**: E2 native_windows, E3 calling Windows (COM for WASAPI), threads, atomics, a lock-free queue, MMCSS — in HorrisEllis/Emerge (needs push access there). | "wait for emerge" | specced (blocked on access) |
| T-35 | **EN3 kernels in Emerge**, each against its contract, bit-close to today's by the null render. | "invent our own? specifically made more eravos?" | specced |
| T-36 | **EN4 the engine process in Emerge**: WASAPI exclusive / shared, ASIO; DYNAMIC (graph swapped at a block, cross-faded); LOAD BALANCING (the DAG scheduled over cores, work stealing, measured cost, critical path first); SIGNAL TO NOISE (64-bit mix, FTZ, headroom + true-peak, TPDF dither, oversampling; work only on what is heard); tools isolated; its own process; Web Audio the fallback. | "dynamic, load balancing, signal to noise?" | specced |
| T-37 | **EN5 Settings › Audio** from the engine (driver, device, buffer, sample rate, cores, per-core load, per-tool cost). | "that is still not great. what about the audio driver or engine that electron uses?" | specced |
| T-38 | **Which lags on his PC — the screen or the sound?** (decides what is cut next) | "that is still not great. what about the audio driver or engine that electron uses?" | open (asked) |

## Shipped, to confirm on his PC

| # | What | His words | State |
|---|---|---|---|
| T-01 | **Borderless window** (0.2.36): no Windows title bar; drag by the toolbar; window buttons at its right. | "also borderless windows please?" (2026-11-24) | built, unconfirmed |
| T-02 | **Updating in the app** (0.2.34): the updater runs from a copy; a held updater is kept. Confirm an in-app update goes through. | "trying to update it. fails to close eravos. also broke my current version." (2026-11-24) | built, unconfirmed |
| T-03 | **Start in two steps** (0.2.36). | "like only show the domains at first." (2026-11-24) | built, unconfirmed |
| T-31 | **The new Start (StartScreen, SS2)** replacing today's Start: a preview since 2026-11-20. | "domain screen first, then animated transition into the next screen" (2026-11-20) | waiting (his yes) |

## Older open items (from CLAUDE.md › Open, carried here so this is the one list)

| # | What | Asked | Where |
|---|---|---|---|
| O-01 | The store: the canvas on the system, everything else as whole zips in Documents\ERAVOS; decisions D1–D4 his. | 2026-11-06 | `specs/eravos.store.spec` |
| O-02 | Novel, full depth, no noise: every preset novel against all of ERAVOS; every tool full depth; a Tuning & settings tab per tool (N1 ✓ → N2 ✓ → N3 → N4). | 2026-11-06 | `specs/eravos.music-ecosystem.spec`, `eravos.tool-depth.spec` |
| O-03 | Mutation, a bare canvas, dynamic UI: UIs that merge when wired; every component carries its UI element; tools announce their needs; ERAVOS 2's name ("Synthesis" proposed, to confirm). | 2026-11-13 | `specs/eravos.compat-graph.spec`, `eravos.ui-field.spec`, `eravos.store.spec` |
| O-04 | The store's Browse: every tool an isolated zip; the Browse UI rejected ("no. i like the current ui. do not change it.") — the work goes on underneath. | 2026-11-13 | `specs/eravos.store-browse.spec` |
| O-05 | Connecting with people: share as a link, remix with credit, play together, share packs. | 2026-11-05 | CLAUDE.md › Direction |
| O-06 | Songs as a rhythm-exploring tool only. | — | CLAUDE.md › Open |
| O-07 | Patterns for each tool with variety: presets, depth, curves, per-note editing. | — | CLAUDE.md › Open |
| O-08 | Delete the merged branch `claude/nice-dirac-t64qeo` (needs his permission). | — | CLAUDE.md › Open |
| O-09 | Emerge E1–E3 (a session with push access to HorrisEllis/Emerge); E4 widen "only kernel32"? (his call). | 2026-11-05 | `docs/eravos-v2-emerge-looking-glass.md` |
| O-10 | The next high-leverage set: Ensemble Organism (UI preview first) → slew-lag, mpe-expression, relationship-graph, reverb-fdn, waveshaper. | 2026-11-13 | `docs/eco-graph.md` |
| O-11 | Piano: MIDI CC64 / CC67 to the pedal; a shorter layout for short screens (shown first). | 2026-11-13 | CLAUDE.md › Open |
| O-12 | Element synthesis ES2 (Retro DCO, Swarm, Tape Memory) → ES3 a choice — after his yes to ES1. | 2026-11-13 | CLAUDE.md › Open |
| O-13 | Tests failing before today's work: P23 (wheel over a fitting Timeline), P70 (a curve lane's right-click), P82 ×2 (glass layer); and `tests/p16-ui.mjs` stops at `plug.click is not a function` (on main too, found 2026-11-24). | — | CLAUDE.md › Open |
| O-14 | Wobble Bass sounds before any note in an offline headless render. | 3.130 | CLAUDE.md › Open |
| O-15 | AE vowel: Wub Filter's third band −12 dB vs the table's −14 dB (his call). | 2026-11-05 | CLAUDE.md › Open |
| O-16 | Phase 1 components, bottom up: lfo → osc-va → waveshaper → env-adsr → env-msseg … (some built since); each new tool's UI shown first. | 2026-11-05 | `docs/eco-graph.md` |

## Done (moved here, never deleted)

| # | What | Where · proof |
|---|---|---|
| D-01 | Branches merged (none were left); "error writing ERAVOS.exe" — a running ERAVOS was never seen (3.213, 0.2.32) | PR #211 · setup-copy 14/14 |
| D-02 | The Setup falls back to the 0.2.29 way (3.214, 0.2.33) — made his install worse; fixed by D-03 | PR #212 |
| D-03 | Updating no longer breaks on the running ERAVOS Update.exe (3.215, 0.2.34) — "it works." | PR #213 · setup-copy 15/15 |
| D-04 | The box framed whole; hover words; right-click › Replace with (3.216) | PR #214 · P216 |
| D-05 | Pick the voice; "the rest from <tool>" — ERAVOS makes it from his picks (3.217) | PR #215 · P217 |
| D-06 | The README, current, with pictures (3.218); the exploded note in it (3.219, 0.2.35) | PR #215, #216 |
| D-07 | Start in two steps; borderless window; the 3D exploded note (3.220, 0.2.36) | PR #217 · p16-ui (the two steps) |
| D-08 | This ledger, the 2026-11-24 session map, the specs' addenda and phases (3.221) | `specs/eravos.2026-11-24-session.map.spec`, `specs/eravos.performance-plan.spec` |

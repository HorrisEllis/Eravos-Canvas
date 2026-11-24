# spec_id: eravos.engine · status: specced (EN0) · author: James Brooks · 2026-11-24
# ERAVOS's own real-time engine — not a driver: the part that computes the sound (and any real-time work), built around ERAVOS's DAGs and
# component contracts. His words (2026-11-24, verbatim; the whole messages: specs/eravos.2026-11-24-session.map.spec 24–26):
#   "that is still not great. what about the audio driver or engine that electron uses?"
#   "invent our own? specifically made more eravos?"
#   "dynamic, load balancing, signal to noise? wait for emerge"
# Beside: specs/eravos.performance-plan.spec (the screen's thread; PF7 — kernels faster — moves here) · docs/eravos-v2-emerge-looking-glass.md
# (Emerge E1–E4, Looking Glass LG1+).

## What is true today (2026-11-24)
  - Chromium's Web Audio: ONE real-time render thread for every tool (in the window's process); built-in nodes native, the newer instruments
    JavaScript AudioWorklets on that thread. Windows output: WASAPI shared mode, ~10 ms buffer (latencyHint 'interactive',
    tools/music/core/audio.js). No ASIO, no exclusive mode, no choice of device, buffer or sample rate; nothing measures the audio thread's load.
  - What ERAVOS has that an engine can stand on: every tool's DAG (signal order, build/spec-dag.mjs), every component's contract (ports,
    variables, kernel — tools/music/components/*/<id>.contract.json), kernels that are the same code live and offline (worklet = kernel), the
    null render (tests/null-render.mjs) proving "no change in sound".

## Decisions
  - D1 AN ENGINE, NOT A DRIVER: no kernel driver (signing, whole-PC crashes, nothing gained). The engine speaks to the card from user mode:
    WASAPI exclusive (and shared), ASIO for interfaces that have it (the ASIO SDK's licence terms to be read before use — open).
  - D2 WRITTEN IN EMERGE — his call: "wait for emerge". The native engine is not written in Rust or C++ first; it waits for Emerge's Windows
    target (E2) and calling Windows (E3: threads, atomics, WASAPI / ASIO, MMCSS). Until then only what today's stack can do (EN1).
  - D3 ITS OWN PROCESS: a crash or a stall in the engine never takes the canvas with it, nor the reverse; it restarts by itself.
  - D4 TOOLS ISOLATED (his rule, 2026-11-24): each tool runs sandboxed in the engine — non-finite samples, overload or a fault mute that tool and
    flag it; the rest keep playing; it can be deleted whole.
  - D5 AGNOSTIC (his rule): the engine schedules REAL-TIME WORK, not "music": an image or video graph is scheduled the same way; priority
    from what is on the canvas (performance-plan D4, RP1–RP3).
  - D6 LIVE = OFFLINE: one kernel per component, the same live and offline; the null render is the engine's own regression test.

## DYNAMIC ("dynamic")
  - The graph changes while it plays: tools added / removed, wires drawn, parts swapped (Replace with, mutation, synthesis) — the engine builds
    the next graph beside the running one and switches at a block boundary, cross-fading what changed (no click, no stop).
  - Parameters are data (the contracts' variables): any of them reaches the kernel on the next block, smoothed per its contract.
  - A made tool (synthesis, 3.205 / 3.217) is assembled in the engine at once from its components' kernels — no worklet rebuilt.
  - Quality is dynamic too (see SIGNAL TO NOISE): when load rises, quality steps down gracefully before anything can drop out.

## LOAD BALANCING ("load balancing")
  - THE DAG IS THE SCHEDULE: per audio block the tools' DAGs form one graph; nodes whose inputs are ready run in parallel on a pool of
    real-time worker threads (one per core it is given, registered with Windows MMCSS "Pro Audio"); work stealing between workers; the
    critical path (longest chain to the output) first.
  - MEASURED COST: each node's time per block is kept (a moving average); the scheduler places work by it, and the deadline (the block's
    length) is watched — a block predicted late sheds by AUDIBILITY first (below), never by dropping the output.
  - Settings (Settings › Audio, appearing with a tool that needs real-time audio — ST3): cores for real-time work (auto = all but two), the
    load per core live, the block size, the driver, the device, the sample rate.

## SIGNAL TO NOISE ("signal to noise") — two meanings, both kept
  - CLEAN SOUND: the mix in 64-bit float (each node 32-bit at least); denormals flushed (FTZ / DAZ) so silence costs nothing and adds nothing;
    headroom on every bus and a true-peak limiter at the output; TPDF dither when the output is integer (16 / 24-bit, exports included);
    oversampling for what bends the wave (drives, clippers, waveshapers, FM) so aliasing — noise — stays under the floor; each component's
    contract gains its measured noise floor and aliasing (dB), checked like its other numbers.
  - WORK ON WHAT IS HEARD: the engine spends its time where it is audible — a voice or a tail below the floor (−96 dB) is ended, a tool that is
    silent and fed silence sleeps, an inaudible branch (muted, faded out) is not computed; when load rises, oversampling and other quality
    steps come down before any block can be late; with room, back up. Silence is cheap; what you hear gets the cores.

## Phases
  - EN0 this spec + its place in the ledger (docs/TODO-LEDGER.md T-33 … T-38). (done 3.223)
  - EN1 TODAY'S STACK, what needs no new language (Web Audio + JavaScript): the audio thread's load measured (a meter in Settings, render
    time per quantum where the platform tells it); silent tools sleep (their nodes disconnected while silent and fed silence); voices and tails
    below the floor ended; denormal guards and headroom checked in every component (tests/components.mjs); TPDF dither on export; the
    latency, sample-rate and output-device settings Web Audio allows (latencyHint, sampleRate, setSinkId). Proven by the null render.
  - EN2 EMERGE PREREQUISITES (in HorrisEllis/Emerge — needs a session with push access there): E2 native_windows, E3 calling Windows
    (several DLLs, Win64 calls with doubles, raw memory, callbacks, COM — WASAPI is COM), plus threads, atomics, a lock-free queue, MMCSS.
  - EN3 KERNELS IN EMERGE: each component's kernel written in Emerge against its contract; checked equal (bit-close) to today's JavaScript
    kernel by its own tests and the null render; Emerge → CommonJS keeps them runnable in today's ERAVOS meanwhile.
  - EN4 THE ENGINE PROCESS (Emerge): the device (WASAPI exclusive / shared, ASIO), the graph and the scheduler (DYNAMIC, LOAD BALANCING),
    isolation (D4), clean sound (SIGNAL TO NOISE), its link to the canvas (a shared-memory ring for audio, messages for parameters); today's Web
    Audio kept as the fallback until the engine is proven on his PC.
  - EN5 Settings › Audio from the engine (driver, device, buffer, sample rate, cores, per-core load, per-tool cost).
  - EN6 Looking Glass hosts the engine and the canvas (v2).

## Open
  - The ASIO SDK's licence (Steinberg) — read before EN4; WASAPI needs nothing.
  - EN1's "silent tools sleep": which tools may sleep (a delay or reverb tail is not silent while it rings) — from each tool's contract.
  - Whether EN1 is wanted now (it is today's stack, not the engine) — asked.

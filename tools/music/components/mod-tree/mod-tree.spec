# spec_id: eravos.component.mod-tree · version 1.0.0 · status built (2026-11-08) — written before its code (axiom 8)
# his words (2026-11-08): "i want the 3d. like i want like a full modulation, waveform, oscillation, like all the ways to edit a sound, give it
#   as much depth as possible. fractally and recursively." — rule: eravos.components.spec (small, on its own, shared; a component imports no tool)
identity:
  id: mod-tree ; group: modulation ; component tool: no (data + a kernel; any tool, the Workshop, the Timeline use it)
  job: a value over a span (a note's life, a bar, a clip) as a SIGNAL — a drawn base plus modulators — where every modulator's rate and depth
       are signals too, so modulation nests to any level (bounded: MAX_DEPTH 8, so it is always computable)
model:
  SIGNAL { base: [[t 0…1, value], …] (linear between points; empty = 0), mods: [MOD] }
  MOD    { shape: sine | triangle | saw | ramp | square | random | smooth | drawn, wave: [[x 0…1, y −1…1], …] (drawn: one cycle),
           rate: SIGNAL (cycles over the span), depth: SIGNAL (in the target's units), phase 0…1, fade 0…1 (of the span: fade-in), seed, on }
  random / smooth are seeded (the same tree → the same values, every render): stepped once per cycle / glided between steps
kernel:
  sample(sig, N) → Float64Array(N) over t = i / (N − 1): base + Σ mods; a mod = depth(t) · fade(t) · wave(φ(t)), φ(t) = phase + ∫ rate dt
    (the rate integrated, so a rate that moves sweeps the oscillation smoothly — no jumps when the rate changes)
  at(sig, t) — one value (for drawing); resample(arr, n) → [[t, v], …] n points (what a player stores: 64 for a note's curves)
  get(root, path) / set(root, path, value) — by path (['mods', 0, 'rate', 'mods', 1, 'depth'], …) without changing the original
  depthOf(sig) — how deep the tree goes; count(sig) — how many mods in it
dag: base ─┐ ; mods[i].rate ─ integrate → φ ─ wave(shape, wave) ─┐ ; mods[i].depth ─ × ─ × fade ─┤→ Σ → value
proved (mod-tree.test.mjs): a flat base is itself; a sine at rate 4, depth 2 makes four cycles of ±2; a rate signal that rises sweeps (zero
  crossings get closer together); depth of a depth (two levels) multiplies; eight levels compute, a ninth is ignored; seeded random repeats
  exactly and changes with the seed; a drawn wave plays its points; fade starts at 0; get / set by path leave the original untouched; 1,000
  samples of an eight-level tree under 50 ms
rules: never imports a tool; pure functions; no allocation beyond the arrays it returns

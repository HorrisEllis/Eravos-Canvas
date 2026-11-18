# spec_id: eravos.component.ratio-set · version 0.1.0 · status planned · template eravos.component/1
# From his words (2026-11-13): "irrational frequencies, and unconvential harmonic data" — tools/music/planned/feeling-song.spec
identity:
  id: ratio-set ; group: tuning ; component tool: no
  job: harmonic and tuning sets as data — irrational ratios (φ, √2, √3, π/2, e/2, 2^(1/φ), golden stack, φⁿ, n^φ), series (primes, Fibonacci
    ratios, stretched strings n·√(1+Bn²), membrane / bar modes, Bohlen–Pierce, beating clusters), and any list of numbers → partials
    (as ratios · as Hz · log-scaled into a range; amplitudes given or by rank) · steps(set) → the set's own melodic intervals
used by: feeling-song · embodiment-lab (its SETS move here; must null) · xen-synth (its tunings, where they are ratio sets)
inputs / outputs / limits: in: a set name or numbers + mapping; out: [{ ratio, amp }] (≤ 64), cents of each; pure data, no audio, no allocation
  in a worklet's process() (tables made on change)
rules:
  - never imports a tool; tools import it
  - every formula exact (computed, never typed decimals); a data set is checked (finite, > 0, ≤ 64 entries)
acceptance:
  - each named set within 0.5 c of its formula; Embodiment Lab renders identically on it (null ≤ −60 dB)
  - numbers in → the same ratios out (±0.5 c) under each mapping

# spec_id: eravos.component.oscillator-population · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: oscillator-population ; group: sources ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: N coupled oscillators (Kuramoto-style): coupling strength, topology (all, ring, small-world, user), drift, group-coherence output
used by: drone-engine · oscillation-ecology · oscillation-matrix · swarm-oscillator
inputs / outputs / limits (written 2026-11-06 for Swarm Oscillator; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel POP(): up to 32 phases; natural frequencies from a spread in cents (even, deterministic) + drift (bounded random walk, cents); coupling K 0…1 by mean field (Kuramoto: dθᵢ = ωᵢ + K·R·sin(ψ − θᵢ)); modes free (K = 0) · coupled · harmonic (n:m locking on ratios 1, 3/2, 2, 5/4, 3, 5/2, 4, 7/4 by Cluster) · chaotic (repulsive K); pull (adaptive frequency toward the mean while coupled); snap() sets every phase to the mean phase; coherence R = |mean e^(iθ)| 0…1
  stands on: — (phases only; the tool renders them through osc-va or osc-wavetable)
  status: building 2026-11-06 — NEW code proved on its own (oscillator-population.test.mjs); extraction from new (no tool today has coupled oscillators)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

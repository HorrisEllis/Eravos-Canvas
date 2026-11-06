/* eravos.component.oscillator-population 1.0.0 — N coupled oscillators (phase 1 · Swarm Oscillator, Oscillation Ecology, Oscillation
 * Matrix, Drone Engine stand on it). NEW code (2026-11-06): no tool today has coupled oscillators.
 *
 * Phases only (the tool renders them through osc-va or osc-wavetable). The coupling is Kuramoto's mean field (Y. Kuramoto, "Chemical
 * Oscillations, Waves, and Turbulence", 1984): each oscillator is pulled toward the population's mean phase ψ, as hard as the
 * population is already together (R):   dθᵢ/dt = ωᵢ + K·R·sin(ψ − θᵢ)        R·e^(iψ) = mean of e^(iθⱼ)
 * Below a critical coupling they drift apart and beat; above it they lock. O(N) a sample.
 *   modes   0 free (no coupling) · 1 coupled · 2 harmonic (n:m locking: each voice is pulled on θᵢ/rᵢ, its ratio rᵢ from
 *           1, 3/2, 2, 5/4, 3, 5/2, 4, 7/4 by Cluster — they settle on a chord) · 3 chaotic (repulsive: K < 0, they push apart)
 *   spread  natural frequencies spread evenly over ± spread cents (deterministic; 1 voice = none)
 *   drift   each voice's own slow wander, a bounded random walk in cents (seeded: the same every time)
 *   pull    while coupled, each voice's own frequency is drawn toward the swarm's (adaptive frequency): 0 = only phases lock
 *   snap()  every phase to the mean phase at once (Lock on beat)
 *   R       coherence 0…1: 1 = all in phase, ~1/√N = scattered
 *   MusicParts.POP(max = 32) → { configure(n, spreadCents, seed), set({ coupling, mode, pull, drift, cluster }), step(f0, sr),
 *                               phase(i), dt(i), R, psi, n, snap(), reset(seed) }
 * Coupling strength K = coupling × 8 % of the note's frequency (Hz): at 1 it locks a spread of about ±70 cents.
 * Allocation-free after construction; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function POP(MAX) {
    MAX = MAX || 32;
    const TAU = 2 * Math.PI, RATIOS = [1, 1.5, 2, 1.25, 3, 2.5, 4, 1.75];
    const TN = 4096, ST = new Float64Array(TN + 1); for (let i = 0; i <= TN; i++) ST[i] = Math.sin(TAU * i / TN);
    const sinC = (c) => { c -= Math.floor(c); const x = c * TN, i = x | 0; return ST[i] + (ST[i + 1] - ST[i]) * (x - i); };   // sin of a phase in cycles (table, ~1e-6)
    const cx = new Float64Array(MAX), sy = new Float64Array(MAX), fac = new Float64Array(MAX);
    const th = new Float64Array(MAX), phi = new Float64Array(MAX), base = new Float64Array(MAX), drift = new Float64Array(MAX), adapt = new Float64Array(MAX), dts = new Float64Array(MAX), rat = new Float64Array(MAX);
    let mx = 1, my = 0, n = 1, K = 0.45, mode = 1, pull = 0.5, dAmt = 0.25, cluster = 0, seed = 1, tick = 0, R = 1, psi = 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    function configure(count, spreadCents, s) {
      tick = 0;
      n = Math.max(1, Math.min(MAX, count | 0));
      for (let i = 0; i < n; i++) base[i] = n < 2 ? 0 : spreadCents * (2 * i / (n - 1) - 1);
      if (s !== undefined) reset(s);
    }
    function reset(s) { seed = (s >>> 0) || 1; for (let i = 0; i < MAX; i++) { th[i] = rnd(); phi[i] = th[i]; drift[i] = 0; adapt[i] = 0; } tick = 0; }
    function set(o) { if (o.coupling !== undefined) K = o.coupling; if (o.mode !== undefined) mode = o.mode; if (o.pull !== undefined) pull = o.pull; if (o.drift !== undefined) dAmt = o.drift; if (o.cluster !== undefined) cluster = o.cluster; tick = 0; }
    // the mean field over the effective phases φᵢ (θᵢ/rᵢ in harmonic mode — kept as its own continuous phase: θ/r would jump when θ wraps)
    function field() {
      let x = 0, y = 0; for (let i = 0; i < n; i++) { const c = sinC(phi[i] + 0.25), s = sinC(phi[i]); cx[i] = c; sy[i] = s; x += c; y += s; }
      x /= n; y /= n; R = Math.sqrt(x * x + y * y); mx = x; my = y;
    }
    function step(f0, sr) {
      if ((tick & 63) === 0 || fac[0] === 0) for (let i = 0; i < n; i++) rat[i] = mode === 2 ? Math.pow(RATIOS[i % 8], cluster) : 1;
      field();
      const k = mode === 0 ? 0 : mode === 3 ? -Math.abs(K) : K, kHz = k * 0.08 * f0;
      // every 64 samples: the drift walks (bounded, leaky), and pull draws each voice's frequency toward the swarm's
      if ((tick++ & 63) === 0 || fac[0] === 0) {
        const span = dAmt * 15, lr = 64 / sr;
        for (let i = 0; i < n; i++) {
          drift[i] += (rnd() - 0.5) * dAmt * 4 - drift[i] * 0.02; if (drift[i] > span) drift[i] = span; else if (drift[i] < -span) drift[i] = -span;
          if (k > 0 && pull > 0) adapt[i] += -(base[i] + drift[i] + adapt[i]) * pull * k * R * lr * 2; else adapt[i] *= 1 - lr * 0.5;
          fac[i] = rat[i] * Math.pow(2, (base[i] + drift[i] + adapt[i]) / 1200);   // the pitch ratio, refreshed every 64 samples
        }
      }
      for (let i = 0; i < n; i++) {
        // sin(ψ − φᵢ)·R = (sinψ·cosφᵢ − cosψ·sinφᵢ)·R = my·cosφᵢ − mx·sinφᵢ  (no trig here)
        let d = f0 * fac[i] / sr + (kHz ? kHz * (my * cx[i] - mx * sy[i]) * rat[i] / sr : 0);
        if (d < 0) d = 0; else if (d > 0.49) d = 0.49;
        dts[i] = d; th[i] += d; if (th[i] >= 1) th[i] -= Math.floor(th[i]); phi[i] += d / rat[i]; if (phi[i] >= 1) phi[i] -= Math.floor(phi[i]);
      }
    }
    function snap() { field(); let p = Math.atan2(my, mx) / TAU; p -= Math.floor(p); for (let i = 0; i < n; i++) { phi[i] = p; let v = p * rat[i]; v -= Math.floor(v); th[i] = v; } field(); }
    for (let i = 0; i < MAX; i++) { rat[i] = 1; fac[i] = 0; }
    reset(1); configure(1, 0);
    return { configure, reset, set, step, snap, phase: (i) => th[i], dt: (i) => dts[i], ratio: (i) => rat[i], cents: (i) => base[i] + drift[i] + adapt[i],
      get R() { return R; }, get psi() { return Math.atan2(my, mx); }, get n() { return n; }, MAX };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { POP, POP_MODES: ['free', 'coupled', 'harmonic', 'chaotic'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = { POP, POP_MODES: ['free', 'coupled', 'harmonic', 'chaotic'] };
})(typeof window !== 'undefined' ? window : globalThis);

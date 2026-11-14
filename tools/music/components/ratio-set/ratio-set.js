/* eravos.component.ratio-set 1.0.0 — harmonic and tuning sets as data: irrational ratios and unconventional harmonics (spec ratio-set.spec;
 * his words 2026-11-13: "irrational frequencies, and unconvential harmonic data"). Every ratio is COMPUTED from its formula, never typed.
 *   MusicParts.RATIOS.SETS        { name: [[ratio, weight], …] } — Embodiment Lab's seven (proved equal in ratio-set.test.mjs) + more
 *   MusicParts.RATIOS.names()     the set names, in order
 *   MusicParts.RATIOS.ratios(name, n)  the first n ratios of a set (repeating an octave up past its end) — a fixed count for a fixed voice
 *   MusicParts.RATIOS.fromNumbers(list, mode)  any numbers → ratios: 'ratio' (as given, over the first) · 'log' (spread over 3 octaves)
 *   MusicParts.RATIOS.cents(r)    1200·log2(r)
 * Pure; no state. A component imports no tool. */
(function (root) {
  'use strict';
  const PHI = (1 + Math.sqrt(5)) / 2, G = Math.pow(2, 1 / PHI);
  const STACK = [0, 1, 2, 3, 4].map(k => Math.pow(2, ((k * 1200 * Math.log2(PHI)) % 1200) / 1200)).sort((a, b) => a - b);
  const PI2 = Math.PI / 2, E2 = Math.E / 2;
  const SETS = {
    'harmonic': [1, 2, 3, 4, 5, 6].map((r, i) => [r, 1 / (i + 1)]),
    'φ golden': [[1, 1], [PHI, 0.8], [2, 0.45], [PHI * PHI, 0.5], [PHI * PHI * PHI, 0.25]],
    '√2': [[1, 1], [Math.SQRT2, 0.7], [2, 0.55], [2 * Math.SQRT2, 0.35], [4, 0.2]],
    '√3': [[1, 1], [Math.sqrt(3), 0.75], [2, 0.4], [3, 0.4], [2 * Math.sqrt(3), 0.22]],
    'π/2': [[1, 1], [PI2, 0.75], [PI2 * PI2, 0.45], [Math.PI, 0.35], [Math.PI * Math.PI / 2, 0.18]],
    'e/2': [[1, 1], [E2, 0.75], [E2 * E2, 0.5], [Math.E, 0.35], [Math.E * Math.E / 2, 0.18]],
    '2^(1/φ)': [[1, 1], [G, 0.75], [2, 0.4], [G * G, 0.45], [G * G * G, 0.25]],
    'golden stack': STACK.map((r, i) => [r, i ? 0.7 - i * 0.08 : 1]).concat([[2, 0.4], [2 * STACK[2], 0.2]]),
    'φ series': [0, 1, 2, 3, 4, 5].map(k => [Math.pow(PHI, k), Math.pow(0.62, k)]),
    'primes': [1, 2, 3, 5, 7, 11].map((r, i) => [r, 1 / (i + 1)]),
    'stretched string': [1, 2, 3, 4, 5, 6].map(n => [n * Math.sqrt((1 + 0.004 * n * n) / 1.004), 1 / n]),
    'membrane': [2.4048, 3.8317, 5.1356, 5.5201, 6.3802, 7.0156].map((z, i) => [z / 2.4048, 1 / (i + 1)]),   // Bessel zeros j(m,n) / j(0,1)
  };
  const names = () => Object.keys(SETS);
  function ratios(name, n) {
    const s = SETS[name] || SETS.harmonic, out = [];
    for (let i = 0; out.length < n; i++) { const [r, w] = s[i % s.length], oct = Math.pow(2, Math.floor(i / s.length)); out.push([r * oct, w / oct]); }
    return out;
  }
  function fromNumbers(list, mode) {
    const xs = (list || []).map(Number).filter(x => isFinite(x) && x > 0).slice(0, 64); if (!xs.length) return [[1, 1]];
    if (mode === 'log') { const lo = Math.min(...xs), hi = Math.max(...xs), sp = hi > lo ? Math.log(hi / lo) : 1; return xs.map((x, i) => [Math.pow(8, Math.log(x / lo) / sp), 1 / (i + 1)]); }
    return xs.map((x, i) => [x / xs[0], 1 / (i + 1)]);
  }
  const cents = (r) => 1200 * Math.log2(r);
  const RATIOS = { SETS, names, ratios, fromNumbers, cents, PHI };
  root.MusicParts = root.MusicParts || {}; root.MusicParts.RATIOS = RATIOS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { RATIOS };
})(typeof window !== 'undefined' ? window : globalThis);

/* eravos.component.ratio-set 1.1.0 — harmonic and tuning sets as data: irrational ratios and unconventional harmonics (spec ratio-set.spec;
 * his words 2026-11-13: "irrational frequencies, and unconvential harmonic data"). Every ratio is COMPUTED from its formula, never typed.
 *   MusicParts.RATIOS.SETS        { name: [[ratio, weight], …] } — Embodiment Lab's seven (proved equal in ratio-set.test.mjs) + more
 *   MusicParts.RATIOS.names()     the set names, in order
 *   MusicParts.RATIOS.ratios(name, n)  the first n ratios of a set (repeating an octave up past its end) — a fixed count for a fixed voice
 *   MusicParts.RATIOS.fromNumbers(list, mode)  any numbers → ratios: 'ratio' (as given, over the first) · 'log' (spread over 3 octaves)
 *   MusicParts.RATIOS.cents(r)    1200·log2(r)
 *   1.1.0 (3.240; his words, 2026-11-26: "Different harmonic and irrational frequencies, look at all domains, theories, research all music with
 *   any validtity or integrity or epistemic backing. Like the full spectrum. Like moving across the screen."): more spectra, each from a measured
 *   or derived source (named beside it) — and nothing from claims without evidence (no "healing" frequencies, no 432 Hz, no solfeggio):
 *   MusicParts.RATIOS.dissonance(set, f0)   the spectrum's own roughness at f0 (Plomp & Levelt 1965, as parameterised by Sethares 1993)
 *   MusicParts.RATIOS.inharmonicity(set)    cents from whole-number harmonics, weighted — 0 = one fused pitch
 *   MusicParts.RATIOS.spectrum(f0)          every set, from fused to apart (inharmonicity, then roughness — the order is computed, not chosen)
 *   MusicParts.RATIOS.morph(x, n, f0)       0…1 across that order → n [ratio, weight], gliding in log frequency between neighbours
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
    // 1.1.0 — spectra from acoustics and tuning theory (sources: Fletcher & Rossing, The Physics of Musical Instruments, 1998; Sethares, Tuning,
    // Timbre, Spectrum, Scale, 2005; Bohlen 1978 / Mathews & Pierce 1989; Benade 1976; Rossing, The Science of Sound)
    'odd harmonics': [1, 3, 5, 7, 9, 11].map((r, i) => [r, 1 / (i + 1)]),   // a closed pipe, the clarinet's low register (Benade): the timbre Bohlen–Pierce is consonant with
    'free bar': [1, 2.7565, 5.4039, 8.9330, 13.3443, 18.6379].map((r, i) => [r, 1 / (i + 1)]),   // a free–free beam, its modes over the first (Fletcher & Rossing §2.15): a marimba bar untuned
    'clamped bar': [1, 6.2669, 17.5475, 34.3861].map((r, i) => [r, 1 / (i + 1)]),   // a clamped–free bar: a tine, a kalimba tongue (Fletcher & Rossing §2.15)
    'church bell': [[0.5, 0.6], [1, 1], [1.2, 0.8], [1.5, 0.5], [2, 0.9], [2.5, 0.4], [3, 0.3]],   // hum, prime, minor tierce, quint, nominal … (Rossing: a tuned bell's partials)
    'bonang': [[1, 1], [1.52, 0.7], [3.46, 0.45], [3.92, 0.35]],   // a gamelan bonang kettle, measured (Sethares 2005, ch. 11)
    '2.1 stretch': [1, 2, 3, 4, 5, 6].map((h, i) => [Math.pow(2.1, Math.log2(h)), 1 / (i + 1)]),   // Sethares: a spectrum whose octave is 2.1, consonant with a 2.1-stretched scale
    'tritave': [0, 1, 2, 3, 4, 5].map(k => [Math.pow(3, k / 2), Math.pow(0.7, k)]),   // the 3:1 tritave halved: Bohlen–Pierce's frame instead of the octave
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
  // roughness of two sines (Sethares 1993's fit of Plomp & Levelt 1965): d = a1·a2·(e^(−3.5·s·Δf) − e^(−5.75·s·Δf)), s = 0.24 / (0.021·fmin + 19)
  function dissonance(name, f0) {
    const P = (typeof name === 'string' ? (SETS[name] || SETS.harmonic) : name).map(([r, w]) => [r * (f0 || 220), w]); let d = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const lo = Math.min(P[i][0], P[j][0]), df = Math.abs(P[i][0] - P[j][0]), sc = 0.24 / (0.021 * lo + 19);
      d += P[i][1] * P[j][1] * (Math.exp(-3.5 * sc * df) - Math.exp(-5.75 * sc * df)); }
    return d;
  }
  // inharmonicity: how far, in cents, each partial sits from a whole-number harmonic of the lowest (weighted by its level) — 0 = one fused pitch
  // (the harmonic series, odd harmonics, primes), large = a bell, a bar, an irrational stack. The axis across: fusion → apart.
  function inharmonicity(name) {
    const S = (typeof name === 'string' ? (SETS[name] || SETS.harmonic) : name), lo = Math.min(...S.map(x => x[0])); let a = 0, w = 0;
    S.forEach(([r, wt]) => { const q = r / lo, h = Math.max(1, Math.round(q)); a += wt * Math.abs(cents(q / h)); w += wt; });
    return w ? a / w : 0;
  }
  const order = {};
  function spectrum(f0) { const k = String(f0 || 220); return order[k] || (order[k] = names().map(nm => ({ name: nm, inharm: +inharmonicity(nm).toFixed(1), d: +dissonance(nm, f0).toFixed(4) })).sort((a, b) => a.inharm - b.inharm || a.d - b.d || (a.name < b.name ? -1 : 1))); }
  function morph(x, n, f0) {   // → { ratios: [[r, w] × n], from, to, t, name }
    const L = spectrum(f0), p = Math.max(0, Math.min(1, +x || 0)) * (L.length - 1), i = Math.min(L.length - 2, Math.floor(p)), t = p - i;
    const A = ratios(L[i].name, n), B = ratios(L[i + 1].name, n);
    return { ratios: A.map(([ra, wa], k) => [Math.exp((1 - t) * Math.log(ra) + t * Math.log(B[k][0])), (1 - t) * wa + t * B[k][1]]), from: L[i].name, to: L[i + 1].name, t, name: t < 0.5 ? L[i].name : L[i + 1].name };
  }
  const RATIOS = { SETS, names, ratios, fromNumbers, cents, PHI, dissonance, inharmonicity, spectrum, morph };
  root.MusicParts = root.MusicParts || {}; root.MusicParts.RATIOS = RATIOS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { RATIOS };
})(typeof window !== 'undefined' ? window : globalThis);

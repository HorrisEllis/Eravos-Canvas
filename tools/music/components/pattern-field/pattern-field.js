/* eravos.component.pattern-field 1.0.0 — a pattern as a structure: the shape its conditions make, and what emerges inside it (3.150).
 * His words, 2026-11-07: "agnostic. the structure defines the shape which defines the emergent properties of the conditions." · "Yeah, we can
 * just start with this. The small, like just the flat". The Workshop's music PATTERN kind and the Pattern tool stand on it.
 *   MusicParts.PF.shape(st) → { steps, admitted: [[step, midi], …], open(step, midi) }   every note the conditions admit
 *   MusicParts.PF.emerge(st) → { steps, admitted, notes: [{ s, n, len, vel, locked }] }  what emerges (deterministic: same st → same notes)
 *   MusicParts.PF.euclid(k, n, rot) → [0|1 × n] · PF.density(st, s) · PF.contour(st, s) · PF.clean(st) (every field in range)
 * st (the structure; every field optional — PF.clean fills the defaults):
 *   bars 1–8 · root 0–11 · scale (a MusicParts.KEY scale name, own table if absent) · chords [[pitch classes] per bar] (none = every tone of the
 *   scale) · grid { k, n, rot } (k hits of every n steps, Bjorklund) · range [lo, hi] (MIDI) · density { start, end, shape: rise|fall|arch|hold }
 *   (the share of admitted steps that sound) · contour { shape: flat|rise|fall|arch|wave, amount (semitones), centre (MIDI) } (where the line
 *   leans) · length (steps a note lasts) · seed · locked [{ s, n }] (yours: always sounds, kept whatever the shape)
 * Pure; no state; no tool imported. */
(function (root) {
  'use strict';
  const OWN = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    pentatonic_minor: [0, 3, 5, 7, 10], pentatonic_major: [0, 2, 4, 7, 9], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
  const mod = (a, n) => ((a % n) + n) % n, clamp = (v, a, b) => v < a ? a : v > b ? b : v, num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const scaleTones = (name) => { const K = root.MusicParts && root.MusicParts.KEY; return (K && K.SCALES && K.SCALES[name]) || OWN[name] || OWN.minor; };
  function clean(st) {
    st = st || {}; const g = st.grid || {}, d = st.density || {}, c = st.contour || {}, r = Array.isArray(st.range) ? st.range : [];
    const bars = clamp(Math.round(num(st.bars, 4)), 1, 8), lo = clamp(Math.round(num(r[0], 33)), 0, 126), hi = clamp(Math.round(num(r[1], 57)), lo + 1, 127);
    const n = clamp(Math.round(num(g.n, 8)), 1, 32), k = clamp(Math.round(num(g.k, 5)), 0, n);
    const shapes = ['rise', 'fall', 'arch', 'hold'], cshapes = ['flat', 'rise', 'fall', 'arch', 'wave'];
    return { bars, root: mod(Math.round(num(st.root, 9)), 12), scale: typeof st.scale === 'string' ? st.scale : 'minor',
      chords: Array.isArray(st.chords) ? st.chords.map(a => (Array.isArray(a) ? a.map(x => mod(Math.round(+x), 12)) : [])) : null,
      grid: { k, n, rot: mod(Math.round(num(g.rot, 0)), n) }, range: [lo, hi],
      density: { start: clamp(num(d.start, 0.3), 0, 1), end: clamp(num(d.end, 0.9), 0, 1), shape: shapes.includes(d.shape) ? d.shape : 'rise' },
      contour: { shape: cshapes.includes(c.shape) ? c.shape : 'arch', amount: clamp(num(c.amount, 9), 0, 36), centre: clamp(num(c.centre, Math.round((lo + hi) / 2) - 4), lo, hi) },
      length: clamp(num(st.length, 1.6), 0.25, 16), seed: Math.max(1, Math.round(num(st.seed, 41))) >>> 0,
      locked: Array.isArray(st.locked) ? st.locked.filter(x => x && isFinite(x.s) && isFinite(x.n)).map(x => ({ s: Math.round(x.s), n: Math.round(x.n) })) : [] };
  }
  // k hits spread as evenly as they go over n steps (the Bjorklund / Euclidean rhythm), turned by rot
  function euclid(k, n, rot) { const out = []; for (let i = 0; i < n; i++) { const j = mod(i + (rot || 0), n); out.push((j * k) % n < k ? 1 : 0); } return out; }
  const ease = (shape, u) => shape === 'fall' ? 1 - u : shape === 'arch' ? Math.sin(Math.PI * u) : shape === 'hold' ? 0 : u;
  function density(st, s) { const u = s / Math.max(1, st.bars * 16 - 1), d = st.density; return d.shape === 'hold' ? d.start : d.start + (d.end - d.start) * ease(d.shape, u); }
  function contour(st, s) { const u = s / Math.max(1, st.bars * 16 - 1), c = st.contour, a = c.amount;
    const v = c.shape === 'flat' ? 0 : c.shape === 'rise' ? u : c.shape === 'fall' ? 1 - u : c.shape === 'wave' ? 0.5 + 0.5 * Math.sin(2 * Math.PI * u * 2) : Math.sin(Math.PI * u); return c.centre + a * v; }
  function shape(st0) {
    const st = clean(st0), steps = st.bars * 16, tones = scaleTones(st.scale), hits = euclid(st.grid.k, st.grid.n, st.grid.rot), admitted = [];
    const inKey = (m) => tones.includes(mod(m - st.root, 12)), chordOk = (m, bar) => { const c = st.chords && st.chords.length ? st.chords[bar % st.chords.length] : null; return !c || !c.length || c.includes(mod(m, 12)); };
    const open = (s, m) => s >= 0 && s < steps && hits[s % st.grid.n] === 1 && m >= st.range[0] && m <= st.range[1] && inKey(m) && chordOk(m, Math.floor(s / 16));
    for (let s = 0; s < steps; s++) if (hits[s % st.grid.n]) for (let m = st.range[0]; m <= st.range[1]; m++) if (open(s, m)) admitted.push([s, m]);
    return { st, steps, admitted, open };
  }
  function emerge(st0) {
    const sh = shape(st0), st = sh.st, notes = [], byStep = new Map();
    sh.admitted.forEach(([s, m]) => { if (!byStep.has(s)) byStep.set(s, []); byStep.get(s).push(m); });
    let seed = st.seed; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const lockAt = new Map(st.locked.map(x => [x.s, x.n]));
    for (let s = 0; s < sh.steps; s++) {
      const a = rnd(), b = rnd();   // two draws every step, used or not: a change in one place never reshuffles the rest
      if (lockAt.has(s)) { notes.push({ s, n: lockAt.get(s), len: st.length, vel: 0.9, locked: true }); continue; }
      const cand = byStep.get(s); if (!cand || a > density(st, s)) continue;
      const c = contour(st, s); let best = cand[0], bd = Infinity; cand.forEach(m => { const d = Math.abs(m - c) + b * 3 * ((m * 7919) % 5) / 5; if (d < bd) { bd = d; best = m; } });
      notes.push({ s, n: best, len: st.length, vel: 0.7 + 0.25 * (s % 4 === 0 ? 1 : 0), locked: false });
    }
    return { st, steps: sh.steps, admitted: sh.admitted, notes };
  }
  const PF = { clean, euclid, density: (st, s) => density(clean(st), s), contour: (st, s) => contour(clean(st), s), shape, emerge };
  root.MusicParts = root.MusicParts || {}; root.MusicParts.PF = PF;
  if (typeof module !== 'undefined' && module.exports) module.exports = PF;
})(typeof window !== 'undefined' ? window : globalThis);

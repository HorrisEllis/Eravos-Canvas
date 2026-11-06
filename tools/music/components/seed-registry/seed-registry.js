/* eravos.component.seed-registry 1.0.0 — named, stable seeds (phase 2 · 13 tools stand on it; the Pattern Editor first). NEW code.
 * Every random choice in ERAVOS names WHERE it is ('project/pattern-editor/lane 2/chance'); the same path gives the same seed, so a variation
 * can always be found again. Reroll writes a new seed for that path and keeps the old one in its history — never hidden state.
 *   MusicParts.Seeds(projectSeed) → { seed(path), set(path, s), reroll(path), history(path), rng(path | seed) → () → 0…1, toJSON(), fromJSON(o) }
 *   MusicParts.mulberry32(seed) → () → 0…1 (the generator; the same one dsp.mulberry32 is)
 * A component imports no tool. */
(function (root) {
  'use strict';
  function mulberry32(a) { a >>>= 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // FNV-1a over the path, mixed with the project seed: stable across runs and machines
  function hash(str, seed) { let h = (0x811c9dc5 ^ (seed >>> 0)) >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function Seeds(projectSeed) {
    let P = (projectSeed === undefined ? 1 : projectSeed) >>> 0; const own = {}, hist = {};
    const seed = (path) => own[path] !== undefined ? own[path] : hash(String(path), P);
    function set(path, s) { (hist[path] = hist[path] || []).push(seed(path)); own[path] = s >>> 0; return own[path]; }
    function reroll(path) { const cur = seed(path), next = hash(String(path) + '#' + ((hist[path] || []).length + 1), cur ^ 0x9e3779b9); return set(path, next); }
    return {
      seed, set, reroll, history: (path) => (hist[path] || []).slice(),
      rng: (x) => mulberry32(typeof x === 'number' ? x : seed(x)),
      get project() { return P; },
      toJSON: () => ({ project: P, own: Object.assign({}, own), hist: JSON.parse(JSON.stringify(hist)) }),
      fromJSON(o) { P = (o.project >>> 0) || 1; Object.keys(own).forEach(k => delete own[k]); Object.assign(own, o.own || {}); Object.keys(hist).forEach(k => delete hist[k]); Object.assign(hist, o.hist || {}); },
    };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Seeds, mulberry32 });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Seeds, mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);

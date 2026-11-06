/* eravos.component.pattern-store 1.0.0 — patterns as data (phase 2 · the most-reached unbuilt component: 24 tools stand on it; the
 * Pattern Editor first). NEW code (2026-11-06). His words: "I keep envisioning like a whole ass extremely detailed note and pattern editor.
 * Like fractals. Then can save for later. I’m struggling with the complicated patterns." · "The pattern and note editor are the same."
 *
 * A PATTERN is notes AND other patterns placed inside it — nesting to any depth is the fractal; flatten() turns it back into plain notes.
 *   pattern { id, name, len (sixteenths), key? { root, scale }, notes: [{ s, l, n | r, v, b?, k? }], places: [{ ref, at, xf }], tags, v }
 *     notes exactly as the Timeline's clips have them ({ s, l, n, v } + bends b, per-note knobs k; r = n − root as the Pattern Library
 *     stores pitch) — a clip's notes ARE a pattern: nothing converts, they round-trip bit for bit
 *     xf (how a placed pattern is changed): transpose (semitones) · steps (scale steps, needs a key) · stretch (time ×) · reverse · invert
 *     (pitch mirrored around its first note) · every (sounds on every Nth repeat) · chance (0…1 per note, by a named seed) · vel (×)
 *   MusicParts.PatternStore() → { put(p) → { id, v } (every save a NEW version; the old ones kept) · get(id, v?) · versions(id) · list(f?) ·
 *                                  remove(id) · toJSON() · fromJSON(o) }
 *   MusicParts.flatten(p, store, { depth = 6, rep = 0, key, KEY, rng(path) }) → { notes, refused: [ids] }   (cycles and depth refused, named)
 *   MusicParts.grow(base, rule, depth) → pattern: each note of base becomes the rule, placed on that note, stretched to its length,
 *                                  transposed to its pitch — depth 0 = base; depth d has |base| × |rule|^d notes (self-similar)
 *   MusicParts.patternDiff(a, b) → { added, removed, changed }
 * Pure data; no audio. A component imports no tool. */
(function (root) {
  'use strict';
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const pitch = (n, rootPc) => n.n !== undefined ? n.n : (n.r || 0) + (rootPc || 0);
  let uid = 0; const newId = () => 'pt-' + Date.now().toString(36) + '-' + (++uid).toString(36);
  function PatternStore() {
    const vs = new Map();   // id → [versions]
    function put(p) {
      const q = clone(p); q.id = q.id || newId(); q.notes = q.notes || []; q.places = q.places || []; q.len = q.len || 16;
      const list = vs.get(q.id) || []; q.v = list.length + 1; list.push(Object.freeze(q)); vs.set(q.id, list); return { id: q.id, v: q.v };
    }
    const get = (id, v) => { const l = vs.get(id); if (!l) return null; return clone(v ? l[v - 1] || null : l[l.length - 1]); };
    return {
      put, get, versions: (id) => (vs.get(id) || []).map(x => x.v),
      list: (f) => Array.from(vs.values()).map(l => l[l.length - 1]).filter(p => !f || f(p)).map(clone),
      remove: (id) => vs.delete(id),
      toJSON: () => Array.from(vs.entries()).map(([id, l]) => ({ id, versions: l.map(clone) })),
      fromJSON(o) { vs.clear(); (o || []).forEach(e => vs.set(e.id, e.versions.map(x => Object.freeze(clone(x))))); },
    };
  }
  // one placed pattern's notes, changed by its xf
  function applyXf(notes, len, xf, o, path) {
    xf = xf || {}; let out = notes.map(n => Object.assign({}, n));
    if (xf.reverse) out = out.map(n => Object.assign(n, { s: len - n.s - n.l }));
    if (xf.invert && out.length) { const axis = out.reduce((a, n) => (n.s < a.s ? n : a), out[0]).n; out.forEach(n => { n.n = 2 * axis - n.n; }); }
    if (xf.steps && o.KEY && o.key) out.forEach(n => { n.n = o.KEY.step(n.n, xf.steps, o.key.root, o.key.scale); });
    if (xf.transpose) out.forEach(n => { n.n += xf.transpose; });
    if (xf.stretch && xf.stretch !== 1) out.forEach(n => { n.s *= xf.stretch; n.l *= xf.stretch; });
    if (xf.vel !== undefined) out.forEach(n => { n.v = Math.max(0, Math.min(1, (n.v === undefined ? 0.8 : n.v) * xf.vel)); });
    if (xf.chance !== undefined && xf.chance < 1) { const r = o.rng ? o.rng(path + '/chance' + (xf.seed !== undefined ? '#' + xf.seed : '')) : Math.random; out = out.filter(() => r() < xf.chance); }
    return out;
  }
  function flatten(p, store, o) {
    o = o || {}; const depth = o.depth === undefined ? 6 : o.depth, rep = o.rep || 0, rootPc = o.key ? o.key.root : 0, refused = [];
    function walk(pt, stack, d, path) {
      const own = (pt.notes || []).map(n => Object.assign({}, n, { n: pitch(n, rootPc) }, n.r !== undefined && n.n === undefined ? { r: undefined } : {}));
      own.forEach(n => { if (n.r === undefined) delete n.r; });
      let out = own;
      (pt.places || []).forEach((pl, i) => {
        if (pl.xf && pl.xf.every && rep % pl.xf.every !== 0) return;
        const child = store && store.get(pl.ref); if (!child) { refused.push(pl.ref + ' (missing)'); return; }
        if (stack.includes(child.id)) { refused.push(child.id + ' (cycle)'); return; }
        if (d >= depth) { refused.push(child.id + ' (deeper than ' + depth + ')'); return; }
        const inner = walk(child, stack.concat(child.id), d + 1, path + '/' + i);
        out = out.concat(applyXf(inner, child.len || 16, pl.xf, o, path + '/' + i).map(n => Object.assign(n, { s: n.s + (pl.at || 0) })));
      });
      return out;
    }
    const notes = walk(p, [p.id], 0, p.id || 'p').sort((a, b) => a.s - b.s || a.n - b.n);
    return { notes, refused };
  }
  // the fractal: every note of `base` becomes `rule`, fitted to that note — repeated `depth` times
  function grow(base, rule, depth) {
    const rn = (rule.notes || []), rlen = rule.len || Math.max(1, ...rn.map(n => n.s + n.l)), r0 = rn.length ? rn.reduce((a, n) => (n.s < a.s ? n : a), rn[0]).n : 0;
    let notes = (base.notes || []).map(n => Object.assign({}, n));
    for (let d = 0; d < depth; d++) {
      const next = [];
      notes.forEach(n => { const k = n.l / rlen; rn.forEach(m => next.push({ s: n.s + m.s * k, l: m.l * k, n: n.n + (m.n - r0), v: Math.max(0, Math.min(1, (n.v === undefined ? 0.8 : n.v) * (m.v === undefined ? 1 : m.v / 0.8))) })); });
      notes = next;
    }
    return { name: (base.name || 'pattern') + (depth ? ' · grown ×' + depth : ''), len: base.len || 16, notes: notes.sort((a, b) => a.s - b.s || a.n - b.n), places: [], tags: ['grown'] };
  }
  function patternDiff(a, b) {
    const key = (n) => n.s + ':' + n.n, A = new Map((a.notes || []).map(n => [key(n), n])), B = new Map((b.notes || []).map(n => [key(n), n]));
    const added = [], removed = [], changed = [];
    B.forEach((n, k) => { if (!A.has(k)) added.push(n); else if (JSON.stringify(A.get(k)) !== JSON.stringify(n)) changed.push({ from: A.get(k), to: n }); });
    A.forEach((n, k) => { if (!B.has(k)) removed.push(n); });
    return { added, removed, changed };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { PatternStore, flatten, grow, patternDiff });
  if (typeof module !== 'undefined' && module.exports) module.exports = { PatternStore, flatten, grow, patternDiff };
})(typeof window !== 'undefined' ? window : globalThis);

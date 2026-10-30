/* ERAVOS curves for every genre (3.74) — data only, a transform of the Pattern Library (PatternLibrary.addTransform).
 * James, 2026-10-25: "why doesn't the pattern library have more curves? like floor falls."
 * Measured on main (64e3d99): the library is generated from the Song Engine, and only 3 of its 85 genres write curve lanes (Heavy Drops,
 * Arp & Motion, Floor Falls) — 16 curve patterns — and only 28 of 1253 note patterns bend or oscillate. The songs stay as they are (his);
 * the LIBRARY adds the curves, from Floor Falls Out's own moves (heavy-drops-songbook.js bar(), read 2026-10-24):
 *   CURVED VERSIONS of every bass, wobble and lead pattern ("· curved"):
 *     the first note slides in from a 4th above (Floor Falls' "from 5, early") · every phrase's last note bends down at its end (an octave,
 *     never under ~18 Hz) · a wobble changes rate with each note's length (1/16 · 1/8 · 1/8t · 1/4t) and its turn SPEEDS UP 1/8 → 1/32 ·
 *     a lead glides into a leap from the note before and blooms a vibrato on its long notes
 *   CURVE SHAPES for every tool a genre uses (filed under that genre): Riser (+7 over 8 bars, snaps back on the hit) · Freefall (−12 through
 *     the pause bar) · Ripples (a slow pitch swing, ±0.3 st at 1/2) · and where the tool has them: Filter opens (8 bars) · Filter closes,
 *     then rips open · Depth swing (the Wobble's, triangle at 1/2) */
(function (global) {
  'use strict';
  const PL = global.PatternLibrary; if (!PL || !PL.addTransform) return;
  const F = () => global.OrganismFactory, FLOOR = 14;
  const WRATE = (l) => l <= 2 ? '1/16' : l <= 4 ? '1/8' : l <= 6 ? '1/8t' : '1/4t';
  const copy = (n) => Object.assign({}, n, n.p ? { p: Object.assign({}, n.p) } : {}, n.b ? { b: Object.assign({}, n.b) } : {});
  // Floor Falls' moves on any line of notes; null when there is nothing to curve
  function curved(p) {
    const ns = p.notes.map(copy).sort((a, b) => a.s - b.s || a.r - b.r); if (ns.length < 2) return null;
    const own = new Set(ns.filter(n => n.b)); let moved = 0;   // 3.73b merge: a note the song already bends keeps its bend; the moves go on the others
    const wob = p.type === 'wobble', lead = p.type === 'lead', phrase = Math.max(16, Math.min(64, p.bars * 16));
    const dive = (n, by) => Math.max(by, FLOOR - n.r);   // never under ~18 Hz (r is from the key's root; the root adds 0–11 on top)
    ns.forEach((n, i) => {
      const prev = ns[i - 1], next = ns[i + 1], endsPhrase = !next || Math.floor(next.s / phrase) !== Math.floor(n.s / phrase);
      if (wob && !(n.p && n.p.div)) { n.p = Object.assign({}, n.p, { div: WRATE(n.l) }); moved++; }
      if (own.has(n)) return;
      const had = n.b;
      if (lead) {
        if (prev && Math.abs(n.r - prev.r) > 4 && n.l >= 2) n.b = { from: Math.max(-12, Math.min(12, prev.r - n.r)), to: 0, shape: 'early' };   // glides into a leap
        if (n.l >= 6) n.b = Object.assign(n.b || { from: 0, to: 0 }, { osc: { rate: 5.5, depth: 0.3, shape: 'sine', fade: 0.5 } });          // a vibrato that blooms
        if (n.b !== had) moved++;
        return;
      }
      if (i === 0 && n.l >= 2) n.b = { from: 5, to: 0, shape: 'early' };                                                                     // slides in from a 4th above
      if (endsPhrase && n.l >= 3) { const to = dive(n, -12); if (to < 0) n.b = Object.assign({ from: n.b ? n.b.from : 0 }, { to, shape: 'late', at: 0.4 }, wob ? { osc: { rate: '1/8', rateTo: '1/32', depth: 0.4, shape: 'sine' } } : {}); }
      if (n.b !== had) moved++;
    });
    if (!moved) return null;
    return Object.assign({}, p, { id: undefined, name: p.name + ' · curved', notes: ns, move: 'curved', source: (p.source || '') + ' · curved by the library (Floor Falls’ moves)' });
  }
  // curve shapes for a tool, from what its knobs allow
  function shapes(tool) {
    const d = F().def(tool), knob = (k) => d && (d.config || []).find(c => c.key === k), out = [];
    out.push(['Riser: +7 over 8 bars, snaps back on the hit', 8, { key: '@pitch', points: [[0, 0], [7.95, 7], [8, 0]] }]);
    out.push(['Freefall: down an octave through the pause', 1, { key: '@pitch', points: [[0, 0], [0.98, -12], [1, 0]] }]);
    out.push(['Ripples: a slow pitch swing', 4, { key: '@pitch', points: [[0, 0], [3.95, 0]], osc: { rate: '1/2', depth: 0.3, shape: 'sine' } }]);
    const cut = knob('cutoff');
    if (cut && typeof cut.min === 'number' && typeof cut.max === 'number') {
      const lo = Math.max(cut.min, Math.min(cut.max, cut.min * 2 || 200)), hi = Math.round(Math.min(cut.max, Math.max(lo * 8, cut.max * 0.7))), mid = Math.round(Math.sqrt(lo * hi));
      out.push(['Filter opens over 8 bars', 8, { key: 'cutoff', points: [[0, Math.round(lo)], [7.95, hi], [8, mid]] }]);
      out.push(['Filter closes, then rips open', 8, { key: 'cutoff', points: [[0, mid], [5, Math.round(lo)], [7.6, Math.round(lo * 1.15)], [7.95, hi], [8, mid]] }]);
    }
    const dep = knob('depth');
    if (dep && typeof dep.max === 'number' && /wobble|wub/.test(tool)) out.push(['Depth swing through the drop', 16, { key: 'depth', points: [[0, Math.min(dep.max, 3)], [15.95, Math.min(dep.max, 6)], [16, Math.min(dep.max, 3)]], osc: { rate: '1/2', depth: 1.2, shape: 'triangle' } }]);
    return out;
  }
  PL.addTransform((lib) => {
    const out = [];
    lib.filter(p => p.notes && !p.drums && (p.type === 'bass' || p.type === 'wobble' || p.type === 'lead')).forEach(p => { const c = curved(p); if (c) out.push(c); });
    // one set of shapes per tool, filed under the first genre (in library order) that plays it as a bass, wobble, lead or chords part
    const seen = new Set();
    lib.filter(p => p.notes && !p.drums && ['bass', 'wobble', 'lead', 'chords'].includes(p.type)).forEach(p => {
      if (seen.has(p.tool) || !F().def(p.tool) || p.genre === 'tension-drops') return; seen.add(p.tool);   // filed under a Song Engine genre, not the hand-made set
      shapes(p.tool).forEach(([name, bars, curve]) => out.push({ name: name + ' (' + ((F().def(p.tool) || {}).label || p.tool) + ')', type: 'curve', bars, tool: p.tool, preset: p.preset, configure: p.configure,
        genre: p.genre, genreLabel: p.genreLabel, bpm: p.bpm, scale: p.scale, curve, move: 'curve-shape', source: 'curve shapes by the library (Floor Falls’ moves) · ' + p.genreLabel }));
    });
    return out;
  });
  global.CurvePatterns = { curved, shapes };
})(typeof window !== 'undefined' ? window : globalThis);

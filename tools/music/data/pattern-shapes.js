/* ERAVOS music data — pattern-shapes.js (3.151): the Pattern tool's structures as blocks in the pattern browser, and on the Timeline.
 * His words, 2026-11-07: "patterns need to be in the timeline or in the pattern browser." A structure (eravos.pattern-field's settings)
 * becomes a PatternLibrary block: its notes emerge in A minor and are kept as semitones from the root (the browser's own form), so it plays in
 * any song's key. The Factory presets are blocks; so is every structure saved from the Pattern window or the Workshop (kept on this computer).
 *   MusicParts.PF_LIB = { toLibrary(name, params, tool, saved), librarySource(), saveShape(doc, name?) → name, toTimeline(doc) → send's result,
 *     readSaved(), ensureSource(), SAVED } */
(function (global) {
  'use strict';
  const PF = () => global.MusicParts.PF, TOOL = () => global.MusicParts.PF_TOOL, F = () => global.OrganismFactory;
  const emergeFrom = (get, key) => PF().emerge(TOOL().toStructure(get, key));
  const SAVED = 'eravos.shapes.v1', REF = { root: 9, scale: 'minor' };
  const readSaved = () => { try { const a = JSON.parse(global.localStorage.getItem(SAVED) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const writeSaved = (a) => { try { global.localStorage.setItem(SAVED, JSON.stringify(a.slice(-200))); } catch (e) {} };
  const settingsOf = (params) => { const out = {}, d = F() && F().def('eravos.pattern-field'); (d ? d.config : []).forEach(c => { out[c.key] = params && params[c.key] !== undefined ? params[c.key] : c.default; }); return out; };
  function toLibrary(name, params, tool, saved) {
    const P = settingsOf(params), r = emergeFrom((k) => P[k], REF), hi = r.st.range[1], type = hi <= 60 ? 'bass' : 'lead';
    return { name: '▦ ' + name, type, bars: r.st.bars, genre: 'shapes', genreLabel: 'Shapes', bpm: 120, scale: 'minor', tool: tool || (type === 'bass' ? 'eravos.retro-dco' : 'eravos.retro-poly'),
      notes: r.notes.map(x => ({ s: x.s, l: x.len, r: x.n - REF.root, v: x.vel })), source: saved ? 'your shape' : 'Pattern · Factory', shape: P };
  }
  function librarySource() {
    const d = F() && F().def('eravos.pattern-field'), out = [];
    Object.keys((d && d.presets) || {}).forEach(nm => { const pr = d.presets[nm]; out.push(toLibrary(nm.replace(/^.*· /, ''), pr.params || pr, null, false)); });
    readSaved().forEach(x => { if (x.notes) out.push(fromNotes(x)); else out.push(toLibrary(x.name, x.params, x.tool, true)); });
    return out.filter(p => p.notes.length);
  }
  let sourced = false; const ensureSource = () => { if (sourced || !global.PatternLibrary) return; sourced = true; global.PatternLibrary.addSource(librarySource); };
  // 3.165 a whole pattern made on the Workshop (his words, 2026-11-10: "i want to be able to add or create patterns for the library and the
  // timeline and import them into the timeline"): its notes kept as semitones from the song's root (drums: as they are), with each note's
  // bend and own knob values — a block under Yours, sent to the Timeline like any other
  function fromNotes(x) {
    const hi = Math.max(0, ...x.notes.map(n => (x.drums ? n.n : n.r)));
    return { name: '✎ ' + x.name, type: x.drums ? 'drums' : hi <= 51 ? 'bass' : 'lead', bars: x.bars, genre: 'yours', genreLabel: 'Yours', bpm: 120, scale: 'minor', drums: !!x.drums,
      tool: x.tool || (x.drums ? 'eravos.pads' : 'eravos.retro-poly'), notes: x.notes.map(n => Object.assign({}, n)), source: 'your pattern' };
  }
  // 2026-11-12: a saved pattern keeps all a note carries (shape, how it plays, chance, ratchet, knob curves) — before, only b and p
  const KEEP = ['p', 'b', 'c', 'sh', 'x', 'pr', 'rt', 'mt'];
  const keep = (n) => { const o = {}; KEEP.forEach(k => { if (n[k] !== undefined && n[k] !== null) o[k] = JSON.parse(JSON.stringify(n[k])); }); return o; };
  function saveNotes(name, notes, o) {
    o = o || {}; const K = global.Kernel, root = K && K.music && K.music.key ? +K.music.key.root || 0 : 0, a = readSaved(), nm = name || ('Pattern ' + (a.filter(q => q.notes).length + 1));
    const bars = Math.max(1, Math.min(8, Math.ceil(Math.max(1, ...notes.map(n => n.s + n.l)) / 16)));
    a.push({ name: nm, drums: !!o.drums, tool: o.tool || null, bars, at: Date.now(), notes: notes.map(n => Object.assign(o.drums ? { s: n.s, l: n.l, n: n.n, v: n.v } : { s: n.s, l: n.l, r: n.n - root, v: n.v }, keep(n))) });
    writeSaved(a); ensureSource(); if (global.PatternLibrary && !o.later) global.PatternLibrary.rebuild(); return nm;   // o.later: many at once, the caller rebuilds once (3.229)
  }
  function saveShape(d, name) {
    const P = {}; Object.keys(d).forEach(k => { if (k[0] !== '_') P[k] = d[k]; }); const a = readSaved(), nm = name || ('Shape ' + (a.length + 1));
    a.push({ name: nm, params: P, tool: (d._intoIds || [])[0] || null, at: Date.now() }); writeSaved(a); ensureSource(); if (global.PatternLibrary) global.PatternLibrary.rebuild(); return nm;
  }
  function toTimeline(d) {
    if (!global.PatternLibrary) return null; const P = {}; Object.keys(d).forEach(k => { if (k[0] !== '_') P[k] = d[k]; });
    const p = toLibrary('Shape', P, (d._intoIds || [])[0] || null, true); return global.PatternLibrary.send(p);
  }
  global.MusicParts = global.MusicParts || {};
  global.MusicParts.PF_LIB = { toLibrary, librarySource, saveShape, saveNotes, toTimeline, readSaved, ensureSource, SAVED };
  ensureSource();
})(window);

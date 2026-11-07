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
    readSaved().forEach(x => out.push(toLibrary(x.name, x.params, x.tool, true)));
    return out.filter(p => p.notes.length);
  }
  let sourced = false; const ensureSource = () => { if (sourced || !global.PatternLibrary) return; sourced = true; global.PatternLibrary.addSource(librarySource); };
  function saveShape(d, name) {
    const P = {}; Object.keys(d).forEach(k => { if (k[0] !== '_') P[k] = d[k]; }); const a = readSaved(), nm = name || ('Shape ' + (a.length + 1));
    a.push({ name: nm, params: P, tool: (d._intoIds || [])[0] || null, at: Date.now() }); writeSaved(a); ensureSource(); if (global.PatternLibrary) global.PatternLibrary.rebuild(); return nm;
  }
  function toTimeline(d) {
    if (!global.PatternLibrary) return null; const P = {}; Object.keys(d).forEach(k => { if (k[0] !== '_') P[k] = d[k]; });
    const p = toLibrary('Shape', P, (d._intoIds || [])[0] || null, true); return global.PatternLibrary.send(p);
  }
  global.MusicParts = global.MusicParts || {};
  global.MusicParts.PF_LIB = { toLibrary, librarySource, saveShape, toTimeline, readSaved, ensureSource, SAVED };
  ensureSource();
})(window);

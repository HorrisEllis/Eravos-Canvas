/* eravos.pattern-field 1.0.0 — Pattern: a pattern as a structure (3.150). His words, 2026-11-07: "agnostic. the structure defines the shape
 * which defines the emergent properties of the conditions." · "Yeah, we can just start with this. The small, like just the flat".
 * Its settings are the STRUCTURE — the key (from the canvas), chords per bar (its own progression, or the scale alone), a Euclidean grid
 * (k hits of n), a range, density over the pattern (how much of what the shape admits sounds), a contour (where the line leans), a note length,
 * a seed, and the notes you lock. Together they make the SHAPE: every note it admits; inside it the notes EMERGE (components/pattern-field:
 * the same structure + seed → the same notes). It makes no sound: notes go to each instrument wired from its note out. Every setting reaches
 * the next step it plays (live). Open in Field edits the same structure on the Field surface (tools/core/field/field.js). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, PROG = MusicParts.ALL_PROGRESSIONS, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const n = (key, label, group, def, min, max, step, unit, hint) => ({ key, type: 'number', default: def, min, max, step, unit, label, group, hint });
  const i = (key, label, group, def, min, max, hint) => ({ key, type: 'integer', default: def, min, max, label, group, hint });
  // the structure, from the settings (get(key)) and the key the canvas plays in — one builder: the engine, its window and the Workshop use it
  function toStructure(get, key) {
    const k = key || { root: 9, scale: 'minor' }, MT = window.MusicTheory, bars = +get('bars') || 4, chords = [];
    if (get('chords') === 'progression' && PROG[get('progression')]) for (let b = 0; b < bars; b++) { const deg = MusicParts.degreeAt(PROG, get('progression'), b, get('chordBars'));
      chords.push([0, 2, 4].map(s => ((MT.degreeToMidi(deg + s, 3, k.root, k.scale) % 12) + 12) % 12)); }
    const lo = +get('lo'), hi = +get('hi');
    return { bars, root: k.root, scale: k.scale, chords: chords.length ? chords : null, grid: { k: get('gridK'), n: get('gridN'), rot: get('gridRot') },
      range: [Math.min(lo, hi - 1), Math.max(hi, lo + 1)], density: { start: get('densStart'), end: get('densEnd'), shape: get('densShape') },
      contour: { shape: get('contour'), amount: get('contourAmt'), centre: get('centre') }, length: get('length'), seed: get('seed'), locked: get('locked') || [] };
  }
  MusicParts.PF_TOOL = { toStructure };
  OrganismFactory.define({
    id: 'eravos.pattern-field', domain: 'music', version: '1.0.0', label: 'Pattern', icon: '▦', accent: '#00d4ff',
    category: 'Generators', blurb: 'A pattern as a structure: its conditions make a shape, and the notes emerge inside it. Plays any instrument wired to it.',
    size: { w: 620, h: 430 }, minSize: { w: 460, h: 320 },
    permissions: ['bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.generation', 'capability.note_out'],
    hooks: [S.note_out('pf.hook.note_out'), S.transport_in('pf.hook.transport_in'), S.theory_in('pf.hook.theory_in')],
    config: [
      { key: 'chords', type: 'enum', options: ['progression', 'scale only'], default: 'progression', label: 'Chords', group: 'CHORDS', hint: 'progression: each bar admits its chord’s tones · scale only: every tone of the key' },
      { key: 'progression', type: 'enum', options: Object.keys(PROG), default: 'i-VI-III-VII', label: 'Progression', group: 'CHORDS' },
      { key: 'chordBars', type: 'enum', options: [1, 2, 4], default: 1, label: 'Bars / chord', group: 'CHORDS' },
      { key: 'bars', type: 'enum', options: [1, 2, 4, 8], default: 4, label: 'Bars', group: 'PATTERN' },
      i('gridK', 'Hits', 'GRID', 5, 0, 16, 'k of n: how many steps of every n can sound'), i('gridN', 'Of', 'GRID', 8, 1, 16, 'n: the length of the rhythm cycle, in 16ths'), i('gridRot', 'Turn', 'GRID', 0, 0, 15, 'turn the rhythm by steps'),
      i('lo', 'Low', 'RANGE', 33, 12, 108, 'the lowest note it may play (MIDI)'), i('hi', 'High', 'RANGE', 57, 13, 120, 'the highest note it may play (MIDI)'),
      n('densStart', 'Start', 'DENSITY', 0.3, 0, 1, 0.01, '', 'how much of what the shape admits sounds, at the start'), n('densEnd', 'End', 'DENSITY', 0.9, 0, 1, 0.01, '', '… and at the end'),
      { key: 'densShape', type: 'enum', options: ['rise', 'fall', 'arch', 'hold'], default: 'rise', label: 'Shape', group: 'DENSITY' },
      { key: 'contour', type: 'enum', options: ['flat', 'rise', 'fall', 'arch', 'wave'], default: 'arch', label: 'Contour', group: 'CONTOUR', hint: 'where the line leans over the pattern' },
      n('contourAmt', 'Amount', 'CONTOUR', 9, 0, 36, 1, 'st'), i('centre', 'Centre', 'CONTOUR', 41, 12, 120, 'the note the contour starts from (MIDI)'),
      n('length', 'Length', 'NOTES', 1.6, 0.25, 8, 0.05, 'steps'), i('seed', 'Seed', 'NOTES', 41, 1, 99999, 'the same seed plays the same notes'),
      { key: 'locked', type: 'object', default: [], hidden: true, label: 'Locked' },
    ],
    ui_hooks: ['pf_set', 'pf_lock'],
    presets: {},
    defaultPreset: null,
    engine(ctx) {
      const P = ctx.params;
      const structure = () => toStructure((k) => P.get(k), ctx.key);
      let cache = null, atStep = null;
      const result = () => { if (!cache) { cache = MusicParts.PF.emerge(structure()); atStep = new Map(); cache.notes.forEach(x => { if (!atStep.has(x.s)) atStep.set(x.s, []); atStep.get(x.s).push(x); }); } return cache; };
      const dirty = () => { cache = null; ctx.emitUI('pf_shape', { key: ctx.key || null }); };
      ctx.descriptor.config.forEach(c => P.onChange(c.key, dirty)); ctx.onKey(dirty);
      ctx.onTick((tk) => {
        const r = result(), s = tk.step16 % r.steps, outs = ctx.wiredOut('pf.hook.note_out');
        (atStep.get(s) || []).forEach(x => outs.forEach(target => ctx.emit('note:trigger', { target, note: x.n, velocity: x.vel, time: tk.time, duration: x.len * tk.stepDur * 0.98 })));
        ctx.emitUI('pf_step', { step: s, time: tk.time });
      });
      // the Workshop (or the window) sets several fields at once; a lock toggles a note you keep
      ctx.onUI('pf_set', { type: 'object' }, (p) => { Object.keys(p || {}).forEach(k => { const c = ctx.descriptor.config.find(x => x.key === k); if (c && k !== 'locked') P.set(k, p[k]); }); if (Array.isArray(p && p.locked)) P.set('locked', p.locked.slice(0, 256)); });
      ctx.onUI('pf_lock', { type: 'object', required: ['s', 'n'] }, (p) => { const L = (P.get('locked') || []).slice(), j = L.findIndex(x => x.s === p.s); if (j >= 0 && L[j].n === p.n) L.splice(j, 1); else if (j >= 0) L[j] = { s: p.s, n: p.n }; else L.push({ s: p.s, n: p.n }); P.set('locked', L); });
      ctx.internals = { structure, result, clamp };
      ctx.stateExtra = () => { const r = result(); return { admitted: r.admitted.length, emerged: r.notes.length, key: ctx.key || null }; };
      return {};
    },
  });
})();

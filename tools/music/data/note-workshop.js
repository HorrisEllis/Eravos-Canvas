/* ERAVOS music — note-workshop.js → window.NoteWorkshop (W2a, specs/eravos.workshop.spec ADDENDUM 2026-11-08).
 * His words, 2026-11-08: "When you right click on edit note. Does it open the workshop?" · "do that. editing a note, whether in the
 * pattern menu or in the timeline."
 * The music NOTES kind for the Workshop, and the one way both entries open a clip's notes there (the Timeline's right-click › ✎ Edit notes,
 * and Patterns › ✎ Edit notes). A clip's notes are the Timeline's own: { s (16th), l (16ths), n (MIDI), v (0…1), b?: { from, to, shape },
 * p?: { knob: value } (this note only, 3.53), c?: curves }. Every edit reaches the clip at once (ui:clip_edit { notes }); the Workshop keeps
 * the undo, the redo and the history.
 *   NoteWorkshop.open({ K?, tl, clip }) → the Workshop (or null) · NoteWorkshop.KIND */
(function (global) {
  'use strict';
  const F = () => global.OrganismFactory, MT = () => global.MusicTheory;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const name = (n) => (MT() && MT().noteName ? MT().noteName(n) : String(n));
  const SHAPES = ['linear', 'early', 'late'];
  let lastLen = 2;
  // the instrument a clip plays: its lane's target; its knobs = its own numeric settings (the ones a note may set for itself)
  function knobsOf(K, inst) {
    const r = inst && F().handle(inst); if (!r || !r.def) return [];
    return (r.def.config || []).filter(c => (c.type === 'number' || c.type === 'integer') && !c.hidden && !c.settingsOnly && typeof c.min === 'number' && typeof c.max === 'number' && c.max > c.min)
      .slice(0, 12).map(c => ({ key: c.key, label: c.label || c.key, min: c.min, max: c.max, step: c.step || (c.type === 'integer' ? 1 : (c.max - c.min) / 100), unit: c.unit || '', base: +r.ctx.params.get(c.key) }));
  }
  const range = (d) => { const ns = d.notes.map(x => x.n); const lo = ns.length ? Math.min(...ns) : 48, hi = ns.length ? Math.max(...ns) : 72; return [Math.max(0, lo - 3), Math.min(127, Math.max(hi + 3, lo + 14))]; };
  const cur = (d) => (d.sel >= 0 && d.sel < d.notes.length) ? d.notes[d.sel] : null;
  const KIND = {
    id: 'music.notes', label: 'Notes',
    title: (d) => (d.name || 'clip') + ' · notes',
    stations: (d) => ['Timeline', d.name || 'clip', cur(d) ? 'note ' + name(cur(d).n) : 'notes'],
    layers(d) {
      const n = cur(d), L = [{ id: 'clip', label: 'Clip', group: 'CLIP', type: 'value', sub: d.bars + (d.bars > 1 ? ' bars · ' : ' bar · ') + d.notes.length + ' notes',
        fields: [{ key: 'bars', label: 'Bars', type: 'number', min: 1, max: 128, step: 1 }] }];
      L.push({ id: 'note', label: n ? 'Note ' + name(n.n) : 'Note — click one', group: 'NOTE', type: 'events', sub: n ? 'bar ' + (1 + Math.floor(n.s / 16)) + '.' + (1 + Math.floor((n.s % 16) / 4)) + ' · ' + n.l + '/16' : 'a click on a note selects it, on an empty spot adds one',
        fields: n ? [{ key: 'n', label: 'Pitch', type: 'number', min: 0, max: 127, step: 1 }, { key: 's', label: 'Start', type: 'number', min: 0, max: d.bars * 16 - 1, step: 1, unit: '/16' },
          { key: 'l', label: 'Length', type: 'number', min: 1, max: d.bars * 16, step: 1, unit: '/16' }, { key: 'v', label: 'Velocity', type: 'number', min: 0.05, max: 1, step: 0.01 }] : [] });
      if (n) L.push({ id: 'bend', label: 'Bend', group: 'NOTE', type: 'curve', sub: n.b ? (n.b.from || 0) + ' → ' + (n.b.to || 0) + ' st' : 'none',
        fields: [{ key: 'b.from', label: 'From', type: 'number', min: -24, max: 24, step: 0.5, unit: 'st' }, { key: 'b.to', label: 'To', type: 'number', min: -24, max: 24, step: 0.5, unit: 'st' }, { key: 'b.shape', label: 'Shape', type: 'enum', options: SHAPES }] });
      if (n && d.knobs.length) L.push({ id: 'knobs', label: 'This note’s knobs', group: 'NOTE', type: 'value', sub: Object.keys(n.p || {}).length + ' set for this note only',
        fields: d.knobs.map(k => ({ key: 'p.' + k.key, label: k.label, type: 'number', min: k.min, max: k.max, step: k.step, unit: k.unit })) });
      return L;
    },
    get(d, key) {
      const n = cur(d); if (key === 'bars') return d.bars; if (!n) return '';
      if (key === 'n' || key === 's' || key === 'l' || key === 'v') return n[key];
      if (key.startsWith('b.')) { const b = n.b || {}; return key === 'b.shape' ? (b.shape || 'linear') : (b[key.slice(2)] || 0); }
      if (key.startsWith('p.')) { const k = key.slice(2), kn = d.knobs.find(x => x.key === k); return n.p && n.p[k] !== undefined ? n.p[k] : (kn ? +(+kn.base).toFixed(4) : ''); }
      return '';
    },
    set(d, key, v) {
      if (key === 'bars') { d.bars = clamp(Math.round(+v || 1), 1, 128); d.notes = d.notes.filter(x => x.s < d.bars * 16); return d; }
      if (key === 'sel') { d.sel = Number.isInteger(+v) && +v >= 0 && +v < d.notes.length ? +v : -1; return d; }
      if (key === 'add') { const nn = { s: clamp(Math.round(v.s), 0, d.bars * 16 - 1), l: lastLen, n: clamp(Math.round(v.n), 0, 127), v: 0.85 }; d.notes.push(nn); d.notes.sort((a, b) => a.s - b.s || a.n - b.n); d.sel = d.notes.indexOf(nn); return d; }
      const n = cur(d); if (!n) return d;
      if (key === 'del') { d.notes.splice(d.sel, 1); d.sel = -1; return d; }
      if (key === 'dup') { const c = JSON.parse(JSON.stringify(n)); c.s = clamp(n.s + n.l, 0, d.bars * 16 - 1); d.notes.push(c); d.notes.sort((a, b) => a.s - b.s || a.n - b.n); d.sel = d.notes.indexOf(c); return d; }
      if (key === 'n') n.n = clamp(Math.round(+v), 0, 127);
      else if (key === 's') n.s = clamp(Math.round(+v), 0, d.bars * 16 - 1);
      else if (key === 'l') { n.l = clamp(Math.round(+v), 1, d.bars * 16); lastLen = n.l; }
      else if (key === 'v') n.v = clamp(+v, 0.05, 1);
      else if (key.startsWith('b.')) { const b = Object.assign({ from: 0, to: 0, shape: 'linear' }, n.b || {}), k = key.slice(2); b[k] = k === 'shape' ? (SHAPES.includes(v) ? v : 'linear') : clamp(+v || 0, -24, 24); if (!b.from && !b.to) delete n.b; else n.b = b; }
      else if (key.startsWith('p.')) { const k = key.slice(2), kn = d.knobs.find(x => x.key === k); if (!kn) return d; n.p = Object.assign({}, n.p, { [k]: clamp(+v, kn.min, kn.max) }); }
      const keep = n; d.notes.sort((a, b) => a.s - b.s || a.n - b.n); d.sel = d.notes.indexOf(keep); return d;
    },
    geom(d, W, H) { const [lo, hi] = range(d), padL = 44, steps = d.bars * 16, rows = hi - lo + 1; return { lo, hi, padL, steps, rows, sx: (W - padL - 8) / steps, rh: (H - 16) / rows }; },
    draw(g, W, H, d) {
      const G = KIND.geom(d, W, H), x = (s) => G.padL + s * G.sx, y = (n) => 8 + (G.hi - n) * G.rh;
      g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
      for (let n = G.lo; n <= G.hi; n++) { const black = [1, 3, 6, 8, 10].includes(n % 12); g.fillStyle = black ? '#0a0c10' : '#0d1015'; g.fillRect(G.padL, y(n), W - G.padL - 8, G.rh - 0.5);
        if (n % 12 === 0 || G.rh >= 12) { g.fillStyle = n % 12 === 0 ? '#9aa6b8' : '#5d6878'; g.font = '10px monospace'; g.fillText(name(n), 6, y(n) + G.rh * 0.72); } }
      for (let s = 0; s <= G.steps; s++) { g.fillStyle = s % 16 === 0 ? '#2b3340' : s % 4 === 0 ? '#1a1f28' : '#11151c'; g.fillRect(Math.round(x(s)), 8, 1, H - 16); }
      d.notes.forEach((n, i) => {
        const nx = x(n.s), ny = y(n.n), nw = Math.max(3, n.l * G.sx - 2), nh = Math.max(3, G.rh - 2), on = i === d.sel;
        g.globalAlpha = 0.45 + 0.55 * n.v; g.fillStyle = on ? '#ffd166' : '#00d4ff'; g.beginPath(); g.roundRect ? g.roundRect(nx + 1, ny + 1, nw, nh, 3) : g.rect(nx + 1, ny + 1, nw, nh); g.fill(); g.globalAlpha = 1;
        if (n.b && (n.b.from || n.b.to)) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(nx + 2, ny + nh / 2 - (n.b.from || 0) * G.rh); g.lineTo(nx + nw, ny + nh / 2 - (n.b.to || 0) * G.rh); g.stroke(); }
        if (on) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(nx + 0.5, ny + 0.5, nw + 1, nh + 1); }
        if (n.p && Object.keys(n.p).length) { g.fillStyle = '#ff2266'; g.beginPath(); g.arc(nx + nw - 3, ny + 4, 2.5, 0, 7); g.fill(); }   // a dot: this note sets its own knobs
      });
    },
    pick(d, px, py, W, H) {
      const G = KIND.geom(d, W, H); if (px < G.padL) return null;
      const s = Math.floor((px - G.padL) / G.sx), nn = clamp(Math.floor(G.hi - (py - 8) / G.rh + 1), G.lo, G.hi);
      const i = d.notes.findIndex(x => x.n === nn && s >= x.s && s < x.s + x.l);
      if (i >= 0) return { key: 'sel', value: i, label: 'SELECT ' + name(nn) };
      return { key: 'add', value: { s, n: nn }, label: 'ADD ' + name(nn) };
    },
    tools: [{ id: 'note', label: 'Note: select, or add on an empty spot', glyph: '♪', layer: 'note' }, { id: 'bend', label: 'Bend', glyph: '⌒', layer: 'bend' }, { id: 'knobs', label: 'This note’s knobs', glyph: '◎', layer: 'knobs' }],
    outline: (d) => [[0, d.name || 'clip']].concat(d.notes.slice(0, 32).map((n, i) => [1, (i === d.sel ? '▸ ' : '') + name(n.n) + ' · ' + (1 + Math.floor(n.s / 16)) + '.' + (1 + Math.floor((n.s % 16) / 4)), 'note'])),
    status: (d) => [['NOTES', d.notes.length], ['BARS', d.bars], ['SELECTED', cur(d) ? name(cur(d).n) : '—']],
    actions: (d) => (cur(d) ? [{ label: 'DELETE NOTE', hint: 'remove the selected note (Ctrl+Z puts it back)', run: () => ({ key: 'del', value: 1, label: 'DELETE NOTE' }) },
      { label: 'DUPLICATE NOTE', hint: 'a copy right after it', run: () => ({ key: 'dup', value: 1, label: 'DUPLICATE NOTE' }) }] : [])
      .concat(d.tl ? [{ label: 'PIANO ROLL', hint: 'open this clip in the Timeline’s piano roll instead', run: () => { const T = F().handle(d.tl); if (global.Workshop && global.Workshop.current) global.Workshop.current.close(); if (T && T.view && T.view.openClip) T.view.openClip(d.clip); return 'opened in the piano roll'; } }] : []),
  };
  if (global.Workshop && global.Workshop.addKind) { const r = global.Workshop.addKind(KIND); if (!r.ok) console.error('[ERAVOS] notes kind:', r.problems); }

  // open a Timeline clip's notes in the Workshop; every edit goes back to the clip at once
  function open(o) {
    o = o || {}; const K = o.K || global.Kernel, T = F().handle(o.tl); if (!T || !global.Workshop) return null;
    const c = T.ctx.internals.clips.find(x => x.id === o.clip && x.kind === 'notes'); if (!c) return null;
    const lane = T.ctx.internals.lanes.find(l => l.id === c.lane), inst = lane && lane.target;
    const doc = { tl: o.tl, clip: c.id, name: c.name || (lane && lane.name) || 'clip', bars: c.bars || 1, sel: -1, inst: inst || null,
      notes: JSON.parse(JSON.stringify(c.notes || [])), knobs: knobsOf(K, inst) };
    const write = (d) => K.bus.publish('ui:clip_edit:' + o.tl, { id: c.id, patch: { notes: d.notes, bars: d.bars } });
    return global.Workshop.open(KIND.id, doc, { onChange: write, onApply: (d) => { write(d); if (global.Workshop.current) global.Workshop.current.close(); } });
  }
  global.NoteWorkshop = { open, KIND };
})(typeof window !== 'undefined' ? window : globalThis);

/* eravos.pattern-field UI — the window (a flat view of the shape and what emerges, the main controls, Open in Workshop) and the Workshop's
 * music PATTERN kind (canvas/runtime/workshop.js is domain-free; every word and picture of a pattern is here). 3.150, W1 flat. */
(function () {
  'use strict';
  const PF = () => window.MusicParts.PF, TOOL = () => window.MusicParts.PF_TOOL;
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], nm = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const keyName = (k) => k ? NAMES[k.root] + ' ' + String(k.scale).replace(/_/g, ' ') : 'A minor';
  const emergeFrom = (get, key) => PF().emerge(TOOL().toStructure(get, key));
  // where things are on a drawing of the pattern: steps across, notes up; a gutter for the octave names and a lane for density
  function geom(W, H, r, compact) {
    const L = compact ? 30 : 46, R = 12, T = compact ? 12 : 22, lane = compact ? 0 : 58, B = lane + (compact ? 14 : 34), [lo, hi] = r.st.range, rows = hi - lo + 1, steps = r.steps;
    const x0 = L, x1 = W - R, y0 = T, y1 = H - B, cw = (x1 - x0) / steps, rh = (y1 - y0) / rows;
    return { L, x0, x1, y0, y1, cw, rh, lo, hi, steps, lane, X: (s) => x0 + s * cw, Y: (m) => y1 - (m - lo + 1) * rh, at: (x, y) => ({ s: Math.floor((x - x0) / cw), m: lo + Math.floor((y1 - y) / rh) }) };
  }
  function draw(g, W, H, r, o) {
    o = o || {}; const G = geom(W, H, r, o.compact), st = r.st, sel = o.selected || '', PFc = PF();
    g.fillStyle = '#030508'; g.fillRect(0, 0, W, H);
    const tones = (window.MusicParts.KEY && window.MusicParts.KEY.SCALES[st.scale]) || [0, 2, 3, 5, 7, 8, 10], inKey = (m) => tones.includes(((m - st.root) % 12 + 12) % 12);
    const hits = PFc.euclid(st.grid.k, st.grid.n, st.grid.rot), hl = (id) => sel === id;
    for (let m = G.lo; m <= G.hi; m++) { const y = G.Y(m);
      if (!inKey(m)) { g.fillStyle = hl('scale') ? 'rgba(0,0,0,.7)' : 'rgba(0,0,0,.45)'; g.fillRect(G.x0, y, G.x1 - G.x0, G.rh); }
      else if (st.chords) for (let b = 0; b < st.bars; b++) if (st.chords[b % st.chords.length].includes(((m % 12) + 12) % 12)) { g.fillStyle = hl('chords') ? 'rgba(0,212,255,.11)' : 'rgba(0,212,255,.05)'; g.fillRect(G.X(b * 16), y, 16 * G.cw, G.rh); }
      g.fillStyle = 'rgba(26,42,64,.55)'; g.fillRect(G.x0, y + G.rh - 0.5, G.x1 - G.x0, 0.5);
      if (((m - st.root) % 12 + 12) % 12 === 0 && G.rh > 2.5) { g.fillStyle = '#5a7a96'; g.font = '400 9px ui-monospace, monospace'; g.fillText(nm(m), 4, y + G.rh * 0.8); } }
    for (let s = 0; s < G.steps; s++) { const on = hits[s % st.grid.n] === 1; g.fillStyle = on ? (hl('grid') ? 'rgba(0,212,255,.9)' : 'rgba(0,212,255,.55)') : 'rgba(42,64,96,.6)'; g.fillRect(G.X(s) + G.cw * 0.3, G.y0 - 8, Math.max(1, G.cw * 0.4), on ? 4 : 2); }
    for (let b = 0; b <= st.bars; b++) { g.fillStyle = 'rgba(42,64,96,.9)'; g.fillRect(G.X(b * 16), G.y0, 1, G.y1 - G.y0); if (b < st.bars && !o.compact) { g.fillStyle = '#2e4a60'; g.font = '400 9px ui-monospace, monospace'; g.fillText(String(b + 1).padStart(2, '0'), G.X(b * 16) + 4, G.y1 + 13); } }
    r.admitted.forEach(([s, m]) => { g.fillStyle = 'rgba(0,212,255,.3)'; g.fillRect(G.X(s) + G.cw / 2 - 0.75, G.Y(m) + G.rh / 2 - 0.75, 1.5, 1.5); });
    g.fillStyle = hl('range') ? 'rgba(0,212,255,.9)' : 'rgba(0,212,255,.45)'; g.fillRect(G.x0, G.Y(G.hi), G.x1 - G.x0, 1); g.fillRect(G.x0, G.Y(G.lo) + G.rh - 1, G.x1 - G.x0, 1);
    g.strokeStyle = hl('contour') ? 'rgba(204,68,255,.95)' : 'rgba(204,68,255,.5)'; g.lineWidth = hl('contour') ? 1.5 : 1; g.setLineDash([2, 4]); g.beginPath();
    for (let s = 0; s <= G.steps; s++) { const y = G.Y(Math.max(G.lo, Math.min(G.hi, PFc.contour(st, s)))) + G.rh / 2; s ? g.lineTo(G.X(s), y) : g.moveTo(G.X(s), y); } g.stroke(); g.setLineDash([]);
    r.notes.forEach(x => { const col = x.locked ? '#00ff88' : '#7fe9ff', y = G.Y(x.n) + G.rh * 0.25, h = Math.max(1.5, G.rh * 0.5), w = Math.max(2, Math.min(x.len, G.steps - x.s) * G.cw - 1);
      g.shadowColor = x.locked ? 'rgba(0,255,136,.7)' : 'rgba(0,212,255,.7)'; g.shadowBlur = o.compact ? 6 : 10; g.fillStyle = col; g.fillRect(G.X(x.s) + 0.5, y, w, h); g.shadowBlur = 0;
      if (x.locked && !o.compact) { g.strokeStyle = 'rgba(0,255,136,.6)'; g.lineWidth = 1; g.strokeRect(G.X(x.s) - 2, y - 3, w + 5, h + 6); } });
    if (o.cursor >= 0) { g.fillStyle = 'rgba(255,107,53,.85)'; g.fillRect(G.X(o.cursor), G.y0, 1, G.y1 - G.y0); }
    if (G.lane) { const ly = G.y1 + 22, lh = G.lane - 14, d = (s) => PFc.density(st, s); g.fillStyle = 'rgba(26,42,64,.8)'; g.fillRect(G.x0, ly + lh, G.x1 - G.x0, 0.5);
      g.strokeStyle = hl('density') ? '#00d4ff' : 'rgba(0,212,255,.55)'; g.lineWidth = hl('density') ? 1.5 : 1; g.beginPath(); for (let s = 0; s <= G.steps; s++) { const y = ly + lh - d(Math.min(s, G.steps - 1)) * lh; s ? g.lineTo(G.X(s), y) : g.moveTo(G.X(s), y); } g.stroke();
      g.fillStyle = '#5a7a96'; g.font = '400 9px ui-monospace, monospace'; g.fillText('DENSITY', 4, ly + lh / 2 + 3); }
  }

  // ---- the Workshop's kind: a pattern's layers are its settings, grouped as STRUCTURE (the shape) and WHAT EMERGES
  function cfgOf(key) { const d = window.OrganismFactory && OrganismFactory.def('eravos.pattern-field'); return d ? d.config.find(c => c.key === key) : null; }
  const F = (key) => { const c = cfgOf(key) || { key }; return { key, label: c.label || key, type: c.type === 'enum' ? 'enum' : c.type === 'integer' || c.type === 'number' ? 'number' : 'text', min: c.min, max: c.max, step: c.type === 'integer' ? 1 : c.step, unit: c.unit, options: c.options }; };
  const KIND = {
    id: 'music.pattern', label: 'Pattern',
    title: (d) => 'PATTERN · ' + d.bars + ' BARS' + ((d._into || []).length ? ' · INTO ' + d._into.join(', ') : ''),
    stations: () => ['SONG', 'PATTERN', 'NOTE'],
    tools: [{ glyph: '▤', label: 'Chords', layer: 'chords' }, { glyph: '⋮', label: 'Grid', layer: 'grid' }, { glyph: '⇕', label: 'Range', layer: 'range' }, { glyph: '◢', label: 'Density', layer: 'density' }, { glyph: '〰', label: 'Contour', layer: 'contour' }, { glyph: '⚄', label: 'Seed', layer: 'variation' }, { glyph: '🔒', label: 'Lock (click a note)', layer: 'yours' }],
    layers: (d) => [
      { id: 'scale', group: 'STRUCTURE · THE SHAPE', type: 'constraint', label: 'Scale', sub: keyName(d._key) + ' · from the canvas key', fields: [] },
      { id: 'chords', group: 'STRUCTURE · THE SHAPE', type: 'constraint', label: 'Chords', sub: d.chords === 'progression' ? d.progression + ' · ' + d.chordBars + ' bar' + (d.chordBars > 1 ? 's' : '') + ' each' : 'every tone of the key', fields: [F('chords'), F('progression'), F('chordBars')] },
      { id: 'grid', group: 'STRUCTURE · THE SHAPE', type: 'constraint', label: 'Grid', sub: d.gridK + ' of ' + d.gridN + (d.gridRot ? ' · turned ' + d.gridRot : ''), fields: [F('gridK'), F('gridN'), F('gridRot')] },
      { id: 'range', group: 'STRUCTURE · THE SHAPE', type: 'constraint', label: 'Range', sub: nm(d.lo) + ' – ' + nm(d.hi), fields: [F('lo'), F('hi')] },
      { id: 'density', group: 'STRUCTURE · THE SHAPE', type: 'curve', label: 'Density', sub: Math.round(d.densStart * 100) + ' → ' + Math.round(d.densEnd * 100) + ' % · ' + d.densShape, fields: [F('densStart'), F('densEnd'), F('densShape')] },
      { id: 'contour', group: 'STRUCTURE · THE SHAPE', type: 'curve', label: 'Contour', sub: d.contour + ' · ' + d.contourAmt + ' st from ' + nm(d.centre), fields: [F('contour'), F('contourAmt'), F('centre')] },
      { id: 'notes', group: 'WHAT EMERGES', type: 'emergent', label: 'Notes', sub: 'from the conditions', fields: [F('length'), F('bars')] },
      { id: 'yours', group: 'WHAT EMERGES', type: 'events', label: 'Yours', sub: (d.locked || []).length + ' locked · click a note to lock or free it', fields: [] },
      { id: 'variation', group: 'WHAT EMERGES', type: 'value', label: 'Variation', sub: 'seed ' + d.seed, fields: [F('seed')] },
    ],
    get: (d, k) => d[k],
    set: (d, k, v) => Object.assign({}, d, { [k]: v }),
    draw: (g, W, H, d, v) => draw(g, W, H, emergeFrom((k) => d[k], d._key), { selected: v && v.selected }),
    pick: (d, x, y, W, H) => {
      const r = emergeFrom((k) => d[k], d._key), G = geom(W, H, r, false), p = G.at(x, y); if (p.s < 0 || p.s >= r.steps || p.m < G.lo || p.m > G.hi) return null;
      const L = (d.locked || []).slice(), j = L.findIndex(q => q.s === p.s), hit = r.notes.find(q => q.s === p.s && Math.abs(q.n - p.m) <= 1);
      if (j >= 0 && (!hit || L[j].n === hit.n)) { L.splice(j, 1); return { key: 'locked', value: L, label: 'FREE ' + nm(hit ? hit.n : p.m) }; }
      const m = hit ? hit.n : p.m; if (j >= 0) L[j] = { s: p.s, n: m }; else L.push({ s: p.s, n: m }); return { key: 'locked', value: L, label: 'LOCK ' + nm(m) + ' AT ' + (Math.floor(p.s / 16) + 1) + '.' + (p.s % 16 + 1) };
    },
    outline: (d) => [[0, 'PATTERN · ' + d.bars + ' BARS'], [1, 'STRUCTURE · 6'], [2, 'SCALE', 'scale'], [2, 'CHORDS', 'chords'], [2, 'GRID', 'grid'], [2, 'RANGE', 'range'], [2, 'DENSITY', 'density'], [2, 'CONTOUR', 'contour'],
      [1, 'WHAT EMERGES · 3'], [2, 'NOTES', 'notes'], [2, 'YOURS', 'yours'], [2, 'VARIATION', 'variation'], [1, 'PLAYS INTO · ' + ((d._into || []).join(', ') || 'nothing wired yet')]],
    status: (d) => { const r = emergeFrom((k) => d[k], d._key); return [['KEY', keyName(d._key)], ['ADMITTED', r.admitted.length + ' notes'], ['EMERGED', r.notes.length + ' notes'], ['BARS', d.bars]]; },
  };
  const LIB = () => window.MusicParts.PF_LIB, saveShape = (d, nm) => LIB().saveShape(d, nm), toTimeline = (d) => LIB().toTimeline(d), ensureSource = () => LIB() && LIB().ensureSource();
  KIND.actions = (d) => [
    { label: 'SAVE TO PATTERNS', hint: 'keep this structure as a block in the pattern browser (Patterns) — it plays in any key', run: (x) => 'saved as ' + saveShape(x) },
    { label: 'TO THE TIMELINE', hint: 'the notes that emerged, as a clip on the Timeline (on the track of the instrument it plays into)', run: (x) => { const r = toTimeline(x); return r ? 'on the Timeline at bar ' + r.bar : 'no Timeline'; } },
  ];
  window.MusicParts.PF_KIND = KIND;

  OrganismFactory.reg('eravos.pattern-field', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), st = () => view.state || {};
    if (window.Workshop && !window.Workshop.kinds().includes(KIND.id)) { const a = window.Workshop.addKind(KIND); if (!a.ok) console.error('Pattern: the Workshop refused its kind —', a.problems.join('; ')); }
    let key = null, cursor = -1;
    view.on('state_sync', (s) => { if (s && s.key) key = s.key; });
    view.on('pf_shape', (s) => { if (s && s.key) key = s.key; });
    view.on('pf_step', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; }));
    const get = (k) => (st()[k] !== undefined ? st()[k] : (cfg(k) || {}).default);
    const cv = UI.Canvas(560, 170); cv.classList.add('gg-map');
    UI.loop(cv, () => { const g = cv.g, W = cv.fit().W, H = cv.H; draw(g, W, H, emergeFrom(get, key), { compact: true, cursor }); }, 20);
    const knob = (k) => { const c = UI.paramControl(view, cfg(k), { size: 40 }); c.el.dataset.key = k; return c.el; };
    const seg = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el;
    const card = (t, kids) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: t }), h('div', { class: 'uk-row' }, kids)]);
    ensureSource();
    const saveB = UI.Button({ label: 'Save to Patterns', hint: 'keep this structure as a block in the pattern browser', onClick: () => { const nm = saveShape(docNow()); saveB.set && saveB.set('Saved · ' + nm); setTimeout(() => saveB.set && saveB.set('Save to Patterns'), 1600); } });
    const tlB = UI.Button({ label: 'To Timeline', hint: 'the notes that emerged, as a clip on the Timeline', onClick: () => toTimeline(docNow()) });
    const ws = UI.Button({ label: 'Open in Workshop', kind: 'primary', hint: 'the whole structure on the Workshop surface — every change plays at once', onClick: () => openWorkshop() });
    function docNow() { const d = {}; view.descriptor.config.forEach(c => { d[c.key] = get(c.key); }); d._key = key;
      try { const K = view.K || window.Kernel, outs = K && K.wires ? K.wires.list().filter(w => w.src && w.src.instanceId === view.instanceId).map(w => { const r = K.registry.get(w.dst.instanceId); return r && r.descriptor && r.descriptor.label; }).filter(Boolean) : []; d._into = Array.from(new Set(outs)); d._intoIds = K && K.wires ? Array.from(new Set(K.wires.list().filter(w => w.src && w.src.instanceId === view.instanceId).map(w => { const r = K.registry.get(w.dst.instanceId); return r && r.organism_id; }).filter(Boolean))) : []; } catch (e) { d._into = []; d._intoIds = []; }
      return d; }
    function openWorkshop() {
      if (!window.Workshop) return;
      window.Workshop.open(KIND.id, docNow(), { onChange: (d) => { const p = {}; Object.keys(d).forEach(k => { if (k[0] !== '_') p[k] = d[k]; }); view.emit('pf_set', p); } });
    }
    view.openWorkshop = openWorkshop;
    view.root.append(h('div', { class: 'uk-panel' }, [
      h('div', { class: 'org-row', style: { justifyContent: 'space-between', alignItems: 'center' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px' } }, [saveB.el, tlB.el, ws.el])]),
      cv,
      card('SHAPE', [seg('chords'), seg('densShape'), seg('contour')]),
      card('STRUCTURE', [knob('gridK'), knob('gridN'), knob('densStart'), knob('densEnd'), knob('lo'), knob('hi'), knob('seed')]),
    ]));
  });
})();

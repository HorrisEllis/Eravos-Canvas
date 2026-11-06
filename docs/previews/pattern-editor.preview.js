/* PREVIEW ONLY — the Pattern Editor's face (tools/music/planned/pattern-editor.spec), drawn with the real kit in the real canvas. Not shipped.
 * The note view is today's piano roll (kept, per the spec); the tree, grow strip and library run the REAL components (pattern-store,
 * seed-registry, scale-key) on a real nested pattern. Silent. */
(function () {
  const S = OrganismSDK.STD, MP = window.MusicParts, ACC = '#3ddc97';
  OrganismFactory.define({
    id: 'eravos.pattern-editor', domain: 'music', version: '0.1.0', label: 'Pattern Editor', icon: '🧬', accent: ACC,
    category: 'Arrange', blurb: 'Notes and patterns, one editor: patterns inside patterns (the fractal), grown, varied by seed, saved for later.',
    size: { w: 900, h: 780 }, minSize: { w: 640, h: 520 }, permissions: ['bus_publish', 'bus_subscribe'],
    hooks: [S.transport_in('pe.hook.transport_in'), S.theory_in('pe.hook.theory_in')],
    config: [
      { key: 'view', type: 'enum', options: ['notes', 'tree', 'library'], default: 'notes', label: 'View', group: 'EDIT' },
      { key: 'depth', type: 'number', default: 2, min: 0, max: 4, step: 1, label: 'Grow depth', group: 'GROW' },
      { key: 'chance', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Chance', group: 'VARY' },
      { key: 'lock', type: 'boolean', default: true, label: 'Key lock', group: 'EDIT' },
    ],
    engine(ctx) { return {}; },
  });
  OrganismFactory.reg('eravos.pattern-editor', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), KEY = MP.KEY, key = { root: 9, scale: 'minor' };
    // a real nested pattern: a cell → a bar (4 places: as is, +2 scale steps, reversed, inverted) → a phrase (bar, bar up, bar stretched)
    const st = MP.PatternStore(), seeds = MP.Seeds(7);
    st.put({ id: 'cell', name: 'Cell', len: 4, notes: [{ s: 0, l: 1, n: 57, v: 0.9 }, { s: 1, l: 1, n: 60, v: 0.7 }, { s: 2, l: 2, n: 64, v: 0.8 }] });
    st.put({ id: 'bar', name: 'Bar', len: 16, places: [{ ref: 'cell', at: 0 }, { ref: 'cell', at: 4, xf: { steps: 2 } }, { ref: 'cell', at: 8, xf: { reverse: true } }, { ref: 'cell', at: 12, xf: { invert: true, chance: 0.8 } }] });
    st.put({ id: 'phrase', name: 'Phrase', len: 64, places: [{ ref: 'bar', at: 0 }, { ref: 'bar', at: 16, xf: { steps: 2 } }, { ref: 'bar', at: 32, xf: { stretch: 2 } }] });
    const flat = MP.flatten(st.get('phrase'), st, { key, KEY, rng: (p) => seeds.rng(p) }).notes;
    // NOTE VIEW — today's piano roll, showing the flattened phrase (every edit there edits the pattern)
    const roll = EravosTimelinePianoRoll.create(view, {}); const rollBox = h('div', { style: { height: '330px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: '0 0 330px' } }, [roll.el]);
    Object.assign(roll.el.style, { height: '100%', flex: '1 1 auto', minHeight: '0' });
    setTimeout(() => roll.show({ id: 'pe', bars: 4, startBar: 1, notes: flat }, { id: 'l1', name: 'Phrase', color: ACC, target: 'eravos.swarm-oscillator' }, { key }), 0);
    // PATTERN TREE — what is placed inside what, level by level (the fractal, visible): each block a place you can drag, transpose, stretch, mute
    const tree = UI.Canvas(860, 104);
    UI.loop(tree, () => {
      const g = tree.g; tree.fit(); const W = tree.W, H = 104, rowH = 30, x = (s) => 8 + s / 64 * (W - 16);
      g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
      const block = (x0, x1, y, label, sub, a) => { g.fillStyle = `rgba(61,220,151,${a})`; g.fillRect(x0 + 1, y, x1 - x0 - 2, rowH - 6); g.strokeStyle = ACC; g.lineWidth = 1; g.strokeRect(x0 + 1.5, y + 0.5, x1 - x0 - 3, rowH - 7);
        g.fillStyle = '#e8fff4'; g.font = '11px ui-monospace, monospace'; g.fillText(label, x0 + 6, y + 13); if (sub) { g.fillStyle = '#8fbfa9'; g.font = '10px ui-monospace, monospace'; g.fillText(sub, x0 + 6, y + 23); } };
      block(x(0), x(64), 2, 'Phrase', '3 places · 64 steps', 0.22);
      const P = st.get('phrase'), B = st.get('bar');
      P.places.forEach(pl => { const L = 16 * ((pl.xf && pl.xf.stretch) || 1); block(x(pl.at), x(pl.at + L), 2 + rowH, 'Bar', pl.xf ? Object.entries(pl.xf).map(([k, v]) => k === 'steps' ? '+' + v + ' steps' : k + ' ' + (v === true ? '' : v)).join(' ') : 'as is', 0.15);
        B.places.forEach(c => { const k = (pl.xf && pl.xf.stretch) || 1, s0 = pl.at + c.at * k; block(x(s0), x(s0 + 4 * k), 2 + 2 * rowH, 'Cell', c.xf ? Object.keys(c.xf).join(' ') : '', 0.09); }); });
    }, 4);
    // GROW — a rule written into each of its own notes, to a depth (self-similar), then plain notes to edit
    const growC = UI.Canvas(860, 92);
    UI.loop(growC, () => {
      const g = growC.g; growC.fit(); const W = growC.W, H = 92, d = view.state && view.state.depth !== undefined ? view.state.depth : 2;
      g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
      const base = { len: 16, notes: [{ s: 0, l: 8, n: 57, v: 0.9 }, { s: 8, l: 8, n: 64, v: 0.9 }] }, rule = st.get('cell');
      for (let k = 0; k <= 3; k++) {
        const gn = MP.grow(base, rule, k).notes, x0 = 8 + k * (W - 16) / 4, w = (W - 16) / 4 - 10, lo = Math.min(...gn.map(n => n.n)), hi = Math.max(...gn.map(n => n.n)) + 1;
        g.strokeStyle = k === d ? ACC : '#2a2a30'; g.lineWidth = k === d ? 2 : 1; g.strokeRect(x0, 4, w, H - 26);
        gn.forEach(n => { g.fillStyle = k === d ? ACC : '#5c8f78'; g.fillRect(x0 + 2 + n.s / 16 * (w - 4), 6 + (1 - (n.n - lo + 1) / (hi - lo + 1)) * (H - 32), Math.max(1, n.l / 16 * (w - 4) - 1), 3); });
        g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(`depth ${k} · ${gn.length} notes`, x0, H - 6);
      }
    }, 4);
    const lib = h('div', { class: 'uk-panel' }, [h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: 'LIBRARY — YOURS, SAVED FOR LATER' }),
      h('div', { class: 'uk-row', style: { flexWrap: 'wrap', gap: '6px' } }, ['Cell', 'Bar', 'Phrase', 'Phrase · grown ×2', 'Phrase · seed 7'].map(n => UI.Button({ label: n }).el))])]);
    const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el, knob = (k) => UI.paramControl(view, cfg(k), { size: 32 }).el;
    const bar = h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap' } }, [sel('view'), UI.Button({ label: '⟳ Reroll' }).el, UI.Button({ label: 'Save', kind: 'primary' }).el, UI.Button({ label: '⧉ Pop out' }).el]);   // key lock: the roll's own Scale lock (no second one)
    const card = (t, kids) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: t })].concat(kids));
    view.root.append(bar, rollBox, card('PATTERN TREE — WHAT IS INSIDE WHAT', [tree]), card('GROW — THE PATTERN WRITTEN INTO ITS OWN NOTES', [h('div', { class: 'uk-row' }, [knob('depth'), knob('chance')]), growC]), lib,
      UI.hint('One editor for notes and patterns. A pattern holds notes and other patterns; each place can be transposed, stepped in the key, stretched, reversed, inverted, muted or given a chance. Grow writes a pattern into each of its own notes. Every variation has a seed — Reroll writes a new one, the old one stays. Pop out opens it in its own window.'));
  });
})();

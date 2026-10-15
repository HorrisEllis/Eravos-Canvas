/* eravos.fx-box UI — 12 pads (4 × 3) with each algorithm's glyph; the selected pad's editor: algorithm, A/B/C knobs
 * labelled for that algorithm, length (seconds or bars), pitch, level, pan; a mini scope of the last hit. */
OrganismFactory.reg('eravos.fx-box', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const GLYPH = { laser: '⟿', pew: '✶', zap: 'ϟ', riser: '↗', downer: '↘', impact: '✸', scream: '〰', glitch: '⌗', vinyl: '◎', scrape: '≋', bounce: '⋯', ricochet: '↯' };
  let st = { slots: [], algs: [], macros: {} };
  const grid = h('div', { class: 'fxbox-pads' }); const pads = [];
  for (let i = 0; i < 12; i++) {
    const b = h('button', { class: 'fxbox-pad', 'data-i': String(i), 'aria-label': 'Pad ' + (i + 1) + ' — play' }, [h('span', { class: 'g' }), h('span', { class: 'n' })]);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); view.emit('pad_press', { index: i }); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); view.emit('pad_press', { index: i }); } });
    pads.push(b); grid.appendChild(b);
  }
  view.on('hit', (p) => { const b = pads[p.index]; if (!b) return; b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), Math.min(600, p.dur * 1000)); });
  // editor (rebuilt when the selection or algorithm changes)
  const ed = h('div', { class: 'uk-group' }); let edKey = '';
  const num = (label, key, min, max, step, fmt, unit) => UI.Knob({ label, min, max, step, unit, value: st.slots[view.state.sel][key], default: { A: 0.5, B: 0.5, C: 0.3, pitch: 0, level: 0.8, pan: 0, length: 0.6 }[key], size: 34, format: fmt,
    onChange: (v) => view.emit('slot_edit', { index: view.state.sel, key, value: v }) });
  function rebuild() {
    const i = view.state.sel, s = st.slots[i]; if (!s) return;
    const k = i + s.alg + s.unit; if (k === edKey) return; edKey = k; ed.innerHTML = '';
    const M = st.macros[s.alg] || ['A', 'B', 'C'];
    const alg = UI.Select({ label: 'Pad ' + (i + 1), options: st.algs.map(a => ({ value: a, label: (GLYPH[a] || '') + ' ' + a })), value: s.alg, onChange: (v) => view.emit('slot_edit', { index: i, key: 'alg', value: v }) });
    const unit = UI.Segmented({ label: 'Length in', options: [{ value: 's', label: 'seconds' }, { value: 'bars', label: 'bars' }], value: s.unit, onChange: (v) => view.emit('slot_edit', { index: i, key: 'unit', value: v }) });
    ed.append(h('div', { class: 'uk-group-title', text: 'PAD ' + (i + 1) + ' — ' + s.alg.toUpperCase() }), h('div', { class: 'org-row', style: { gap: '10px', flexWrap: 'wrap' } }, [alg.el, unit.el]),
      h('div', { class: 'uk-row' }, [num(M[0], 'A', 0, 1, 0.01).el, num(M[1], 'B', 0, 1, 0.01).el, num(M[2], 'C', 0, 1, 0.01).el,
        num('Length', 'length', s.unit === 'bars' ? 0.25 : 0.02, s.unit === 'bars' ? 16 : 8, s.unit === 'bars' ? 0.25 : 0.01, (v) => s.unit === 'bars' ? v + ' bar' + (v === 1 ? '' : 's') : v.toFixed(2) + ' s').el,
        num('Pitch', 'pitch', -24, 24, 1, (v) => (v > 0 ? '+' : '') + v + ' st').el, num('Level', 'level', 0, 1.5, 0.01).el, num('Pan', 'pan', -1, 1, 0.01).el]));
  }
  view.on('state_sync', (s) => {
    if (s.slots) st = s;
    pads.forEach((b, i) => { const sl = st.slots[i]; if (!sl) return; b.querySelector('.g').textContent = GLYPH[sl.alg] || '•'; b.querySelector('.n').textContent = (i + 1) + ' ' + sl.alg; b.classList.toggle('sel', i === (s.params ? s.params.sel : view.state.sel)); b.setAttribute('aria-label', `Pad ${i + 1}: ${sl.alg} — play`); });
    if (st.slots.length) rebuild();
  });
  view.bind('sel', () => { edKey = ''; if (st.slots.length) rebuild(); });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramPanel(view, ['volume'], { flat: true, noTitles: true, size: 28 })]),
    grid, ed,
    UI.hint('Click a pad to hear it and edit it. Notes 36–47 play pads 1–12 — wire a Sequencer or a Timeline track in, or use your MIDI pads. Length in bars follows the tempo.'),
  );
});

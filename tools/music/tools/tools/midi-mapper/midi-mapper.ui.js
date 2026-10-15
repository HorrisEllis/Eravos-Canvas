/* eravos.midi-mapper UI — connect · 4×4 pad grid (learn wizard, hit flashes, click to test) · pad target ·
 * knob/fader mappings (LEARN → wiggle hardware → touch an ERAVOS control) · live MIDI monitor */
OrganismFactory.reg('eravos.midi-mapper', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let st = {};
  const status = h('div', { class: 'mm-status', style: { padding: '6px 8px', borderRadius: '4px', background: '#10161f', color: '#9fb3c8', fontSize: '12px', minHeight: '18px' } });
  const setStatus = (s) => {
    status.innerHTML = '';
    status.appendChild(h('div', { style: { fontWeight: s.error || s.warn ? '600' : '400' }, text: s.error || s.warn || s.info || '' }));
    if (Array.isArray(s.help) && s.help.length) status.appendChild(h('ol', { style: { margin: '4px 0 0', paddingLeft: '18px', color: '#cfe0f0', lineHeight: '1.45' } }, s.help.map(t => h('li', { text: t }))));
    status.style.color = s.error ? '#ff4466' : s.warn ? '#ffaa00' : '#9fe8ff';
  };
  view.on('status', setStatus);

  // --- device row
  const connectB = UI.Button({ label: '🔌 Connect MIDI', kind: 'primary', hint: 'ask the browser for MIDI access — works in Chrome, Edge, and Firefox when ERAVOS runs from Start ERAVOS (localhost)', onClick: () => view.emit('connect', {}) });
  const inSel = UI.Select({ label: 'From', options: [{ value: '', label: '— no input —' }], onChange: (v) => view.emit('select_io', { input: v }) });
  const outSel = UI.Select({ label: 'To (lights)', options: [{ value: '', label: '— none —' }], onChange: (v) => view.emit('select_io', { output: v }) });
  const profCtl = UI.paramControl(view, cfg('profile'), { segMax: 1 });

  // --- pads
  const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', width: '100%', maxWidth: '300px' } });
  const cells = [];
  for (let r = 3; r >= 0; r--) for (let c = 0; c < 4; c++) { // pad 1 bottom-left, like the hardware
    const i = r * 4 + c;
    const cell = h('div', { title: 'click to test pad ' + (i + 1), style: { aspectRatio: '1', borderRadius: '6px', background: '#1a2230', border: '2px solid #26324a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', transition: 'background 90ms' } }, [
      h('div', { text: String(i + 1), style: { fontWeight: '700', fontSize: '15px', color: '#dfe8f2' } }),
      h('div', { class: 'mm-note', text: '', style: { fontSize: '9px', color: '#7f93a8', fontFamily: 'monospace' } }),
      h('div', { class: 'mm-role', text: '', style: { fontSize: '10px', color: '#9fe8ff', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }),
    ]);
    cell.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (editing) { editPad = i; paint(); paintEditor(); } else view.emit('pad_test', { index: i }); });
    cells[i] = cell; grid.appendChild(cell);
  }
  const flash = (i, v) => { const c = cells[i]; if (!c) return; c.style.background = `rgba(255,107,0,${0.35 + 0.65 * v})`; clearTimeout(c._t); c._t = setTimeout(() => paint(), 140); };
  view.on('pad_hit', (p) => flash(p.index, p.velocity || 0.8));
  function paint() {
    const notes = st.padNotes || [], labels = st.roleLabels || [], roles = st.roles || [];
    cells.forEach((c, i) => {
      const n = notes[i]; c.querySelector('.mm-note').textContent = n ? `n${n.note}${n.channel !== 1 ? ' c' + n.channel : ''}` : '—';
      const r = roles[i]; c.querySelector('.mm-role').textContent = labels[i] || ''; c.querySelector('.mm-role').style.color = !r ? '#7f93a8' : r.kind === 'action' ? '#ffd166' : r.kind === 'drum' ? '#ff9a4d' : '#9fe8ff';
      const learning = st.padLearn === i;
      c.style.border = editing && editPad === i ? '2px solid #9fe8ff' : learning ? '2px solid #ffaa00' : n ? (st.learnedPads ? '2px solid #ff6b00' : '2px dashed #ff6b00') : '2px solid #26324a';
      c.style.background = learning ? '#3a2a00' : '#1a2230';
      c.style.boxShadow = learning ? '0 0 12px #ffaa00' : 'none';
    });
  }
  const learnPadsB = UI.Button({ label: '① Learn pads', kind: 'primary', hint: 'then hit pads 1 → 16 on your controller, one at a time', onClick: () => view.emit('learn_pads', {}) });
  const cancelB = UI.Button({ label: 'Stop learning', onClick: () => view.emit('learn_cancel', {}) });
  const factoryB = UI.Button({ label: 'Factory map', hint: 'forget learned pads; use the controller’s factory notes', onClick: () => view.emit('pads_factory', {}) });
  const tgtSel = UI.Select({ label: 'Pads play', options: [{ value: 'auto', label: 'Auto' }], onChange: (v) => view.emit('config_change', { key: 'padTarget', value: v }) });
  const velCtl = UI.paramControl(view, cfg('velocityCurve'), { segMax: 4 });
  const ledCtl = UI.paramControl(view, cfg('ledFeedback'));
  // ---- 3.35 pad roles: a layout for all 16, or ✎ one pad at a time
  const layoutCtl = UI.paramControl(view, cfg('padLayout'), { segMax: 1 });
  const keysSel = UI.Select({ label: 'Notes play', options: [{ value: 'auto', label: 'Auto' }], onChange: (v) => view.emit('config_change', { key: 'keysTarget', value: v }) });
  const octCtl = UI.paramControl(view, cfg('padOctave')), chordCtl = UI.paramControl(view, cfg('chordType'), { segMax: 1 }), lenCtl = UI.paramControl(view, cfg('noteLength'), { size: 26 });
  let editing = false, editPad = 0;
  const editB = UI.Button({ label: '✎ Edit pads', hint: 'click a pad in the grid, then choose what it does', onClick: () => { editing = !editing; editB.set(editing ? '✓ Done editing' : '✎ Edit pads'); editor.style.display = editing ? '' : 'none'; paint(); paintEditor(); } });
  const editor = h('div', { class: 'org-row', style: { display: 'none', flexWrap: 'wrap', gap: '6px', alignItems: 'center', padding: '6px', border: '1px solid #26324a', borderRadius: '6px', background: '#0d131c' } });
  const KINDS = [{ value: 'default', label: 'Drum (pad tool)' }, { value: 'drum', label: 'Drum on…' }, { value: 'note', label: 'Note in key' }, { value: 'chord', label: 'Chord in key' }, { value: 'action', label: 'Action' }];
  function paintEditor() {
    editor.innerHTML = ''; if (!editing) return;
    const r = (st.roles || [])[editPad] || null, kind = r ? r.kind : 'default';
    const set = (role) => view.emit('pad_role', { index: editPad, role });
    const kindSel = UI.Select({ label: 'Pad ' + (editPad + 1), options: KINDS, value: kind, onChange: (v) => set(v === 'default' ? null : v === 'action' ? { kind: 'action', action: 'restart' } : v === 'drum' ? { kind: 'drum', target: null, pad: editPad } : { kind: v, degree: 0 }) });
    editor.append(kindSel.el);
    if (kind === 'drum') {
      editor.append(UI.Select({ label: 'Tool', options: (st.padTargets || []).map(o => o.value === 'auto' ? { value: '', label: 'Auto' } : o), value: r.target || '', onChange: (v) => set(Object.assign({}, r, { target: v || null })) }).el,
        UI.NumberDrag({ label: 'its pad', min: 1, max: 16, step: 1, value: (r.pad || 0) + 1, onChange: (v) => set(Object.assign({}, r, { pad: v - 1 })) }).el);
    } else if (kind === 'note' || kind === 'chord') {
      editor.append(UI.NumberDrag({ label: 'Degree', min: 1, max: 22, step: 1, value: r.degree + 1, onChange: (v) => set(Object.assign({}, r, { degree: v - 1 })) }).el,
        UI.Select({ label: 'Instrument', options: st.keysTargets || [], value: r.target || 'auto', onChange: (v) => set(Object.assign({}, r, { target: v === 'auto' ? null : v })) }).el);
    } else if (kind === 'action') {
      editor.append(UI.Select({ label: 'Does', options: st.actions || [], value: r.action, onChange: (v) => set({ kind: 'action', action: v }) }).el);
    }
    editor.append(h('span', { class: 'uk-hint', text: (st.roleLabels || [])[editPad] ? 'now: ' + st.roleLabels[editPad] : '' }), UI.Button({ label: '▶ test', onClick: () => view.emit('pad_test', { index: editPad }) }).el);
  }

  // --- mappings
  const learnMapB = UI.Button({ label: '② LEARN a knob', kind: 'primary', hint: 'move a knob/fader on your controller, then touch the ERAVOS knob it should control', onClick: () => view.emit('learn_map', {}) });
  const bankCtl = UI.paramControl(view, cfg('bank'));
  const table = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '130px', overflowY: 'auto' } });
  function paintMaps() {
    table.innerHTML = '';
    const ms = st.mappings || [];
    if (!ms.length) { table.appendChild(h('div', { text: 'No knobs mapped in this bank yet.', style: { color: '#6b7d90', fontSize: '11px' } })); return; }
    ms.forEach(m => {
      const curve = UI.Select({ options: ['lin', 'exp', 'log'], value: m.curve, onChange: (v) => view.emit('map_edit', { id: m.id, patch: { curve: v } }) });
      const take = UI.Select({ options: [{ value: 'jump', label: 'jump' }, { value: 'pickup', label: 'pick-up' }], value: m.takeover, hint: 'pick-up: ignore the hardware until it reaches the current value (no jumps)', onChange: (v) => view.emit('map_edit', { id: m.id, patch: { takeover: v } }) });
      const del = UI.Button({ label: '✕', onClick: () => view.emit('map_remove', { id: m.id }) });
      table.appendChild(h('div', { class: 'org-row', style: { fontSize: '11px', gap: '6px', alignItems: 'center' } }, [
        h('span', { text: `${m.type === 'cc' ? 'CC' : 'Note'} ${m.number} ch${m.channel}`, style: { fontFamily: 'monospace', color: '#ffaa00', minWidth: '84px' } }),
        h('span', { text: '→ ' + m.label, style: { flex: '1', color: '#dfe8f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }),
        curve.el, take.el, del.el,
      ]));
    });
  }

  // --- monitor
  const monEl = h('pre', { style: { margin: 0, height: '70px', overflow: 'hidden', background: '#080b10', color: '#5fd38a', fontSize: '10px', padding: '4px 6px', borderRadius: '4px' } });
  view.on('monitor', (m) => { monEl.textContent = m.lines.slice(-6).map(l => l.text).join('\n'); });

  view.on('state_sync', (s) => {
    st = s;
    connectB.set(s.connected ? '🔌 MIDI on' : '🔌 Connect MIDI');
    if (s.devices) {
      inSel.setOptions([{ value: '', label: s.devices.inputs.length ? '— choose input —' : '— no devices found —' }].concat(s.devices.inputs.map(d => ({ value: d.id, label: d.name }))));
      outSel.setOptions([{ value: '', label: '— none —' }].concat(s.devices.outputs.map(d => ({ value: d.id, label: d.name }))));
      inSel.set(s.inputId || ''); outSel.set(s.outputId || '');
    }
    if (s.padTargets) { tgtSel.setOptions(s.padTargets); tgtSel.set((s.params && s.params.padTarget) || 'auto'); }
    if (s.keysTargets) { keysSel.setOptions(s.keysTargets); keysSel.set((s.params && s.params.keysTarget) || 'auto'); }
    paintEditor();
    cancelB.el.style.display = (s.padLearn >= 0 || s.learning) ? '' : 'none';
    learnMapB.set(s.learning === 'source' ? '… move a hardware knob' : s.learning === 'target' ? '… now touch an ERAVOS knob' : '② LEARN a knob');
    learnMapB.el.classList.toggle('danger', !!s.learning);
    if (!s.connected && !status.textContent) setStatus({ info: 'Plug in your StarryPad (USB), then press Connect MIDI.' });
    else if (s.padLearn >= 0) setStatus({ info: `Hit pad ${s.padLearn + 1} on your controller` });
    else if (s.connected && !s.learnedPads && !s.learning) setStatus({ info: 'Connected — your pads already play (factory map for this controller). “① Learn pads” only if yours send different notes.' });
    paint(); paintMaps();
  });

  const sec = (t) => h('div', { text: t, style: { fontSize: '10px', letterSpacing: '1px', color: '#6b7d90', marginTop: '8px' } });
  view.root.append(
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px' } }, [connectB.el, inSel.el, outSel.el, profCtl.el]),
    status,
    sec('PADS'),
    h('div', { class: 'org-row', style: { gap: '12px', alignItems: 'flex-start' } }, [
      grid,
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, [learnPadsB.el, cancelB.el, factoryB.el, tgtSel.el, velCtl.el, ledCtl.el]),
    ]),
    sec('WHAT THE PADS DO'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px', alignItems: 'center' } }, [layoutCtl.el, editB.el, keysSel.el, octCtl.el, chordCtl.el, lenCtl.el]),
    editor,
    sec('KNOBS & FADERS'),
    h('div', { class: 'org-row', style: { gap: '6px' } }, [learnMapB.el, bankCtl.el]),
    table,
    sec('MIDI IN'),
    monEl,
  );
  paint(); paintMaps();
});

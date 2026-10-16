/* eravos.pads UI — 4×4 grid, bank strip, pad inspector, meter. ui_hooks only. */
OrganismFactory.reg('eravos.pads', function (view) {
  const UI = view.ui, h = UI.h;
  const KEYS = '1234qwerasdfzxcv';
  let banks = null, voices = [], models = {}, driveTypes = [], sel = 0;
  const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', flex: '1', minHeight: '180px' } });
  const pads = [];
  for (let i = 0; i < 16; i++) {
    const p = h('div', { class: 'pad', style: { position: 'relative', borderRadius: '8px', background: '#141c27', border: '1px solid #2a3a50', cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '5px 6px', transition: 'background .08s, box-shadow .08s', minHeight: '38px' } },
      [h('div', { style: { font: '600 10.5px var(--font)', color: '#cfe', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }), h('div', { style: { display: 'flex', justifyContent: 'space-between', font: '9px var(--mono)', color: '#567' } }, [h('span', { text: String(i + 1) }), h('span', { text: KEYS[i].toUpperCase() })])]);
    p.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const r = p.getBoundingClientRect(); const vel = Math.max(0.35, Math.min(1, 1 - ((e.clientY - r.top) / r.height) * 0.65));
      sel = i; view.emit('pad_press', { index: i, velocity: +vel.toFixed(3) }); drawInspector(); drawPads();
    });
    p.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); p.style.outline = '2px solid var(--green)'; });
    p.addEventListener('dragleave', () => { p.style.outline = ''; });
    p.addEventListener('drop', async (e) => {
      e.preventDefault(); e.stopPropagation(); p.style.outline = '';
      const f = e.dataTransfer.files[0]; if (!f) return;
      view.emit('pad_load', { index: i, arrayBuffer: await f.arrayBuffer(), name: f.name }); sel = i;
    });
    pads.push(p); grid.appendChild(p);
  }
  const bankSeg = UI.Segmented({ options: [{ value: 0, label: 'A' }, { value: 1, label: 'B' }, { value: 2, label: 'C' }, { value: 3, label: 'D' }], value: view.state.bank, onChange: (b) => view.emit('bank_select', { bank: b }) });
  view.bind('bank', (b) => bankSeg.set(b));
  const meter = UI.Meter({ width: 10, height: 60 });
  const an = view.tap('out', 1024);
  UI.loop(meter, () => { const l = UI.readLevel(an); meter.draw(l.peakDb, l.rmsDb); }, 30);
  const vol = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'volume'), { size: 32 });
  const hum = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'swingVel'), { size: 32 });
  const keyT = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'keymap'));
  const head = h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [h('div', { class: 'org-row', style: { margin: 0 } }, [h('span', { class: 'org-label', text: 'Bank' }), bankSeg.el, keyT.el]), UI.presetBar(view)]);

  // inspector
  const insp = h('div', { class: 'uk-group', style: { display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' } });
  function drawInspector() {
    insp.innerHTML = '';
    if (!banks) return;
    const p = banks[view.state.bank][sel];
    const vs = UI.Select({ label: 'Pad ' + (sel + 1) + ' voice', options: voices, value: p.voice, onChange: (v) => view.emit('pad_edit', { index: sel, key: 'voice', value: v }) });
    insp.appendChild(vs.el);
    const k = (key, label, min, max, step, unit) => UI.Knob({ label, min, max, step, unit, value: p[key], default: key === 'level' ? 1 : key === 'decay' ? p.decay : 0, size: 30, accent: p.color, onChange: (v) => view.emit('pad_edit', { index: sel, key, value: v }) }).el;
    // 3.0: the model is the instrument — picking one plays it on this pad at once
    const ms = models[p.voice] || ['classic'];
    if (ms.length > 1) insp.appendChild(UI.Select({ label: 'Model', options: ms, value: p.model || 'classic', onChange: (v) => { view.emit('pad_edit', { index: sel, key: 'model', value: v }); view.emit('pad_press', { index: sel, velocity: 0.9 }); } }).el);
    insp.append(k('tune', 'Tune', -24, 24, 1, 'st'), k('decay', 'Decay', 0.02, 4, 0.01, 's'), k('level', 'Level', 0, 1.5, 0.01), k('pan', 'Pan', -1, 1, 0.01), k('drive', 'Drive', 0, 1, 0.01), k('tone', 'Tone', -1, 1, 0.01));
    if (p.model && p.model !== 'classic') {
      insp.append(k('snap', 'Snap', 0, 1, 0.01), k('sweep', 'Sweep', 0, 48, 0.5, 'st'), k('body', 'Body', 0, 1, 0.01));
      insp.appendChild(UI.Select({ label: 'Drive type', options: driveTypes, value: p.driveType || 'soft', onChange: (v) => view.emit('pad_edit', { index: sel, key: 'driveType', value: v }) }).el);
    }
    insp.appendChild(UI.Select({ label: 'Choke', options: [0, 1, 2, 3, 4].map(v => ({ value: v, label: v ? 'group ' + v : 'none' })), value: p.choke, onChange: (v) => view.emit('pad_edit', { index: sel, key: 'choke', value: +v }) }).el);
    const col = h('input', { type: 'color', value: p.color, style: { width: '28px', height: '24px', border: 0, background: 'none' } });
    col.addEventListener('change', () => view.emit('pad_edit', { index: sel, key: 'color', value: col.value }));
    insp.appendChild(col);
    if (p.voice === 'sample') {
      insp.appendChild(h('div', { class: 'uk-hint', style: { width: '100%' }, text: p.sample ? '🎵 ' + p.sample.name : 'Empty sample pad — drag an audio file (her voice!) onto it.' }));
      if (p.sample) insp.appendChild(UI.Toggle({ label: 'Reverse', value: p.sample.reverse, onChange: (v) => view.emit('pad_edit', { index: sel, key: 'reverse', value: v }) }).el);
    }
  }
  function drawPads() {
    if (!banks) return;
    banks[view.state.bank].forEach((p, i) => {
      pads[i].firstChild.textContent = p.sample ? '🎵 ' + p.sample.name.replace(/\.[a-z0-9]+$/i, '') : (p.voice === 'sample' ? '＋ drop sound' : p.voice + (p.model && p.model !== 'classic' ? ' · ' + p.model : ''));
      pads[i].style.borderColor = i === sel ? p.color : '#2a3a50';
      pads[i].style.boxShadow = i === sel ? `inset 0 0 0 1px ${p.color}` : '';
      pads[i].style.setProperty('--pc', p.color);
    });
  }
  view.on('state_sync', (s) => { if (s.banks) { banks = s.banks; voices = s.voices; models = s.models || {}; driveTypes = s.driveTypes || []; drawPads(); drawInspector(); } });
  view.on('pad_lit', (p) => {
    const el = pads[p.index]; if (!el) return;
    UI.atTime(view.ac, p.time || 0, () => {
      el.style.background = p.color; el.style.boxShadow = `0 0 18px ${p.color}`;
      setTimeout(() => { el.style.background = '#141c27'; el.style.boxShadow = p.index === sel ? `inset 0 0 0 1px ${p.color}` : ''; }, 90);
    });
  });
  // QWERTY only while this window is focused (F-15)
  let focused = false;
  view.observe('canvas:focus', (p) => { focused = p.instanceId === view.instanceId; });
  const onKey = (e) => {
    if (!focused || !view.state.keymap || e.repeat || e.metaKey || e.ctrlKey) return;
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const i = KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return;
    e.preventDefault(); sel = i; view.emit('pad_press', { index: i, velocity: e.shiftKey ? 1 : 0.85 }); drawPads();
  };
  document.addEventListener('keydown', onKey);
  view.onDispose(() => document.removeEventListener('keydown', onKey));
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
  view.root.append(head, h('div', { style: { display: 'flex', gap: '8px', flex: '1', minHeight: '0' } }, [grid, h('div', { class: 'org-col', style: { alignItems: 'center' } }, [meter, vol.el, hum.el])]), h('div', { style: { height: '8px' } }), insp);
});

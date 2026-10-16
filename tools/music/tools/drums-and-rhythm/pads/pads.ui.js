/* eravos.pads UI 3.0 — an instrument, not a form (3.39 redesign, pads.css):
 * KIT strip (the kit is the headline) · 4×4 rubber pads (voice small, MODEL big, an LED strip in the pad's colour that
 * lights with the hit) · a segmented LED meter · the VOICE editor: model chips (a click plays it), a live drawing of the
 * sound's shape (loudness envelope + pitch drop) and the controls grouped Source · Shape · Colour · Mix.
 * ui_hooks only; every behaviour of 2.x kept (velocity by height, drop a sound, banks, QWERTY, choke, reverse). */
OrganismFactory.reg('eravos.pads', function (view) {
  const UI = view.ui, h = UI.h;
  const KEYS = '1234qwerasdfzxcv';
  let banks = null, voices = [], models = {}, driveTypes = [], sel = 0;
  view.root.classList.add('dm3');

  // ---- pads
  const grid = h('div', { class: 'dm3-grid' });
  const pads = [];
  for (let i = 0; i < 16; i++) {
    const voice = h('div', { class: 'dm3-voice' }), model = h('div', { class: 'dm3-model' }), num = h('span', { text: String(i + 1) }), key = h('span', { text: KEYS[i].toUpperCase() });
    const p = h('div', { class: 'dm3-pad', role: 'button', tabindex: '-1', 'aria-label': 'pad ' + (i + 1) }, [voice, model, h('div', { class: 'dm3-foot' }, [num, key]), h('div', { class: 'dm3-led' })]);
    p.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const r = p.getBoundingClientRect(); const vel = Math.max(0.35, Math.min(1, 1 - ((e.clientY - r.top) / r.height) * 0.65));
      sel = i; view.emit('pad_press', { index: i, velocity: +vel.toFixed(3) }); drawInspector(); drawPads();
    });
    p.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); p.classList.add('drop'); });
    p.addEventListener('dragleave', () => p.classList.remove('drop'));
    p.addEventListener('drop', async (e) => {
      e.preventDefault(); e.stopPropagation(); p.classList.remove('drop');
      const f = e.dataTransfer.files[0]; if (!f) return;
      view.emit('pad_load', { index: i, arrayBuffer: await f.arrayBuffer(), name: f.name }); sel = i;
    });
    pads.push({ el: p, voice, model }); grid.appendChild(p);
  }

  // ---- kit strip
  const bankSeg = UI.Segmented({ options: [0, 1, 2, 3].map(b => ({ value: b, label: 'ABCD'[b], hint: 'bank ' + 'ABCD'[b] })), value: view.state.bank, onChange: (b) => view.emit('bank_select', { bank: b }) });
  view.bind('bank', (b) => bankSeg.set(b));
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const vol = UI.paramControl(view, cfg('volume'), { size: 30 }), hum = UI.paramControl(view, cfg('swingVel'), { size: 30 }), keyT = UI.paramControl(view, cfg('keymap'));
  const kitName = h('div', { class: 'dm3-kitname' }), kitPack = h('div', { class: 'dm3-kitpack' });
  view.on('state_sync', (s) => { const n = s.preset || ''; const m = /^(.*?) · (.*)$/.exec(n); kitPack.textContent = m ? m[1] : (n ? 'Factory' : 'Kit'); kitName.textContent = m ? m[2] : (n || 'Your kit'); });
  const head = h('div', { class: 'dm3-head' }, [
    h('div', { class: 'dm3-kit' }, [kitPack, kitName]),
    h('div', { class: 'dm3-kitctl' }, [UI.presetBar(view), h('div', { class: 'dm3-bank' }, [h('span', { class: 'dm3-cap', text: 'Bank' }), bankSeg.el]), keyT.el]),
  ]);

  // ---- LED meter (segments, peak hold)
  const meter = UI.Canvas(12, 150, 'dm3-meter'); const an = view.tap('out', 1024); let hold = -90, holdT = 0;
  UI.loop(meter, () => {
    const g = meter.g, W = 12, H = meter.H, l = UI.readLevel(an), N = 28, gap = 2, sh = (H - gap * (N - 1)) / N, lit = Math.round(Math.max(0, Math.min(1, (l.peakDb + 54) / 54)) * N);
    if (l.peakDb > hold || performance.now() - holdT > 900) { hold = l.peakDb; holdT = performance.now(); }
    const hi = Math.round(Math.max(0, Math.min(1, (hold + 54) / 54)) * N);
    g.clearRect(0, 0, W, H);
    for (let k = 0; k < N; k++) { const y = H - (k + 1) * (sh + gap) + gap, top = k >= N - 3, mid = k >= N - 8, on = k < lit || k === hi - 1;
      g.fillStyle = on ? (top ? '#ff3b5c' : mid ? '#ffc23d' : '#2bffa3') : (top ? '#2a1218' : mid ? '#2a2212' : '#10261c'); g.fillRect(0, y, W, sh); }
  }, 30);
  const side = h('div', { class: 'dm3-side' }, [meter, vol.el, hum.el]);

  // ---- voice editor
  const vHead = h('div', { class: 'dm3-vhead' }), chips = h('div', { class: 'dm3-chips' }), shape = UI.Canvas(420, 74, 'dm3-shape'), cards = h('div', { class: 'dm3-cards' }), extra = h('div', { class: 'dm3-extra' });
  const editor = h('div', { class: 'dm3-editor' }, [vHead, chips, shape, cards, extra]);
  const pad = () => banks && banks[view.state.bank][sel];
  const edit = (key, value) => view.emit('pad_edit', { index: sel, key, value });
  const knob = (p, key, label, min, max, step, unit, def) => UI.Knob({ label, min, max, step, unit, value: p[key], default: def === undefined ? 0 : def, size: 30, accent: p.color, onChange: (v) => edit(key, v) }).el;
  const card = (title, kids) => h('div', { class: 'dm3-card' }, [h('div', { class: 'dm3-cap', text: title }), h('div', { class: 'dm3-row' }, kids)]);
  function drawInspector() {
    vHead.innerHTML = ''; chips.innerHTML = ''; cards.innerHTML = ''; extra.innerHTML = '';
    const p = pad(); if (!p) return;
    editor.style.setProperty('--pc', p.color);
    const vs = UI.Select({ label: 'voice', options: voices, value: p.voice, onChange: (v) => { edit('voice', v); view.emit('pad_press', { index: sel, velocity: 0.9 }); } });
    const col = h('input', { type: 'color', class: 'dm3-color', value: p.color, title: 'pad colour' }); col.addEventListener('change', () => edit('color', col.value));
    vHead.append(h('div', { class: 'dm3-vtitle' }, [h('span', { class: 'dm3-vnum', text: 'PAD ' + (sel + 1) }), vs.el]), col);
    const ms = ['classic'].concat((models[p.voice] || []).filter(m => m !== 'classic'));   // 'classic' first: number-like names ('808') would otherwise sort ahead
    if (ms.length > 1) ms.forEach(m => { const b = h('button', { class: 'dm3-chip' + ((p.model || 'classic') === m ? ' on' : ''), text: m, title: 'play the ' + m + ' ' + p.voice });
      b.addEventListener('click', (e) => { e.stopPropagation(); edit('model', m); view.emit('pad_press', { index: sel, velocity: 0.9 }); });
      b.addEventListener('pointerdown', (e) => e.stopPropagation()); chips.appendChild(b); });
    const fresh = p.model && p.model !== 'classic';
    cards.append(
      card('Source', [knob(p, 'tune', 'Tune', -24, 24, 1, 'st'), fresh ? knob(p, 'sweep', 'Sweep', 0, 48, 0.5, 'st', 24) : null, fresh ? knob(p, 'body', 'Body', 0, 1, 0.01, '', 0.5) : null].filter(Boolean)),
      card('Shape', [knob(p, 'decay', 'Decay', 0.02, 4, 0.01, 's', p.decay), fresh ? knob(p, 'snap', 'Snap', 0, 1, 0.01, '', 0.5) : null].filter(Boolean)),
      card('Colour', [knob(p, 'tone', 'Tone', -1, 1, 0.01), knob(p, 'drive', 'Drive', 0, 1, 0.01)].concat(fresh ? [UI.Segmented({ options: driveTypes, value: p.driveType || 'soft', onChange: (v) => edit('driveType', v), label: 'drive type' }).el] : [])),
      card('Mix', [knob(p, 'level', 'Level', 0, 1.5, 0.01, '', 1), knob(p, 'pan', 'Pan', -1, 1, 0.01),
        (() => { const c = UI.Select({ label: 'choke group', options: [0, 1, 2, 3, 4].map(v => ({ value: v, label: v ? 'choke ' + v : 'no choke' })), value: p.choke, onChange: (v) => edit('choke', +v) }).el; c.classList.add('dm3-choke'); return c; })()]));
    if (p.voice === 'sample') {
      extra.appendChild(h('div', { class: 'dm3-sample', text: p.sample ? '🎵 ' + p.sample.name : 'Empty sample pad — drop an audio file (her voice!) onto it.' }));
      if (p.sample) extra.appendChild(UI.Toggle({ label: 'Reverse', value: p.sample.reverse, onChange: (v) => edit('reverse', v) }).el);
    }
  }
  // the sound's shape, drawn from its own settings: loudness (filled) and the pitch drop (line) over its length
  UI.loop(shape, () => {
    const g = shape.g; shape.fit(); const W = shape.W, H = 74, p = pad(); g.clearRect(0, 0, W, H); if (!p) return;
    const fresh = p.model && p.model !== 'classic', dec = Math.max(0.02, p.decay), T = Math.max(0.25, dec * 1.25), att = 0.002 + (fresh ? (1 - p.snap) * 0.01 : 0.002);
    const env = (t) => t < att ? t / att : Math.exp(-(t - att) * 6.9 / dec), X = (t) => 8 + (t / T) * (W - 16);
    g.strokeStyle = 'rgba(140,170,200,.10)'; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(8, k * H / 4); g.lineTo(W - 8, k * H / 4); g.stroke(); }
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, p.color + 'cc'); grad.addColorStop(1, p.color + '08');
    g.beginPath(); g.moveTo(X(0), H - 6); for (let k = 0; k <= 120; k++) { const t = T * k / 120; g.lineTo(X(t), H - 6 - env(t) * (H - 14)); } g.lineTo(X(T), H - 6); g.closePath(); g.fillStyle = grad; g.fill();
    g.strokeStyle = p.color; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k <= 120; k++) { const t = T * k / 120, y = H - 6 - env(t) * (H - 14); k ? g.lineTo(X(t), y) : g.moveTo(X(t), y); } g.stroke();
    if (fresh && p.sweep > 0) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.setLineDash([3, 3]); g.beginPath(); for (let k = 0; k <= 60; k++) { const t = T * k / 60, y = 10 + (1 - Math.exp(-t / 0.03)) * (p.sweep / 48) * (H - 24); k ? g.lineTo(X(t), y) : g.moveTo(X(t), y); } g.stroke(); g.setLineDash([]); }
    g.lineWidth = 1; g.fillStyle = 'rgba(214,228,240,.55)'; g.font = '600 9px var(--mono)'; g.fillText((dec * 1000 | 0) + ' ms', W - 52, 12); if (fresh && p.sweep > 0) g.fillText('pitch drop ' + (+p.sweep).toFixed(0) + ' st', 12, H - 10);
  }, 20);

  function drawPads() {
    if (!banks) return;
    banks[view.state.bank].forEach((p, i) => {
      const P = pads[i], isS = p.voice === 'sample';
      P.voice.textContent = isS ? 'sample' : p.voice;
      P.model.textContent = p.sample ? p.sample.name.replace(/\.[a-z0-9]+$/i, '') : isS ? '＋ drop sound' : (p.model && p.model !== 'classic' ? p.model : p.voice);
      P.el.classList.toggle('sel', i === sel); P.el.classList.toggle('empty', isS && !p.sample);
      P.el.style.setProperty('--pc', p.color);
    });
  }
  view.on('state_sync', (s) => { if (s.banks) { banks = s.banks; voices = s.voices; models = s.models || {}; driveTypes = s.driveTypes || []; drawPads(); drawInspector(); } });
  view.on('pad_lit', (p) => {
    const P = pads[p.index]; if (!P) return;
    UI.atTime(view.ac, p.time || 0, () => { P.el.style.setProperty('--hit', String(0.35 + 0.65 * (p.velocity || 1))); P.el.classList.add('hit'); setTimeout(() => P.el.classList.remove('hit'), 110); });
  });
  // QWERTY only while this window is focused (F-15)
  let focused = false;
  view.observe('canvas:focus', (p) => { focused = p.instanceId === view.instanceId; });
  const onKey = (e) => {
    if (!focused || !view.state.keymap || e.repeat || e.metaKey || e.ctrlKey) return;
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const i = KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return;
    e.preventDefault(); sel = i; view.emit('pad_press', { index: i, velocity: e.shiftKey ? 1 : 0.85 }); drawPads(); drawInspector();
  };
  document.addEventListener('keydown', onKey);
  view.onDispose(() => document.removeEventListener('keydown', onKey));
  view.root.append(head, h('div', { class: 'dm3-body' }, [grid, side]), editor);
});

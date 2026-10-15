/* eravos.sample-player UI — the waveform is the whole interface */
OrganismFactory.reg('eravos.sample-player', function (view) {
  const UI = view.ui, h = UI.h;
  let wf = null, slices = [], playhead = -1, loaded = false;
  const cv = UI.Canvas(440, 120, 'samp-wave'); cv.style.cursor = 'crosshair'; cv.style.flex = '1'; cv.style.height = '100%';
  const title = h('div', { class: 'org-note', style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }, text: 'Drop an audio file here — or on the canvas' });
  const fileIn = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (f) view.emit('load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  const openB = UI.Button({ label: 'Open…', onClick: () => fileIn.click() });
  const playB = UI.Button({ label: '▶', kind: 'primary', hint: 'play (in slice mode: click a slice)', onClick: () => view.emit('play_press', {}) });
  const stopB = UI.Button({ label: '■', hint: 'stop', onClick: () => view.emit('stop_press', {}) });
  const sendSel = UI.Select({ options: [{ value: '', label: 'Send to…' }], onChange: (v) => { if (v) { view.emit('send', { target: v }); setTimeout(() => sendSel.set(''), 50); } } });
  const refreshTargets = () => sendSel.setOptions([{ value: '', label: 'Send clip to…' }].concat(view.targets().filter(t => /drop-builder|timeline|granular|pads|clip-maker|contrast|looper|library/.test(t.value))));
  sendSel.select.addEventListener('focus', refreshTargets); sendSel.select.addEventListener('pointerdown', refreshTargets);
  const info = h('div', { class: 'uk-hint', style: { fontFamily: 'var(--mono)', fontSize: '10px' } });
  const head = h('div', { class: 'org-row', style: { flexWrap: 'wrap' } }, [UI.presetBar(view), playB.el, stopB.el, title, openB.el, sendSel.el, fileIn]);
  const modeSeg = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'mode'), { segMax: 6 });
  const knobs = UI.paramPanel(view, ['gain', 'pitch', 'attack', 'release', 'sensitivity', 'xfade'], { flat: true, noTitles: true, size: 32 });
  const rev = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'reverse'));
  const sl = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'slices'), { segMax: 6 });
  const foot = h('div', { class: 'org-col' }, [h('div', { class: 'org-row', style: { margin: 0 } }, [modeSeg.el, rev.el]), h('div', { class: 'org-row', style: { margin: 0 } }, [knobs, h('div', { class: 'org-col' }, [sl.el, info])])]);
  const waveWrap = h('div', { style: { position: 'relative', flex: '1', minHeight: '80px', display: 'flex' } }, [cv]);
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column'; view.root.style.gap = '6px';
  view.root.append(head, waveWrap, foot);

  // drop replaces clip
  view.root.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); waveWrap.style.outline = '2px dashed var(--green)'; });
  view.root.addEventListener('dragleave', () => { waveWrap.style.outline = ''; });
  view.root.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); waveWrap.style.outline = ''; const f = e.dataTransfer.files[0]; if (f) view.emit('load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });

  view.on('waveform_ready', (w) => { wf = w; loaded = true; title.textContent = '🎵 ' + w.name; info.textContent = `${w.duration_sec.toFixed(2)} s · peak ${w.peakDb.toFixed(1)} dB · ${w.transients.length} hits`; });
  view.on('slices', (s) => { slices = s.positions; });
  view.on('playhead_update', (p) => { playhead = p.position_normalized; });
  view.on('state_sync', (s) => { if (s.name && !loaded) title.textContent = '🎵 ' + s.name; });

  // interaction: handles (top 14px strip), slices (dbl-click add, right-click remove), click slice → audition, vertical drag → pitch
  let drag = null;
  const xn = (e) => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); if (!wf) return;
    const r = cv.getBoundingClientRect(), x = xn(e), y = e.clientY - r.top;
    const loopMode = view.state.mode === 'loop';
    const ks = loopMode ? ['loopStart', 'loopEnd'] : ['start', 'end'];
    const near = ks.find(k => Math.abs(view.state[k] - x) * r.width < 8);
    if (e.button === 2) return;
    if (near && y < 22) { drag = { key: near }; }
    else if (view.state.mode === 'slice') { let i = 0; slices.forEach((s, k) => { if (x >= s) i = k; }); view.emit('play_press', { slice: i }); drag = { pitch: true, y0: e.clientY, p0: view.state.pitch }; }
    else { view.emit('scrub', { position: x }); drag = { pitch: true, y0: e.clientY, p0: view.state.pitch }; }
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (drag.key) view.set(drag.key, +xn(e).toFixed(4));
    else if (drag.pitch && Math.abs(e.clientY - drag.y0) > 6) view.set('pitch', Math.max(-24, Math.min(24, Math.round(drag.p0 + (drag.y0 - e.clientY) / 8))));
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
  cv.addEventListener('dblclick', (e) => view.emit('slice_edit', { op: 'add', position: xn(e) }));
  cv.addEventListener('contextmenu', (e) => { e.preventDefault(); view.emit('slice_edit', { op: 'remove', position: xn(e) }); });

  UI.loop(cv, () => {
    cv.fit();
    const r = cv.getBoundingClientRect(); if (r.height > 10 && Math.abs(r.height - cv.H) > 1) { cv.H = r.height; cv.height = r.height * cv.dpr; cv.g.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0); }
    const g = cv.g, W = cv.W, H = cv.H;
    g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!wf) { g.fillStyle = '#34465c'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText('drop audio here', W / 2, H / 2); return; }
    const s = view.state;
    const loopMode = s.mode === 'loop';
    // region shading
    g.fillStyle = 'rgba(170,68,255,.10)'; const ra = loopMode ? s.loopStart : s.start, rb = loopMode ? s.loopEnd : s.end;
    g.fillRect(ra * W, 0, (rb - ra) * W, H);
    // waveform (min/max peaks)
    const n = wf.peaks.length / 2;
    g.fillStyle = s.reverse ? '#ff66cc' : '#aa44ff';
    for (let x = 0; x < W; x++) {
      const i = Math.floor(x / W * n); const mn = wf.peaks[i * 2], mx = wf.peaks[i * 2 + 1];
      const idx = s.reverse ? n - 1 - i : i;
      const a = s.reverse ? wf.peaks[idx * 2] : mn, b = s.reverse ? wf.peaks[idx * 2 + 1] : mx;
      g.globalAlpha = (x / W >= ra && x / W <= rb) ? 1 : 0.35;
      g.fillRect(x, H / 2 - b * H * 0.46, 1, Math.max(1, (b - a) * H * 0.46));
    }
    g.globalAlpha = 1;
    // slices
    if (s.mode === 'slice') { g.strokeStyle = '#ffdd00'; g.fillStyle = '#ffdd00'; g.font = '9px monospace'; g.textAlign = 'left'; slices.forEach((p, i) => { g.beginPath(); g.moveTo(p * W + 0.5, 0); g.lineTo(p * W + 0.5, H); g.stroke(); g.fillText(String(i + 1), p * W + 3, H - 4); }); }
    // handles
    g.fillStyle = loopMode ? '#00ff88' : '#fff';
    [ra, rb].forEach(p => { g.fillRect(p * W - 1, 0, 2, H); g.beginPath(); g.moveTo(p * W - 6, 0); g.lineTo(p * W + 6, 0); g.lineTo(p * W, 10); g.fill(); });
    if (playhead >= 0) { g.fillStyle = '#00d4ff'; g.fillRect(playhead * W, 0, 2, H); }
    if (s.pitch) { g.fillStyle = '#00d4ff'; g.font = '11px monospace'; g.textAlign = 'right'; g.fillText((s.pitch > 0 ? '+' : '') + s.pitch.toFixed(1) + ' st', W - 6, 14); }
  }, 30);
});

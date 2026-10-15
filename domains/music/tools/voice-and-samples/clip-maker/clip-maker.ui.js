/* eravos.clip-maker UI — zoomable waveform (wheel zoom, drag select, shift-extend), pencil tool, ops, clip list with send-to */
OrganismFactory.reg('eravos.clip-maker', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let W = null, zoom = { a: 0, b: 1 }, tool = 'select', play = null, recOn = false;
  const cv = UI.Canvas(720, 170); cv.style.cursor = 'text';
  const info = h('span', { class: 'org-note', text: 'Drop her recording here, Open a file, or ● Record' });
  const fileIn = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (f) view.emit('load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  view.on('file_ready', (f) => window.Workspace.download(f.name, f.data, f.mime));
  view.on('wave', (w) => { const fresh = !W || w.length !== W.length || w.name !== W.name; W = w; if (fresh && !w.sel) zoom = { a: 0, b: 1 }; info.textContent = `✂ ${w.name} · ${w.duration.toFixed(2)} s` + (w.sel && w.sel.b > w.sel.a ? ` · selection ${((w.sel.b - w.sel.a) / w.sr).toFixed(3)} s` : '') + (w.note ? ' · ' + w.note : ''); drawClips(); undoB.el.disabled = !w.canUndo; redoB.el.disabled = !w.canRedo; });
  view.on('playhead', (p) => { play = p.from >= 0 ? p : null; });
  view.on('recording', (r) => { recOn = r.on; recB.el.classList.toggle('danger', r.on); recB.set(r.on ? '■ Stop recording' : '● Record'); });
  const X = (i) => ((i / W.length) - zoom.a) / (zoom.b - zoom.a) * cv.W;
  const I = (x) => Math.round((zoom.a + x / cv.W * (zoom.b - zoom.a)) * W.length);
  UI.loop(cv, () => {
    const g = cv.g, Wd = cv.fit().W, H = 170; g.fillStyle = '#080b10'; g.fillRect(0, 0, Wd, H);
    if (!W || !W.length) { g.fillStyle = '#34465c'; g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText('drop audio here', Wd / 2, H / 2); g.textAlign = 'left'; return; }
    if (W.sel && W.sel.b > W.sel.a) { g.fillStyle = 'rgba(0,255,136,.13)'; g.fillRect(X(W.sel.a), 0, X(W.sel.b) - X(W.sel.a), H); }
    W.clips.forEach(c => { g.fillStyle = 'rgba(0,212,255,.08)'; g.fillRect(X(c.a), H - 14, X(c.b) - X(c.a), 14); g.fillStyle = '#00d4ff'; g.font = '9px monospace'; g.fillText(String(c.id), X(c.a) + 2, H - 4); });
    const n = W.peaks.length / 2; g.fillStyle = '#00ff88';
    for (let x = 0; x < Wd; x++) { const f = zoom.a + x / Wd * (zoom.b - zoom.a); const i = Math.min(n - 1, Math.floor(f * n)); const mn = W.peaks[i * 2], mx = W.peaks[i * 2 + 1]; g.fillRect(x, H / 2 - mx * H * 0.45, 1, Math.max(1, (mx - mn) * H * 0.45)); }
    g.fillStyle = '#ffdd00'; W.markers.forEach(m => { const x = X(m); if (x >= 0 && x <= Wd) g.fillRect(x, 0, 1, 8); });
    if (play) { const i = play.from + (view.ac.currentTime - play.t0) * play.sr; g.fillStyle = '#fff'; g.fillRect(X(i), 0, 2, H); }
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText(`${(zoom.a * W.duration).toFixed(2)}s`, 4, 10); g.textAlign = 'right'; g.fillText(`${(zoom.b * W.duration).toFixed(2)}s`, Wd - 4, 10); g.textAlign = 'left';
  }, 30);
  let drag = null, pencil = [];
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); if (!W || !W.length) return; cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (tool === 'draw') { pencil = [{ i: I(x), v: 1 - 2 * y / r.height }]; drag = { draw: true }; return; }
    const i = I(x);
    if (e.shiftKey && W.sel) drag = { a: Math.abs(i - W.sel.a) < Math.abs(i - W.sel.b) ? W.sel.b : W.sel.a };
    else drag = { a: i };
    view.emit('select', { a: drag.a, b: i });
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (drag.draw) { pencil.push({ i: I(x), v: Math.max(-1, Math.min(1, 1 - 2 * y / r.height)) }); return; }
    view.emit('select', { a: drag.a, b: I(x) });
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { if (drag && drag.draw && pencil.length > 1) view.emit('draw', { points: pencil }); drag = null; pencil = []; }));
  cv.addEventListener('wheel', (e) => { if (!W) return; e.preventDefault(); e.stopPropagation(); const r = cv.getBoundingClientRect(); const f = zoom.a + (e.clientX - r.left) / r.width * (zoom.b - zoom.a); const span = Math.max(0.0005, Math.min(1, (zoom.b - zoom.a) * Math.exp(e.deltaY * 0.002))); zoom = { a: Math.max(0, f - (f - zoom.a) * span / (zoom.b - zoom.a)), b: 0 }; zoom.b = Math.min(1, zoom.a + span); zoom.a = Math.max(0, zoom.b - span); }, { passive: false });
  cv.addEventListener('dblclick', () => { if (W && W.sel && W.sel.b > W.sel.a) zoom = { a: W.sel.a / W.length, b: W.sel.b / W.length }; else zoom = { a: 0, b: 1 }; });
  view.root.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  view.root.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) view.emit('load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  const tools = UI.Segmented({ options: [{ value: 'select', label: '⌶ select' }, { value: 'draw', label: '✎ draw' }], value: 'select', onChange: (v) => { tool = v; cv.style.cursor = v === 'draw' ? 'crosshair' : 'text'; } });
  const op = (label, name, extra, hint) => UI.Button({ label, hint, onClick: () => view.emit('op', Object.assign({ name }, extra || {})) }).el;
  const undoB = UI.Button({ label: '↶ Undo', onClick: () => view.emit('undo', {}) }), redoB = UI.Button({ label: '↷ Redo', onClick: () => view.emit('redo', {}) });
  const recB = UI.Button({ label: '● Record', hint: 'record from the microphone (or the wired input)', onClick: () => view.emit('record', { on: !recOn }) });
  const targets = () => view.targets().filter(t => /drop-builder|sample-player|timeline|pads|granular|looper|contrast/.test(t.value));
  const sendSel = UI.Select({ options: [], onChange: () => {} });
  const refresh = () => sendSel.setOptions([{ value: '', label: 'Send to…' }, { value: '__new', label: '＋ new Sample player' }].concat(targets()));
  sendSel.select.addEventListener('pointerdown', refresh); refresh();
  function sendTo(v, clip) {
    if (!v) return;
    if (v === '__new') { const id = OrganismFactory.spawn('eravos.sample-player'); if (id) view.emit('send', { target: id, clip }); return; }
    view.emit('send', { target: v, clip });
  }
  sendSel.select.addEventListener('change', () => { sendTo(sendSel.select.value); setTimeout(() => sendSel.set(''), 50); });
  const clipList = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } });
  function drawClips() {
    clipList.innerHTML = ''; if (!W || !W.clips.length) return;
    W.clips.forEach(c => {
      const s = UI.Select({ options: [{ value: '', label: `#${c.id} ${((c.b - c.a) / W.sr).toFixed(2)}s → send…` }, { value: '__new', label: '＋ new Sample player' }].concat(targets()), onChange: (v) => { sendTo(v, c.id); setTimeout(() => s.set(''), 50); } });
      const b = UI.Button({ label: '▶ ' + c.id, onClick: () => { view.emit('clip_select', { id: c.id }); setTimeout(() => view.emit('play', {}), 20); } });
      clipList.appendChild(h('div', { class: 'org-row', style: { margin: 0, gap: '2px' } }, [b.el, s.el]));
    });
  }
  const bars = UI.NumberDrag({ min: 1, max: 64, step: 1, value: 2, suffix: ' bars' });
  view.root.append(
    h('div', { class: 'org-row', style: { flexWrap: 'wrap' } }, [UI.presetBar(view), UI.Button({ label: '▶ Play', kind: 'primary', onClick: () => view.emit('play', {}) }).el, UI.Button({ label: '■', onClick: () => view.emit('stop', {}) }).el, recB.el, UI.Button({ label: 'Open…', onClick: () => fileIn.click() }).el, fileIn, tools.el, undoB.el, redoB.el, info]),
    cv,
    h('div', { class: 'org-row', style: { marginTop: '6px' } }, [op('Cut', 'cut'), op('Copy', 'copy'), op('Paste', 'paste'), op('Delete', 'delete'), op('Keep only selection', 'crop', null, 'crop to the selection'), op('Silence', 'silence'), op('Fade in', 'fadeIn'), op('Fade out', 'fadeOut'), op('Normalise', 'normalise'), op('Reverse', 'reverse'), op('−3 dB', 'gain', { db: -3 }), op('+3 dB', 'gain', { db: 3 }), op('Pitch −12', 'pitch', { semitones: -12 }), op('Pitch +12', 'pitch', { semitones: 12 }), op('Remove DC', 'removeDC')]),
    h('div', { class: 'org-row' }, [UI.Button({ label: '✂ Split on silence', kind: 'primary', hint: 'find each phrase/word separated by silence', onClick: () => view.emit('split', {}) }).el, UI.paramControl(view, cfg('silenceThresh'), { size: 28 }).el, UI.paramControl(view, cfg('minGap'), { size: 28 }).el, UI.Button({ label: 'Detect BPM', onClick: () => view.emit('detect_bpm', {}) }).el, bars.el, UI.Button({ label: 'Trim to bars', onClick: () => view.emit('trim_bars', { bars: bars.get() }) }).el, sendSel.el, UI.Button({ label: '⤓ WAV', onClick: () => view.emit('export', {}) }).el]),
    clipList,
    UI.hint('Drag to select, shift-drag to extend, wheel to zoom, double-click to zoom to the selection. “Keep only selection” trims to exactly the words you want.'),
  );
  view.emit('request_state', {});
});

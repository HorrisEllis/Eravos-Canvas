/* eravos.sidechain-compressor UI — drawable duck shape with live playhead, GR meter from the env port, step gate grid */
OrganismFactory.reg('eravos.sidechain-compressor', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let shape = [], points = null, per = 0.25, lastDuck = null, gateStep = -1;
  const cv = UI.Canvas(400, 110); cv.style.cursor = 'crosshair';
  const envAn = view.tap('env', 256); const eb = new Float32Array(256);
  view.on('state_sync', (s) => { shape = s.shape || []; points = s.points; per = s.period; });
  view.on('ducked', (d) => { lastDuck = d; });
  view.on('gate', (g) => UI.atTime(view.ac, g.time, () => { gateStep = g.step; }));
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 110; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    const s = view.state;
    if (s.mode === 'step') {
      const st = s.steps || []; const w = W / 16;
      st.forEach((v, i) => { g.fillStyle = i === gateStep ? '#fff' : (i % 4 === 0 ? '#ffaa00' : '#b87a00'); g.globalAlpha = 0.25 + 0.75 * v; g.fillRect(i * w + 2, H - 8 - v * (H - 16), w - 4, v * (H - 16) + 2); });
      g.globalAlpha = 1; g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText('click/drag bars to set the gate level per 1/16', 6, 12); return;
    }
    g.strokeStyle = '#1a2533'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.stroke(); }
    g.strokeStyle = '#ffaa00'; g.lineWidth = 2; g.beginPath();
    shape.forEach((v, i) => { const x = i / (shape.length - 1) * W, y = 8 + (1 - v) * (H - 16); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    if (points) { g.fillStyle = '#fff'; points.forEach(p => { g.beginPath(); g.arc(p.x * W, 8 + (1 - p.y) * (H - 16), 4, 0, 7); g.fill(); }); }
    if (lastDuck) { const x = (view.ac.currentTime - lastDuck.time) / lastDuck.dur; if (x >= 0 && x <= 1) { const v = shape[Math.round(x * (shape.length - 1))]; g.fillStyle = '#00ff88'; g.beginPath(); g.arc(x * W, 8 + (1 - v) * (H - 16), 5, 0, 7); g.fill(); } }
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(points ? `drawn shape · ${s.shapeLength}` : `${(per * 1000).toFixed(0)} ms duck`, 6, 12);
  }, 40);
  // GR meter reads the real env signal
  const gr = UI.Canvas(24, 110); gr.style.width = '24px';
  UI.loop(gr, () => { const g = gr.g; envAn.getFloatTimeDomainData(eb); let mn = 1; for (let i = 0; i < eb.length; i++) mn = Math.min(mn, eb[i]); const db = 20 * Math.log10(Math.max(1e-4, mn)); g.fillStyle = '#080b10'; g.fillRect(0, 0, 24, 110); const n = Math.min(1, -db / 30); g.fillStyle = '#ffaa00'; g.fillRect(4, 0, 16, n * 110); g.fillStyle = '#7f93a8'; g.font = '8px monospace'; g.fillText('GR', 5, 106); }, 30);
  // editing
  let drag = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top - 8) / (r.height - 16))) }; };
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const p = pos(e); cv.setPointerCapture(e.pointerId);
    if (view.state.mode === 'step') { drag = { step: true }; setStep(p); return; }
    let pts = points ? points.slice() : shape.filter((_, i) => i % 8 === 0).map((v, i, a) => ({ x: i / (a.length - 1), y: v }));
    let idx = pts.findIndex(q => Math.abs(q.x - p.x) < 0.04);
    if (e.button === 2 && idx > 0 && idx < pts.length - 1) { pts.splice(idx, 1); view.emit('shape_edit', { points: pts }); return; }
    if (idx < 0) { pts.push(p); pts.sort((a, b) => a.x - b.x); idx = pts.indexOf(p); }
    drag = { pts, idx }; view.emit('shape_edit', { points: pts });
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  function setStep(p) { const st = (view.state.steps || []).slice(); const i = Math.min(15, Math.floor(p.x * 16)); st[i] = +p.y.toFixed(2) < 0.08 ? 0 : +p.y.toFixed(2); view.set('steps', st); }
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return; const p = pos(e);
    if (drag.step) return setStep(p);
    const q = drag.pts[drag.idx]; q.y = p.y; if (drag.idx > 0 && drag.idx < drag.pts.length - 1) q.x = p.x;
    view.emit('shape_edit', { points: drag.pts });
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
  const reset = UI.Button({ label: 'Reset shape', onClick: () => view.emit('shape_edit', { points: null }) });
  const test = UI.Button({ label: 'Test duck', onClick: () => view.emit('test_duck', {}) });
  const c = (k) => UI.paramControl(view, cfg(k), { size: 30 }).el;
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), c('enabled')]),
    h('div', { style: { display: 'flex', gap: '6px' } }, [cv, gr]),
    h('div', { class: 'org-row', style: { marginTop: '6px' } }, [c('target'), c('mode'), c('triggerMode'), c('division')]),
    h('div', { class: 'org-row' }, [c('depth'), c('attack'), c('hold'), c('release'), c('curve'), c('smoothing')]),
    h('div', { class: 'org-row' }, [c('source'), c('shapeLength'), reset.el, test.el]),
    UI.hint('Target “master” pumps the whole mix (including reverb tails) on every beat. Wire sounds in and use “insert” to pump only them.'),
  );
});

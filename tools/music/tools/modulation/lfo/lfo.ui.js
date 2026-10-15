/* eravos.lfo UI — real signal trace (analyser on the out port), custom 16-bar shape editor, division ladder / Hz, wired targets */
OrganismFactory.reg('eravos.lfo', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const an = view.tap('out', 2048); const buf = new Float32Array(2048);
  const cv = UI.Canvas(380, 110); const hist = [];
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 110; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1a2533'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    an.getFloatTimeDomainData(buf); const v = buf[buf.length - 1];
    hist.push(v); if (hist.length > W) hist.shift();
    g.strokeStyle = '#aa44ff'; g.lineWidth = 2; g.beginPath();
    hist.forEach((x, i) => { const y = H / 2 - x * H * 0.45; i ? g.lineTo(i, y) : g.moveTo(i, y); }); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(hist.length - 1, H / 2 - v * H * 0.45, 5, 0, 7); g.fill();
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(v.toFixed(2), 6, 12);
  }, 60);
  // custom editor
  const ed = UI.Canvas(380, 60); ed.style.cursor = 'ns-resize';
  UI.loop(ed, () => {
    const g = ed.g, W = ed.fit().W, H = 60; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    const pts = view.state.custom || []; const w = W / 16;
    pts.forEach((v, i) => { g.fillStyle = view.state.shape === 'custom' ? '#aa44ff' : '#3a2a55'; const y = H / 2 - v * (H / 2 - 3); g.fillRect(i * w + 2, Math.min(y, H / 2), w - 4, Math.abs(y - H / 2) || 1); });
  }, 15);
  let dr = false;
  const setPt = (e) => { const r = ed.getBoundingClientRect(); const i = Math.max(0, Math.min(15, Math.floor((e.clientX - r.left) / r.width * 16))); const v = Math.max(-1, Math.min(1, 1 - (e.clientY - r.top) / r.height * 2)); const pts = (view.state.custom || []).slice(); pts[i] = +v.toFixed(2); view.emit('custom_shape', { points: pts }); };
  ed.addEventListener('pointerdown', (e) => { e.stopPropagation(); dr = true; ed.setPointerCapture(e.pointerId); setPt(e); });
  ed.addEventListener('pointermove', (e) => { if (dr) setPt(e); });
  ['pointerup', 'pointercancel'].forEach(t => ed.addEventListener(t, () => { dr = false; }));
  const div = UI.divisionLadder(view, 'div'); view.bind('div', v => div.set(v));
  const rate = UI.paramControl(view, cfg('rate'), { size: 30 });
  const syncT = UI.paramControl(view, cfg('sync'));
  view.bind('sync', (s) => { div.el.style.display = s ? '' : 'none'; rate.el.style.display = s ? 'none' : ''; });
  const targets = h('div', { class: 'uk-hint' });
  function refreshTargets() {
    const ws = view.K.wires.list().filter(w => w.src.instanceId === view.instanceId);
    targets.innerHTML = '';
    if (!ws.length) { targets.textContent = 'Not wired yet — drag the violet dot on the right edge onto a violet input (cutoff, pan, DJ filter…).'; return; }
    ws.forEach(w => targets.appendChild(h('div', { class: 'org-row', style: { margin: '2px 0' } }, [h('span', { text: '→ ' + view.label(w.dst.instanceId) + ' · ' + w.dst.hookId.split('.').pop().replace(/_/g, ' ') }), UI.Button({ label: '×', onClick: () => view.K.wires.remove(w.wire_id, 'user') }).el])));
  }
  view.observe('kernel:wire-registered', refreshTargets); view.observe('kernel:wire-removed', refreshTargets); refreshTargets();
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('polarity')).el]),
    UI.paramControl(view, cfg('shape'), { segMax: 8 }).el, cv, ed,
    h('div', { class: 'org-row', style: { marginTop: '6px', flexWrap: 'wrap', gap: '6px' } }, [syncT.el, div.el, rate.el]),
    UI.paramPanel(view, ['depth', 'offset', 'phase', 'retrigger', 'fade'], { flat: true, noTitles: true, size: 30 }),
    targets,
  );
});

/* eravos.macro-automation UI — parameter browser (organism → parameter), breakpoint editor per lane */
OrganismFactory.reg('eravos.macro-automation', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let S = { lanes: [], length: 16, params: [] }, playBar = null;
  const orgSel = UI.Select({ options: [{ value: '', label: 'Organism…' }], onChange: () => fillKeys() });
  const keySel = UI.Select({ options: [{ value: '', label: 'Parameter…' }] });
  function fillOrgs() { orgSel.setOptions([{ value: '', label: 'Organism…' }].concat(S.params.map(p => ({ value: p.id, label: p.label })))); }
  function fillKeys() { const o = S.params.find(p => p.id === orgSel.select.value); keySel.setOptions([{ value: '', label: 'Parameter…' }].concat(o ? o.keys.map(k => ({ value: k.key, label: (k.group ? k.group + ' · ' : '') + k.label })) : [])); }
  const add = UI.Button({ label: '＋ Add lane', kind: 'primary', onClick: () => { if (orgSel.select.value && keySel.select.value) view.emit('lane_add', { target: orgSel.select.value, key: keySel.select.value }); } });
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'auto', flex: '1' } });
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
  view.root.append(h('div', { class: 'org-row' }, [orgSel.el, keySel.el, add.el, UI.paramControl(view, cfg('mode')).el, UI.paramControl(view, cfg('quantize'), { segMax: 5 }).el, UI.paramControl(view, cfg('lengthBars'), { size: 28 }).el]), list,
    UI.hint('Click = add point · drag = move · alt-drag = bend the curve · right-click = delete. Mode “write” records your knob moves while the song plays.'));
  view.on('play_bar', (p) => { playBar = p.bar; });
  const store = {}; const els = {};
  function laneEl(l0) {
    const id = l0.id; const L = () => store[id] || l0;
    const cv = UI.Canvas(700, 70); cv.style.cursor = 'crosshair';
    const H = 70;
    const X = (b) => (b - 1) / S.length * cv.W, B = (x) => 1 + x / cv.W * S.length, Y = (v) => 4 + (1 - v) * (H - 8), V = (y) => Math.max(0, Math.min(1, 1 - (y - 4) / (H - 8)));
    UI.loop(cv, () => {
      cv.fit(); const g = cv.g, W = cv.W; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
      for (let b = 1; b <= S.length; b++) { g.fillStyle = b % 4 === 1 ? '#223044' : '#141c27'; g.fillRect(X(b), 0, 1, H); }
      const pts = L().points; g.strokeStyle = L().missing ? '#555' : '#ffaa00'; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= W; x += 2) { const b = B(x); let v = pts[0].value; if (b >= pts[0].bar) { v = pts[pts.length - 1].value; for (let i = 1; i < pts.length; i++) if (b < pts[i].bar) { const a = pts[i - 1], c = pts[i]; let u = (b - a.bar) / (c.bar - a.bar); if (L().hold) u = 0; else if (a.curve > 0) u = Math.pow(u, 1 + a.curve * 3); else if (a.curve < 0) u = 1 - Math.pow(1 - u, 1 - a.curve * 3); v = a.value + (c.value - a.value) * u; break; } } x ? g.lineTo(x, Y(v)) : g.moveTo(x, Y(v)); }
      g.stroke(); g.fillStyle = '#fff'; pts.forEach(p => { g.beginPath(); g.arc(X(p.bar), Y(p.value), 4, 0, 7); g.fill(); });
      if (playBar) { g.fillStyle = '#00d4ff'; g.fillRect(X(playBar), 0, 2, H); }
    }, 30);
    let drag = null;
    const hitPt = (x, y) => L().points.findIndex(p => Math.hypot(X(p.bar) - x, Y(p.value) - y) < 8);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; const i = hitPt(x, y);
      if (e.button === 2) { if (i >= 0) view.emit('point_edit', { lane: L().id, op: 'delete', index: i }); return; }
      cv.setPointerCapture(e.pointerId);
      if (i >= 0) drag = { i, alt: e.altKey, y0: y, c0: L().points[i].curve || 0 };
      else { view.emit('point_edit', { lane: L().id, op: 'add', point: { bar: B(x), value: V(y) } }); }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (drag.alt) view.emit('point_edit', { lane: L().id, op: 'curve', index: drag.i, point: { curve: Math.max(-1, Math.min(1, drag.c0 + (y - drag.y0) / 40)) } });
      else view.emit('point_edit', { lane: L().id, op: 'move', index: drag.i, point: { bar: drag.i === 0 && L().points[0].bar === 1 ? 1 : B(x), value: V(y) } });
    });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
    const en = UI.Toggle({ label: L().enabled ? 'On' : 'Off', value: L().enabled, onChange: (v) => view.emit('lane_mode', { id: L().id, enabled: v }) });
    const head = h('div', { class: 'org-row', style: { margin: 0 } }, [h('span', { style: { font: '600 11px var(--font)', color: L().missing ? '#ff5577' : '#ffaa00' }, text: L().label + (L().missing ? ' — target gone' : '') + (L().recording ? ' ● rec' : '') }), h('span', { class: 'uk-hint', text: L().output === 'audio' ? 'audio-rate' : 'event-rate' }), en.el, UI.Button({ label: 'Clear', onClick: () => view.emit('point_edit', { lane: L().id, op: 'clear' }) }).el, UI.Button({ label: '×', onClick: () => view.emit('lane_remove', { id: L().id }) }).el]);
    return h('div', { class: 'uk-group' }, [head, cv]);
  }
  // 3.27 empty state: a drawn example of what a lane does + one-click lanes for the moves people actually automate
  const LIKELY = ['cutoff', 'djFilter', 'depth', 'mix', 'reverbMix', 'level', 'volume', 'fader', 'drive', 'res'];
  function emptyState() {
    const demo = UI.Canvas(700, 64);
    UI.loop(demo, () => {
      demo.fit(); const g = demo.g, W = demo.W, H = 64; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
      for (let b = 0; b < 16; b++) { g.fillStyle = b % 4 === 0 ? '#223044' : '#141c27'; g.fillRect(b / 16 * W, 0, 1, H); }
      g.strokeStyle = '#ffaa0066'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= W; x += 3) { const u = x / W, v = u < 0.5 ? Math.pow(u * 2, 2.2) : u < 0.75 ? 1 : 1 - (u - 0.75) * 3.2; const y = 6 + (1 - Math.max(0, Math.min(1, v))) * (H - 12); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.setLineDash([]); g.fillStyle = '#c9a25a'; g.font = '11px monospace'; g.fillText('e.g. a filter that opens over 8 bars, holds, then drops — drawn once, played every time', 8, 14);
    }, 4);
    const quick = h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px', margin: '6px 0 0' } });
    S.params.slice(0, 8).forEach(p => {
      const k = LIKELY.map(x => p.keys.find(q => q.key === x)).find(Boolean); if (!k) return;
      quick.appendChild(UI.Button({ label: '＋ ' + p.label + ' · ' + k.label, onClick: () => view.emit('lane_add', { target: p.id, key: k.key }) }).el);
    });
    if (!quick.children.length) quick.appendChild(UI.hint('Add a synth or effect to the canvas — its knobs show up here, one click to automate.'));
    return h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: 'NO LANES YET — PICK A KNOB TO DRAW' }), demo, quick]);
  }
  view.on('state_sync', (s) => {
    if (!s.lanes) return; S = s; fillOrgs();
    const ids = S.lanes.map(l => l.id + (l.enabled ? 1 : 0) + (l.missing ? 1 : 0) + (l.recording ? 1 : 0)).join(',') + (S.lanes.length ? '' : '|' + S.params.map(p => p.id).join(','));
    S.lanes.forEach(l => { store[l.id] = l; });
    if (ids === list.dataset.ids) return;
    list.dataset.ids = ids;
    list.innerHTML = ''; S.lanes.forEach(l => list.appendChild(laneEl(l)));
    if (!S.lanes.length) list.appendChild(emptyState());
  });
});

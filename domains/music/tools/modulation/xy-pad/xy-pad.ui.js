/* eravos.xy-pad UI — square surface, puck with 1 s trail, recorded loop path, axis labels from wired targets */
OrganismFactory.reg('eravos.xy-pad', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const pad = UI.Canvas(360, 300); pad.style.cursor = 'crosshair'; pad.style.touchAction = 'none';
  let puck = { x: 0.5, y: 0.5 }, trail = [], loopPts = null, st = {}, loopPuck = null;
  view.on('state_sync', (s) => { st = s; loopPts = s.loop; if (s.x !== undefined) puck = { x: s.x, y: s.y }; });
  view.on('pos', (p) => { const f = () => { if (p.loop) loopPuck = p; else puck = p; }; if (p.time) UI.atTime(view.ac, p.time, f); else f(); });
  function labels() {
    const lab = (port) => { const w = view.K.wires.list().find(w => w.src.instanceId === view.instanceId && w.src.hookId === 'xy.hook.mod_' + port); return w ? view.label(w.dst.instanceId) + ' ' + w.dst.hookId.split('.').pop().replace('mod_', '') : port.toUpperCase() + ' (unwired)'; };
    return { x: lab('x'), y: lab('y') };
  }
  UI.loop(pad, () => {
    pad.fit(); const g = pad.g, W = pad.W, H = 300; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1a2533'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
    if (loopPts) { g.strokeStyle = 'rgba(0,212,255,.35)'; g.lineWidth = 2; g.beginPath(); loopPts.forEach((q, i) => { const x = q[1] * W, y = (1 - q[2]) * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    const now = performance.now(); trail.push({ x: puck.x, y: puck.y, t: now }); trail = trail.filter(p => now - p.t < 1000);
    trail.forEach((p, i) => { g.fillStyle = `rgba(0,212,255,${i / trail.length * 0.5})`; g.beginPath(); g.arc(p.x * W, (1 - p.y) * H, 4, 0, 7); g.fill(); });
    if (loopPuck && st.looping) { g.fillStyle = '#ffaa00'; g.beginPath(); g.arc(loopPuck.x * W, (1 - loopPuck.y) * H, 9, 0, 7); g.fill(); }
    g.fillStyle = '#00d4ff'; g.shadowColor = '#00d4ff'; g.shadowBlur = 16; g.beginPath(); g.arc(puck.x * W, (1 - puck.y) * H, 11, 0, 7); g.fill(); g.shadowBlur = 0;
    const L = labels(); g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText('→ ' + L.x, 6, H - 6); g.save(); g.translate(12, H - 24); g.rotate(-Math.PI / 2); g.fillText('→ ' + L.y, 0, 0); g.restore();
    if (st.armed) { g.fillStyle = '#ff2266'; g.fillText('ARMED — recording starts on the next bar', 6, 14); }
    if (st.recording) { g.fillStyle = '#ff2266'; g.fillText('● RECORDING GESTURE', 6, 14); }
  }, 60);
  let down = false;
  const xy = (e) => { const r = pad.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)) }; };
  pad.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; pad.setPointerCapture(e.pointerId); const p = xy(e); puck = p; view.emit('xy_move', p); });
  pad.addEventListener('pointermove', (e) => { if (!down) return; const p = xy(e); puck = p; view.emit('xy_move', p); });
  ['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, () => { down = false; view.emit('xy_release', {}); }));
  const arm = UI.Button({ label: '● ARM', hint: 'record your next move for N bars, starting on the next bar (transport must play)', onClick: () => view.emit('loop_arm', {}) });
  const playB = UI.Button({ label: '⟲ LOOP', onClick: () => view.emit('loop_play', {}) });
  const clr = UI.Button({ label: 'CLEAR', onClick: () => view.emit('loop_clear', {}) });
  view.on('state_sync', (s) => { playB.el.classList.toggle('primary', !!s.looping); arm.el.classList.toggle('danger', !!(s.armed || s.recording)); });
  view.root.append(pad, h('div', { class: 'org-row', style: { marginTop: '6px' } }, [arm.el, playB.el, clr.el, UI.paramControl(view, cfg('loopBars')).el]),
    UI.paramPanel(view, ['smoothing', 'snapBack', 'returnTime', 'inertia', 'friction', 'curveX', 'minX', 'maxX', 'invertX', 'curveY', 'minY', 'maxY', 'invertY'], { size: 28, segMax: 3 }));
});

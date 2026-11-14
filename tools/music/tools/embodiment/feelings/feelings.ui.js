/* eravos.feelings UI — the approved preview (2026-11-13: "then build it."): the feeling picker and the pad, nothing else ("no capture button
 * or return"). The whole window is the pad ("resize to add more dynamic range": a bigger window = a bigger pad, finer control). Drag = play;
 * where the dot is moves the sound; the light follows the dot; the trail shows where you have been. view.* only. */
OrganismFactory.reg('eravos.feelings', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
  const WORD = { love: 'LOVE', anger: 'ANGER', sadness: 'SADNESS' };
  let px = P('x'), py = 1 - P('y'), trail = [], drag = false, last = null, speed = 0, sent = 0;
  const cv = UI.Canvas(860, 720); cv.style.cursor = 'crosshair'; cv.style.touchAction = 'none'; cv.dataset.pad = '1';
  const at = (e) => { const r = cv.getBoundingClientRect(); px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); };
  const send = () => {   // the dot → x / y (y up = more), speed from how fast it moved; at most one message a frame
    const now = performance.now(); if (last) { const dt = Math.max(1, now - last.t), d = Math.hypot(px - last.x, py - last.y); speed = Math.max(speed * 0.8, Math.min(1, d / dt * 400)); }
    last = { x: px, y: py, t: now }; if (now - sent < 14) return; sent = now;
    view.emit('config_change', { key: 'x', value: +px.toFixed(4) }); view.emit('config_change', { key: 'y', value: +(1 - py).toFixed(4) }); view.emit('config_change', { key: 'speed', value: +speed.toFixed(3) });
  };
  cv.addEventListener('pointerdown', e => { e.stopPropagation(); drag = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} at(e); trail = []; last = null; send(); view.emit('touch', { on: true }); });
  cv.addEventListener('pointermove', e => { if (!drag) return; at(e); send(); });
  const up = () => { if (!drag) return; drag = false; speed = 0; view.emit('config_change', { key: 'speed', value: 0 }); view.emit('touch', { on: false }); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
  view.bind('x', (v) => { if (!drag) px = v; }); view.bind('y', (v) => { if (!drag) py = 1 - v; });
  UI.loop(cv, () => {
    const g = cv.g; cv.fit();
    const want = Math.max(240, Math.floor(view.root.clientHeight - cv.offsetTop - 10));   // the pad fills the window
    if (Math.abs(want - cv.H) > 1) { cv.H = want; cv.style.height = want + 'px'; cv.height = want * cv.dpr; g.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0); }
    const W = cv.W, H = cv.H;
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(px * W, py * H, 0, px * W, py * H, Math.max(W, H) * 0.8); gr.addColorStop(0, `rgba(127,184,255,${drag ? 0.26 : 0.16})`); gr.addColorStop(1, 'rgba(127,184,255,.02)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(W * k / 4, 0); g.lineTo(W * k / 4, H); g.moveTo(0, H * k / 4); g.lineTo(W, H * k / 4); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.font = '600 44px ui-monospace, monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(235,240,250,.07)'; g.fillText(WORD[P('feeling')] || '', W / 2, H / 2 + 15); g.textAlign = 'left';
    if (drag) { trail.push({ x: px, y: py }); if (trail.length > 120) trail.shift(); } else if (trail.length) trail.shift();
    trail.forEach((p, i) => { if (!i) return; const q = trail[i - 1]; g.strokeStyle = `rgba(127,184,255,${0.6 * i / trail.length})`; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x * W, q.y * H); g.lineTo(p.x * W, p.y * H); g.stroke(); });
    const x = px * W, y = py * H; g.fillStyle = `rgba(127,184,255,${drag ? 0.24 : 0.14})`; g.beginPath(); g.arc(x, y, drag ? 26 : 22, 0, 6.283); g.fill();
    g.fillStyle = '#7fb8ff'; g.beginPath(); g.arc(x, y, 7, 0, 6.283); g.fill();
  }, 30);
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
  view.root.append(h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('feeling'), { segMax: 6, noLabel: true }).el]), cv);
});

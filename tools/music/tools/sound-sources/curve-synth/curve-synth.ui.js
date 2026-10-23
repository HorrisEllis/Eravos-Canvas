/* eravos.curve-synth UI — draw the gesture (drag; shift = straight line), see the bounce path it will take, watch the
 * live pitch dot ride it; slots 1–8 (keys 1–8 while focused), click ▶ or press Space-free Enter to fire. */
OrganismFactory.reg('eravos.curve-synth', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let curves = [], drawing = null, live = null;
  const cv = UI.Canvas(520, 220); cv.style.cursor = 'crosshair'; cv.style.touchAction = 'none'; cv.tabIndex = 0;
  const M = 14, X = (x, W) => M + x * (W - 2 * M), Y = (y) => M + (1 - y) * (220 - 2 * M);
  function smooth(pts) { const p = pts.slice().sort((a, b) => a.x - b.x); return p; }
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 220, s = view.state, pts = drawing || curves[s.slot || 0] || [];
    g.fillStyle = '#0d0703'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2a1608'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(X(i / 8, W), M); g.lineTo(X(i / 8, W), H - M); g.stroke(); }
    g.strokeStyle = '#ff6a2a'; g.lineWidth = 3; g.strokeRect(M, M, W - 2 * M, H - 2 * M); g.lineWidth = 1; // the edges it bounces off
    const sp = smooth(pts); if (sp.length) {
      g.strokeStyle = '#ffb27a'; g.lineWidth = 2.5; g.beginPath(); sp.forEach((p, i) => i ? g.lineTo(X(p.x, W), Y(p.y)) : g.moveTo(X(p.x, W), Y(p.y))); g.stroke(); g.lineWidth = 1;
      const end = sp[sp.length - 1]; if (s.edge && (end.y >= 0.97 || end.y <= 0.03)) { let d = 1, a = 1, x0 = end.x; g.setLineDash([4, 4]); for (let b = 1; b <= (s.bounces || 0); b++) { d *= s.decay || 0.6; a *= s.restitution || 0.6; g.strokeStyle = `rgba(255,106,42,${a})`; g.beginPath(); const rev = sp.slice().reverse(); rev.forEach((p, i) => { const x = x0 - (1 - p.x) * d * 0.25 * (b % 2 ? 1 : -1); i ? g.lineTo(X(Math.max(0, Math.min(1, x)), W), Y(p.y)) : g.moveTo(X(Math.max(0, Math.min(1, x)), W), Y(p.y)); }); g.stroke(); } g.setLineDash([]); }
    }
    if (live) { const el = (performance.now() - live.at) / 1000; const seg = live.plan.find(p => el >= p.t && el < p.t + p.dur); if (seg && sp.length) { const u = (el - seg.t) / seg.dur, fx = seg.dir > 0 ? u : 1 - u; let y = sp[0].y; for (let i = 1; i < sp.length; i++) if (sp[i].x >= fx) { const a = sp[i - 1], b = sp[i], k = (fx - a.x) / Math.max(1e-6, b.x - a.x); y = a.y + (b.y - a.y) * k; break; } g.fillStyle = '#fff'; g.beginPath(); g.arc(X(fx, W), Y(y), 3 + seg.amp * 6, 0, 7); g.fill(); } else if (el > live.plan[live.plan.length - 1].t + 1) live = null; }
    // Follow note: the start of the drawing IS the note played — mark that height, and how far the edges bend from it
    if (s.follow === 'note' && sp.length) { const y0 = sp[0].y, sp2 = s.span || 0; g.setLineDash([2, 5]); g.strokeStyle = '#ffffff55'; g.beginPath(); g.moveTo(M, Y(y0)); g.lineTo(W - M, Y(y0)); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffd2b0'; g.font = '10px monospace'; g.fillText('the note you play', M + 4, Y(y0) - 4); g.fillStyle = '#a0603a'; g.fillText('+' + (+((1 - y0) * sp2).toFixed(1)) + ' st', W - M - 62, M + 12); g.fillText('−' + (+(y0 * sp2).toFixed(1)) + ' st', W - M - 62, H - M - 16); }
    g.fillStyle = '#a0603a'; g.font = '10px monospace'; g.fillText('draw a gesture · end on the orange edge to bounce · shift = line', M + 4, H - 4);
  }, 60);
  let last = null;
  const at = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left - M * r.width / cv.W) / (r.width - 2 * M * r.width / cv.W))), y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top - M) / (220 - 2 * M))) }; };
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); cv.focus({ preventScroll: true }); cv.setPointerCapture(e.pointerId); const p = at(e); drawing = [p]; last = p; });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = at(e); if (e.shiftKey) { drawing = [drawing[0], p]; return; } drawing = drawing.filter(q => (p.x >= last.x ? q.x < Math.min(last.x, p.x) || q.x > p.x : q.x > Math.max(last.x, p.x) || q.x < p.x) || q === drawing[0]); drawing.push(p); last = p; });
  const done = () => { if (!drawing) return; const pts = drawing.slice().sort((a, b) => a.x - b.x); drawing = null; if (pts.length > 1) { view.emit('curve_set', { slot: view.state.slot || 0, pts }); setTimeout(() => view.emit('play', {}), 30); } };
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, done));
  cv.addEventListener('keydown', (e) => { if (/^[1-8]$/.test(e.key)) { view.set('slot', +e.key - 1); view.emit('play', { slot: +e.key - 1 }); e.preventDefault(); } else if (e.key === 'Enter') view.emit('play', {}); });
  const slots = UI.Segmented({ options: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: n - 1, label: String(n) })), value: view.state.slot, onChange: (v) => { view.set('slot', v); view.emit('play', { slot: v }); } }); view.bind('slot', (v) => slots.set(v));
  view.on('played', (p) => { live = { at: performance.now(), plan: p.plan }; });
  view.on('state_sync', (s) => { if (s.curves) curves = s.curves; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), slots.el, UI.Button({ label: '▶ Fire', onClick: () => view.emit('play', {}) }).el]), cv,
    UI.paramPanel(view, ['follow', 'span', 'length', 'duration', 'lowNote', 'highNote', 'edge', 'bounces', 'restitution', 'decay', 'wave', 'noise', 'drive', 'sustain', 'level'], { size: 30 }));
});

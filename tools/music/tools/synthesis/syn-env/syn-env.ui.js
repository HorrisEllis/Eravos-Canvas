/* eravos.syn-env UI — the shape, drawn from its knobs (drag the dots), a dot that runs along it when it fires, what it follows */
OrganismFactory.reg('eravos.syn-env', function (view) {
  const UI = view.ui, h = UI.h;
  const cv = UI.Canvas(460, 130); cv.style.cursor = 'grab';
  let fired = null; view.on('fired', (p) => { fired = { at: performance.now(), dur: p.dur }; });
  const follows = h('div', { class: 'uk-hint' });
  view.on('follows', (p) => { follows.textContent = p.n ? `moves on the notes of the ${p.n === 1 ? 'tool' : p.n + ' tools'} it is wired into` : 'wire its violet dot into any knob input — it then moves on that tool’s notes'; });
  follows.textContent = 'wire its violet dot into any knob input — it then moves on that tool’s notes';
  function geom(W, H) {
    const s = view.state, total = Math.max(1, s.delay + s.attack + s.hold + s.decay + 0.6 + s.release), X = (t) => 8 + t / total * (W - 16), Y = (v) => H - 10 - v * (H - 22);
    const t1 = s.delay, t2 = t1 + s.attack, t3 = t2 + s.hold, t4 = t3 + s.decay, t5 = t4 + 0.6, t6 = t5 + s.release;
    return { s, X, Y, total, t: [t1, t2, t3, t4, t5, t6] };
  }
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 130, G = geom(W, H), s = G.s, [t1, t2, t3, t4, t5, t6] = G.t;
    g.fillStyle = '#0b0712'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2a1f3a'; g.beginPath(); g.moveTo(8, G.Y(0)); g.lineTo(W - 8, G.Y(0)); g.stroke();
    g.strokeStyle = '#c58bff'; g.lineWidth = 2; g.beginPath(); g.moveTo(G.X(0), G.Y(0)); g.lineTo(G.X(t1), G.Y(0));
    for (let i = 1; i <= 16; i++) { const x = i / 16, c = s.curve, y = c > 0 ? Math.pow(x, 1 + c * 3) : c < 0 ? 1 - Math.pow(1 - x, 1 - c * 3) : x; g.lineTo(G.X(t1 + s.attack * x), G.Y(y)); }
    g.lineTo(G.X(t3), G.Y(1)); g.lineTo(G.X(t4), G.Y(s.sustain)); g.lineTo(G.X(t5), G.Y(s.sustain));
    for (let i = 1; i <= 16; i++) g.lineTo(G.X(t5 + s.release * i / 16), G.Y(s.sustain * Math.exp(-4 * i / 16))); g.stroke();
    g.fillStyle = '#fff'; [[t2, 1], [t4, s.sustain], [t6, 0]].forEach(([t, v]) => { g.beginPath(); g.arc(G.X(t), G.Y(v), 4, 0, 7); g.fill(); });
    if (fired) { const el = (performance.now() - fired.at) / 1000; if (el < t6 + 0.2) { g.fillStyle = '#c58bff'; g.beginPath(); g.arc(G.X(Math.min(el, t6)), 8, 4, 0, 7); g.fill(); } else fired = null; }
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${s.loop ? 'loop · ' : ''}${s.polarity} · depth ${s.depth.toFixed(2)}`, 10, 14);
  }, 30);
  let drag = null;   // drag the attack peak (time), the decay/sustain point (time + level) or the release end (time)
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const r = cv.getBoundingClientRect(), W = r.width, G = geom(W, 130), x = e.clientX - r.left, y = e.clientY - r.top;
    const pts = [['a', G.X(G.t[1]), G.Y(1)], ['d', G.X(G.t[3]), G.Y(G.s.sustain)], ['r', G.X(G.t[5]), G.Y(0)]];
    drag = pts.sort((A, B) => Math.hypot(A[1] - x, A[2] - y) - Math.hypot(B[1] - x, B[2] - y))[0][0]; drag = { k: drag, total: G.total, W }; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return; const r = cv.getBoundingClientRect(), s = view.state, sec = (px) => Math.max(0.001, (px - 8) / (drag.W - 16) * drag.total);
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (drag.k === 'a') view.set('attack', +Math.max(0.001, sec(x) - s.delay).toFixed(3));
    if (drag.k === 'd') { view.set('decay', +Math.max(0.005, sec(x) - s.delay - s.attack - s.hold).toFixed(3)); view.set('sustain', +Math.max(0, Math.min(1, (130 - 10 - y) / 108)).toFixed(2)); }
    if (drag.k === 'r') view.set('release', +Math.max(0.005, sec(x) - (s.delay + s.attack + s.hold + s.decay + 0.6)).toFixed(3));
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
  const fire = UI.Button({ label: '▶ fire', hint: 'run it once (1 s note)', onClick: () => view.emit('audition', { note: 60, duration: 1 }) });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), fire.el]),
    cv, follows,
    UI.paramPanel(view, null, { size: 30 }),
  );
});

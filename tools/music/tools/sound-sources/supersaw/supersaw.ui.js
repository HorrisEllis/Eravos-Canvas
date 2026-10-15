/* eravos.supersaw UI — playable scale keyboard hero, voice strip, drawn/draggable ADSR, panels */
OrganismFactory.reg('eravos.supersaw', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory;
  const kb = UI.Keyboard({ low: 57, high: 81, key: view.key, onDown: (n, v) => view.emit('key_down', { note: n, velocity: v }), onUp: (n) => view.emit('key_up', { note: n }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  const strip = h('div', { style: { display: 'flex', gap: '3px', margin: '6px 0' } });
  const cells = []; for (let i = 0; i < 8; i++) { const c = h('div', { style: { flex: 1, height: '8px', borderRadius: '3px', background: '#1a2533' } }); cells.push(c); strip.appendChild(c); }
  const chordLbl = h('span', { class: 'org-note', text: '' });
  view.on('voices', (v) => { cells.forEach((c, i) => { c.style.background = i < v.active.length ? '#00d4ff' : '#1a2533'; c.style.boxShadow = i < v.active.length ? '0 0 8px #00d4ff' : ''; }); chordLbl.textContent = v.active.length > 1 ? MT.chordName(v.active.slice().sort((a, b) => a - b)) : (v.active.length ? MT.noteName(v.active[0]) : ''); });
  // ADSR editor
  const adsr = UI.Canvas(220, 70); adsr.style.width = '220px'; adsr.style.cursor = 'grab';
  const tMax = 3;
  function pts() { const s = view.state; const W = 220, H = 70; const x = (t) => Math.min(W - 40, t / tMax * (W - 40)); const a = x(s.aA), d = a + x(s.aD); return { a: [a, 6], d: [d, 6 + (1 - s.aS) * (H - 12)], r: [d + 30 + x(s.aR) * 0.3, H - 6], W, H }; }
  UI.loop(adsr, () => {
    const g = adsr.g, p = pts(); g.fillStyle = '#080b10'; g.fillRect(0, 0, p.W, p.H);
    g.strokeStyle = '#00d4ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, p.H - 6); g.lineTo(...p.a); g.lineTo(...p.d); g.lineTo(p.d[0] + 30, p.d[1]); g.lineTo(...p.r); g.stroke();
    g.fillStyle = '#fff'; [p.a, p.d, p.r].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 4, 0, 7); g.fill(); });
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('A', p.a[0] - 3, p.H - 2); g.fillText('D/S', p.d[0] - 6, p.H - 2); g.fillText('R', p.r[0] - 3, p.H - 12);
  }, 20);
  let dragK = null;
  adsr.addEventListener('pointerdown', (e) => { e.stopPropagation(); const r = adsr.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, p = pts(); const d = (q) => Math.hypot(q[0] - x, q[1] - y); dragK = [['a', p.a], ['d', p.d], ['r', p.r]].sort((A, B) => d(A[1]) - d(B[1]))[0][0]; adsr.setPointerCapture(e.pointerId); });
  adsr.addEventListener('pointermove', (e) => {
    if (!dragK) return; const r = adsr.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = view.state; const sec = (px) => Math.max(0.001, px / 180 * tMax);
    if (dragK === 'a') view.set('aA', +sec(x).toFixed(3));
    if (dragK === 'd') { view.set('aD', +Math.max(0.01, sec(x) - s.aA).toFixed(3)); view.set('aS', +Math.max(0, Math.min(1, 1 - (y - 6) / 58)).toFixed(2)); }
    if (dragK === 'r') view.set('aR', +Math.max(0.01, (x - pts().d[0] - 30) / 0.3 / 180 * tMax).toFixed(2));
  });
  ['pointerup', 'pointercancel'].forEach(t => adsr.addEventListener(t, () => { dragK = null; }));
  // QWERTY A..K = scale degrees 1..8 while focused
  let focused = false; view.observe('canvas:focus', (p) => { focused = p.instanceId === view.instanceId; });
  const KEYS = 'asdfghjk'; const down = new Set();
  const kd = (e) => { if (!focused || e.repeat || e.metaKey || e.ctrlKey) return; const i = KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return; const k = view.key; const n = MT.degreeToMidi(i + 1, 4, k.root, k.scale) + 12 * (view.state.octave || 0) * 0; down.add(n); view.emit('key_down', { note: n, velocity: 0.85 }); kb.mark(n, true); e.preventDefault(); };
  const ku = (e) => { const i = KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return; const k = view.key; const n = MT.degreeToMidi(i + 1, 4, k.root, k.scale); if (down.delete(n)) { view.emit('key_up', { note: n }); kb.mark(n, false); } };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  view.onDispose(() => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); });
  const chord = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'chordMode'), { segMax: 6 });
  // 3.27 — the sound, drawn: live spectrum with the filter's cutoff (+ how far the envelope opens it), and the unison fan
  const an = view.tap('out', 4096);
  const spec = view.ui.Spectrum(an, { width: 360, height: 96, color: '#00d4ff', overlay(g, W, H) {
    const s = view.state, X = (f) => Math.log(Math.max(20, f) / 20) / Math.log(1000) * W;
    const c = X(s.cutoff), o = X(Math.min(20000, s.cutoff * Math.pow(2, s.fEnv || 0)));
    g.fillStyle = 'rgba(0,212,255,.10)'; g.fillRect(c, 0, Math.max(0, o - c), H);
    g.fillStyle = '#00d4ff'; g.fillRect(c - 1, 0, 2, H);
    g.font = '10px monospace'; g.fillStyle = '#9fd8ff'; g.fillText('cutoff ' + (s.cutoff >= 1000 ? (s.cutoff / 1000).toFixed(1) + 'k' : Math.round(s.cutoff)), Math.min(W - 70, c + 4), 12);
    if (s.fEnv > 0.05) g.fillText('+env', Math.min(W - 30, o + 3), 24);
  } });
  const fan = UI.Canvas(150, 96); fan.style.width = '150px'; fan.style.flex = 'none';
  UI.loop(fan, () => {
    const g = fan.g, W = 150, H = 96, s = view.state, n = s.unison || 1;
    g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1a2533'; g.beginPath(); g.moveTo(W / 2, 4); g.lineTo(W / 2, H - 14); g.stroke();
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('L', 4, H - 3); g.fillText('R', W - 10, H - 3); g.fillText(n + ' voices', W / 2 - 22, H - 3);
    const t = performance.now() / 1000;
    for (let i = 0; i < n; i++) {
      const x0 = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;                       // −1..1
      const x = W / 2 + x0 * (s.spread || 0) * (W / 2 - 10);
      const det = x0 * (s.detune || 0);                                      // relative detune
      const y = (H - 14) / 2 - det * ((H - 24) / 2) + Math.sin(t * (1 + Math.abs(det) * 6) + i) * 2;
      const a = i === Math.floor(n / 2) ? 1 : 0.35 + 0.65 * (s.mix || 0);
      g.fillStyle = `rgba(0,212,255,${a.toFixed(2)})`; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    }
  }, 30);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [chord.el, chordLbl])]),
    kb.el, strip,
    h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '8px', alignItems: 'start' } }, [
      h('div', { style: { display: 'flex', gap: '8px', minWidth: 0 } }, [h('div', { style: { flex: 1, minWidth: 0 } }, [spec]), fan]),
      h('div', { class: 'uk-group', style: { margin: 0 } }, [h('div', { class: 'uk-group-title', text: 'AMP — drag the dots' }), adsr]),
    ]),
    UI.paramPanel(view, ['unison', 'detune', 'mix', 'spread', 'cutoff', 'res', 'fEnv', 'fA', 'fD', 'fS', 'fR', 'aA', 'aD', 'aS', 'aR', 'octave', 'level'], { size: 32 }),
    UI.hint('Keys A S D F G H J K play scale degrees 1–8 while this window is focused. Everything snaps to the song key.'),
  );
});

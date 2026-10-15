/* eravos.organ UI — nine console drawbars (brown 16'/5⅓', white, black) you pull down, a breathing cathedral window
 * that swells with the breath cycle, gothic toggles, keyboard. */
OrganismFactory.reg('eravos.organ', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const FEET = ["16'", "5⅓'", "8'", "4'", "2⅔'", "2'", "1⅗'", "1⅓'", "1'"], COL = ['#7a4a2a', '#7a4a2a', '#e8e0d0', '#e8e0d0', '#222', '#e8e0d0', '#222', '#222', '#e8e0d0'];
  const bars = h('div', { class: 'drawbars' });
  FEET.forEach((f, i) => {
    const slot = h('div', { class: 'slot' }), bar = h('div', { class: 'bar', style: { background: `linear-gradient(${COL[i]}, ${COL[i]}cc)` } }); slot.appendChild(bar);
    const num = h('small', { text: '0' });
    const set = (e) => { const r = slot.getBoundingClientRect(); view.set('d' + i, Math.max(0, Math.min(8, Math.round((e.clientY - r.top) / r.height * 8)))); };
    let d = false; slot.addEventListener('pointerdown', (e) => { e.stopPropagation(); d = true; slot.setPointerCapture(e.pointerId); set(e); }); slot.addEventListener('pointermove', (e) => { if (d) set(e); }); ['pointerup', 'pointercancel'].forEach(t => slot.addEventListener(t, () => { d = false; }));
    view.bind('d' + i, (v) => { bar.style.height = (14 + v / 8 * 136) + 'px'; num.textContent = v; });
    bars.appendChild(h('div', { class: 'drawbar' }, [slot, num, h('small', { text: f })]));
  });
  const win = UI.Canvas(150, 186); const t0 = performance.now();
  UI.loop(win, () => {
    const g = win.g; win.fit(); const W = win.W, H = 186, s = view.state, ph = ((performance.now() - t0) / 1000 / (s.breathPeriod || 10)) % 1, b = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2), lv = 1 - (s.breathDepth || 0) * (1 - b);
    g.fillStyle = '#07050a'; g.fillRect(0, 0, W, H);
    const cx = W / 2, top = 22, bw = W - 40; g.save(); g.beginPath(); g.moveTo(cx - bw / 2, H - 10); g.lineTo(cx - bw / 2, top + bw / 2); g.arc(cx, top + bw / 2, bw / 2, Math.PI, 0); g.lineTo(cx + bw / 2, H - 10); g.closePath(); g.clip();
    const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, `rgba(138,43,226,${0.25 + 0.55 * lv})`); gr.addColorStop(1, `rgba(40,0,60,${0.3 + 0.4 * lv})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 3; for (let x = cx - bw / 2; x <= cx + bw / 2; x += bw / 4) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, H); g.stroke(); } for (let y = top + bw / 2; y < H; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.restore(); g.fillStyle = '#c9a8f0'; g.font = '10px monospace'; g.textAlign = 'center'; g.fillText(`breath ${(s.breathPeriod || 10).toFixed(1)} s`, cx, 12); g.textAlign = 'left';
  }, 30);
  UI.instrumentPanel(view, { color: '#8a2be2', low: 36, high: 72, height: 60,
    header: [UI.paramControl(view, cfg('rotorSpeed')).el, UI.paramControl(view, cfg('chord')).el, UI.paramControl(view, cfg('pedal')).el],
    top: [h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 150px', gap: '8px' } }, [bars, win])],
    keys: ['pipe', 'perc', 'percHarm', 'drive', 'ampTone', 'rotary', 'pulse', 'pulseRate', 'pulseShape', 'celeste', 'chiff', 'wind', 'reed', 'tremRate', 'tremDepth', 'breathPeriod', 'breathDepth', 'scrape', 'space', 'dark', 'attack', 'release', 'level'],
    hint: 'Rotor slow/fast spins the speaker up or down like the real thing. Pulse throbs locked to the beat; Amp drive pushes it through a tube amp. Pull the drawbars down to open each rank. Celeste detunes alternate ranks (the haunted beating); Breath swells the whole organ slowly; Gothic chord turns every key into a detuned minor triad.' });
});

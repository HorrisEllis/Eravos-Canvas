/* eravos.edm-lab UI — RHYTHM density canvas (brush), BASS note ribbon, TENSION wheel, ENERGY / DROP / PRINT */
OrganismFactory.reg('eravos.edm-lab', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let map = null, rows = [], cursor = -1, flash = {}, notes = [], chord = null, dropArmed = false, seqs = [];
  const brush = { size: 1, strength: 1, erase: false };
  const cv = UI.Canvas(460, 200); cv.style.cursor = 'crosshair';
  const COL = ['#ff2266', '#ffaa00', '#b87a00', '#ffdd00', '#ddff44', '#ff66aa', '#00ff88', '#ccff99'];
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 200, rh = H / 8, cw = (W - 50) / 32; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!map) return;
    rows.forEach((r, i) => {
      g.fillStyle = COL[i]; g.font = '9px monospace'; g.fillText(r, 2, i * rh + rh / 2 + 3);
      for (let s = 0; s < 32; s++) {
        const v = map[i][s], x = 50 + s * cw, y = i * rh;
        g.fillStyle = s % 4 === 0 ? '#141c27' : '#10161f'; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        if (v > 0) { g.fillStyle = COL[i]; g.globalAlpha = 0.2 + 0.8 * v; g.fillRect(x + 1, y + 1 + (1 - v) * (rh - 2), cw - 2, v * (rh - 2)); g.globalAlpha = 1; }
        const f = flash[i + ':' + s]; if (f && performance.now() - f < 140) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, cw - 2, rh - 2); }
      }
    });
    if (cursor >= 0) { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(50 + cursor * cw, 0, cw, H); }
  }, 30);
  let painting = false;
  const at = (e) => { const r = cv.getBoundingClientRect(), W = r.width, cw = (W - 50) / 32; return { row: Math.max(0, Math.min(7, Math.floor((e.clientY - r.top) / (r.height / 8)))), step: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left - 50) / cw))) }; };
  const paint = (e) => { const p = at(e); view.emit('paint', { row: p.row, step: p.step, radius: brush.size - 1, value: brush.erase || e.button === 2 ? 0 : brush.strength }); };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); painting = true; cv.setPointerCapture(e.pointerId); paint(e); });
  cv.addEventListener('pointermove', (e) => { if (painting) paint(e); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { painting = false; }));
  view.on('map', (m) => { map = m.map; });
  view.on('hits', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; const n = performance.now(); x.rows.forEach((on, i) => { if (on) flash[i + ':' + x.step] = n; }); }));
  // bass ribbon
  const rib = UI.Canvas(260, 90);
  view.on('bass_note', (n) => UI.atTime(view.ac, n.time, () => { notes.push({ midi: n.midi, name: n.name, t: performance.now() }); if (notes.length > 40) notes.shift(); }));
  UI.loop(rib, () => { const g = rib.g, W = rib.fit().W, H = 90, now = performance.now(); g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H); notes.forEach(n => { const x = W - (now - n.t) / 20; if (x < -30) return; const y = H - ((n.midi - 24) / 36) * H; g.fillStyle = '#ff2266'; g.fillRect(x, y - 4, 26, 8); g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText(n.name, x + 2, y - 6); }); g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('BASS — notes actually played', 4, 11); }, 30);
  // tension wheel
  const wheel = UI.Canvas(170, 170); wheel.style.width = '170px';
  view.on('chord', (c) => UI.atTime(view.ac, c.time, () => { chord = c; }));
  UI.loop(wheel, () => {
    const g = wheel.g, cx = 85, cy = 85; g.clearRect(0, 0, 170, 170);
    const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    g.strokeStyle = '#223044'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 60, 0, 7); g.stroke();
    order.forEach((pc, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2; const on = chord && chord.notes.some(n => n % 12 === pc); g.fillStyle = on ? '#ff2266' : '#1a2533'; g.beginPath(); g.arc(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, on ? 8 : 5, 0, 7); g.fill(); g.fillStyle = '#7f93a8'; g.font = '8px monospace'; g.textAlign = 'center'; g.fillText(MT.NAMES[pc], cx + Math.cos(a) * 76, cy + Math.sin(a) * 76 + 3); });
    const t = view.state.tension || 0; g.strokeStyle = '#ff2266'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; g.font = '700 14px sans-serif'; g.textAlign = 'center'; g.fillText(chord ? chord.name : '—', cx, cy + 4); g.font = '9px monospace'; g.fillStyle = '#7f93a8'; g.fillText('TENSION ' + t.toFixed(2), cx, cy + 18);
  }, 20);
  let drag = null;
  wheel.addEventListener('pointerdown', (e) => { e.stopPropagation(); drag = { y: e.clientY, v: view.state.tension }; wheel.setPointerCapture(e.pointerId); });
  wheel.addEventListener('pointermove', (e) => { if (drag) view.set('tension', Math.max(0, Math.min(1, +(drag.v + (drag.y - e.clientY) / 150).toFixed(3)))); });
  ['pointerup', 'pointercancel'].forEach(t => wheel.addEventListener(t, () => { drag = null; }));
  // bottom
  const energy = UI.Fader(Object.assign({}, cfg('energy'), { value: view.state.energy, height: 90, onChange: (v) => view.set('energy', v) })); view.bind('energy', v => energy.set(v));
  const dropB = UI.Button({ label: 'DROP', kind: 'danger big', hint: 'next bar: filtered build with a silent last beat, then the impact', onClick: () => view.emit('drop_arm', {}) });
  view.on('drop', (d) => { if (d.armed !== undefined) { dropArmed = d.armed; dropB.el.style.animation = d.armed ? 'pulse .5s infinite' : ''; } if (d.time) dropB.el.style.animation = ''; });
  const tgt = UI.Select({ options: [] }); const refresh = () => tgt.setOptions(seqs.length ? seqs : [{ value: '', label: 'add a Sequencer first' }]);
  view.on('state_sync', (s) => { if (s.map) map = s.map; if (s.rows) rows = s.rows; if (s.sequencers) { seqs = s.sequencers; refresh(); } });
  const printB = UI.Button({ label: 'PRINT → sequencer', kind: 'primary', hint: 'bake this groove (current seed) into real sequencer lanes', onClick: () => { if (tgt.select.value) view.emit('print', { target: tgt.select.value }); } });
  const brushSize = UI.Segmented({ label: '', hint: 'brush size', options: [{ value: 1, label: '•', hint: 'small brush' }, { value: 2, label: '●', hint: 'medium brush' }, { value: 4, label: '⬤', hint: 'large brush' }], value: 1, onChange: (v) => { brush.size = v; } });
  const brushStr = UI.Knob({ label: 'Strength', min: 0.1, max: 1, step: 0.05, value: 1, default: 1, size: 26, onChange: (v) => { brush.strength = v; } });
  const erase = UI.Toggle({ label: 'Erase', onChange: (v) => { brush.erase = v; } });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [brushSize.el, brushStr.el, erase.el, UI.Button({ label: 'Clear', onClick: () => view.emit('clear', {}) }).el, UI.Button({ label: '🎲 Reseed', onClick: () => view.emit('reseed', {}) }).el])]),
    h('div', { style: { display: 'flex', gap: '8px' } }, [h('div', { style: { flex: '1' } }, [cv, h('div', { style: { height: '6px' } }), rib]), h('div', { class: 'org-col', style: { alignItems: 'center' } }, [wheel, UI.paramControl(view, cfg('progression')).el])]),
    h('div', { class: 'org-row', style: { marginTop: '6px', alignItems: 'flex-end' } }, [energy.el, dropB.el, tgt.el, printB.el, UI.paramPanel(view, ['swing', 'chordBars', 'rhythmLevel', 'bassLevel', 'harmonyLevel'], { flat: true, noTitles: true, size: 28 })]),
    UI.hint('Paint where the drums are busy (right-click erases). The bass follows the kick, the chords follow TENSION. Everything is in the song key.'),
  );
});

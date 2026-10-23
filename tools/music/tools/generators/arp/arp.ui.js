/* eravos.arp UI 2.0 — the note it is on, the STEP LANE (drag a step: its level, 0 = a rest · top cell: its octave, click up /
 * right-click down · bottom cell: slide on/off · the step playing lights up), lane shapes, every control grouped side by side
 * (wide, not tall), and a keyboard to hold notes by hand. */
OrganismFactory.reg('eravos.arp', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory, ACC = '#00d4ff';
  let lane = null, shapes = [], cur = -1, curAt = 0;
  const now = h('div', { class: 'cg-now', text: '—' }), sub = h('div', { class: 'cg-notes', text: 'hold notes, or wire in a Chords' });
  view.on('step', (s) => UI.atTime(view.ac, s.time, () => { now.textContent = MT.noteName(s.note); cur = s.lane; curAt = performance.now(); }));
  view.on('state_sync', (s) => { if (s.lane) lane = s.lane; if (s.shapes && s.shapes.join() !== shapes.join()) { shapes = s.shapes; drawShapes(); } if (s.holding) sub.textContent = s.holding.length ? 'holding ' + s.holding.map(n => MT.noteName(n)).join(' ') : 'hold notes, or wire in a Chords'; });
  // ---- the step lane
  const H = 120, OCT = 16, SL = 14, cv = UI.Canvas(700, H); cv.style.cursor = 'ns-resize'; cv.setAttribute('aria-label', 'step lane: drag a step for its level, top cell its octave, bottom cell slide');
  const steps = () => view.state.steps || 16, colW = (W) => W / steps();
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, n = steps(), cw = colW(W); g.fillStyle = '#071018'; g.fillRect(0, 0, W, H); if (!lane) return;
    for (let i = 0; i < n; i++) {
      const x = i * cw, v = lane.vel[i], o = lane.oct[i], on = i === cur && performance.now() - curAt < 260, body = H - OCT - SL - 4;
      g.fillStyle = i % 4 === 0 ? '#0f1b26' : '#0b141d'; g.fillRect(x + 1, OCT + 1, cw - 2, body);
      g.fillStyle = v > 0 ? (on ? '#ffffff' : ACC) : '#1d2a36'; g.globalAlpha = v > 0 ? 0.35 + 0.65 * v : 1; const bh = Math.max(2, v * (body - 2)); g.fillRect(x + 2, OCT + body - bh, cw - 4, bh); g.globalAlpha = 1;
      if (v <= 0) { g.fillStyle = '#3b4c5e'; g.font = '9px monospace'; g.textAlign = 'center'; g.fillText('rest', x + cw / 2, OCT + body / 2); }
      g.fillStyle = o ? (o > 0 ? '#ffd24a' : '#b066ff') : '#122030'; g.fillRect(x + 1, 0, cw - 2, OCT - 1); g.fillStyle = o ? '#000' : '#4d6075'; g.font = '9px monospace'; g.textAlign = 'center'; g.fillText(o ? (o > 0 ? '+' : '') + o : '·', x + cw / 2, OCT - 4);
      g.fillStyle = lane.slide[i] ? '#ff66cc' : '#122030'; g.fillRect(x + 1, H - SL, cw - 2, SL - 1); if (lane.slide[i]) { g.fillStyle = '#000'; g.fillText('~', x + cw / 2, H - 3); }
      if (on) { g.strokeStyle = '#fff'; g.strokeRect(x + 1.5, 0.5, cw - 3, H - 1); }
    }
    g.textAlign = 'left';
  }, 30);
  const at = (e) => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (cv.offsetWidth / r.width), y = (e.clientY - r.top) * (cv.offsetHeight / r.height); return { i: Math.max(0, Math.min(steps() - 1, Math.floor(x / colW(cv.offsetWidth)))), y }; };
  let drag = null;
  const send = () => view.emit('lane_edit', { lane });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); if (!lane) return; const p = at(e);
    if (p.y < OCT) { lane.oct[p.i] = Math.max(-2, Math.min(2, lane.oct[p.i] + (e.button === 2 ? -1 : 1))); send(); return; }
    if (p.y > H - SL) { lane.slide[p.i] = !lane.slide[p.i]; send(); return; }
    drag = { last: p.i }; cv.setPointerCapture(e.pointerId); level(e);
  });
  const level = (e) => { const p = at(e), body = H - OCT - SL - 4, v = Math.max(0, Math.min(1, 1 - (p.y - OCT) / body)); lane.vel[p.i] = v < 0.06 ? 0 : +v.toFixed(2); drag.last = p.i; };
  cv.addEventListener('pointermove', (e) => { if (drag) level(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, () => { if (drag) { drag = null; send(); } }));
  const shapeRow = h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '4px', margin: '4px 0 0' } });
  const NAMES = { all: 'All on', offbeats: 'Offbeats', gallop: 'Gallop', accents: 'Accents', trance: 'Trance gate', ramp: 'Ramp', octaves: 'Octave jumps', flat: 'No octaves / slides', random: '🎲 Random' };
  function drawShapes() { shapeRow.innerHTML = ''; shapes.forEach(sh => shapeRow.appendChild(UI.Button({ label: NAMES[sh] || sh, onClick: () => view.emit('lane_shape', { shape: sh }) }).el)); }
  // ---- the controls, grouped side by side
  const card = (title, keys) => h('div', { class: 'arp-card', style: { breakInside: 'avoid', marginBottom: '8px', background: '#0a121b', border: '1px solid #1c2c3c', borderRadius: '8px', padding: '6px 8px' } },
    [h('div', { class: 'uk-group-title', text: title }), UI.paramPanel(view, keys, { flat: true, noTitles: true, size: 30 })]);
  const cards = h('div', { class: 'arp-cards', style: { columnWidth: '230px', columnGap: '8px', marginTop: '6px' } }, [
    card('PATTERN', ['order', 'div', 'octaves', 'octDir', 'repeat', 'length', 'restart', 'latch']),
    card('FEEL', ['swing', 'chance', 'gate', 'gateRand', 'humanize', 'slide']),
    card('PLAY', ['velocity', 'velRand', 'velRamp', 'transpose', 'stack', 'seed']),
  ]);
  // the keyboard holds notes in the arp (it grows with the window, P48.7)
  const kb = UI.Keyboard({ low: 48, high: 72, key: view.key, lock: false, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'cg-box', style: { margin: 0 } }, [now, sub])]),
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', alignItems: 'flex-end', margin: '4px 0 2px' } }, [h('div', { class: 'uk-group-title', text: 'STEPS — drag: level (bottom = rest) · top: octave (right-click down) · bottom: slide' }), UI.paramControl(view, view.descriptor.config.find(c => c.key === 'steps'), { size: 26 }).el]),
    cv, shapeRow, cards, kb.el,
    UI.hint('Wire its note out into any instrument. Notes in hold it; a Chords wired to its chord in feeds it the chord. Press play: it steps on the beat.'),
  );
});

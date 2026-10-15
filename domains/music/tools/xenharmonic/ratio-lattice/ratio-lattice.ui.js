/* eravos.ratio-lattice UI — clickable 3×5 lattice on the chosen Z layer, chord readout (otonal form, cents,
 * 12-TET offsets), pair beat table, dissonance meter, send / export buttons, target picker. */
OrganismFactory.reg('eravos.ratio-lattice', function (view) {
  const UI = view.ui, h = UI.h, XT = window.XenTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let st = { nodes: [], chord: [], pairs: [], otonal: '', dissonance: 0 };
  const A = [-4, 4], B = [-3, 3];
  const cv = UI.Canvas(600, 300); cv.style.cursor = 'pointer';
  const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  function ratioOf(a, b, c) {
    const z = Number(view.state.primeZ) || 7; let num = 1, den = 1;
    [[3, a], [5, b], [z, c]].forEach(([p, e]) => { if (e > 0) num *= Math.pow(p, e); else if (e < 0) den *= Math.pow(p, -e); });
    while (num / den >= 2) den *= 2; while (num / den < 1) num *= 2; const g = gcd(num, den); return { p: num / g, q: den / g, r: num / den };
  }
  const geo = () => { const W = cv.W, H = 300, cols = A[1] - A[0] + 1, rows = B[1] - B[0] + 1; return { W, H, dx: (W - 40) / (cols - 1), dy: (H - 40) / (rows - 1) }; };
  const pos = (a, b) => { const g = geo(); return { x: 20 + (a - A[0]) * g.dx + (b * g.dx * 0.18), y: 20 + (B[1] - b) * g.dy }; };
  const isOn = (a, b, c) => st.nodes.some(n => n[0] === a && n[1] === b && n[2] === c);
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 300, layer = view.state.layer | 0;
    g.fillStyle = '#05090c'; g.fillRect(0, 0, W, H);
    // edges between neighbours (3 → horizontal, 5 → vertical)
    for (let a = A[0]; a <= A[1]; a++) for (let b = B[0]; b <= B[1]; b++) {
      const p = pos(a, b);
      [[1, 0], [0, 1]].forEach(([da, db]) => { if (a + da > A[1] || b + db > B[1]) return; const q = pos(a + da, b + db); const both = isOn(a, b, layer) && isOn(a + da, b + db, layer); g.strokeStyle = both ? '#00ffcc' : '#132028'; g.lineWidth = both ? 3 : 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); });
    }
    g.lineWidth = 1; g.textAlign = 'center';
    for (let a = A[0]; a <= A[1]; a++) for (let b = B[0]; b <= B[1]; b++) {
      const p = pos(a, b), r = ratioOf(a, b, layer), on = isOn(a, b, layer), other = !on && st.nodes.some(n => n[0] === a && n[1] === b);
      const simple = Math.log2(r.p * r.q);
      g.fillStyle = on ? '#00ffcc' : '#0d1a1f'; g.strokeStyle = on ? '#00ffcc' : other ? '#ff44cc' : simple < 6 ? '#2b5560' : '#1a2c33';
      g.beginPath(); g.arc(p.x, p.y, 17, 0, 7); g.fill(); g.lineWidth = other ? 2 : 1; g.stroke();
      g.fillStyle = on ? '#00241c' : '#9fc7cf'; g.font = (r.p + r.q > 999 ? '8px' : '10px') + ' monospace';
      g.fillText(r.p + '/' + r.q, p.x, p.y + 1);
      g.fillStyle = on ? '#00241c' : '#4f6d75'; g.font = '8px monospace'; g.fillText(XT.cents(r.r).toFixed(0), p.x, p.y + 11);
    }
    g.textAlign = 'left'; g.fillStyle = '#4a5b6e'; g.font = '9px monospace';
    g.fillText('→ ×3 (fifths)   ↑ ×5 (thirds)   layer ×' + view.state.primeZ + '^' + layer + '   magenta ring = active on another layer', 8, H - 4);
  }, 20);
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let a = A[0]; a <= A[1]; a++) for (let b = B[0]; b <= B[1]; b++) { const p = pos(a, b); if (Math.hypot(p.x - x, p.y - y) < 18) { view.emit('node_toggle', { a, b, c: view.state.layer | 0 }); return; } }
  });
  const layerSeg = UI.Segmented({ options: [-2, -1, 0, 1, 2], value: view.state.layer, onChange: (v) => view.set('layer', v) }); view.bind('layer', v => layerSeg.set(v));
  const zSel = UI.paramControl(view, cfg('primeZ'));
  const tim = UI.paramControl(view, cfg('timbre'));
  const readout = h('div', { class: 'uk-hint', style: { fontSize: '11.5px', lineHeight: '1.5' } });
  const table = h('div', { class: 'org-scroll', style: { maxHeight: '120px' } });
  const meter = UI.Canvas(160, 14);
  UI.loop(meter, () => { const g = meter.g; meter.fit(); const W = meter.W; g.fillStyle = '#0b1118'; g.fillRect(0, 0, W, 14); const v = Math.min(1, st.dissonance / 1.2); const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#00ffcc'); gr.addColorStop(0.6, '#ffaa00'); gr.addColorStop(1, '#ff2266'); g.fillStyle = gr; g.fillRect(0, 2, v * W, 10); }, 10);
  const targetSel = UI.Select({ options: [{ value: '', label: '— no instrument —' }], onChange: (v) => view.set('sendTo', v) });
  function refreshTargets() { targetSel.setOptions([{ value: '', label: '— no instrument —' }].concat(view.targets('capability.note_in'))); targetSel.set(view.state.sendTo || ''); }
  view.observe('kernel:organism', refreshTargets); view.observe('factory:spawned', refreshTargets); refreshTargets();
  view.bind('sendTo', (v) => targetSel.set(v || ''));
  view.on('state_sync', (s) => {
    if (!s.chord) return; st = s;
    readout.innerHTML = '';
    if (!s.chord.length) { readout.textContent = 'Click nodes to build a chord. 1/1 is the centre; right = a pure fifth up, up = a pure major third.'; table.innerHTML = ''; return; }
    readout.append(h('b', { text: 'Harmonic series  ' + s.otonal, style: { color: '#00ffcc', fontSize: '13px' } }), h('br'),
      s.chord.map(c => `${c.p}/${c.q}${c.name ? ' (' + c.name + ')' : ''} ${c.cents.toFixed(1)}¢ ${c.et >= 0 ? '+' : ''}${c.et.toFixed(1)}¢ vs piano`).join('  ·  '));
    table.innerHTML = '';
    const t = h('table', { class: 'org-table' }, [h('tr', {}, ['pair', 'slowest beat', 'between harmonics'].map(x => h('th', { text: x })))]);
    s.pairs.forEach(p => t.appendChild(h('tr', {}, [h('td', { text: p.a + ' – ' + p.b }), h('td', { text: p.beat === null ? 'none (locked)' : p.beat + ' Hz' }), h('td', { text: p.at })])));
    table.appendChild(t);
  });
  // 3.28: the drone's play/stop, up front (Stop / Stop all switch it off)
  const droneBtn = UI.Button({ label: '▶ Drone', hint: 'start / stop the drone', onClick: () => view.emit('config_change', { key: 'drone', value: !view.state.drone }) });
  view.bind('drone', (on) => { droneBtn.set(on ? '■ Stop drone' : '▶ Drone'); droneBtn.el.classList.toggle('primary', !on); });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), droneBtn.el, h('div', { class: 'org-row', style: { gap: '6px' } }, [h('span', { class: 'org-label', text: 'LAYER' }), layerSeg.el, zSel.el])]),
    cv, readout,
    h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center' } }, [h('span', { class: 'org-label', text: 'DISSONANCE' }), meter]),
    table,
    h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap', marginTop: '6px' } }, [
      UI.Button({ label: 'Clear', onClick: () => view.emit('clear') }).el,
      h('span', { class: 'org-label', text: 'SEND TO' }), targetSel.el,
      UI.Button({ label: '♪ Send chord', hint: 'play the chord on the chosen instrument with exact frequencies', onClick: () => view.emit('send_chord') }).el,
      UI.Button({ label: '⇢ Export as scale', hint: 'send the chord as a tuning (xen:tuning) — Xen Synth adopts it', onClick: () => view.emit('export_scale') }).el,
      tim.el,
    ]),
    UI.paramPanel(view, ['baseHz', 'fade', 'level', 'drone', 'arp', 'arpDiv', 'arpOrder', 'noteDur'], { size: 28 }),
    UI.hint('Beats slower than ~1 Hz feel like a gentle wobble; 81:80 (four fifths vs one third) is the comma 12-TET hides. Prime 7 gives blues sevenths, 11 neutral “in-between” notes, 13 the strange ones.'),
  );
});

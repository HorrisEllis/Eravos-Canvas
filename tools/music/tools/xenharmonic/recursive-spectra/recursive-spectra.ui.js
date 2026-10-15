/* eravos.recursive-spectra UI — the lineage as a waterfall: one row per generation (log-ratio x, dot size = amplitude),
 * threads joining partial k across generations, the sounding generation lit; click a row to jump there. */
OrganismFactory.reg('eravos.recursive-spectra', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let lin = [], gen = 0, ceiling = 12, live = null;
  const cv = UI.Canvas(560, 260); cv.style.cursor = 'pointer';
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 260; g.fillStyle = '#04080a'; g.fillRect(0, 0, W, H);
    if (!lin.length) return;
    const L = Math.log2(Math.max(2, ceiling * 1.05)), rows = lin.length, rh = (H - 22) / rows;
    const X = (r) => 30 + Math.log2(Math.max(1e-3, r)) / L * (W - 40);
    for (let o = 0; o <= L; o++) { g.strokeStyle = '#0f1d1a'; g.beginPath(); g.moveTo(X(Math.pow(2, o)), 0); g.lineTo(X(Math.pow(2, o)), H - 18); g.stroke(); g.fillStyle = '#3d5a52'; g.font = '9px monospace'; g.fillText(Math.pow(2, o) + '×', X(Math.pow(2, o)) + 2, H - 6); }
    // threads
    const maxP = Math.max(...lin.map(s => s.length));
    for (let k = 0; k < maxP; k++) { g.strokeStyle = 'rgba(124,255,178,.13)'; g.beginPath(); lin.forEach((sp, i) => { const x = sp[k]; if (!x) return; const xx = X(x[0]), yy = 8 + i * rh + rh / 2; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }); g.stroke(); }
    lin.forEach((sp, i) => {
      const y = 8 + i * rh + rh / 2, cur = i === Math.min(gen, rows - 1);
      if (cur) { g.fillStyle = 'rgba(124,255,178,.08)'; g.fillRect(0, y - rh / 2, W, rh); }
      g.fillStyle = cur ? '#7cffb2' : '#3f6b5c'; g.font = '9px monospace'; g.fillText(String(i), 6, y + 3);
      sp.forEach(([r, a]) => { g.fillStyle = cur ? '#7cffb2' : 'rgba(124,255,178,.55)'; g.beginPath(); g.arc(X(r), y, 1.5 + a * Math.min(6, rh / 2.4), 0, 7); g.fill(); });
    });
    if (gen >= rows && live) { g.fillStyle = '#ffaa00'; g.font = '10px monospace'; g.fillText('free-running past depth — generation ' + gen, 30, H - 6); }
  }, 20);
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!lin.length) return; const r = cv.getBoundingClientRect(); const i = Math.floor((e.clientY - r.top - 8) / ((260 - 22) / lin.length)); if (i >= 0 && i < lin.length) view.emit('goto', { gen: i }); });
  const now = h('div', { class: 'uk-hint' });
  function describe(sp) { if (!sp) return; now.textContent = 'sounding: ' + sp.slice(0, 10).map(x => (x.r !== undefined ? x.r : x[0]).toFixed(3)).join('  ') + (sp.length > 10 ? ' …' : ''); }
  view.on('state_sync', (s) => { if (s.lineage) { lin = s.lineage; gen = s.gen; ceiling = s.ceiling; describe(lin[Math.min(gen, lin.length - 1)]); } });
  view.on('gen', (p) => { gen = p.gen; live = p.spectrum; describe(p.spectrum); });
  const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 0 });
  // 3.28: the drone's play/stop, up front (Stop / Stop all switch it off)
  const droneBtn = UI.Button({ label: '▶ Drone', hint: 'start / stop the drone', onClick: () => view.emit('config_change', { key: 'drone', value: !view.state.drone }) });
  view.bind('drone', (on) => { droneBtn.set(on ? '■ Stop drone' : '▶ Drone'); droneBtn.el.classList.toggle('primary', !on); });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), droneBtn.el, sel('seed').el, sel('transform').el, sel('loop').el]),
    cv, now,
    h('div', { class: 'org-row', style: { gap: '6px', margin: '4px 0', flexWrap: 'wrap' } }, [
      UI.Button({ label: '⇢ Send spectrum', hint: 'this generation → Xen Synth / anything taking xen:spectrum', onClick: () => view.emit('send_spectrum') }).el,
      UI.Button({ label: '⇢ Scale from timbre', hint: 'minima of this generation’s dissonance curve → xen:tuning (Sethares)', onClick: () => view.emit('send_scale') }).el,
      sel('rate').el,
    ]),
    UI.paramPanel(view, ['amount', 'depth', 'partials', 'ceiling', 'seconds', 'morph', 'baseHz', 'drone', 'level', 'attack', 'release', 'autoSend'], { size: 28 }),
    UI.hint('Each row is one generation: the seed at the top, every row below is the transform applied to the row above. Ping-pong walks down and back up the lineage; free keeps inventing new generations forever.'),
  );
});

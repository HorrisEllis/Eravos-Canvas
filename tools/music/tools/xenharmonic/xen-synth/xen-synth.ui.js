/* eravos.xen-synth UI — tuning wheel (steps on a circle, 12-TET ghost ticks, deviation colours), playable step strip,
 * partial spectrum (log-ratio bars, irrational partials marked), keyboard mapped key → step. */
OrganismFactory.reg('eravos.xen-synth', function (view) {
  const UI = view.ui, h = UI.h, XT = window.XenTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let tun = null, spec = [];
  const tuningSel = UI.paramControl(view, cfg('tuning'), { segMax: 0 });
  const nK = UI.paramControl(view, cfg('n'), { size: 30 });
  const genSel = UI.paramControl(view, cfg('generator'), { segMax: 0 });
  const perSel = UI.paramControl(view, cfg('period'), { segMax: 0 });
  const txt = UI.paramControl(view, cfg('scaleText'));
  const specSel = UI.paramControl(view, cfg('spectrum'), { segMax: 0 });
  const describe = h('div', { class: 'uk-hint', style: { minHeight: '28px' } });
  const recv = h('div', { class: 'uk-hint', style: { color: '#00ffcc' } });
  const paramRow = h('div', { class: 'org-row', style: { gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' } }, [nK.el, genSel.el, perSel.el]);
  const txtRow = h('div', { class: 'org-row' }, [txt.el]);
  txt.el.style.flex = '1'; const ti = txt.el.querySelector('input'); if (ti) ti.style.width = '100%';

  // ---- tuning wheel
  const wheel = UI.Canvas(230, 230);
  UI.loop(wheel, () => {
    const g = wheel.g, W = wheel.fit().W, H = 230, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 22;
    g.fillStyle = '#060a0e'; g.fillRect(0, 0, W, H);
    if (!tun) return;
    const per = tun.period;
    g.strokeStyle = '#1a2836'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    // 12-TET ghost ticks across one period
    for (let c = 0; c < per - 0.01; c += 100) { const a = c / per * Math.PI * 2 - Math.PI / 2; g.strokeStyle = '#223244'; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); g.lineTo(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6)); g.stroke(); }
    const steps = tun.equalStep ? Array.from({ length: Math.max(1, Math.floor(1200 / per)) }, (_, k) => k * per).filter(c => c < 1200) : tun.steps;
    const span = tun.equalStep ? 1200 : per;
    g.font = '9px monospace';
    steps.forEach((c, i) => {
      const a = c / span * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const d = XT.describeRatio(XT.ratio(c), 32), off = Math.abs(d.et12.offset);
      const col = d.irrational ? '#ff44cc' : d.irrationality < 2 ? '#00ff88' : off < 15 ? '#00d4ff' : '#ffaa00';
      g.strokeStyle = col + '55'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(x, y, i === 0 ? 6 : 4.5, 0, 7); g.fill();
      if (steps.length <= 24) { g.fillStyle = '#9fb3c8'; const lx = cx + Math.cos(a) * (R + 14), ly = cy + Math.sin(a) * (R + 14); g.textAlign = 'center'; g.fillText(c.toFixed(0), lx, ly + 3); }
    });
    g.textAlign = 'center'; g.fillStyle = '#d6e4f0'; g.font = '600 11px monospace';
    g.fillText(tun.equalStep ? `${per.toFixed(2)}¢ step` : `${tun.steps.length} / ${per.toFixed(1)}¢`, cx, cy - 4);
    g.fillStyle = '#7f93a8'; g.font = '9px monospace';
    const pr = XT.describeRatio(XT.ratio(per), 64);
    g.fillText(tun.equalStep ? 'no period' : 'period ' + (pr.irrational || (pr.p + '/' + pr.q + (Math.abs(pr.errCents) > 0.5 ? '~' : ''))), cx, cy + 10);
    g.textAlign = 'left';
  }, 12);

  // ---- spectrum bars (x = log2 ratio)
  const sp = UI.Canvas(300, 230);
  UI.loop(sp, () => {
    const g = sp.g, W = sp.fit().W, H = 230; g.fillStyle = '#060a0e'; g.fillRect(0, 0, W, H);
    if (!spec.length) return;
    const top = Math.max(...spec.map(p => p.r)) * 1.08, L = Math.log2(Math.max(2, top));
    for (let o = 0; o <= L; o++) { const x = 10 + o / L * (W - 20); g.strokeStyle = '#162230'; g.beginPath(); g.moveTo(x, 10); g.lineTo(x, H - 26); g.stroke(); g.fillStyle = '#4a5b6e'; g.font = '9px monospace'; g.fillText(Math.pow(2, o) + '×', x + 2, H - 14); }
    const amax = Math.max(...spec.map(p => p.a)) || 1;
    spec.forEach((p) => {
      const x = 10 + Math.log2(p.r) / L * (W - 20), hh = (p.a / amax) * (H - 50);
      const irr = p.d && p.d.irrational, rational = p.d && p.d.irrationality < 1.5;
      g.fillStyle = irr ? '#ff44cc' : rational ? '#00ffcc' : '#ffaa00';
      g.fillRect(x - 2, H - 26 - hh, 4, hh);
      if (spec.length <= 14) { g.save(); g.translate(x + 3, H - 30 - hh); g.rotate(-Math.PI / 2); g.fillStyle = '#9fb3c8'; g.font = '9px monospace'; g.fillText(irr ? irr : p.r.toFixed(3), 0, 0); g.restore(); }
    });
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('■ rational  ■ near-rational  ■ irrational (φ, π, √…)', 10, H - 3);
    g.fillStyle = '#00ffcc'; g.fillRect(10, H - 10, 6, 6); g.fillStyle = '#ffaa00'; g.fillRect(68, H - 10, 6, 6); g.fillStyle = '#ff44cc'; g.fillRect(165, H - 10, 6, 6);
  }, 12);

  // ---- step strip (playable)
  const strip = h('div', { class: 'xen-strip' });
  function paintStrip() {
    strip.innerHTML = '';
    if (!tun) return;
    const N = tun.steps.length, count = Math.min(48, tun.equalStep ? Math.max(8, Math.ceil(1200 / tun.period) + 1) : N + 1);
    for (let s = 0; s < count; s++) {
      const c = XT.stepCents(tun, s), hz = view.state.baseHz * XT.ratio(c);
      const b = h('button', { class: 'xen-step', title: `step ${s} · ${c.toFixed(2)}¢ · ${hz.toFixed(2)} Hz` }, [h('b', { text: String(s) }), h('small', { text: c.toFixed(0) + '¢' })]);
      const on = (e) => { e.preventDefault(); e.stopPropagation(); view.emit('play_step', { step: s, on: true }); b.classList.add('down'); };
      const off = () => { if (!b.classList.contains('down')) return; view.emit('play_step', { step: s, on: false }); b.classList.remove('down'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
      strip.appendChild(b);
    }
  }
  const kb = UI.Keyboard({ low: 48, high: 84, lock: false, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) });

  function vis() {
    const t = XT.TUNINGS[view.state.tuning] || {}, ps = t.params || [];
    nK.el.style.display = ps.includes('n') ? '' : 'none';
    genSel.el.style.display = ps.includes('generator') ? '' : 'none';
    perSel.el.style.display = ps.includes('period') ? '' : 'none';
    txtRow.style.display = ps.includes('text') ? '' : 'none';
  }
  view.bind('tuning', vis);
  view.on('state_sync', (s) => {
    if (s.tun) { tun = s.tun; describe.textContent = (s.tun.describe || '') + (tun.equalStep ? '' : ` — ${tun.steps.length} steps, period ${tun.period.toFixed(2)}¢.`) + ` Key ${view.state.baseNote} = step 0 = ${(+view.state.baseHz).toFixed(2)} Hz.`; paintStrip(); }
    if (s.spec) spec = s.spec;
    vis();
  });
  view.on('received', (r) => { recv.textContent = `⇠ received ${r.what} “${r.name}”${r.from ? ' from ' + view.label(r.from) : ''}`; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '8px' } }, [UI.presetBar(view), tuningSel.el]),
    paramRow, txtRow, describe,
    h('div', { style: { display: 'grid', gridTemplateColumns: '230px 1fr', gap: '8px' } }, [wheel, h('div', {}, [h('div', { class: 'org-row' }, [specSel.el]), sp])]),
    h('div', { class: 'org-label', style: { marginTop: '6px' }, text: 'STEPS — press to play (one period + 1)' }), strip,
    UI.paramPanel(view, ['baseHz', 'baseNote', 'partials', 'shape', 'tilt', 'even', 'bright', 'shimmer', 'spread', 'attack', 'decay', 'sustain', 'release', 'partialDecay', 'level'], { size: 30 }),
    recv, kb.el,
    UI.hint('Irrational partials (magenta) never line up with a pitch, so the ear hears “metal” or “glass”. Choose “tuning-matched” to bend the partials onto any tuning so its chords sound consonant.'),
  );
});

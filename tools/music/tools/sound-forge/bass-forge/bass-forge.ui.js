/* eravos.bass-forge UI — LFO → destinations matrix (one gesture, six depths), live spectrum, MATCH drop zone with the
 * recursion's distance curve shrinking iteration by iteration. */
OrganismFactory.reg('eravos.bass-forge', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const hist = []; let info = null;
  const mx = h('div', { class: 'bf-matrix' });
  [['lfoFM', 'FM'], ['lfoFold', 'FOLD'], ['lfoFormant', 'VOWEL'], ['lfoComb', 'COMB'], ['lfoNotch', 'NOTCH'], ['lfoCut', 'CUTOFF']].forEach(([k, l]) => {
    const bar = h('div', { class: 'bf-cell' }, [h('i'), h('span', { text: l })]); const fill = bar.firstChild;
    const set = (e) => { const r = bar.getBoundingClientRect(); view.set(k, +Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)).toFixed(2)); };
    let d = false; bar.addEventListener('pointerdown', (e) => { e.stopPropagation(); d = true; bar.setPointerCapture(e.pointerId); set(e); }); bar.addEventListener('pointermove', (e) => { if (d) set(e); }); ['pointerup', 'pointercancel'].forEach(t => bar.addEventListener(t, () => { d = false; }));
    view.bind(k, (v) => { fill.style.height = (v * 100) + '%'; }); mx.appendChild(bar);
  });
  const plot = UI.Canvas(220, 86);
  UI.loop(plot, () => { const g = plot.g; plot.fit(); const W = plot.W, H = 86; g.fillStyle = '#0c0705'; g.fillRect(0, 0, W, H); g.fillStyle = '#c98a6a'; g.font = '10px monospace';
    if (!hist.length) { g.fillText('MATCH: drop a bass clip here', 8, 20); g.fillText('(or 📂) — it learns the sound', 8, 34); return; }
    const m = Math.max(...hist), n = hist.length; g.strokeStyle = '#ff3d00'; g.lineWidth = 2; g.beginPath(); hist.forEach((d, i) => { const x = 6 + i / Math.max(1, n - 1) * (W - 12), y = 8 + (d / m) * (H - 26); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    g.fillText(info ? (info.error ? '⚠ ' + info.error : `${info.done ? 'done' : 'iter ' + info.iter} · distance ${info.dist.toFixed(3)}${info.f0 ? ' · ' + info.f0.toFixed(1) + ' Hz' : ''}`) : '', 6, H - 4); }, 15);
  view.on('match', (m) => { info = m; if (m.dist !== undefined) hist.push(m.dist); if (m.iter === 0) hist.length = 0, hist.push(m.dist); });
  const file = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  const go = async (f) => { hist.length = 0; info = { iter: 0, dist: 0 }; view.emit('match', { arrayBuffer: await f.arrayBuffer(), name: f.name }); };
  file.addEventListener('change', () => { if (file.files[0]) go(file.files[0]); file.value = ''; });
  const drop = h('div', { class: 'bf-drop' }, [plot, h('div', { class: 'org-row', style: { gap: '4px' } }, [UI.Button({ label: '📂 Match a clip', onClick: () => file.click() }).el, UI.Button({ label: 'Stop', onClick: () => view.emit('match_stop') }).el]), file]);
  drop.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); }); drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) go(f); });
  const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 0 }).el;
  UI.instrumentPanel(view, { color: '#ff3d00', low: 33, high: 57, height: 80,
    header: [sel('wave'), sel('ratio')],
    top: [h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 230px', gap: '8px', alignItems: 'stretch' } }, [h('div', {}, [h('div', { class: 'org-row', style: { gap: '6px' } }, [h('span', { class: 'org-label', text: 'LFO' }), sel('lfoDiv'), sel('lfoShape')]), mx]), drop])],
    keys: ['fm', 'spread', 'fold', 'formant', 'vowelA', 'vowelB', 'comb', 'combPitch', 'notch', 'cutoff', 'res', 'drive', 'crush', 'ott', 'pitchEnv', 'pitchTime', 'glide', 'octave', 'sub', 'attack', 'release', 'level'],
    hint: 'Drag the six bars: how far the one LFO pushes each stage. Irrational FM ratios (φ, √2) give metallic, never-quite-pitched growls.' });
});

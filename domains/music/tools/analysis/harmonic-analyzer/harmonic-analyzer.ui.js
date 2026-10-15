/* eravos.harmonic-analyzer UI — live spectrum with measured partials marked (green rational / amber near / magenta
 * irrational), headline numbers, recursive layers, partial table, the sound's own dissonance curve with minima,
 * send / export (.scl) buttons, file loader. */
OrganismFactory.reg('eravos.harmonic-analyzer', function (view) {
  const UI = view.ui, h = UI.h, XT = window.XenTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let A = null;
  const an = view.tap('in', 16384); const bins = new Float32Array(an ? an.frequencyBinCount : 8192);
  const sp = UI.Canvas(600, 170);
  UI.loop(sp, () => {
    const g = sp.g; sp.fit(); const W = sp.W, H = 170; g.fillStyle = '#07080a'; g.fillRect(0, 0, W, H);
    const X = (f) => Math.log(f / 20) / Math.log(1000) * W, Y = (db) => H - 14 - Math.max(0, Math.min(1, (db + 110) / 110)) * (H - 24);
    [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach(f => { g.strokeStyle = '#141a20'; g.beginPath(); g.moveTo(X(f), 0); g.lineTo(X(f), H - 12); g.stroke(); g.fillStyle = '#3c4b58'; g.font = '9px monospace'; g.fillText(f >= 1000 ? f / 1000 + 'k' : f, X(f) + 2, H - 3); });
    if (an && view.state.source === 'live') {
      an.getFloatFrequencyData(bins); const ny = an.context.sampleRate / 2;
      g.strokeStyle = 'rgba(255,224,102,.45)'; g.beginPath();
      for (let x = 0; x < W; x++) { const f = 20 * Math.pow(1000, x / W), b = Math.min(bins.length - 1, Math.round(f / ny * bins.length)); const y = Y(bins[b]); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    if (!A) { g.fillStyle = '#7f93a8'; g.font = '11px sans-serif'; g.fillText('Wire any sound into the left dot, or load a file — then play a sustained note.', 12, 20); return; }
    A.partials.forEach(p => {
      const col = p.irrational ? '#ff44cc' : Math.abs(p.approxErr) < 2 && p.approx.split('/')[1] <= 8 ? '#00ff88' : '#ffaa00';
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(X(p.f), H - 14); g.lineTo(X(p.f), Y(p.db)); g.stroke(); g.lineWidth = 1;
      g.fillStyle = col; g.font = '9px monospace'; g.fillText(p.irrational || p.approx, X(p.f) + 2, Y(p.db) - 2);
    });
    (A.layers || []).forEach((L, i) => { if (!i) return; for (let n = 1; n < 30; n++) { const f = n * L.f0 * Math.sqrt(1 + Math.max(0, L.B) * n * n); if (f > 20000) break; g.strokeStyle = ['', '#00d4ff55', '#b066ff55', '#ff884455'][i]; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(f), 0); g.lineTo(X(f), H - 14); g.stroke(); g.setLineDash([]); } });
  }, 20);
  const stats = h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap', margin: '6px 0' } });
  const stat = (v, l) => h('div', { class: 'org-stat' }, [h('b', { text: v }), h('small', { text: l })]);
  const layersEl = h('div', { class: 'uk-hint' });
  const table = h('div', { class: 'org-scroll' });
  const curve = UI.Canvas(600, 110);
  UI.loop(curve, () => {
    const g = curve.g; curve.fit(); const W = curve.W, H = 110; g.fillStyle = '#07080a'; g.fillRect(0, 0, W, H);
    if (!A || !A.curve) return;
    const n = A.curve.length, X = (c) => c / 1250 * W;
    for (let c = 0; c <= 1200; c += 100) { g.strokeStyle = '#131820'; g.beginPath(); g.moveTo(X(c), 0); g.lineTo(X(c), H); g.stroke(); }
    g.strokeStyle = '#ffe066'; g.beginPath(); A.curve.forEach((d, i) => { const x = i / (n - 1) * W, y = 8 + d * (H - 30); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    A.minima.forEach(m => { const x = X(m.c); g.fillStyle = m.irr ? '#ff44cc' : '#00ff88'; g.beginPath(); g.arc(x, H - 16, 3, 0, 7); g.fill(); g.font = '9px monospace'; g.fillText(m.irr || m.approx, x - 8, H - 4); });
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('dissonance of this timbre against itself, 0 → 1250¢ (dips = consonant intervals for THIS sound)', 6, 10);
  }, 8);
  function render(a) {
    A = a; stats.innerHTML = ''; table.innerHTML = '';
    stats.append(stat(a.f0.toFixed(2) + ' Hz', 'f0'), stat(a.note.name + ' ' + (a.note.cents >= 0 ? '+' : '') + a.note.cents + '¢', 'nearest key'),
      stat((a.harmonicity * 100).toFixed(0) + '%', 'harmonicity'), stat(a.B ? a.B.toExponential(2) : '0', 'inharmonicity B'),
      stat(String(a.partials.length), 'partials'), stat(String(a.partials.filter(p => p.irrational).length), 'irrational'), stat(a.source === 'file' ? 'file' : 'live', a.name || ''));
    layersEl.textContent = 'Layers: ' + (a.layers || []).map((L, i) => `#${i + 1} ${L.f0.toFixed(2)} Hz (${L.note.name}${L.note.cents >= 0 ? '+' : ''}${L.note.cents}¢) · ${L.count} partials · B ${L.B.toExponential(1)}`).join('   ') + (a.residue ? `   · ${a.residue} unexplained` : '') + (a.slices ? '   · over time: ' + a.slices.map(s => s.f0 ? `${s.t}s ${s.f0}Hz/${Math.round(s.harmonicity * 100)}%` : `${s.t}s —`).join(' → ') : '');
    const t = h('table', { class: 'org-table' }, [h('tr', {}, ['n', 'Hz', 'dB', 'ratio', '≈ p/q', 'err ¢', 'vs harmonic ¢', 'vs piano ¢', 'constant'].map(x => h('th', { text: x })))]);
    a.partials.forEach(p => t.appendChild(h('tr', { class: p.irrational ? 'irr' : Math.abs(p.harmDevCents) < 5 ? 'rat' : '' }, [
      p.harmonic, p.f.toFixed(2), p.rel.toFixed(1), p.ratio.toFixed(4), p.approx, p.approxErr.toFixed(1), (p.harmDevCents >= 0 ? '+' : '') + p.harmDevCents.toFixed(1), (p.et12Offset >= 0 ? '+' : '') + p.et12Offset.toFixed(1), p.irrational || '',
    ].map(x => h('td', { text: String(x) })))));
    table.appendChild(t);
  }
  view.on('analysis', render);
  view.on('state_sync', (s) => { if (s.last && !A) render(s.last); });
  const file = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  file.addEventListener('change', async () => { const f = file.files[0]; if (!f) return; view.emit('load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); file.value = ''; });
  function exportScl() {
    if (!A) return;
    const steps = A.minima.filter(m => m.c > 0 && m.c < 1195).map(m => m.c.toFixed(5)).concat(['2/1']);
    const txt = [`! ${(A.name || 'sound').replace(/[^\w.-]+/g, '_')}-consonances.scl`, '!', `Consonant intervals of ${A.name || 'a sound'} (f0 ${A.f0.toFixed(2)} Hz) from its dissonance curve — ERAVOS Harmonic Analyzer`, ` ${steps.length}`, '!'].concat(steps.map(s => ' ' + s)).join('\n') + '\n';
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); const a = h('a', { href: url, download: (A.name || 'sound').replace(/\.\w+$/, '') + '-consonances.scl' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const targetSel = UI.Select({ options: [{ value: '', label: 'everyone listening' }], onChange: (v) => view.set('sendTo', v) });
  const refresh = () => { targetSel.setOptions([{ value: '', label: 'everyone listening' }].concat(view.targets('capability.xen_in'))); targetSel.set(view.state.sendTo || ''); };
  view.observe('factory:spawned', refresh); view.observe('kernel:organism', refresh); refresh();
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), UI.paramControl(view, cfg('source')).el, UI.paramControl(view, cfg('hold')).el,
      UI.Button({ label: '📂 Analyse a file', onClick: () => file.click() }).el, file]),
    sp, stats, layersEl, table,
    h('div', { class: 'org-label', style: { marginTop: '6px' }, text: 'CONSONANCE MAP' }), curve,
    h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap', marginTop: '4px' } }, [
      h('span', { class: 'org-label', text: 'SEND TO' }), targetSel.el,
      UI.Button({ label: '⇢ Tuning (consonances)', onClick: () => view.emit('send_tuning') }).el,
      UI.Button({ label: '⇢ Spectrum (partials)', onClick: () => view.emit('send_spectrum') }).el,
      UI.Button({ label: '⤓ Export .scl', hint: 'Scala tuning file of the consonant intervals', onClick: exportScl }).el,
      UI.Button({ label: '↻', hint: 're-analyse the file with the current settings', onClick: () => view.emit('reanalyse') }).el,
    ]),
    UI.paramPanel(view, ['fft', 'floor', 'range', 'maxPeaks', 'maxDen', 'smoothing', 'layers', 'f0Mode', 'f0Manual'], { size: 28 }),
  );
});

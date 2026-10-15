/* eravos.master-fx UI — SPACE | ECHO | GLUE | OUT columns + meter bridge with LUFS and plain-language status */
OrganismFactory.reg('eravos.master-fx', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const col = (title, keys, extra) => h('div', { class: 'uk-group', style: { flex: '1', minWidth: '120px' } }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(k => UI.paramControl(view, cfg(k), { size: 32, segMax: 3 }).el)), extra || null]);
  const echoDiv = UI.divisionLadder(view, 'delayDiv'); view.bind('delayDiv', v => echoDiv.set(v));
  const dj = UI.paramControl(view, cfg('djFilter'), { big: true, size: 70 });
  const grNeedle = UI.Canvas(110, 30);
  let L = null;
  view.on('loudness', (m) => { L = m; });
  UI.loop(grNeedle, () => {
    const g = grNeedle.g; g.fillStyle = '#080b10'; g.fillRect(0, 0, 110, 30);
    const gr = L ? L.gr : 0; const n = Math.min(1, -gr / 12);
    g.fillStyle = '#aa44ff'; g.fillRect(110 - n * 110, 8, n * 110, 10);
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('GR ' + gr.toFixed(1) + ' dB', 4, 27);
  }, 20);
  const bridge = UI.Canvas(600, 64);
  const status = h('div', { class: 'org-big', style: { fontSize: '18px' }, text: '—' });
  const nums = h('div', { class: 'uk-hint', style: { fontFamily: 'var(--mono)' } });
  const reset = UI.Button({ label: 'Reset integrated', onClick: () => view.emit('loudness_reset', {}) });
  UI.loop(bridge, () => {
    const g = bridge.g, W = bridge.fit().W, H = 64; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    const m = view.K.audio.meters(); if (!m) return;
    const X = (db) => Math.max(0, Math.min(1, (db + 48) / 48)) * (W - 40) + 30;
    [m.L, m.R].forEach((c, i) => { const y = 6 + i * 14; g.fillStyle = '#1a2533'; g.fillRect(30, y, W - 40, 10); g.fillStyle = '#00ff88'; g.fillRect(30, y, X(c.rmsDb) - 30, 10); g.fillStyle = c.peakDb > -1 ? '#ff2266' : '#ffdd00'; g.fillRect(X(c.peakDb) - 2, y, 3, 10); g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText(i ? 'R' : 'L', 14, y + 9); });
    if (L) {
      const y = 38; g.fillStyle = '#1a2533'; g.fillRect(30, y, W - 40, 12);
      g.fillStyle = '#aa44ff'; g.fillRect(30, y, X(L.shortTerm) - 30, 12);
      g.fillStyle = '#fff'; g.fillRect(X(L.target) - 1, y - 3, 2, 18);
      g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('LU', 10, y + 10);
      [-48, -36, -24, -14, -8, 0].forEach(db => g.fillText(String(db), X(db) - 6, H - 2));
      status.textContent = L.status === 'on target' ? '✔ on target' : L.status === 'too loud' ? '▲ too loud' : L.status === 'quiet' ? '▼ quiet — raise Makeup' : '· silent';
      status.style.color = L.status === 'on target' ? '#00ff88' : L.status === 'too loud' ? '#ff2266' : '#ffaa00';
      nums.textContent = `M ${L.momentary.toFixed(1)}  S ${L.shortTerm.toFixed(1)}  I ${L.integrated <= -70 ? '—' : L.integrated.toFixed(1)} LUFS · peak ${L.truePeakDb.toFixed(1)} dB`;
    }
  }, 30);
  view.on('state_sync', (s) => { if (s.readOnly) view.root.style.opacity = 0.6; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [status])]),
    h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, [
      col('SPACE — reverb', ['reverbMix', 'size', 'decay', 'predelay', 'damping', 'shimmer', 'freeze']),
      col('ECHO — delay', ['delayMix', 'feedback', 'tone', 'width'], echoDiv.el),
      col('GLUE — comp', ['compThresh', 'compRatio', 'compAttack', 'compRelease', 'makeup'], grNeedle),
      h('div', { class: 'uk-group', style: { minWidth: '150px' } }, [h('div', { class: 'uk-group-title', text: 'OUT' }), h('div', { class: 'org-row', style: { justifyContent: 'center' } }, [dj.el]), h('div', { class: 'uk-row' }, ['ceiling', 'outGain'].map(k => UI.paramControl(view, cfg(k), { size: 30 }).el)), UI.paramControl(view, cfg('target'), { segMax: 3 }).el]),
    ]),
    h('div', { style: { height: '6px' } }), bridge, h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [nums, reset.el]),
  );
});

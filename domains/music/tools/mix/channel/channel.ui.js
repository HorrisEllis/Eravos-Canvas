/* eravos.channel UI — vertical strip: name, source, HPF, 3-band EQ + mini curve, drive, sends, pan, big fader, stereo meter, M/S/Ø */
OrganismFactory.reg('eravos.channel', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const nameIn = h('input', { class: 'uk-text', 'aria-label': 'Channel name', value: view.state.name || 'CH', style: { width: '100%', fontWeight: '700', textAlign: 'center' } });
  nameIn.addEventListener('change', () => view.set('name', nameIn.value)); nameIn.addEventListener('pointerdown', e => e.stopPropagation());
  view.bind('name', v => { nameIn.value = v; });
  const src = h('div', { class: 'uk-hint', style: { textAlign: 'center', fontSize: '10px', minHeight: '14px' }, text: '…' });
  view.on('source', (s) => { src.textContent = s.label; view.root.closest('.wm-win') && view.root.closest('.wm-win').style.setProperty('--acc', s.accent); });
  view.emit('request_source', {});
  const k = (key) => UI.paramControl(view, cfg(key), { size: 30 }).el;
  const eqCurve = UI.Canvas(190, 34);
  UI.loop(eqCurve, () => {
    const g = eqCurve.g, W = eqCurve.fit().W, H = 34, s = view.state; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#6a88a8'; g.beginPath();
    for (let x = 0; x < W; x++) {
      const f = 20 * Math.pow(1000, x / W);
      let db = s.low / (1 + Math.pow(f / 120, 2)) + s.high / (1 + Math.pow(8000 / f, 2)) + s.mid * Math.exp(-Math.pow(Math.log2(f / s.midFreq) * s.midQ * 1.2, 2));
      if (s.hpf > 0) db += Math.min(0, 60 * Math.log10(Math.min(1, f / s.hpf)));
      const y = H / 2 - db / 16 * (H / 2); x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }, 15);
  const fader = UI.Fader(Object.assign({}, cfg('fader'), { value: view.state.fader, height: 170, law: view.descriptor.faderLaw, format: (v) => v <= -60 ? '-∞' : (v > 0 ? '+' : '') + v.toFixed(1), onChange: (v) => view.set('fader', v) }));
  view.bind('fader', v => fader.set(v));
  const meter = UI.Canvas(34, 170); meter.style.width = '34px';
  let m = null, clipLed = false;
  view.on('meter', (x) => { m = x; });
  UI.loop(meter, () => {
    const g = meter.g, W = 34, H = 170; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!m) return; const n = (db) => Math.max(0, Math.min(1, (db + 60) / 66));
    const grad = g.createLinearGradient(0, H, 0, 0); grad.addColorStop(0, '#00ff88'); grad.addColorStop(0.8, '#ffdd00'); grad.addColorStop(0.92, '#ff2266');
    [[m.peakL, m.rmsL, m.holdL, 2], [m.peakR, m.rmsR, m.holdR, 18]].forEach(([pk, rm, hd, x]) => {
      g.fillStyle = grad; g.globalAlpha = 0.4; g.fillRect(x, H - n(pk) * H, 14, n(pk) * H); g.globalAlpha = 1; g.fillRect(x, H - n(rm) * H, 14, n(rm) * H);
      g.fillStyle = '#fff'; g.fillRect(x, H - n(hd) * H, 14, 2);
    });
    g.fillStyle = '#34465c'; g.font = '8px monospace'; [0, -6, -12, -24, -48].forEach(db => g.fillText(String(db), 0, H - n(db) * H + 3));
    clipLed = m.clip;
    clipB.el.style.background = clipLed ? '#ff2266' : '';
  }, 30);
  const clipB = UI.Button({ label: 'CLIP', hint: 'lights at −0.1 dBFS; click to reset', onClick: () => view.emit('clip_reset', {}) });
  const mute = UI.paramControl(view, cfg('mute')), solo = UI.paramControl(view, cfg('solo')), ph = UI.paramControl(view, cfg('phase'));
  view.on('state_sync', (s) => { mute.el.style.opacity = s.effMute && !s.params.mute ? 0.5 : 1; });
  const row = (...els) => h('div', { class: 'org-row', style: { justifyContent: 'center', gap: '2px', margin: '2px 0' } }, els);
  view.root.append(
    nameIn, src, row(UI.presetBar(view)),
    row(k('trim'), k('hpf')), eqCurve, row(k('low'), k('mid'), k('high')), row(k('midFreq'), k('midQ'), k('drive')),
    row(k('sendRev'), k('sendDel'), k('pan')),
    h('div', { style: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '6px' } }, [fader.el, meter]),
    row(mute.el, solo.el, ph.el, clipB.el),
  );
});

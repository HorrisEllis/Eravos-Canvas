/* eravos.fx-filter UI — response curve (getFrequencyResponse of a mirror filter built from the settings) over the live output spectrum */
OrganismFactory.reg('eravos.fx-filter', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const an = view.tap('out', 4096); const bins = new Float32Array(an.frequencyBinCount);
  const ac = view.ac, m1 = ac.createBiquadFilter(), m2 = ac.createBiquadFilter(); // mirrors: never connected
  const N = 256, fr = new Float32Array(N), mag1 = new Float32Array(N), mag2 = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) fr[i] = 20 * Math.pow(1000, i / (N - 1));
  const TYPES = { LP: 'lowpass', HP: 'highpass', BP: 'bandpass', notch: 'notch' };
  const cv = UI.Canvas(420, 130);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 130, s = view.state; g.fillStyle = '#060b09'; g.fillRect(0, 0, W, H);
    const xOf = (f) => Math.log(f / 20) / Math.log(1000) * W, yOf = (db) => H * 0.15 - db / 48 * H * 0.8;
    [100, 1000, 10000].forEach(f => { g.fillStyle = '#16241e'; g.fillRect(xOf(f), 0, 1, H); g.fillStyle = '#4d6b5e'; g.font = '9px monospace'; g.fillText(f >= 1000 ? f / 1000 + 'k' : f, xOf(f) + 2, H - 3); });
    an.getFloatFrequencyData(bins); g.fillStyle = 'rgba(0,255,170,.18)';
    for (let x = 0; x < W; x += 2) { const f = 20 * Math.pow(1000, x / W), i = Math.min(bins.length - 1, Math.round(f / (ac.sampleRate / 2) * bins.length)); const v = Math.max(0, (bins[i] + 100) / 100); g.fillRect(x, H - v * H, 2, v * H); }
    const four = +s.slope === 24, lp = s.type === 'LP' || s.type === 'HP';
    [m1, m2].forEach((m, i) => { m.type = TYPES[s.type]; m.frequency.value = s.cutoff; const lin = four && lp ? s.res / Math.SQRT1_2 * (i ? 1.3066 : 0.5412) : s.res; m.Q.value = lp ? 20 * Math.log10(lin) : lin; });
    m1.getFrequencyResponse(fr, mag1, ph); if (four) m2.getFrequencyResponse(fr, mag2, ph);
    g.strokeStyle = '#00ffaa'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < N; i++) { const db = 20 * Math.log10(mag1[i] * (four ? mag2[i] : 1) + 1e-9); const x = xOf(fr[i]), y = Math.max(0, Math.min(H, yOf(db))); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(xOf(s.cutoff), yOf(0), 4, 0, 7); g.fill();
    const mv = [s.lfoAmt ? `LFO ${s.lfoAmt > 0 ? '+' : ''}${s.lfoAmt} oct` : '', s.envAmt ? `env ${s.envAmt > 0 ? '+' : ''}${s.envAmt} oct` : ''].filter(Boolean).join(' · ');
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${s.type} ${s.slope} dB · ${Math.round(s.cutoff)} Hz${mv ? ' · ' + mv : ''}`, 6, 12);
  }, 30);
  const note = h('div', { class: 'uk-hint' }); view.on('notice', (n) => { note.textContent = n.text; });
  const div = UI.divisionLadder(view, 'lfoDiv'); view.bind('lfoDiv', v => div.set(v));
  const hz = UI.paramControl(view, cfg('lfoRate'), { size: 28 });
  view.bind('lfoSync', (sy) => { div.el.style.display = sy ? '' : 'none'; hz.el.style.display = sy ? 'none' : ''; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv,
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('type')).el, UI.paramControl(view, cfg('slope')).el]),
    UI.paramPanel(view, ['cutoff', 'res', 'drive', 'mix'], { flat: true, noTitles: true, size: 34 }),
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('lfoShape')).el, UI.paramControl(view, cfg('lfoSync')).el, div.el, hz.el]),
    UI.paramPanel(view, ['lfoAmt', 'envAmt', 'envAttack', 'envRelease'], { flat: true, noTitles: true, size: 30 }),
    note, UI.audioRouting(view).el,
  );
});

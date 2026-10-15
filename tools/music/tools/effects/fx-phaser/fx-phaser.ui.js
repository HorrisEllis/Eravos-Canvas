/* eravos.fx-phaser UI — live output spectrum with the sweep range shaded and the sweep centre marked */
OrganismFactory.reg('eravos.fx-phaser', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const an = view.tap('out', 4096); const bins = new Float32Array(an.frequencyBinCount), ac = view.ac;
  const cv = UI.Canvas(420, 120); const t0 = performance.now();
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 120, s = view.state; g.fillStyle = '#07061a'; g.fillRect(0, 0, W, H);
    const xOf = (f) => Math.log(f / 20) / Math.log(1000) * W;
    g.fillStyle = 'rgba(85,51,255,.18)'; g.fillRect(xOf(s.minHz), 0, xOf(s.maxHz) - xOf(s.minHz), H);
    an.getFloatFrequencyData(bins); g.fillStyle = '#5533ff';
    for (let x = 0; x < W; x += 2) { const f = 20 * Math.pow(1000, x / W), i = Math.min(bins.length - 1, Math.round(f / (ac.sampleRate / 2) * bins.length)); const v = Math.max(0, (bins[i] + 100) / 100); g.fillRect(x, H - v * H, 2, v * H); }
    const rate = s.sync ? 1 / window.MusicTheory.divisionSec(s.div, view.bpm || 120) : s.rate, ph = Math.sin(2 * Math.PI * rate * (performance.now() - t0) / 1000);
    const fc = Math.sqrt(s.minHz * s.maxHz) * Math.pow(s.maxHz / s.minHz, ph / 2);
    // 3.27: the filter itself, drawn — |dry + wet| of N first-order allpasses at fc with feedback, so the moving
    // notches are visible even before anything is wired in
    const N = +s.stages || 6, fb = +s.feedback || 0, mix = +s.mix || 0;
    g.strokeStyle = '#c8c4ff'; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const f = 20 * Math.pow(1000, x / W), P = -2 * N * Math.atan(f / fc);
      const er = Math.cos(P), ei = Math.sin(P), dr = 1 - fb * er, di = -fb * ei, den = dr * dr + di * di;
      const hr = (er * dr + ei * di) / den, hi = (ei * dr - er * di) / den;               // e^{iP} / (1 − fb·e^{iP})
      const or = (1 - mix) + mix * hr, oi = mix * hi, mag = Math.sqrt(or * or + oi * oi);
      const db = 20 * Math.log10(Math.max(1e-4, mag)), y = H * 0.42 - db / 30 * H * 0.5;
      x ? g.lineTo(x, Math.max(2, Math.min(H - 2, y))) : g.moveTo(x, Math.max(2, Math.min(H - 2, y)));
    }
    g.stroke();
    g.fillStyle = '#fff'; g.fillRect(xOf(fc), 0, 2, H);
    g.fillStyle = '#9fa0ff'; g.font = '10px monospace'; g.fillText(`${s.stages} stages · fb ${s.feedback} · ${Math.round(fc)} Hz`, 6, 12);
  }, 30);
  const div = UI.divisionLadder(view, 'div'); view.bind('div', v => div.set(v));
  const rate = UI.paramControl(view, cfg('rate'), { size: 30 });
  view.bind('sync', (sy) => { div.el.style.display = sy ? '' : 'none'; rate.el.style.display = sy ? 'none' : ''; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv, UI.paramControl(view, cfg('stages')).el,
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('sync')).el, div.el, rate.el]),
    UI.paramPanel(view, ['minHz', 'maxHz', 'feedback', 'stereo', 'Q', 'mix'], { flat: true, noTitles: true, size: 30 }),
    UI.audioRouting(view).el,
  );
});

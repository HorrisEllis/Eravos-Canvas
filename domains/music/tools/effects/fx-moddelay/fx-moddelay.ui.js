/* eravos.fx-moddelay UI — stereo field (L vs R goniometer of the real output: width you can see) + controls */
OrganismFactory.reg('eravos.fx-moddelay', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const st = view.tapStereo('out', 1024); const L = new Float32Array(1024), R = new Float32Array(1024);
  const cv = UI.Canvas(420, 130);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 130; g.fillStyle = 'rgba(5,9,12,.35)'; g.fillRect(0, 0, W, H);
    st.L.getFloatTimeDomainData(L); st.R.getFloatTimeDomainData(R);
    const cx = W / 2, cy = H / 2, sc = H * 0.45; g.fillStyle = '#33ddff';
    let c = 0, eL = 0, eR = 0;
    for (let i = 0; i < L.length; i += 2) { const m = (L[i] + R[i]) / 2, s = (L[i] - R[i]) / 2; g.fillRect(cx + s * sc * 1.6, cy - m * sc, 1.5, 1.5); c += L[i] * R[i]; eL += L[i] * L[i]; eR += R[i] * R[i]; }
    const corr = c / Math.sqrt(eL * eR + 1e-12);
    if (eL + eR < 1e-6) { // 3.27 silent: draw what the effect is doing — the swept delay time per side
      const s = view.state, rate = s.sync ? 1 / window.MusicTheory.divisionSec(s.div, view.bpm || 120) : s.rate, t = performance.now() / 1000;
      g.fillStyle = '#05090c'; g.fillRect(0, 0, W, H);
      [['L', 0, '#33ddff'], ['R', Math.PI * (s.spread || 0), '#ff66cc']].forEach(([nm, off, col]) => {
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
        for (let x = 0; x <= W; x += 2) { const tt = t - (W - x) / W * 2; const d = s.base * (1 + (s.depth || 0) * 0.9 * Math.sin(2 * Math.PI * rate * tt + off)); const y = H - 16 - d / 30 * (H - 30); x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.fillStyle = col; g.fillText(nm, W - 12, nm === 'L' ? 26 : 40);
      });
      g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${s.mode} · delay ${s.base.toFixed(1)} ms ± ${(s.base * s.depth * 0.9).toFixed(1)} · last 2 s · plug a sound in to see its width`, 6, 12);
      return;
    }
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${view.state.mode} · width ${(1 - Math.max(0, corr)).toFixed(2)}`, 6, 12);
  }, 30);
  const div = UI.divisionLadder(view, 'div'); view.bind('div', v => div.set(v));
  const rate = UI.paramControl(view, cfg('rate'), { size: 30 });
  view.bind('sync', (sy) => { div.el.style.display = sy ? '' : 'none'; rate.el.style.display = sy ? 'none' : ''; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv, UI.paramControl(view, cfg('mode')).el,
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('sync')).el, div.el, rate.el]),
    UI.paramPanel(view, ['depth', 'base', 'feedback', 'spread', 'mix'], { flat: true, noTitles: true, size: 30 }),
    UI.audioRouting(view).el,
  );
});

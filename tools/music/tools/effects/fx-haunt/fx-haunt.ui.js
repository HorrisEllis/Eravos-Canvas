/* eravos.fx-haunt UI — a dying CRT: the output trace through scanlines, flicker and drift that grow with the settings. */
OrganismFactory.reg('eravos.fx-haunt', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const an = view.tap('out', 2048), td = new Float32Array(2048); const crt = UI.Canvas(440, 120); let ph = 0;
  UI.loop(crt, () => {
    const g = crt.g; crt.fit(); const W = crt.W, H = 120, s = view.state; an.getFloatTimeDomainData(td); ph += 0.02;
    const fl = 0.85 + Math.random() * 0.15 * (0.3 + (s.vinyl || 0)); g.fillStyle = `rgba(6,4,14,${0.55})`; g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(155,140,255,${fl})`; g.lineWidth = 1.5; g.beginPath();
    const drift = Math.sin(ph * (s.wowRate || 0.5) * 6) * (s.warble || 0) * 6;
    let e = 0; for (let i = 0; i < td.length; i += 16) e += td[i] * td[i]; const silent = e < 1e-6;
    for (let x = 0; x < W; x++) { const v = silent ? 0.35 * Math.sin(x / W * Math.PI * 6 * Math.pow(2, -(+s.screw || 0) / 12) + ph * 4) * (s.tone === 'telephone' || s.tone === 'radio' ? Math.sign(Math.sin(x / 9)) * 0.7 : 1) : (td[Math.floor(x / W * td.length)] || 0), y = H / 2 + drift + v * H * 0.42 + (Math.random() - 0.5) * (s.crush || 0) * 4; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    if (Math.random() < (s.vinyl || 0) * 0.25) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1); }
    g.fillStyle = '#7c70c9'; g.font = '10px monospace'; g.fillText(`${(s.tone || 'open').toUpperCase()}  ·  screw −${(+s.screw || 0).toFixed(1)} st`, 8, 13);
  }, 40);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px' } }, [UI.presetBar(view), UI.paramControl(view, cfg('tone'), { segMax: 5 }).el]), crt,
    UI.paramPanel(view, ['screw', 'warble', 'wowRate', 'crush', 'vinyl', 'ghost', 'ghostLen', 'mix', 'inGain', 'outGain', 'bypass'], { size: 32 }),
    UI.audioRouting(view).el);
});

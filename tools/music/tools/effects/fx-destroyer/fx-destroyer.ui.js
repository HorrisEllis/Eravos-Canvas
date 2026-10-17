/* eravos.fx-destroyer UI — the engine's own transfer curve (asym bias, bit staircase) over the output oscilloscope,
 * then the stages in signal order: SHAPER · TONE · CRUSH */
OrganismFactory.reg('eravos.fx-destroyer', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), C = view.descriptor.curves;
  const an = view.tap('out', 2048); const buf = new Float32Array(2048);
  const cv = UI.Canvas(440, 140); let key = '', curve = null;
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 140, s = view.state; g.fillStyle = '#080b05'; g.fillRect(0, 0, W, H);
    const k = s.shape + s.drive + s.asym; if (k !== key) { key = k; curve = C.shapeCurve(s.shape, s.drive, s.asym, 513); }
    const box = H - 16, x0 = 8, y0 = 8, L = Math.pow(2, s.bits - 1);
    g.strokeStyle = '#223018'; g.strokeRect(x0, y0, box, box);
    g.strokeStyle = '#aaff00'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < 513; i++) { let y = curve[i]; if (s.bits < 16) y = Math.max(-1, Math.min(1, (Math.floor(y * L) + 0.5) / L)); const px = x0 + i / 512 * box, py = y0 + box / 2 - y * box / 2; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    an.getFloatTimeDomainData(buf); const ox = box + 24, ow = W - ox - 6;
    g.strokeStyle = '#aaff00'; g.globalAlpha = 0.7; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 600; i++) { const x = ox + i / 600 * ow, y = H / 2 - buf[i] * H * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#7f93a8'; g.font = '10px monospace';
    g.fillText(`${s.shape}${s.asym > 0 ? ' +asym' : ''} · ${s.bits} bit · ÷${s.downsample}${s.lowKeep >= 20 ? ` · lows < ${s.lowKeep} Hz clean` : ''}`, ox, 12);
  }, 30);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv, UI.paramControl(view, cfg('shape')).el,
    UI.paramPanel(view, ['drive', 'asym', 'autoGain', 'tight', 'lowKeep', 'tilt', 'postLP', 'autoTame', 'bits', 'downsample', 'alias', 'dither', 'mix'], { size: 30 }),
    UI.audioRouting(view).el,
  );
});

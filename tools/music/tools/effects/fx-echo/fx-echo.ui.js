/* eravos.fx-echo UI — echo train (repeat times × levels from the live settings) over the output scope, THROW pad, routing */
OrganismFactory.reg('eravos.fx-echo', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), MT = window.MusicTheory;
  const an = view.tap('out', 2048); const buf = new Float32Array(2048);
  const cv = UI.Canvas(420, 110); let flash = 0;
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 110, s = view.state; g.fillStyle = '#070b0a'; g.fillRect(0, 0, W, H);
    const t = s.sync ? MT.divisionSec(s.div, view.bpm || 120) : s.timeFree / 1000, span = 4; // seconds shown
    let lv = 1; const fb = s.freeze ? 1 : s.feedback, dark = 1 - 0.35 * s.age;
    g.fillStyle = '#00ff44'; g.fillRect(4, H - 10 - (H - 24), 4, H - 24);
    for (let k = 1; k * t < span && lv > 0.02; k++) {
      lv *= Math.min(1.05, fb) * (k === 1 ? 1 : dark); lv = Math.min(1, lv);
      const x = 4 + (k * t) / span * (W - 12), hh = lv * (H - 24);
      g.fillStyle = s.stereo === 'pingpong' ? (k % 2 ? '#00ff44' : '#00d4ff') : '#00ff44'; g.globalAlpha = 0.85; g.fillRect(x, H - 10 - hh, 4, hh); g.globalAlpha = 1;
    }
    an.getFloatTimeDomainData(buf); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath();
    for (let i = 0; i < buf.length; i += 4) { const x = i / buf.length * W, y = H / 2 - buf[i] * H * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${Math.round(t * 1000)} ms · ${s.stereo}${s.freeze ? ' · FROZEN' : ''}`, 12, 12);
    if (flash > 0) { g.fillStyle = `rgba(0,255,68,${flash})`; g.fillRect(0, 0, W, H); flash -= 0.05; }
  }, 30);
  view.on('thrown', () => { flash = 0.35; });
  const thr = UI.Button({ label: 'THROW', kind: 'primary', hint: 'send one division into the echo (dub throw)', onClick: () => view.emit('throw', {}) });
  thr.el.style.minWidth = '90px'; thr.el.style.height = '40px';
  const clr = UI.Button({ label: '■ CLEAR', hint: 'empty the tape now — stops a frozen or runaway echo', onClick: () => view.emit('clear', {}) });
  clr.el.style.height = '40px';
  view.on('cleared', () => { flash = 0; });
  const div = UI.divisionLadder(view, 'div'); view.bind('div', v => div.set(v));
  const free = UI.paramControl(view, cfg('timeFree'), { size: 30 });
  view.bind('sync', (sy) => { div.el.style.display = sy ? '' : 'none'; free.el.style.display = sy ? 'none' : ''; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px' } }, [clr.el, thr.el])]),
    cv,
    h('div', { class: 'org-row', style: { marginTop: '6px' } }, [UI.paramControl(view, cfg('sync')).el, div.el, free.el]),
    UI.paramControl(view, cfg('stereo')).el,
    UI.paramPanel(view, ['feedback', 'age', 'wow', 'flutter', 'sat', 'offsetRatio', 'mix'], { flat: true, noTitles: true, size: 30 }),
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('throwMode')).el, UI.paramControl(view, cfg('freeze')).el, UI.paramControl(view, cfg('bypass')).el]),
    UI.audioRouting(view).el,
  );
});

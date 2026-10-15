/* eravos.fx-dynamics UI — scrolling history (input level, output level, gain reduction from the engine's own GR signal)
 * beside the static transfer curve with a live dot where the sound is right now. */
OrganismFactory.reg('eravos.fx-dynamics', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const anIn = view.tap('in', 1024), anOut = view.tap('out', 1024), anGr = view.tap('gr', 256);
  const bi = new Float32Array(1024), bo = new Float32Array(1024), bg = new Float32Array(256);
  const peak = (an, b) => { if (!an) return 0; an.getFloatTimeDomainData(b); let p = 0; for (let i = 0; i < b.length; i++) p = Math.max(p, Math.abs(b[i])); return p; };
  const dB = (x) => 20 * Math.log10(Math.max(1e-6, x));
  const HH = 150, hist = [], hc = UI.Canvas(400, HH); hc.setAttribute('aria-label', 'level history: input, output and gain reduction');
  const tc = UI.Canvas(150, 150); tc.style.width = '150px'; tc.style.flex = 'none'; tc.setAttribute('aria-label', 'compressor transfer curve');
  let lastIn = -90;
  UI.loop(hc, () => {
    const g = hc.g, W = hc.fit().W, H = HH; const li = dB(peak(anIn, bi)), lo = dB(peak(anOut, bo)), gr = peak(anGr, bg) * 48; lastIn = li;
    hist.push([li, lo, gr]); if (hist.length > W) hist.shift();
    g.fillStyle = '#0c0803'; g.fillRect(0, 0, W, H);
    const Y = (d) => H - Math.max(0, Math.min(1, (d + 60) / 60)) * (H - 4);
    const s = view.state; g.fillStyle = 'rgba(255,136,0,.25)'; g.fillRect(0, Y(s.thresh), W, 1); if (s.gateOn) { g.fillStyle = 'rgba(0,212,255,.25)'; g.fillRect(0, Y(s.gateThresh), W, 1); }
    const line = (k, col) => { g.strokeStyle = col; g.beginPath(); hist.forEach((v, i) => { const y = Y(v[k]); i ? g.lineTo(i, y) : g.moveTo(i, y); }); g.stroke(); };
    line(0, 'rgba(255,255,255,.35)'); line(1, '#ff8800');
    g.fillStyle = 'rgba(255,34,102,.55)'; hist.forEach((v, i) => { const hgt = Math.min(H, v[2] / 24 * H * 0.5); g.fillRect(i, 0, 1, hgt); });
    g.fillStyle = '#c9a070'; g.font = '10px monospace'; g.fillText(`in ${li.toFixed(1)} · out ${lo.toFixed(1)} dBFS · GR ${gr.toFixed(1)} dB`, 6, H - 6);
    g.fillStyle = '#ff5577'; g.fillText('GR ↓', W - 34, 12);
  }, 30);
  UI.loop(tc, () => {
    const g = tc.g, W = 150, H = 150, s = view.state; g.fillStyle = '#0c0803'; g.fillRect(0, 0, W, H);
    const P = (d) => (d + 60) / 60; g.strokeStyle = '#2a1e10'; g.beginPath(); g.moveTo(0, H); g.lineTo(W, 0); g.stroke();
    const out = (d) => { let o = d; if (s.compOn) { const over = d - s.thresh, W2 = s.knee, sl = 1 / s.ratio - 1; if (W2 > 0 && 2 * Math.abs(over) <= W2) o += sl * (over + W2 / 2) * (over + W2 / 2) / (2 * W2); else if (over > 0) o += sl * over; o += s.makeup; } if (s.gateOn && d < s.gateThresh) o -= s.gateRange; return o; };
    g.strokeStyle = '#ff8800'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x++) { const d = -60 + x / W * 60, y = H - P(out(d)) * H; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1;
    const di = Math.max(-60, Math.min(0, lastIn)); g.fillStyle = '#fff'; g.beginPath(); g.arc(P(di) * W, H - P(out(di)) * H, 4, 0, 7); g.fill();
    g.fillStyle = '#8a7050'; g.font = '9px monospace'; g.fillText('in →', W - 26, H - 3); g.fillText('out', 3, 10);
  }, 30);
  const keyNote = h('div', { class: 'uk-hint', 'aria-live': 'polite' });
  const refreshKey = () => { const wired = view.K.wires.list().some(w => w.dst.instanceId === view.instanceId && w.dst.hookId === 'dyn.hook.key_in'); keyNote.textContent = view.state.keyed ? (wired ? 'KEY is on: the sound wired into the key dot drives this compressor.' : 'KEY is on but nothing is wired into the key dot (left edge) yet.') : ''; };
  view.observe('kernel:wire-registered', refreshKey); view.observe('kernel:wire-removed', refreshKey); view.bind('keyed', refreshKey);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    h('div', { style: { display: 'flex', gap: '8px' } }, [h('div', { style: { flex: 1, minWidth: 0 } }, [hc]), tc]),
    h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [UI.paramControl(view, cfg('compOn')).el, UI.paramControl(view, cfg('gateOn')).el, UI.paramControl(view, cfg('keyed')).el]),
    UI.paramPanel(view, ['thresh', 'ratio', 'knee', 'attack', 'release', 'makeup', 'gateThresh', 'gateRange', 'gateAttack', 'gateHold', 'gateRelease', 'mix', 'inGain', 'outGain'], { size: 30 }),
    keyNote, UI.audioRouting(view).el,
  );
});

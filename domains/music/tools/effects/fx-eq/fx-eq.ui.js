/* eravos.fx-eq UI — live spectrum (input faint, output bright), the EQ curve the filters really make, 7 numbered
 * nodes: drag = frequency (x) + gain (y), wheel = Q, double-click = band on/off, alt-hold = LISTEN to that band. */
OrganismFactory.reg('eravos.fx-eq', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const anIn = view.tap('in', 4096), anOut = view.tap('out', 4096);
  const binsIn = new Float32Array(anIn ? anIn.frequencyBinCount : 2048), binsOut = new Float32Array(anOut ? anOut.frequencyBinCount : 2048);
  const H = 220, cv = UI.Canvas(600, H); cv.style.cursor = 'pointer'; cv.setAttribute('aria-label', 'EQ curve over the live spectrum — drag the numbered points');
  const DBR = 18, X = (f, W) => Math.log(f / 20) / Math.log(1000) * W, F = (x, W) => 20 * Math.pow(1000, Math.max(0, Math.min(1, x / W)));
  const Y = (db) => H / 2 - db / DBR * (H / 2 - 14), DB = (y) => Math.max(-DBR, Math.min(DBR, (H / 2 - y) / (H / 2 - 14) * DBR));
  let bands = [], resp = null, respKey = '';
  const freqs = new Float32Array(300);
  view.on('state_sync', (s) => { if (s.bands) bands = s.bands; });
  const nodeOf = (b, W) => { const s = view.state, f = s[b.id + 'Freq']; const g = (b.type === 'highpass' || b.type === 'lowpass') ? 0 : s[b.id + 'Gain']; return { x: X(f, W), y: Y(g || 0), on: s[b.id + 'On'] }; };
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, s = view.state; g.fillStyle = '#0a0a05'; g.fillRect(0, 0, W, H);
    [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach(f => { const x = X(f, W); g.fillStyle = '#1c1c10'; g.fillRect(x, 0, 1, H); g.fillStyle = '#5c5a40'; g.font = '9px monospace'; g.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), x + 2, H - 3); });
    [-12, -6, 0, 6, 12].forEach(d => { g.fillStyle = d ? '#16160c' : '#2a2a18'; g.fillRect(0, Y(d), W, 1); });
    const spec = (an, bins, col, fill) => {
      if (!an) return; an.getFloatFrequencyData(bins); const ny = an.context.sampleRate / 2;
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x < W; x += 2) { const i = Math.min(bins.length - 1, Math.round(F(x, W) / ny * bins.length)); const v = Math.max(0, Math.min(1, (bins[i] + 100) / 90)); g.lineTo(x, H - v * (H - 10)); }
      g.lineTo(W, H); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = col; g.stroke();
    };
    spec(anIn, binsIn, 'rgba(255,221,0,.25)', 'rgba(255,221,0,.05)'); spec(anOut, binsOut, 'rgba(255,221,0,.8)', 'rgba(255,221,0,.14)');
    // the curve: ask the engine for its true response (only when a setting changed)
    const key = JSON.stringify(s); if (key !== respKey) { respKey = key; for (let i = 0; i < 300; i++) freqs[i] = F(i / 299 * W, W); view.emit('want_response', {}); }
    if (resp) { g.strokeStyle = '#fff6a0'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < resp.length; i++) { const x = i / (resp.length - 1) * W, y = Y(Math.max(-DBR - 6, Math.min(DBR + 6, resp[i]))); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; }
    bands.forEach((b, i) => { const n = nodeOf(b, W); g.globalAlpha = n.on ? 1 : 0.35; g.fillStyle = s.listen === b.id ? '#ff5577' : '#ffdd00'; g.beginPath(); g.arc(n.x, n.y, 9, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = '700 10px sans-serif'; g.fillText(String(i + 1), n.x - 3, n.y + 4); g.globalAlpha = 1; });
    if (s.listen && s.listen !== 'off') { g.fillStyle = '#ff5577'; g.font = '11px monospace'; g.fillText('LISTEN · ' + (bands.find(b => b.id === s.listen) || {}).label, 8, 14); }
  }, 30);
  view.on('response', (r) => { resp = r.db; });
  // drag nodes
  let drag = null;
  const hit = (x, y) => { const W = cv.W; let best = null, bd = 16; bands.forEach(b => { const n = nodeOf(b, W), d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = b; } }); return best; };
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), b = hit(e.clientX - r.left, e.clientY - r.top); if (!b) return;
    e.stopPropagation(); cv.setPointerCapture(e.pointerId); drag = { b, alt: e.altKey };
    if (e.altKey) view.set('listen', b.id);
  });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; view.emit('band_drag', { band: drag.b.id, freq: Math.round(F(x, cv.W)), gain: +DB(y).toFixed(1) }); });
  const end = () => { if (drag && drag.alt) view.set('listen', 'off'); drag = null; };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, end));
  cv.addEventListener('wheel', (e) => { const r = cv.getBoundingClientRect(), b = hit(e.clientX - r.left, e.clientY - r.top); if (!b || b.type !== 'peaking') return; e.preventDefault(); e.stopPropagation(); const q = view.state[b.id + 'Q']; view.emit('band_drag', { band: b.id, q: +Math.max(0.1, Math.min(18, q * (e.deltaY < 0 ? 1.12 : 1 / 1.12))).toFixed(2) }); }, { passive: false });
  cv.addEventListener('dblclick', (e) => { const r = cv.getBoundingClientRect(), b = hit(e.clientX - r.left, e.clientY - r.top); if (b) view.set(b.id + 'On', !view.state[b.id + 'On']); });
  // band table: one compact column per band
  const table = h('div', { class: 'eq-table' });
  const rebuild = () => {
    table.innerHTML = '';
    bands.forEach((b, i) => {
      const keys = [b.id + 'Freq'].concat(b.type === 'peaking' ? [b.id + 'Gain', b.id + 'Q'] : (b.type === 'highpass' || b.type === 'lowpass') ? [] : [b.id + 'Gain']);
      const col = h('div', { class: 'uk-group eq-col' }, [h('div', { class: 'uk-group-title', text: `${i + 1} · ${b.label}` }), UI.paramControl(view, cfg(b.id + 'On')).el, UI.paramPanel(view, keys, { flat: true, noTitles: true, size: 28 })]);
      if (b.type === 'highpass' || b.type === 'lowpass') col.appendChild(UI.paramControl(view, cfg(b.id + 'Slope'), { segMax: 3 }).el);
      table.appendChild(col);
    });
  };
  let built = false; view.on('state_sync', (s) => { if (s.bands && !built) { built = true; rebuild(); } });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', flexWrap: 'wrap' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0, gap: '6px' } }, [UI.paramControl(view, cfg('autoGain')).el, UI.paramControl(view, cfg('bypass')).el])]),
    cv, UI.hint('Drag a point: left/right = frequency, up/down = boost/cut. Wheel = width (Q). Double-click = band on/off. Hold Alt while dragging to LISTEN to just that band.'),
    table, UI.paramPanel(view, ['inGain', 'outGain', 'mix'], { flat: true, noTitles: true, size: 28 }), UI.audioRouting(view).el,
  );
});

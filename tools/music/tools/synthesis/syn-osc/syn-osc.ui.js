/* eravos.syn-osc UI — the morphed wave itself (the 6 tables, the one you hear lit), over the live spectrum; what is
 * wired into FM / Ring; keyboard. */
OrganismFactory.reg('eravos.syn-osc', function (view) {
  const UI = view.ui, h = UI.h, TB = view.descriptor.tables, N = 256;
  const shapes = {};   // bank → [NT × Float32Array(N)] time-domain shapes, normalised for drawing
  function bankShapes(b) {
    if (shapes[b]) return shapes[b];
    shapes[b] = TB.BANKS[b].map(a => { const y = new Float32Array(N); let pk = 1e-9; for (let i = 0; i < N; i++) { let s = 0; for (let k = 1; k <= TB.H; k++) if (a[k]) s += a[k] * Math.sin(2 * Math.PI * k * i / N); y[i] = s; pk = Math.max(pk, Math.abs(s)); } for (let i = 0; i < N; i++) y[i] /= pk; return y; });
    return shapes[b];
  }
  const cv = UI.Canvas(520, 120);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 120, s = view.state, sh = bankShapes(s.bank || 'analog'), m = (s.morph || 0) * (TB.NT - 1);
    g.fillStyle = '#05100f'; g.fillRect(0, 0, W, H);
    const tw = W / TB.NT;   // the strip of tables along the top
    sh.forEach((y, k) => { const w = Math.max(0, 1 - Math.abs(m - k)); g.strokeStyle = w > 0 ? `rgba(58,214,196,${0.35 + 0.65 * w})` : '#1a3a36'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < N; i += 4) { const x = k * tw + 4 + i / N * (tw - 8), yy = 16 - y[i] * 10; i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); });
    const k0 = Math.floor(m), f = m - k0, a = sh[Math.min(TB.NT - 1, k0)], b = sh[Math.min(TB.NT - 1, k0 + 1)];
    g.strokeStyle = '#3ad6c4'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < N; i++) { const y = a[i] * (1 - f) + b[i] * f, x = i / (N - 1) * W, yy = 72 - y * 40; i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${s.bank} · morph ${(s.morph || 0).toFixed(2)}${+s.ratio !== 1 ? ' · ×' + s.ratio : ''}`, 6, H - 6);
  }, 30);
  const inputs = h('div', { class: 'uk-hint' });
  function paintInputs() {
    const ws = view.K.wires.list().filter(w => w.dst.instanceId === view.instanceId && /fm_in|ring_in/.test(w.dst.hookId));
    const fm = ws.filter(w => /fm_in/.test(w.dst.hookId)).map(w => view.label(w.src.instanceId)), ring = ws.filter(w => /ring_in/.test(w.dst.hookId)).map(w => view.label(w.src.instanceId));
    inputs.textContent = (fm.length ? `FM ← ${fm.join(', ')}` : 'FM in: nothing — wire another Morph Osc (or any sound) to its left “fm in” dot') + '  ·  ' + (ring.length ? `Ring ← ${ring.join(', ')}` : 'Ring in: nothing');
  }
  view.observe('kernel:wire-registered', paintInputs); view.observe('kernel:wire-removed', paintInputs); paintInputs();
  UI.instrumentPanel(view, { top: [cv, inputs], keys: ['bank', 'morph', 'octave', 'ratio', 'fine', 'glide', 'unison', 'detune', 'width', 'fmIndex', 'ring', 'follow', 'attack', 'decay', 'sustain', 'release', 'velocity', 'level'], low: 48, high: 72, color: '#3ad6c4',
    hint: 'Small tools, bigger sounds: wire a second Morph Osc into FM in for FM (it follows these notes), an Envelope into Morph to sweep the tables, or put a Destroyer in a Wub Osc mod slot.' });
});

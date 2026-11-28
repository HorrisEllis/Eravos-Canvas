/* eravos.ripple UI — the RIPPLE element (unison-stack's: the grind's voices and the swell they make, drawn from the real settings), the
 * WAVELENGTH of the note played (λ = 343 / f), a live spectrum (the sub against the grind), the keys, and the controls by part. */
OrganismFactory.reg('eravos.ripple', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory, ACC = '#ff5a3c', ACC2 = '#5ac8ff', DIM = '#8f8f99', TAU = Math.PI * 2;
  const S = (k) => view.state[k];
  let t = 0, lastNote = 45;
  const label = (g, s, x, y, c) => { g.fillStyle = c || DIM; g.font = '10px ui-monospace, monospace'; g.fillText(s, x, y); };
  // RIPPLE: each grind voice (faint), their sum (white), the swell's envelope (dashed) — at the real Beat; slowed so it can be seen
  const cv = UI.Canvas(560, 110);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 110, b = S('beat'), n = S('voices'), mid = H / 2 + 4; t += 1 / 30;
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    const sh = (x) => t * 0.25 + x / W * 2, f = 9;   // f: a drawn carrier (the real one is far too fast to see); the swell is real time
    for (let k = 0; k < Math.min(n, 3); k++) { g.strokeStyle = k ? ACC : ACC2; g.globalAlpha = 0.35; g.beginPath();
      for (let x = 0; x < W; x++) { const off = n > 1 ? (k / (n - 1) - 0.5) * b : 0, y = mid - 30 - 8 * Math.sin(TAU * (f + off) * sh(x)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.globalAlpha = 1; g.strokeStyle = '#e8e8ea'; g.lineWidth = 1.2; g.beginPath();
    for (let x = 0; x < W; x++) { let v = 0; for (let k = 0; k < n; k++) v += Math.sin(TAU * (f + (n > 1 ? (k / (n - 1) - 0.5) * b : 0)) * sh(x)); const y = mid + 10 - 24 * v / n; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1;
    if (n === 2) { g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); for (let x = 0; x < W; x++) { const y = mid + 10 - 24 * Math.abs(Math.cos(Math.PI * b * sh(x))); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]); }
    const hz = MT.hz(lastNote + 12 * S('octave')), lam = 343 / hz;
    label(g, `RIPPLE · ${n} voices · ${b.toFixed(2)} swells / s`, 6, 12, '#e8e8ea');
    label(g, b < 0.05 ? 'No ripple: one clean wave' : b < 7 ? 'A swell: the floor breathes' : 'Roughness: a growl', 6, H - 6, b < 7 ? DIM : ACC);
    label(g, `WAVELENGTH · ${MT.noteName ? MT.noteName(lastNote + 12 * S('octave')) : ''} ${hz.toFixed(1)} Hz · one wave ${lam.toFixed(2)} m`, W - 300, 12, ACC2);
  }, 30);
  const an = view.tap('out', 4096);
  const spec = UI.Spectrum(an, { width: 560, height: 80, color: ACC });
  const kb = UI.Keyboard({ low: 40, high: 64, key: view.key, onDown: (n, v) => { lastNote = n; view.emit('key_down', { note: n, velocity: v }); }, onUp: (n) => view.emit('key_up', { note: n }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  view.on('voices', (v) => { if (v.active && v.active.length) lastNote = v.active[v.active.length - 1]; });
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 4 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const face = h('div', { class: 'uk-panel' }, [card('RIPPLE', ['voices', 'beat', 'width']), card('GRIND', ['drive', 'grind']), card('SUB', ['sub']), card('FILTER', ['cutoff', 'fEnv']), card('DIVE', ['dive', 'diveTime', 'diveCurve']), card('COLLIDE', ['collideFrom', 'collideTime']), card('MOD', ['modAmt', 'modRatio', 'modWave'])]);
  const deep = h('div', { class: 'uk-panel' }, [card('RIPPLE+', ['detune']), card('GRIND+', ['wave', 'midOct', 'bias']), card('FILTER+', ['res', 'fDec']), card('AMP', ['aA', 'aD', 'aS', 'aR']), card('OUT', ['octave', 'level'])]);
  deep.style.display = 'none';
  const more = UI.Button({ label: 'More depth ▸', hint: 'Detune in cents, the grind’s wave, octave and bias, resonance, the filter’s decay, the amp envelope, octave and level', onClick: () => { const show = deep.style.display === 'none'; deep.style.display = show ? '' : 'none'; more.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv, spec.el || spec, kb.el, face, h('div', { class: 'org-row' }, [more.el]), deep,
    UI.hint('A clean sub on the note, and above it a grind of voices a few hertz apart: they swell together Beat times a second on every note. Drive turns their sums and differences into new partials. The ripple goes out (violet) to move any other knob.'));
});

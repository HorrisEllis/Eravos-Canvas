/* eravos.wub-rate UI — the step pattern (click a step to change its rate, right-click to go back), the shape you'll
 * hear drawn with its polarity, and the playing step lit. Only view.* : state in, view.emit out. */
OrganismFactory.reg('eravos.wub-rate', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const OPTS = ['off', 'hold', '1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  // shape preview: the same drawing the engine plays (UI keeps its own copy — it never reads the engine)
  const SHAPE = {
    sine: (p) => -Math.cos(2 * Math.PI * p), sawdown: (p) => 1 - 2 * p, sawup: (p) => -1 + 2 * p, square: (p) => p < 0.5 ? 1 : -1,
    triangle: (p) => p < 0.5 ? -1 + 4 * p : 3 - 4 * p,
    talk: (p) => p < 0.22 ? -1 + 2 * Math.sin((p / 0.22) * Math.PI / 2) : p < 0.45 ? 1 - 0.9 * Math.sin(((p - 0.22) / 0.23) * Math.PI / 2) : p < 0.6 ? 0.1 + 0.5 * Math.sin(((p - 0.45) / 0.15) * Math.PI) : 0.1 - 1.1 * ((p - 0.6) / 0.4),
  };
  const POL = { 'unipolar+': [0.5, 0.5], 'unipolar−': [-0.5, -0.5], 'bipolar': [0, 1], 'bipolar inverted': [0, -1] };
  let current = -1;
  // ---- step grid
  const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', margin: '6px 0' } });
  const cells = Array.from({ length: 16 }, (_, i) => {
    const b = h('button', { class: 'tb-btn', style: { fontFamily: 'monospace', fontSize: '12px', padding: '8px 0', minWidth: 0 }, title: `step ${i + 1}: click = faster, right-click = slower` });
    const step = (dir) => { const s = (view.state.steps || [])[i] || '1/8', j = OPTS.indexOf(s); view.emit('step_set', { index: i, value: OPTS[(j + dir + OPTS.length) % OPTS.length] }); };
    b.onclick = () => step(1); b.oncontextmenu = (e) => { e.preventDefault(); step(-1); };
    grid.appendChild(b); return b;
  });
  function paint() {
    const s = view.state.steps || [], n = view.state.length || 8;
    cells.forEach((b, i) => {
      const v = s[i] || '1/8', on = i < n;
      b.textContent = v === 'off' ? '·' : v === 'hold' ? '→' : v;
      b.style.opacity = on ? '1' : '0.28';
      b.style.borderColor = i === current ? 'var(--acc, #b066ff)' : '';
      b.style.background = i === current ? 'rgba(176,102,255,.28)' : v === 'off' ? 'rgba(0,0,0,.25)' : '';
    });
  }
  view.bind('steps', paint); view.bind('length', paint);
  view.on('step', (p) => { current = p && typeof p.index === 'number' ? p.index : -1; paint(); });
  // ---- shape preview (two cycles, polarity applied, 0 line drawn)
  const cv = UI.Canvas(460, 90);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 90, s = view.state, f = SHAPE[s.shape] || SHAPE.sine, [c, k] = POL[s.polarity] || POL['unipolar+'], d = s.depth === undefined ? 1 : s.depth;
    g.fillStyle = '#0b0812'; g.fillRect(0, 0, W, H);
    const yOf = (v) => H / 2 - v * H * 0.42;
    g.fillStyle = '#2a2140'; g.fillRect(0, yOf(0), W, 1); g.fillRect(W / 2, 0, 1, H);
    g.strokeStyle = '#b066ff'; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x <= W; x++) { const p = ((x / W) * 2 + (s.phase || 0)) % 1, v = d * (c + k * f(p)); x ? g.lineTo(x, yOf(v)) : g.moveTo(x, yOf(v)); }
    g.stroke();
    g.fillStyle = '#9a8cb8'; g.font = '10px monospace';
    g.fillText(`${s.shape} · ${s.polarity} · step = ${s.stepLen}`, 6, 12); g.fillText('open', W - 34, 12); g.fillText(k > 0 ? '0 = closed' : 'inverted', W - 70, H - 4);
  }, 20);
  const ctl = (k) => UI.paramControl(view, cfg(k)).el;
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' } }, [UI.presetBar(view), ctl('shape'), ctl('polarity')]),
    cv,
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', margin: '6px 0 0' } }, [
      ctl('stepLen'), ctl('retrig'), ctl('noteRetrig'),
      h('span', {}, [UI.Button({ label: '◀', hint: 'move the pattern one step earlier', onClick: () => view.emit('steps_shift', { by: -1 }) }).el, UI.Button({ label: '▶', hint: 'one step later', onClick: () => view.emit('steps_shift', { by: 1 }) }).el]),
    ]),
    grid,
    UI.paramPanel(view, ['length', 'phase', 'smooth', 'depth'], { size: 32 }),
    UI.hint('Drag the violet dot onto Wub Filter’s “wub” input. Each step is one rate: · = off (mouth shut), → = hold (keep going). Notes on a Wub Osc restart the wobble.'),
  );
  paint();
});

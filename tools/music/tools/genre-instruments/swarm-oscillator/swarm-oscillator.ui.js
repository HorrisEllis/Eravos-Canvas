/* eravos.swarm-oscillator UI — the face approved as a preview (tools/music/planned/swarm-oscillator.ui.md): the swarm display and the
 * coherence meter, Mode · Shape · Lock on beat, SWARM / TONE / OUT on the face, the rest behind More depth ▸, the kit keyboard.
 * The display draws the real swarm: while a note sounds, the phases the worklet sends (relative to the swarm's mean); when silent, the
 * same component (MusicParts.POP) run here with the current settings, so you see what it will do before you play. */
OrganismFactory.reg('eravos.swarm-oscillator', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), st = () => view.state || {};
  const MP = window.MusicParts, MODES = ['free', 'coupled', 'harmonic', 'chaotic'];
  let live = null, liveAt = 0;
  view.on('swarm', (s) => { live = s; liveAt = performance.now(); });
  // silent: the population component itself, here, with the current settings (a slow f0 so the motion is visible)
  const sim = MP.POP(32); let simKey = '';
  const simSync = () => { const s = st(), k = [s.voices, s.spread, s.mode, s.coupling, s.pull, s.drift, s.cluster].join(); if (k === simKey) return; simKey = k;
    sim.configure(s.voices || 9, (s.spread === undefined ? 0.35 : s.spread) * 50, 5); sim.set({ mode: Math.max(0, MODES.indexOf(s.mode)), coupling: s.coupling, pull: s.pull, drift: s.drift, cluster: s.cluster, restless: s.restless || 0, form: s.form || 0, fm: s.fieldFm || 0 }); };
  const cv = UI.Canvas(520, 120);
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 120;
    let phases, coh, sounding = live && live.sounding && performance.now() - liveAt < 300;
    if (sounding) { phases = live.phases; coh = live.coh; }
    else { simSync(); for (let i = 0; i < 40; i++) sim.step(2, 400); const p = sim.psi / (2 * Math.PI); phases = []; for (let i = 0; i < sim.n; i++) phases.push(sim.eff(i) - p); coh = sim.R; }
    g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
    const ox = W * 0.36, oy = H / 2, N = phases.length;
    g.strokeStyle = 'rgba(138,92,255,.18)'; g.lineWidth = 1; for (let i = 0; i < N; i++) { g.beginPath(); g.arc(ox, oy, 14 + i * (40 / Math.max(1, N)), 0, 6.283); g.stroke(); }
    const pr = 14 * coh * 3, px = ox + pr, py = oy;   // the centre of pull (the mean phase points right: phases are drawn relative to it)
    for (let i = 0; i < N; i++) { const r = 14 + i * (40 / Math.max(1, N)), a = 2 * Math.PI * phases[i], x = ox + Math.cos(a) * r, y = oy + Math.sin(a) * r;
      g.strokeStyle = `rgba(185,155,255,${0.08 + 0.35 * coh})`; g.beginPath(); g.moveTo(x, y); g.lineTo(px, py); g.stroke();
      g.fillStyle = '#b99bff'; g.beginPath(); g.arc(x, y, 3, 0, 6.283); g.fill(); }
    g.fillStyle = '#e4d9ff'; g.beginPath(); g.arc(px, py, 2.5, 0, 6.283); g.fill();
    const mx = W * 0.66, mw = W * 0.3; g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText('COHERENCE', mx, 30);
    g.fillStyle = '#151518'; g.fillRect(mx, 38, mw, 8); const mg = g.createLinearGradient(mx, 0, mx + mw, 0); mg.addColorStop(0, '#5a3bd1'); mg.addColorStop(1, '#c7b0ff'); g.fillStyle = mg; g.fillRect(mx, 38, mw * coh, 8);
    g.fillStyle = '#e4d9ff'; g.font = '18px ui-monospace, monospace'; g.fillText(coh.toFixed(2), mx, 72);
    g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(coh > 0.8 ? 'locked' : coh > 0.4 ? 'beating' : 'apart', mx + 50, 72);
    g.fillText(sounding ? '→ coherence out' : 'preview — play a note', mx, 92);
  }, 30);
  const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el;
  // cards from kit parts, each control tagged with its key (so the dynamic rules find it — the Wobble Bass way)
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const face = h('div', { class: 'uk-panel' }, [card('SWARM', ['voices', 'spread', 'coupling', 'cluster']), card('TONE', ['cutoff', 'res', 'attack', 'release']), card('OUT', ['width', 'level'])]);
  const deepBox = h('div', { class: 'uk-panel', style: { display: 'none' } }, [   // display, not [hidden]: .uk-panel's own display wins over the attribute
   card('SWARM+', ['pull', 'drift']), card('OSC+', ['table', 'sub', 'octave']), card('FILTER+ / AMP+', ['envAmt', 'decay', 'sustain']), card('MOVE', ['lfoRate', 'lfoCouple']), card('LIFE', ['restless', 'form', 'fieldFm', 'cohTone']), card('OUT+', ['monoBelow'])]);
  const deepB = UI.Button({ label: 'More depth ▸', hint: 'pull, drift, restless, form glide, field FM, lock → tone, wavetable, sub, octave, filter envelope, decay / sustain, a movement on the pull, mono low end', onClick: () => { const open = deepBox.style.display === 'none'; deepBox.style.display = open ? '' : 'none'; deepB.set(open ? 'More depth ▾' : 'More depth ▸'); } });
  UI.instrumentPanel(view, { color: '#8a5cff', low: 48, high: 72, height: 56,
    header: [sel('mode')],
    top: [cv, h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: 'OSC' }), sel('shape'), h('span', { class: 'org-label', text: 'LOCK' }), sel('sync')])],
    middle: [face, h('div', { class: 'org-row' }, [deepB.el]), deepBox],
    keys: [],
    hint: 'Coupling pulls the voices together: low = a loose supersaw, high = one locked wave. Cluster settles them on 3rds, 5ths and octaves. Lock on beat snaps them in phase on the grid. Coherence out moves any knob.' });
  // dynamic: a control that does nothing in this state dims and says why
  const RULES = [['coupling', 'mode', (v) => v !== 'free', 'free: the voices do not pull on each other'], ['pull', 'mode', (v) => v !== 'free', 'free: no pull'], ['lfoCouple', 'mode', (v) => v !== 'free', 'free: no pull to move'],
    ['cluster', 'mode', (v) => v === 'harmonic', 'Cluster works in harmonic mode'], ['table', 'shape', (v) => v === 'table', 'Table works with the table shape'], ['form', 'mode', (v) => v === 'harmonic', 'Form glide works in harmonic mode'], ['restless', 'mode', (v) => v !== 'free', 'free: nothing locks, so nothing bursts']];
  const dim = () => RULES.forEach(([k, sw, ok, why]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; const v = st()[sw] !== undefined ? st()[sw] : cfg(sw).default, on = ok(v); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : '⏸ ' + why; });
  [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
});

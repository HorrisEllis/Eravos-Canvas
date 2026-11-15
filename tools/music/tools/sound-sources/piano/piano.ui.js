/* eravos.piano UI — the face approved as a preview (tools/music/planned/piano.ui.md · docs/previews/piano.preview.js): the hammer and what
 * sounds, its partials (stretched, never exactly harmonic), the tremolo; Model on top; STRIKE / BODY / MOVE / OUT on the face, the rest
 * behind More depth ▸; the kit keyboard. The display strikes when a note really plays (the worklet says how loud it rings). */
OrganismFactory.reg('eravos.piano', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
  let live = { level: 0, sounding: 0, pedal: false }, liveAt = 0, hit = 0, lastLevel = 0;
  view.on('piano', (s) => { live = s; liveAt = performance.now(); if (s.level > lastLevel + 0.05) hit = Math.max(hit, s.level); lastLevel = s.level; });
  const cv = UI.Canvas(540, 120); let t = 0;
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 120; t += 1 / 30;
    const playing = live.sounding && performance.now() - liveAt < 300;
    if (playing) hit = Math.max(hit * 0.9, live.level); else { if ((t % 1.6) < 1 / 30) hit = 1; hit *= Math.exp(-1 / 30 / Math.max(0.3, P('decay') / 3)); }
    const m = P('model'); g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    // the hammer
    const hx = W * 0.08, hy = 60 - hit * 18; g.fillStyle = '#c9bfae'; g.fillRect(hx - 8, hy - 4, 16, 8); g.fillRect(hx - 1, hy + 4, 2, 30);
    // what sounds, vibrating
    g.strokeStyle = '#e7b49b'; g.lineWidth = m === 'grand' || m === 'upright' || m === 'honky' ? 1 : 2; const lines = m === 'grand' || m === 'honky' ? 3 : m === 'upright' || m === 'felt' ? 2 : 1;
    for (let s = 0; s < lines; s++) { g.beginPath(); for (let x = 0; x <= W * 0.42; x += 2) { const u = x / (W * 0.42); const y = 52 + s * 5 + Math.sin(u * Math.PI) * Math.sin(t * 40 + s) * hit * 10 * (m === 'felt' ? 0.5 : 1); x ? g.lineTo(W * 0.12 + x, y) : g.moveTo(W * 0.12, y); } g.stroke(); }
    if (m === 'tine') { g.fillStyle = 'rgba(242,232,213,.35)'; g.fillRect(W * 0.12, 70, W * 0.42, 5); }   // the tonebar
    // partials (stretched)
    const px0 = W * 0.62, pw = W * 0.34, B = 0.0004 * (0.3 + P('inharm'));
    g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(m.toUpperCase() + ' · partials' + (playing ? '' : ' · preview'), px0, 14);
    for (let k = 1; k <= 12; k++) { const f = k * Math.sqrt(1 + B * k * k), x = px0 + (f / 13) * pw, a = hit * Math.pow(0.72 + 0.2 * P('brightness'), k - 1) * (k === 3 || k === 7 ? 1 + P('bell') : 1);
      g.fillStyle = '#e7b49b'; g.globalAlpha = 0.25 + 0.75 * Math.min(1, a); g.fillRect(x, 100 - Math.min(80, a * 80), 3, Math.min(80, a * 80)); } g.globalAlpha = 1;
    // tremolo
    const ep = m === 'tine' || m === 'reed', tr = ep ? P('trem') : 0, pan = Math.sin(t * 2 * Math.PI * P('tremRate')) * tr; g.fillStyle = '#8f8f99'; g.fillText('L', px0, H - 4); g.fillText('R', px0 + pw - 6, H - 4);
    g.fillStyle = '#e7b49b'; g.fillRect(px0 + pw / 2 + pan * pw * 0.4 - 2, H - 12, 4, 6);
    if (P('pedal')) { g.fillStyle = '#e7b49b'; g.fillText('PEDAL', W * 0.12, H - 4); }
  }, 30);
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const face = h('div', { class: 'uk-panel' }, [card('STRIKE', ['hardness', 'brightness', 'bell']), card('BODY', ['decay', 'release', 'resonance']), card('MOVE', ['trem', 'tremRate']), card('OUT', ['drive', 'width', 'level'])]);
  const deepBox = h('div', { class: 'uk-panel', style: { display: 'none' } }, [   // display, not [hidden]: .uk-panel's own display wins over the attribute
    card('STRING+', ['detune', 'inharm', 'sympathetic']), card('PLAY+', ['velCurve', 'keyOff', 'pedalNoise']), card('MIC', ['micX', 'micY', 'lid']), h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('tremSync')).el])]);
  const deepB = UI.Button({ label: 'More depth ▸', hint: 'string detune, stretch, sympathetic strings, velocity curve, key-off thump, pedal noise, mic position, lid, tremolo on the beat', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.set(show ? 'More depth ▾' : 'More depth ▸'); } });
  UI.instrumentPanel(view, { color: '#e7b49b', low: 48, high: 72, height: 56,
    header: [UI.paramControl(view, cfg('model'), { segMax: 6 }).el],
    top: [cv, h('div', { class: 'org-row', style: { gap: '6px' } }, [UI.paramControl(view, cfg('pedal')).el])],
    middle: [face, h('div', { class: 'org-row' }, [deepB.el]), deepBox],
    keys: [],
    hint: 'Tine is the electric piano of soul and lofi, reed is the barkier one, felt is the soft muted upright. Bell brings out the tine’s ring; Tremolo moves it left and right.' });
  // dynamic: a control that does nothing for this model dims and says why
  const EP = (v) => v === 'tine' || v === 'reed', STR = (v) => !EP(v);
  const RULES = [['bell', 'model', EP, 'Bell is the tine’s or reed’s ring'], ['trem', 'model', EP, 'Tremolo is the electric pianos’'], ['tremRate', 'model', EP, 'Tremolo is the electric pianos’'],
    ['detune', 'model', STR, 'strings only'], ['inharm', 'model', STR, 'strings only'], ['sympathetic', 'model', STR, 'strings only'], ['lid', 'model', (v) => v === 'grand', 'only the grand has a lid'],
    ['tremRate', 'tremSync', (v) => v === 'free', 'on the beat: the transport sets the rate']];
  const dim = () => { const off = {}; RULES.forEach(([k, sw, ok, why]) => { if (!ok(P(sw)) && !off[k]) off[k] = why; });
    RULES.forEach(([k]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; el.style.opacity = off[k] ? '0.35' : ''; el.title = off[k] ? '⏸ ' + off[k] : ''; }); };
  [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
});

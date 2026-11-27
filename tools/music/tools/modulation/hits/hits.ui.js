/* eravos.hits UI — the hits as they happen (read from the tool's own Pulse), how many, what they play, and the controls. */
OrganismFactory.reg('eravos.hits', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#ffb44a', DIM = '#8f8f99', MT = window.MusicTheory;
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const tap = view.tap('pulse', 128), buf = new Float32Array(128), hist = []; let n = 0;
  view.on('hit', (p) => { n = p.n; });
  const cv = UI.Canvas(420, 100);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 100; tap.getFloatTimeDomainData(buf); let v = 0; for (const x of buf) v = Math.max(v, x); hist.push(v); if (hist.length > W) hist.shift();
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    hist.forEach((x, i) => { if (x > 0.02) { g.fillStyle = ACC; g.globalAlpha = Math.min(1, x); g.fillRect(i, H - 8 - x * (H - 32), 1.5, x * (H - 32)); } }); g.globalAlpha = 1;
    const ws = view.K.wires.list().filter(w => w.src.instanceId === view.instanceId && /note_out/.test(w.src.hookId)), into = view.K.wires.list().filter(w => w.dst.instanceId === view.instanceId);
    g.font = '10px ui-monospace, monospace'; g.fillStyle = '#e8e8ea'; g.fillText(`Hits ${n}`, 6, 12);
    g.fillStyle = DIM; g.fillText(into.length ? 'Hearing ' + view.label(into[0].src.instanceId) : 'Wire a sound into it (the dot on its left)', 6, 24);
    g.fillText(ws.length ? 'Playing ' + (MT && MT.noteName ? MT.noteName(view.state.note) : view.state.note) + ' on ' + ws.map(w => view.label(w.dst.instanceId)).join(', ') : 'Then wire Notes into any instrument', W - 240, 12);
  }, 30);
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv,
    h('div', { class: 'uk-panel' }, [card('HEAR', ['sense', 'floor', 'gap']), card('PLAY', ['note', 'length', 'velFollow', 'level'])]),
    UI.hint('One tool’s hits play another tool. A kick in, a bass out: every kick plays the bass note, as hard as the kick. The Pulse (violet) moves any knob on every hit.'));
});

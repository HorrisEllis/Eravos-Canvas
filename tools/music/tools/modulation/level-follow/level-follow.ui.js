/* eravos.level-follow UI — what it hears and what it sends: the sound's level (read from the tool's own output) drawn as it moves, the knob it
 * moves named, and the controls. */
OrganismFactory.reg('eravos.level-follow', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#7fe08a', DIM = '#8f8f99';
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const tap = view.tap('level', 128), buf = new Float32Array(128), hist = [];
  const cv = UI.Canvas(420, 110);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 110; tap.getFloatTimeDomainData(buf); const v = buf[buf.length - 1] || 0; hist.push(v); if (hist.length > W) hist.shift();
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); hist.forEach((x, i) => { const y = H - 10 - x * (H - 34); i ? g.lineTo(i, y) : g.moveTo(i, y); }); g.stroke(); g.lineWidth = 1;
    const ws = view.K.wires.list().filter(w => w.src.instanceId === view.instanceId), into = view.K.wires.list().filter(w => w.dst.instanceId === view.instanceId);
    g.font = '10px ui-monospace, monospace'; g.fillStyle = '#e8e8ea'; g.fillText(`Level ${Math.round(v * 100)} %`, 6, 12);
    g.fillStyle = DIM; g.fillText(into.length ? 'Following ' + view.label(into[0].src.instanceId) : 'Wire a sound into it (the dot on its left)', 6, 24);
    g.fillText(ws.length ? 'Moving ' + ws.map(w => view.label(w.dst.instanceId) + ' · ' + w.dst.hookId.split('.').pop().replace(/^mod_/, '').replace(/_/g, ' ')).join(', ') : 'Then wire its out (violet) into any knob', W - 250, 12);
  }, 30);
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv,
    h('div', { class: 'uk-panel' }, [card('FOLLOW', ['attack', 'hold', 'release', 'floor']), card('OUT', ['amount', 'invert', 'offset'])]),
    UI.hint('One tool’s loudness moves another tool’s knob. A bass in, a filter’s cutoff out: the louder the bass, the brighter the filter. Invert it for a duck.'));
});

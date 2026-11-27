/* eravos.pitch-notes UI — what it hears and what it plays: the line drawn as it moves (read from the tool's own Pitch out), the note sung
 * (and how far off it is), the note played, and the controls. */
OrganismFactory.reg('eravos.pitch-notes', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#b48cff', DIM = '#8f8f99', MT = window.MusicTheory;
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 5 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const tap = view.tap('pitch', 128), buf = new Float32Array(128), hist = []; let last = null;
  const name = (n) => MT && MT.noteName ? MT.noteName(n) : String(n);
  view.on('heard', (p) => { last = p.off ? Object.assign({}, last || {}, { off: true }) : p; });
  const cv = UI.Canvas(440, 120);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 120; tap.getFloatTimeDomainData(buf); const v = buf[buf.length - 1] || 0; hist.push(v); if (hist.length > W) hist.shift();
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    const lo = 36 / 127, hi = 96 / 127, y = (x) => H - 8 - (Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo) * (H - 34);
    g.strokeStyle = '#1c1c20'; for (let m = 36; m <= 96; m += 12) { g.beginPath(); g.moveTo(0, y(m / 127)); g.lineTo(W, y(m / 127)); g.stroke(); }
    g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); let on = false; hist.forEach((x, i) => { if (x <= 0) { on = false; return; } on ? g.lineTo(i, y(x)) : g.moveTo(i, y(x)); on = true; }); g.stroke(); g.lineWidth = 1;
    const ws = view.K.wires.list().filter(w => w.src.instanceId === view.instanceId && /note_out/.test(w.src.hookId)), into = view.K.wires.list().filter(w => w.dst.instanceId === view.instanceId);
    g.font = '10px ui-monospace, monospace'; g.fillStyle = '#e8e8ea';
    g.fillText(last && !last.off ? `Sung ${name(last.sung)} ${last.cents >= 0 ? '+' : ''}${last.cents} c · plays ${name(last.note)}` : 'Silence', 6, 12);
    g.fillStyle = DIM; g.fillText(into.length ? 'Hearing ' + view.label(into[0].src.instanceId) : 'Wire a voice or a line into it (the dot on its left)', 6, 24);
    g.fillText(ws.length ? 'Playing ' + ws.map(w => view.label(w.dst.instanceId)).join(', ') : 'Then wire Notes into any instrument', W - 220, 12);
  }, 30);
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv,
    h('div', { class: 'uk-panel' }, [card('HEAR', ['settle', 'min', 'max', 'gate']), card('PLAY', ['inKey', 'octave', 'length', 'velFollow', 'level'])]),
    UI.hint('One tool’s pitch plays another tool. Sing, or wire any single line in: each note it holds plays on the instrument wired to Notes, snapped into the key, fitted to the beat.'));
});

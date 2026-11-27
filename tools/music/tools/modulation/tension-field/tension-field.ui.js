/* eravos.tension-field UI — the TENSION element (tension-meter's and energy-curve's): the four heard kinds stacked as they move (read from the
 * tool's own outputs), the result drawn over them, the build's target and its Release mark; ⇡ Build and ⇣ Release. Then the controls by part. */
OrganismFactory.reg('eravos.tension-field', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#ff5a3c', DIM = '#8f8f99';
  const cfg = (k) => view.descriptor.config.find(c => c.key === k), S = (k) => view.state[k];
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 3 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const KINDS = [['loudness', 'Loudness', '#7fe08a'], ['brightness', 'Brightness', '#e8e8ea'], ['density', 'Density', '#5ac8ff'], ['motion', 'Motion', '#b48cff']];
  const taps = {}; ['tension', 'release'].concat(KINDS.map(k => k[0])).forEach(k => { taps[k] = view.tap(k, 128); });
  const buf = new Float32Array(128), read = (k) => { taps[k].getFloatTimeDomainData(buf); return buf[buf.length - 1] || 0; };
  const hist = []; let rel = 0;
  const cv = UI.Canvas(560, 180);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 180, top = 30, base = H - 16, N = 240;
    const row = { tension: read('tension'), release: read('release') }; KINDS.forEach(([k]) => { row[k] = read(k); }); hist.push(row); if (hist.length > N) hist.shift();
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    const x = (i) => (i / (N - 1)) * W, y = (v) => base - Math.max(0, Math.min(1, v)) * (base - top);
    // the heard kinds, stacked (each a quarter of the height at most)
    hist.forEach((r, i) => { let acc = 0; KINDS.forEach(([k, , col]) => { const v = r[k] * (base - top) / 4; g.fillStyle = col; g.globalAlpha = 0.45; g.fillRect(x(i), base - acc - v, W / N + 0.6, v); acc += v; }); });
    g.globalAlpha = 1; g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); hist.forEach((r, i) => { i ? g.lineTo(x(i), y(r.tension)) : g.moveTo(x(i), y(r.tension)); }); g.stroke(); g.lineWidth = 1;
    hist.forEach((r, i) => { if (r.release > 0.5 && (i === 0 || hist[i - 1].release <= r.release)) { g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x(i), top - 6); g.lineTo(x(i), base); g.stroke(); g.setLineDash([]); g.fillStyle = ACC; g.font = '10px ui-monospace, monospace'; g.fillText('RELEASE', x(i) + 4, top + 4); } });
    g.font = '10px ui-monospace, monospace'; let lx = 6; KINDS.forEach(([k, name, col]) => { g.fillStyle = col; g.fillText(name, lx, 12); lx += g.measureText(name).width + 14; });
    g.fillStyle = ACC; g.fillText(`Tension ${Math.round(row.tension * 100)} %`, W - 110, 12);
    g.fillStyle = DIM; g.fillText(S('mode') === 'measure' ? 'Heard from what is wired in' : S('mode') === 'target' ? `Build: Peak by bar ${S('hold')}` : `Heard, never below the build (bar ${S('hold')})`, 6, 24);
  }, 30);
  let building = false; const go = UI.Button({ label: '⇡ Build', kind: 'primary', hint: 'start the build now (it also starts when the transport plays)', onClick: () => { view.emit(building ? 'release_now' : 'build_now', {}); } });
  const label = () => { go.el.textContent = building ? '⇣ Release' : '⇡ Build'; go.el.title = building ? 'let the tension go now' : 'start the build now (it also starts when the transport plays)'; };
  view.on('build', () => { building = true; label(); }); view.on('release', () => { building = false; label(); });
  const face = h('div', { class: 'uk-panel' }, [card('Mode', ['mode']), card('Build', ['hold', 'shape', 'release', 'loop']), card('Hear', ['wLoud', 'wBright', 'wDense', 'wMotion'])]);
  const deep = h('div', { class: 'uk-panel' }, [card('Build+', ['floor', 'peak', 'rest'])]); deep.style.display = 'none';
  const more = UI.Button({ label: 'More depth ▸', hint: 'where the build starts and ends, and the rest between builds', onClick: () => { const show = deep.style.display === 'none'; deep.style.display = show ? '' : 'none'; more.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), go.el]), cv, face, h('div', { class: 'org-row' }, [more.el]), deep,
    UI.hint('Wire a sound (or the whole mix) in to hear its tension: Loudness, Brightness, Density, Motion. Or let it build: from Play, it climbs to Peak by the last bar of the Hold and lets go. Each one goes out (violet) to move any knob: wire Tension into a filter, Release into anything that should drop.'));
});

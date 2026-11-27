/* eravos.spatial-organism UI — the SPACE element (panner's): from above, you in the middle, the sound where it is NOW (read from the tool's
 * own "where" output), its orbit drawn, its distance as rings, the room's twelve echoes (early-reflections' taps, from the same settings) as
 * faint points around it. Then the controls by part. */
OrganismFactory.reg('eravos.spatial-organism', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#5ac8ff', ACC2 = '#ff5a3c', DIM = '#8f8f99', TAU = Math.PI * 2;
  const cfg = (k) => view.descriptor.config.find(c => c.key === k), S = (k) => view.state[k];
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 3 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const where = view.tap('where', 256), wb = new Float32Array(256), ER = window.MusicParts.Reflections(), trail = [];
  const cv = UI.Canvas(560, 200);
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 200, cx = W / 2, cy = H / 2 + 14, R = Math.min(W / 2 - 30, 160), ry = H / 2 - 22;
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2a2a2e'; [0.25, 0.5, 0.75, 1].forEach(r => { g.beginPath(); g.ellipse(cx, cy, R * r, ry * r, 0, 0, TAU); g.stroke(); });
    where.getFloatTimeDomainData(wb); const a = Math.max(-1, Math.min(1, wb[wb.length - 1] * 2 - 1 || S('angle')));
    const d = S('distance'), pos = (ang, dd) => { const th = -Math.PI / 2 + ang * Math.PI / 2, rr = 0.12 + 0.88 * dd; return [cx + Math.cos(th) * R * rr, cy + Math.sin(th) * ry * rr]; };
    // the orbit's reach (the arc the swing can cover) and the trail
    const lo = Math.max(-1, S('angle') - S('orbitDepth')), hi = Math.min(1, S('angle') + S('orbitDepth'));
    g.strokeStyle = 'rgba(90,200,255,.25)'; g.setLineDash([3, 4]); g.beginPath(); for (let k = 0; k <= 40; k++) { const [x, y] = pos(lo + (hi - lo) * k / 40, d); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
    const [sx, sy] = pos(a, d); trail.push([sx, sy]); if (trail.length > 30) trail.shift();
    trail.forEach(([x, y], i) => { g.fillStyle = `rgba(90,200,255,${i / trail.length * 0.4})`; g.fillRect(x - 1, y - 1, 3, 3); });
    // the room's echoes: each a faint point at its pan, further out the later it arrives
    if (S('room') > 0) { ER.set({ size: S('size'), predelay: S('predelay'), absorption: S('absorption'), damping: S('damping'), spread: S('spread'), level: 1 }, 48000);
      ER.taps().forEach(t => { const [x, y] = pos(t.pan, Math.min(1, d + t.t * 4)); g.fillStyle = `rgba(255,90,60,${Math.min(0.8, t.g * 2.5 * S('room'))})`; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }); }
    g.fillStyle = ACC; g.beginPath(); g.arc(sx, sy, 7, 0, TAU); g.fill();
    g.fillStyle = '#e8e8ea'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
    g.font = '10px ui-monospace, monospace'; g.fillStyle = DIM; g.fillText('you', cx - 9, cy + 16);
    g.fillStyle = '#e8e8ea'; g.fillText(`SPACE · ${a < -0.05 ? 'left ' + Math.round(-a * 90) + '°' : a > 0.05 ? 'right ' + Math.round(a * 90) + '°' : 'ahead'} · ${(0.5 + d * 3.5).toFixed(1)} m away${S('ears') > 0 ? ' · ears ' + Math.round(S('ears') * 100) + ' %' : ''}`, 6, 12);
    g.fillStyle = ACC2; g.fillText(S('room') > 0 ? `room ${S('size').toFixed(0)} m · 12 echoes` : 'no room', W - 150, 12);
    g.fillStyle = DIM; g.fillText(S('shape') === 'pendulum' ? `swings ${S('orbit').toFixed(2)} / s, lingers ${S('lean') > 0.05 ? 'right' : S('lean') < -0.05 ? 'left' : 'nowhere'}` : `orbits ${S('orbit').toFixed(2)} / s`, 6, 26);
  }, 30);
  const face = h('div', { class: 'uk-panel' }, [card('PLACE', ['angle', 'distance', 'ears']), card('MOTION', ['shape', 'orbit', 'orbitDepth', 'lean']), card('ROOM', ['room', 'size'])]);
  const deep = h('div', { class: 'uk-panel' }, [card('MOTION+', ['orbitDist']), card('ROOM+', ['predelay', 'absorption', 'damping', 'spread']), card('OUT', ['width', 'bassMono', 'mix'])]);
  deep.style.display = 'none';
  const more = UI.Button({ label: 'More depth ▸', hint: 'how far the swing carries it away, the room’s pre-delay, absorption, damping and spread, the input’s own width, bass mono, the mix', onClick: () => { const show = deep.style.display === 'none'; deep.style.display = show ? '' : 'none'; more.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv, face, h('div', { class: 'org-row' }, [more.el]), deep,
    UI.hint('Wire any sound through: it becomes a point around you. Near is loud, bright and now; far is quiet, dark and late. The swing moves it (the pendulum lingers on one side); the room answers with its first echoes. Where it is goes out (violet) to move anything else.'));
});

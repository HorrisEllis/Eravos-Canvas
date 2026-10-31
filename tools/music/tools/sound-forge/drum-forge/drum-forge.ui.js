/* eravos.drum-forge UI — 1.1 (3.79, in the look kit, the Groove way). The window is the tool: 4×4 square pads (bottom-left = pad 1,
 * like the StarryPad) that light on every hit, beside the chosen pad — its name, voice, rendered wave, play / WAV / send — and its
 * sound as a knob bank, with the kit's own knobs (room, volume, velocity → tone). Its page adds LAYERS (the pitch drop drawn: drag
 * where it starts, where it ends and how it bends; each layer's length; its filter, FM, room and choke) and MIX (a strip per pad:
 * level, pan, choke, room, a hit meter), beside MOTION and PERFORM from the domain. */
OrganismFactory.reg('eravos.drum-forge', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k, o) => UI.paramControl(view, cfg(k), o || {});
  const head = (title, right) => h('div', { class: 'mo-head' }, [h('span', { class: 'mo-dot' }), h('span', { class: 'mo-cap', text: title }), h('span', { class: 'mo-rule' })].concat(right || []));
  let accNow = view.descriptor.accent || '#ff7b00', accAt = 0;
  const acc = (el) => { const n = performance.now(); if (n - accAt > 250) { accAt = n; const v = getComputedStyle(el).getPropertyValue('--acc').trim(); if (v) accNow = v; } return accNow; };
  if (UI.alive) UI.alive(view, { events: ['hit'] });
  let slots = [], types = [], sel = 0, prev = null, range = {};
  const S = () => slots[sel] || {};
  const CURVED = ['kick', '808', 'tom', 'zap', 'impact'];

  // ---- the pads
  const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
  const grid = h('div', { class: 'forge-pads df-pads' }); const cells = [];
  ORDER.forEach(i => {
    const b = h('button', { class: 'forge-pad', 'aria-label': 'Pad ' + (i + 1) + ' — play' }, [h('span', { text: '' }), h('small', { text: '' })]);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); choose(i); view.emit('hit', { i, vel: e.shiftKey ? 1 : 0.85 }); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i); view.emit('hit', { i, vel: 0.85 }); } });
    cells[i] = b; grid.appendChild(b);
  });
  function paint() { cells.forEach((b, i) => { const s = slots[i]; if (!s) return; b.firstChild.textContent = s.name; b.lastChild.textContent = `${i + 1} · ${s.type}`; b.classList.toggle('sel', i === sel); b.setAttribute('aria-label', `Pad ${i + 1}: ${s.name} — play`); }); pick.forEach((b, i) => b.classList.toggle('on', i === sel)); }
  const meter = new Array(16).fill(0);
  view.on('hit', (p) => { const b = cells[p.i]; meter[p.i] = Math.max(meter[p.i], p.vel || 0.8); if (!b) return; b.classList.add('hit'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('hit'), 110); });
  function choose(i) { if (i === sel && prev) return; sel = i; paint(); fill(); view.emit('preview', { i }); }

  // ---- the chosen pad: name, voice, wave, actions
  const padNo = h('span', { class: 'df-no', text: 'PAD 1' });
  const typeSel = UI.Select({ options: [], onChange: (v) => view.emit('slot_edit', { i: sel, patch: { type: v }, audition: true }) });
  const name = h('input', { class: 'uk-text df-name', value: '', 'aria-label': 'pad name', title: 'pad name' }); name.addEventListener('change', () => view.emit('slot_edit', { i: sel, patch: { name: name.value } })); name.addEventListener('pointerdown', e => e.stopPropagation());
  const wave = UI.Canvas(300, 110); wave.classList.add('df-wave');
  UI.loop(wave, () => {
    const g = wave.g, W = wave.fit().W, H = wave.H, A = acc(wave); g.clearRect(0, 0, W, H); g.fillStyle = '#0c121a'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1c2836'; g.fillRect(0, H / 2, W, 1);
    if (!prev || prev.i !== sel) return; const n = prev.peaks.length / 2; g.fillStyle = A; g.shadowColor = A; g.shadowBlur = 6;
    for (let x = 0; x < W; x++) { const k = Math.floor(x / W * n), mn = prev.peaks[k * 2], mx = prev.peaks[k * 2 + 1]; g.fillRect(x, H / 2 - mx * H / 2 * 0.92, 1, Math.max(1, (mx - mn) * H / 2 * 0.92)); }
    g.shadowBlur = 0; g.fillStyle = '#8796a8'; g.font = '600 8.5px monospace'; g.fillText(prev.dur.toFixed(2) + ' S', W - 40, H - 6);
  }, 15);
  view.on('preview', (p) => { prev = p; });
  const targetSel = UI.Select({ options: [] });
  const refresh = () => targetSel.setOptions([{ value: '', label: 'send to…' }].concat(view.targets().filter(t => /Drum Machine|Sample|Song Recorder|Clip/i.test(t.label))));
  view.observe('factory:spawned', refresh); view.observe('kernel:organism', refresh); refresh();
  const padBox = h('div', { class: 'df-pad' }, [
    h('div', { class: 'df-padhead' }, [padNo, name, typeSel.el]), wave,
    h('div', { class: 'df-acts' }, [UI.Button({ label: '▶', hint: 'play', onClick: () => view.emit('hit', { i: sel }) }).el,
      UI.Button({ label: '⤓ WAV', hint: 'render this sound to a 24-bit WAV', onClick: () => view.emit('render', { i: sel }) }).el,
      h('div', { class: 'df-send' }, [targetSel.el, UI.Button({ label: '⇢ Send', hint: 'render and load it into the chosen Drum Machine / Sample Player / Song Recorder', onClick: () => { const t = targetSel.get(); if (t) view.emit('send', { i: sel, target: t }); } }).el])]),
  ]);

  // ---- a pad's knobs: made once, set to the chosen pad (nothing is rebuilt under the hand)
  const SPEC = { tune: [0.5, 'Tune', 'st'], decay: [0.01, 'Decay', 's'], pitch: [0.5, 'Pitch drop', 'st'], ptime: [0.001, 'Drop time', 's'], tone: [0.01, 'Tone'], noise: [0.01, 'Noise'], snap: [0.01, 'Snap'],
    drive: [0.01, 'Drive'], fm: [0.0001, 'FM ratio'], fmi: [0.01, 'FM index'], gate: [0.01, 'Room send'], pan: [0.01, 'Pan'], level: [0.01, 'Level'], choke: [1, 'Choke'],
    curve: [0.01, 'Drop curve'], nlen: [0.01, 'Noise length', '×'], clen: [0.01, 'Click length', '×'], filter: [0.01, 'Filter'] };
  const knobs = {}; let tmr = 0;
  const knob = (k, size) => {
    const [step, label, unit] = SPEC[k], r = range[k] || [0, 1];
    const kn = UI.Knob({ key: k, min: r[0], max: r[1], step, label, unit, value: S()[k], size: size || 44,
      format: k === 'filter' ? (v) => v < -0.005 ? 'LP ' + Math.round(-v * 100) : v > 0.005 ? 'HP ' + Math.round(v * 100) : 'OFF' : undefined,
      onChange: (v) => { view.emit('slot_edit', { i: sel, patch: { [k]: v } }); clearTimeout(tmr); tmr = setTimeout(() => { view.emit('hit', { i: sel, vel: 0.85 }); view.emit('preview', { i: sel }); }, 260); } });
    (knobs[k] = knobs[k] || []).push(kn); return kn.el;
  };
  function fill() {
    const s = S(); padNo.textContent = 'PAD ' + (sel + 1); if (document.activeElement !== name) name.value = s.name || '';
    typeSel.setOptions(types.map(t => ({ value: t, label: t }))); typeSel.set(s.type || '');
    Object.keys(knobs).forEach(k => knobs[k].forEach(kn => kn.set(s[k])));
    curveNote.textContent = CURVED.includes(s.type) ? 'DRAG THE START (HOW FAR), THE END (HOW LONG) AND THE MIDDLE (HOW IT BENDS)' : 'THE ' + String(s.type || '').toUpperCase() + ' HAS NO PITCH DROP — PICK A KICK, 808, TOM, ZAP OR IMPACT';
  }

  // ---- LAYERS (its page): the pitch drop drawn, each layer's length, the filter and the rest
  const curveNote = h('span', { class: 'mo-count', text: '' });
  const cv = UI.Canvas(560, 170); cv.classList.add('gg-map', 'df-curve'); cv.style.cursor = 'grab';
  const geo = () => { const W = cv.W, H = cv.H, s = S(), pmax = 48, tmax = Math.max(0.05, (s.ptime || 0.04) * 1.6), k = Math.pow(2, ((s.curve === undefined ? 0.5 : s.curve) - 0.5) * 4);
    const X = (t) => 30 + t / tmax * (W - 50), Y = (st) => H - 22 - st / pmax * (H - 40); return { W, H, s, pmax, tmax, k, X, Y }; };
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const G = geo(), { W, H, s, k, X, Y } = G, A = acc(cv); g.clearRect(0, 0, W, H);
    g.fillStyle = '#0c121a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1c2836'; g.lineWidth = 1; g.font = '600 8.5px monospace'; g.fillStyle = '#5b6878';
    [0, 12, 24, 36, 48].forEach(st => { const y = Y(st); g.beginPath(); g.moveTo(30, y); g.lineTo(W - 20, y); g.stroke(); g.fillText('+' + st, 4, y + 3); });
    const on = CURVED.includes(s.type), P = s.pitch || 0, T = s.ptime || 0.04; g.globalAlpha = on ? 1 : 0.3;
    g.strokeStyle = A; g.lineWidth = 2.2; g.shadowColor = A; g.shadowBlur = 8; g.beginPath();
    for (let i = 0; i <= 64; i++) { const x = i / 64, st = P * (1 - Math.pow(x, k)); i ? g.lineTo(X(x * T), Y(st)) : g.moveTo(X(0), Y(st)); }
    g.lineTo(W - 20, Y(0)); g.stroke(); g.shadowBlur = 0;
    const dot = (x, y, r) => { g.fillStyle = '#0c121a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = A; g.lineWidth = 2; g.stroke(); };
    dot(X(0), Y(P), 6); dot(X(T), Y(0), 6); dot(X(T / 2), Y(P * (1 - Math.pow(0.5, k))), 4.5);
    g.fillStyle = '#e8eef6'; g.fillText('+' + P.toFixed(1) + ' ST', X(0) + 10, Y(P) - 6); g.fillText(Math.round(T * 1000) + ' MS', X(T) + 8, Y(0) - 8);
    g.globalAlpha = 1;
  }, 30);
  let grab = null;
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); if (!CURVED.includes(S().type)) return; const r = cv.getBoundingClientRect(), sx = cv.W / r.width, x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * (cv.H / r.height), G = geo(), P = S().pitch || 0, T = S().ptime || 0.04;
    const d = (a, b) => Math.hypot(x - a, y - b), hs = [['start', d(G.X(0), G.Y(P))], ['end', d(G.X(T), G.Y(0))], ['mid', d(G.X(T / 2), G.Y(P * (1 - Math.pow(0.5, G.k))))]].sort((a, b) => a[1] - b[1]);
    grab = hs[0][1] < 28 ? hs[0][0] : 'mid'; cv.style.cursor = 'grabbing'; try { cv.setPointerCapture(e.pointerId); } catch (x2) {} move(e);
  });
  function move(e) {
    if (!grab) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (cv.W / r.width), y = (e.clientY - r.top) * (cv.H / r.height), G = geo(), s = S();
    const st = Math.max(0, Math.min(48, (G.H - 22 - y) / (G.H - 40) * 48)), patch = {};
    if (grab === 'start') patch.pitch = Math.round(st * 2) / 2;
    else if (grab === 'end') patch.ptime = Math.max(0.002, Math.min(0.6, +((x - 30) / (G.W - 50) * G.tmax).toFixed(3)));
    else { const P = s.pitch || 0; if (P > 0.5) { const fr = Math.max(0.02, Math.min(0.98, 1 - st / P)), kk = Math.log(fr) / Math.log(0.5); patch.curve = +Math.max(0, Math.min(1, 0.5 + Math.log2(kk) / 4)).toFixed(2); } }
    if (Object.keys(patch).length) { Object.assign(s, patch); view.emit('slot_edit', { i: sel, patch }); Object.keys(patch).forEach(k => (knobs[k] || []).forEach(kn => kn.set(patch[k]))); }
  }
  cv.addEventListener('pointermove', move);
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { if (!grab) return; grab = null; cv.style.cursor = 'grab'; view.emit('hit', { i: sel, vel: 0.85 }); view.emit('preview', { i: sel }); }));
  // a pad picker on the page (the pads themselves are on the Panel)
  const pick = []; const picker = h('div', { class: 'df-pick' }, Array.from({ length: 16 }, (_, i) => { const b = h('button', { class: 'df-pk', text: String(i + 1), title: 'pad ' + (i + 1) }); b.addEventListener('click', () => { choose(i); view.emit('hit', { i, vel: 0.85 }); }); pick[i] = b; return b; }));

  // ---- MIX (its page): a strip per pad
  const mixBox = h('div', { class: 'df-mixer' }), mMeters = [];
  let built = false;
  function buildMix() {
    if (built || !slots.length) return; built = true; mixBox.innerHTML = '';
    slots.forEach((s, i) => {
      const edit = (k, v) => { slots[i][k] = v; view.emit('slot_edit', { i, patch: { [k]: v } }); };
      const lv = UI.Fader({ min: 0, max: 1.5, step: 0.01, value: s.level, default: 0.9, height: 92, label: 'pad ' + (i + 1) + ' level', format: (v) => Math.round(v * 100) + '%', onChange: (v) => edit('level', +v.toFixed(2)) });
      const pn = UI.NumberDrag({ value: Math.round(s.pan * 100), min: -100, max: 100, step: 1, format: (v) => v ? (v < 0 ? 'L' + -v : 'R' + v) : 'C', label: 'pad ' + (i + 1) + ' pan', onChange: (v) => edit('pan', v / 100) });
      const ck = UI.NumberDrag({ value: s.choke, min: 0, max: 4, step: 1, format: (v) => v ? 'G' + v : '—', label: 'pad ' + (i + 1) + ' choke group (pads in one group cut each other off)', onChange: (v) => edit('choke', v) });
      const rm = UI.NumberDrag({ value: Math.round(s.gate * 100), min: 0, max: 100, step: 1, format: (v) => v + '%', label: 'pad ' + (i + 1) + ' room send', onChange: (v) => edit('gate', v / 100) });
      const m = h('i'); mMeters[i] = m;
      const nm = h('b', { class: 'gg-chn', text: s.name }); nm.addEventListener('click', () => { choose(i); view.emit('hit', { i, vel: 0.85 }); });
      mixBox.appendChild(h('div', { class: 'gg-ch df-ch' }, [nm, h('div', { class: 'gg-fd' }, [lv.el, h('div', { class: 'gg-meter', title: 'hits' }, [m])]),
        h('div', { class: 'gg-small' }, [h('span', { class: 'mo-lab', text: 'pan' }), pn.el]), h('div', { class: 'gg-small' }, [h('span', { class: 'mo-lab', text: 'room' }), rm.el]), h('div', { class: 'gg-small' }, [h('span', { class: 'mo-lab', text: 'choke' }), ck.el])]));
      mixBox.lastChild._set = (x) => { nm.textContent = x.name; lv.set(x.level); pn.set(Math.round(x.pan * 100)); ck.set(x.choke); rm.set(Math.round(x.gate * 100)); };
    });
  }
  let mixHeld = false; mixBox.addEventListener('pointerdown', () => { mixHeld = true; }, true); window.addEventListener('pointerup', () => { mixHeld = false; });
  const syncMix = () => { if (!built) return buildMix(); if (mixHeld) return; Array.from(mixBox.children).forEach((c, i) => c._set && slots[i] && c._set(slots[i])); };
  UI.loop(mixBox, () => mMeters.forEach((m, i) => { meter[i] *= 0.86; if (m) m.style.height = (meter[i] * 100).toFixed(1) + '%'; }), 30);

  // ---- state
  view.on('file', (f) => window.Codecs.download(new Blob([f.data], { type: 'audio/wav' }), f.name));
  view.on('zip', (z) => window.Codecs.download(z.blob, z.name));
  let made = false;
  view.on('state_sync', (s) => {
    if (!s.slots) return; slots = s.slots; types = s.types || types; if (s.range) range = s.range;
    if (!made) { made = true; makeBanks(); }
    paint(); fill(); syncMix();
  });

  const kit = h('div', { class: 'df-kit' }, [h('div', { class: 'mo-lab', text: 'Kit' }), h('div', { class: 'gg-knobs' }, [ctl('room', { size: 40 }).el, ctl('volume', { size: 40 }).el, ctl('velTone', { size: 40 }).el])]);
  padBox.appendChild(kit);
  const bank = h('div', { class: 'gg-knobs' }), layerKnobs = h('div', { class: 'gg-knobs df-wide' }), restKnobs = h('div', { class: 'gg-knobs df-wide' });
  function makeBanks() {
    ['tune', 'decay', 'pitch', 'tone', 'noise', 'snap', 'drive', 'level'].forEach(k => bank.appendChild(knob(k, k === 'decay' ? 56 : 44)));
    ['decay', 'nlen', 'clen', 'curve', 'pitch', 'ptime'].forEach(k => layerKnobs.appendChild(knob(k, 46)));
    ['filter', 'fm', 'fmi', 'gate', 'pan', 'choke'].forEach(k => restKnobs.appendChild(knob(k, 46)));
  }
  const play = h('div', { class: 'gg-play' }, [
    h('div', { class: 'gg-top' }, [UI.presetBar(view), h('div', { class: 'gg-tools' }, [
      UI.Button({ label: '⤓ Kit', hint: 'every pad as a 24-bit WAV (zip) — load them into any sampler or pad app', onClick: () => view.emit('render_kit') }).el])]),
    h('section', { class: 'gg-sec' }, [head('Pads', [h('span', { class: 'mo-count', text: 'SHIFT-CLICK = FULL VELOCITY · NOTES 36–51' })]), h('div', { class: 'df-top' }, [grid, padBox])]),
    h('section', { class: 'gg-sec' }, [head('Sound', [h('span', { class: 'mo-count', text: 'THE CHOSEN PAD' })]), bank]),
  ]);
  const layers = h('div', { class: 'gg-feel' }, [
    h('div', { class: 'df-pickrow' }, [h('span', { class: 'mo-lab', text: 'Pad' }), picker]),
    h('section', { class: 'gg-sec' }, [head('Pitch drop', [curveNote]), cv]),
    h('section', { class: 'gg-sec' }, [head('Layers', [h('span', { class: 'mo-count', text: 'BODY · NOISE · CLICK — EACH ITS OWN LENGTH' })]), layerKnobs]),
    h('section', { class: 'gg-sec' }, [head('Colour'), restKnobs]),
  ]);
  const mix = h('div', { class: 'gg-feel' }, [head('Mix', [h('span', { class: 'mo-count', text: 'LEVEL · PAN · ROOM · CHOKE — EACH PAD ITS OWN · CLICK A NAME TO HEAR IT' })]), mixBox]);

  view.root.append(play);
  if (view.pageTab) { view.pageTab('layers', 'Layers', layers, 'sliders-vertical'); view.pageTab('mix', 'Mix', mix, 'sliders-horizontal'); }
  setTimeout(() => view.emit('preview', { i: 0 }), 50);
});

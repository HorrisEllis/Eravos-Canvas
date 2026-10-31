/* eravos.bass-forge UI — 1.1 (3.79, in the look kit, the Groove way). The window is the tool: TALK — the one LFO as a live trace,
 * its rate and shape, and six stage faders (how far it pushes FM, fold, vowel, comb, notch, cutoff), each with a meter lit by what
 * the LFO is doing to it right now; then a knob bank (FM index large, fold, formant, cutoff, drive, sub, level) and the keys.
 * Its page adds SOUND (every other control, by stage, with the feel) and MATCH (drop a bass clip: the reference and the forge
 * drawn side by side, measure by measure, and the distance shrinking), beside MOTION and PERFORM from the domain. */
OrganismFactory.reg('eravos.bass-forge', function (view) {
  const UI = view.ui, h = UI.h;
  const cfg = (k) => (view.descriptor.config || []).find(c => c.key === k);
  const ctl = (k, o) => { const c = cfg(k); return c ? UI.paramControl(view, c, o || {}) : null; };
  const head = (title, right) => h('div', { class: 'mo-head' }, [h('span', { class: 'mo-dot' }), h('span', { class: 'mo-cap', text: title }), h('span', { class: 'mo-rule' })].concat(right || []));
  let accNow = view.descriptor.accent || '#ff3d00', accAt = 0;
  const acc = (el) => { const n = performance.now(); if (n - accAt > 250) { accAt = n; const v = getComputedStyle(el).getPropertyValue('--acc').trim(); if (v) accNow = v; } return accNow; };
  if (UI.alive) UI.alive(view);
  // the same shapes the engine's LFO draws (bass-forge.engine.js LFO_FN), for the tiles
  const SHAPE = { sine: t => -Math.cos(2 * Math.PI * t), saw: t => 1 - 2 * t, square: t => t < 0.5 ? 1 : -1, stair: t => [-1, 0.33, -0.33, 1][Math.min(3, Math.floor(t * 4))],
    talk: t => t < 0.18 ? -1 + 2 * (t / 0.18) : t < 0.5 ? 1 - 1.4 * ((t - 0.18) / 0.32) : t < 0.62 ? -0.4 + 0.9 * Math.sin((t - 0.5) / 0.12 * Math.PI) : -0.4 - 0.6 * ((t - 0.62) / 0.38) };

  // ---- TALK: the LFO, live
  // the last ~0.7 s of the LFO itself (a long analyser: the whole wave each frame, not one sample a frame)
  let lfoAn = null; try { lfoAn = view.tap('lfo', 32768); } catch (e) {}
  const lb = new Float32Array(32768); let lfoNow = 0;
  const readLfo = () => { if (!lfoAn) return false; lfoAn.getFloatTimeDomainData(lb); lfoNow = Math.max(0, Math.min(1, lb[lb.length - 1])); return true; };
  const scope = UI.Canvas(260, 112); scope.classList.add('bf-scope');
  UI.loop(scope, () => {
    const g = scope.g, W = scope.fit().W, H = scope.H, A = acc(scope); g.clearRect(0, 0, W, H);
    g.fillStyle = '#0c121a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1c2836'; g.lineWidth = 1; [0.25, 0.5, 0.75].forEach(y => { g.beginPath(); g.moveTo(0, y * H); g.lineTo(W, y * H); g.stroke(); });
    // the shape it is set to, faint, behind
    const sh = SHAPE[view.state.lfoShape] || SHAPE.sine, ph = +view.state.lfoPhase || 0; g.strokeStyle = '#3a4656'; g.lineWidth = 1.2; g.beginPath();
    for (let i = 0; i <= 120; i++) { const t = i / 120, y = H / 2 - sh((t * 2 + ph) % 1) * (H / 2 - 8); i ? g.lineTo(t * W, y) : g.moveTo(0, y); } g.stroke();
    if (!readLfo()) return;
    g.strokeStyle = A; g.lineWidth = 2; g.shadowColor = A; g.shadowBlur = 8; g.beginPath();
    const N = Math.max(60, Math.round(W)), stp = lb.length / N;
    for (let i = 0; i < N; i++) { const v = Math.max(0, Math.min(1, lb[Math.floor(i * stp)])), x = i / (N - 1) * W, y = H - 6 - v * (H - 12); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.shadowBlur = 0; g.fillStyle = A; g.beginPath(); g.arc(W - 3, H - 6 - lfoNow * (H - 12), 3.5, 0, Math.PI * 2); g.fill();
  }, 30);
  // the shape tiles (like Motion's): a picture of each shape
  const tiles = h('div', { class: 'bf-shapes' });
  const tileFor = (s) => { const pts = Array.from({ length: 41 }, (_, i) => `${(i / 40 * 36 + 2).toFixed(1)},${(14 - SHAPE[s](i / 40) * 10).toFixed(1)}`).join(' ');
    const b = h('button', { class: 'mo-tile', title: s, 'aria-label': 'LFO shape ' + s }); b.innerHTML = `<svg width="40" height="28" viewBox="0 0 40 28"><path d="M${pts.replace(/ /g, ' L')}"/></svg>`;
    b.addEventListener('click', () => view.emit('config_change', { key: 'lfoShape', value: s })); b.dataset.s = s; return b; };
  cfg('lfoShape').options.forEach(s => tiles.appendChild(tileFor(s)));
  view.bind('lfoShape', (v) => tiles.querySelectorAll('.mo-tile').forEach(b => b.classList.toggle('on', b.dataset.s === v)));
  // six stage faders, a meter each: the LFO × its depth, now
  const STAGES = [['lfoFM', 'FM'], ['lfoFold', 'Fold'], ['lfoFormant', 'Vowel'], ['lfoComb', 'Comb'], ['lfoNotch', 'Notch'], ['lfoCut', 'Cutoff']];
  const meters = [];
  const faders = h('div', { class: 'bf-faders' }, STAGES.map(([k, l]) => {
    const f = UI.Fader({ min: 0, max: 1, step: 0.01, value: view.state[k], default: cfg(k).default, height: 112, label: l, format: (v) => Math.round(v * 100) + '%', onChange: (v) => view.emit('config_change', { key: k, value: +v.toFixed(2) }) });
    view.bind(k, (v) => f.set(v)); const m = h('i'); meters.push([k, m]);
    return h('div', { class: 'bf-stage' }, [f.el, h('div', { class: 'gg-meter', title: 'what the LFO does to it now' }, [m])]);
  }));
  UI.loop(faders, () => { meters.forEach(([k, m]) => { m.style.height = (lfoNow * (+view.state[k] || 0) * 100).toFixed(1) + '%'; }); }, 30);

  const sel = (k) => { const c = ctl(k, { noLabel: true, segMax: 0 }); return h('div', { class: 'gg-strip' }, [h('div', { class: 'mo-lab', text: cfg(k).label }), c.el]); };
  let kb = null;
  if (UI.Keyboard) { kb = UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) }); if (view.observe) view.observe('theory:key-change', (k) => kb.setKey(k)); }
  const play = h('div', { class: 'gg-play' }, [
    h('div', { class: 'gg-top' }, [UI.presetBar(view), h('div', { class: 'gg-tools' }, [sel('wave'), sel('ratio')])]),
    h('section', { class: 'gg-sec' }, [head('Talk', [h('span', { class: 'mo-count', text: 'ONE LFO · SIX STAGES · EACH ITS OWN DEPTH' })]),
      h('div', { class: 'bf-talk' }, [
        h('div', { class: 'bf-lfo' }, [scope, h('div', { class: 'bf-lforow' }, [ctl('lfoDiv', { noLabel: true, segMax: 9 }).el]), tiles]),
        faders,
      ])]),
    h('section', { class: 'gg-sec' }, [head('Tone'),
      h('div', { class: 'gg-knobs' }, [ctl('fm', { big: true, size: 64 }).el, ctl('fold', { size: 44 }).el, ctl('formant', { size: 44 }).el, ctl('cutoff', { size: 44 }).el, ctl('drive', { size: 44 }).el, ctl('sub', { size: 44 }).el, ctl('level', { size: 44 }).el])]),
    kb ? kb.el : null,
  ]);

  // ---- SOUND (its page): everything else, by stage
  const group = (title, keys, note) => h('section', { class: 'gg-sec bf-' + title.toLowerCase() }, [head(title, note ? [h('span', { class: 'mo-count', text: note })] : []),
    h('div', { class: 'gg-knobs' }, keys.map(k => { const c = ctl(k, { size: 46, segMax: 5 }); return c ? c.el : null; }))]);
  const sound = h('div', { class: 'gg-feel bf-rack' }, [
    group('Feel', ['talk', 'velBright', 'lfoPhase', 'lfoFree'], 'EACH NOTE'),
    group('Filter', ['res', 'crush', 'ott']),
    group('Voice', ['spread', 'attack', 'release']),
    group('Shape', ['vowelA', 'vowelB', 'comb', 'combPitch', 'notch'], 'VOWEL A → B: WHERE THE LFO TAKES IT'),
    group('Pitch', ['pitchEnv', 'pitchTime', 'glide', 'octave', 'keepRange']),
  ]);

  // ---- MATCH (its page): the reference and the forge, measure by measure
  const hist = []; let info = null, M = null;
  const MEAS = [['centroid', 'Centre', (v) => Math.max(0, Math.min(1, Math.log(Math.max(50, v) / 50) / Math.log(160))), (v) => Math.round(v) + ' Hz'],
    ['flat', 'Noise', (v) => Math.min(1, v * 2), (v) => v.toFixed(2)], ['sub', 'Sub', (v) => Math.min(1, v), (v) => Math.round(v * 100) + '%'],
    ['bright', 'Air', (v) => Math.min(1, v * 2), (v) => Math.round(v * 100) + '%'], ['rate', 'Wobble', (v) => Math.min(1, v / 16), (v) => v ? v.toFixed(1) + ' Hz' : '—'],
    ['depth', 'Depth', (v) => Math.min(1, v), (v) => v.toFixed(2)]];
  const pic = UI.Canvas(560, 170); pic.classList.add('gg-map');
  UI.loop(pic, () => {
    const g = pic.g, W = pic.fit().W, H = pic.H, A = acc(pic); g.clearRect(0, 0, W, H);
    const half = W * 0.62, cw = half / MEAS.length;
    g.font = '700 8.5px monospace'; g.textAlign = 'center';
    MEAS.forEach(([k, l, n, f], i) => {
      const x = i * cw; g.fillStyle = '#0c121a'; g.fillRect(x + 2, 4, cw - 4, H - 34);
      const bar = (v, dx, col, fill) => { const y = 4 + (H - 34) * (1 - n(v)); g.fillStyle = col; g.globalAlpha = fill ? 1 : 0.9; if (fill) g.fillRect(x + dx, y, cw / 2 - 8, H - 30 - y); else { g.strokeStyle = col; g.lineWidth = 1.5; g.strokeRect(x + dx, y, cw / 2 - 8, H - 30 - y); } g.globalAlpha = 1; };
      if (M && M.target) bar(M.target[k] || 0, 6, '#8796a8', false);
      if (M && M.feat) { g.shadowColor = A; g.shadowBlur = 8; bar(M.feat[k] || 0, cw / 2 + 2, A, true); g.shadowBlur = 0; }
      g.fillStyle = '#8796a8'; g.fillText(l.toUpperCase(), x + cw / 2, H - 17);
      g.fillStyle = '#5b6878'; if (M && M.target) g.fillText(f(M.target[k] || 0), x + cw / 2, H - 5);
    });
    g.textAlign = 'left';
    // the distance, round by round
    const x0 = half + 14, w = W - x0 - 4; g.fillStyle = '#0c121a'; g.fillRect(x0, 4, w, H - 34);
    if (!hist.length) { g.fillStyle = '#5b6878'; g.fillText('DROP A BASS CLIP HERE', x0 + 10, 30); g.fillText('OR 📂 MATCH A CLIP', x0 + 10, 44); g.fillText('IT LEARNS THE SOUND', x0 + 10, 58); return; }
    const m = Math.max(...hist), n = hist.length; g.strokeStyle = A; g.lineWidth = 2; g.shadowColor = A; g.shadowBlur = 6; g.beginPath();
    hist.forEach((d, i) => { const x = x0 + 6 + i / Math.max(1, n - 1) * (w - 12), y = 10 + (d / m) * (H - 50); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#8796a8'; g.fillText(info ? (info.error ? '⚠ ' + info.error : `${info.done ? 'DONE' : 'TRY ' + info.iter} · DISTANCE ${info.dist.toFixed(3)}`) : '', x0, H - 17);
    if (info && info.f0) g.fillText(info.f0.toFixed(1) + ' HZ', x0, H - 5);
  }, 15);
  view.on('match', (m) => { info = m; if (m.iter === 0) hist.length = 0; if (m.dist !== undefined) hist.push(m.dist); M = { target: m.target || (M && M.target), feat: m.feat || (M && M.feat) }; });
  view.on('state_sync', (s) => { if (s && s.match && !M) { M = { target: s.match.target, feat: s.match.feat }; info = { done: true, iter: s.match.iter, dist: s.match.dist, f0: s.match.f0 }; hist.length = 0; hist.push(s.match.dist); } });
  const file = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  const go = async (f) => { hist.length = 0; M = null; info = { iter: 0, dist: 0 }; view.emit('match', { arrayBuffer: await f.arrayBuffer(), name: f.name }); };
  file.addEventListener('change', () => { if (file.files[0]) go(file.files[0]); file.value = ''; });
  const legend = h('div', { class: 'bf-legend' }, [h('span', { class: 'ref', text: 'REFERENCE' }), h('span', { class: 'me', text: 'THE FORGE' })]);
  const match = h('div', { class: 'gg-feel bf-match' }, [
    head('Match', [legend, UI.Button({ label: '📂 Match a clip', onClick: () => file.click() }).el, UI.Button({ label: 'Stop', onClick: () => view.emit('match_stop') }).el]), pic, file,
    h('div', { class: 'gg-hint', text: 'IT RENDERS ITSELF, MEASURES, NUDGES ITS KNOBS AND TRIES AGAIN UNTIL IT STOPS GETTING CLOSER' })]);
  match.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); match.classList.add('over'); }); match.addEventListener('dragleave', () => match.classList.remove('over'));
  match.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); match.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) go(f); });

  view.root.append(play);
  if (view.pageTab) { view.pageTab('sound', 'Sound', sound, 'sliders-vertical'); view.pageTab('match', 'Match', match, 'target'); }
});

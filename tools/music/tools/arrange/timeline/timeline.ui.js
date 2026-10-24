/* eravos.timeline UI 2.2 (3.35: draws only what is visible · wheel scrolls time when the lanes fit · zoom keys · resizable piano roll · one Export menu) — ruler (seek, loop drag, markers), lanes with real waveforms, drag/trim/fade/duplicate, inspector,
 * instrument tracks (＋ Track spawns an instrument + lane + first clip) and the piano roll (timeline.pianoroll.js) */
OrganismFactory.reg('eravos.timeline', function (view) {
  const UI = view.ui, h = UI.h;
  const RULER = 26, HEAD_W = 268;   // room for the name, M · S, the instrument, the 〰 curve picker and ✂ (3.62)
  const laneH = () => Math.max(28, Math.min(160, view.state.laneH || 48));
  let A = null, sel = null, playBar = null, drag = null, hover = null, pendingSel = null, headSig = '', frame = null;   // 3.62 frame: { a, b, l0, l1 } bars × lanes
  const laneKindFor = (c) => c.kind === 'audio' ? 'audio' : c.kind === 'notes' ? 'inst' : 'pattern';
  const isInstDef = (d) => (d.hooks || []).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger');
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  // header
  const play = UI.Button({ label: '▶ / ■', kind: 'primary', onClick: () => view.emit('transport_play', {}) });
  const restart = UI.Button({ label: '⏮', hint: 'back to the start — the loop start when the loop is on (Home). Keeps playing.', onClick: () => view.emit('restart', {}) });
  const pos = h('span', { class: 'org-note', text: '1.1' });
  const snap = UI.paramControl(view, cfg('snap'), { segMax: 5 });
  const zoom = UI.paramControl(view, cfg('pxPerBar'), { size: 28 });
  const loop = UI.paramControl(view, cfg('loopOn'));
  const addL = UI.Select({ options: ['＋ lane…', 'audio', 'pattern', 'marker', { value: 'inst', label: 'instrument (empty)' }], onChange: (v) => { if (v !== '＋ lane…') view.emit('lane_add', { kind: v }); setTimeout(() => addL.set('＋ lane…'), 50); } });
  const instDefs = () => OrganismFactory.defined().filter(d => isInstDef(d) && d.id !== 'eravos.timeline').sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));
  const addT = UI.Select({ options: [{ value: '', label: '＋ Track…' }].concat(instDefs().map(d => ({ value: d.id, label: (d.icon ? d.icon + ' ' : '') + (d.label || d.id) }))), onChange: (v) => {
    setTimeout(() => addT.set(''), 50); if (!v) return;
    const id = OrganismFactory.spawn(v, { K: view.K }); if (!id) return;
    view.emit('lane_add', { kind: 'inst', target: id });
    const at = playBar ? Math.floor(playBar) : 1;
    pendingSel = { target: id, startBar: at };
    view.emit('clip_add', { kind: 'notes', target: id, startBar: at, bars: 4 });
  } });
  addT.el.title = 'add an instrument track: spawns the instrument, a lane bound to it and a 4-bar clip to write notes in';
  const laneDn = UI.Button({ label: '−', hint: 'shorter lanes (Alt + wheel)', onClick: () => setLaneH(laneH() - 12) });
  const laneUp = UI.Button({ label: '＋', hint: 'taller lanes (Alt + wheel)', onClick: () => setLaneH(laneH() + 12) });
  const fitB = UI.Button({ label: '⤢ Fit', hint: 'fit the whole song to the width and the lanes to the height', onClick: () => fit() });
  // 3.35: the four exports are one menu (the toolbar no longer wraps into three rows on a normal-sized window)
  const EXPORTS = { bounce: 'bounce', midi: 'export_midi', stems: 'export_stems', json: 'export' };
  const expM = UI.Select({ options: [{ value: '', label: '⤓ Export…' }, { value: 'bounce', label: 'Song → WAV (real time)' }, { value: 'midi', label: 'MIDI (.mid, a track per instrument)' }, { value: 'stems', label: 'Stems (each track, zipped WAVs)' }, { value: 'json', label: 'Arrangement (JSON)' }],
    onChange: (v) => { setTimeout(() => expM.set(''), 50); if (EXPORTS[v]) view.emit(EXPORTS[v], {}); } });
  expM.el.title = 'export the song: WAV bounce, MIDI, stems or the arrangement as JSON';
  const expSt = h('span', { class: 'uk-hint', style: { margin: '0 4px' }, 'aria-live': 'polite' });
  view.on('export_state', (x) => { expSt.textContent = x.error || x.text || ''; expSt.style.color = x.error ? '#ff5577' : ''; });
  view.on('export_ready', (x) => window.Workspace.download(x.name, x.data, x.mime));
  const heads = h('div', { style: { width: HEAD_W + 'px', flex: 'none', paddingTop: RULER + 'px' } });
  const cv = document.createElement('canvas'); cv.style.display = 'block'; cv.style.position = 'sticky'; cv.style.left = '0'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'arrangement — clips on tracks; drag to move, double-click a clip to edit its notes');
  // 3.35: the canvas is only as wide as what you see (it sticks to the left of the scroller); `inner` carries the song's
  // width for the scrollbar. Before, one canvas was the whole song wide — past ~16 000 px at 2× DPR it hit the browser's
  // canvas limit and went blank, and every playhead tick repainted all of it.
  const inner = h('div', { style: { position: 'relative' } }, [cv]);
  const scroller = h('div', { style: { flex: '1', overflowX: 'auto', overflowY: 'hidden', position: 'relative', minWidth: '0' } }, [inner]);
  const body = h('div', { style: { display: 'flex', flex: '1', minHeight: '0', overflowY: 'auto', border: '1px solid #223044', borderRadius: '6px', background: '#0a0f15' } }, [heads, scroller]);
  const insp = h('div', { class: 'org-row', style: { minHeight: '34px', marginTop: '4px' } });
  const roll = window.EravosTimelinePianoRoll.create(view, { onClose: () => { sel = null; drawInsp(); draw(); } });
  // 3.35: drag the bar between the lanes and the piano roll to give either one the room (shown only while the roll is open)
  const split = h('div', { class: 'tl-split', title: 'drag: lanes ↕ piano roll · double-click: half and half', role: 'separator', 'aria-orientation': 'horizontal' });
  let rollH = 0;
  const setRollH = (px) => { const tot = view.root.clientHeight || 600; rollH = Math.round(Math.max(120, Math.min(tot - 150, px))); roll.el.style.flex = `0 0 ${rollH}px`; draw(); };
  split.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; e.preventDefault(); e.stopPropagation();
    const y0 = e.clientY, h0 = roll.el.getBoundingClientRect().height, s = (roll.el.offsetHeight || 1) / (h0 || 1);
    let done = null; const end = () => { if (!done) return; const d = done; done = null; d(); split.classList.remove('on'); };
    try { split.setPointerCapture(e.pointerId); } catch (_) {} split.classList.add('on');
    const mv = (ev) => { if (!done) return; if (ev.buttons === 0) { end(); return; } setRollH((h0 - (ev.clientY - y0)) * s); };
    done = UI.drag.begin(() => { split.removeEventListener('pointermove', mv); end(); });
    split.addEventListener('pointermove', mv);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => split.addEventListener(t, end, { once: true }));
  });
  split.addEventListener('dblclick', () => setRollH(((view.root.clientHeight || 600) - 80) / 2));
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
  // ---- 3.62 the frame and ✂ Split
  function frameOf(d) { const a = Math.min(d.b0, d.b1), b = Math.max(d.b0, d.b1); return { a, b: d.moved ? b : a, l0: Math.min(d.l0, d.l1), l1: Math.max(d.l0, d.l1) }; }
  function frameSay() { if (!frame) return ''; const f = (v) => { const bar = Math.floor(v + 1e-9), beat = Math.round((v - bar) * 4) + 1; return bar + '.' + beat; }; return frame.a === frame.b ? '✂ at ' + f(frame.a) : '✂ ' + f(frame.a) + ' – ' + f(frame.b); }
  function doSplit() {
    if (frame && A) { const ids = A.lanes.slice(frame.l0, frame.l1 + 1).map(l => l.id); view.emit('clip_split_at', { lanes: ids, bars: frame.a === frame.b ? [frame.a] : [frame.a, frame.b] }); frame = null; splitB.el.classList.remove('on'); draw(); return; }
    const c = A && A.clips.find(x => x.id === sel);
    if (c && playBar) view.emit('clip_split', { id: c.id, bar: playBar });
    else expSt.textContent = 'Split: drag across a track to frame where to cut (or pick a clip and put the playhead on it)';
  }
  const splitB = UI.Button({ label: '✂ Split', hint: 'drag across empty space in a track — or Shift+drag over the clips — to frame a stretch — ✂ cuts every clip there at the frame’s edges (a click without a drag: one cut line). S does the same. Esc clears the frame.', onClick: () => doSplit() });
  view.splitFrame = doSplit; Object.defineProperty(view, 'frame', { get: () => frame, configurable: true });
  // 3.62 ⛶ THE WHOLE TIMELINE FULL SCREEN — tracks, curve lanes, transport, the clip inspector and the piano roll over the page (the roll's
  // own ⛶ shows only the notes). Same move as the roll's (3.53): the timeline lives inside the CSS-transformed canvas, so it is MOVED onto
  // the page and back to the same spot; every hit test maps through the live rect. ⛶ again or Esc.
  let tlFull = null;
  const fullT = UI.Button({ label: '⛶', hint: 'the whole timeline full screen — tracks, curves, piano roll (⛶ again or Esc)', onClick: () => setTlFull(!tlFull) });
  function tlKey(e) { if (e.key !== 'Escape' || !tlFull || roll.full || oscP || document.querySelector('.uk-ask-back')) return; e.preventDefault(); e.stopPropagation(); setTlFull(false); }
  function setTlFull(on) {
    if (!!on === !!tlFull) return;
    const el = view.root;
    if (on) { tlFull = { parent: el.parentNode, next: el.nextSibling }; document.body.appendChild(el); el.classList.add('tl-full'); document.addEventListener('keydown', tlKey, true); }
    else { const f = tlFull; tlFull = null; el.classList.remove('tl-full'); document.removeEventListener('keydown', tlKey, true); if (f.parent) f.parent.insertBefore(el, f.next && f.next.parentNode === f.parent ? f.next : null); }
    fullT.el.classList.toggle('on', !!tlFull); fullT.el.title = tlFull ? 'back to the canvas (Esc)' : 'the whole timeline full screen — tracks, curves, piano roll (⛶ again or Esc)';
    requestAnimationFrame(() => { headSig = ''; if (A) { drawHeads(); draw(); } cv.focus({ preventScroll: true }); });
  }
  view.setFull = setTlFull; Object.defineProperty(view, 'full', { get: () => !!tlFull, configurable: true });
  view.onDispose && view.onDispose(() => { if (tlFull) setTlFull(false); });
  // 3.53 record what you play: while this is on and the song plays, any knob you turn on a track's tool is written into its
  // own automation lane (a lane is made for it the first time)
  const recK = UI.Toggle({ label: '⏺ knobs', hint: 'record what you play — while the song plays, every knob you turn on a track’s tool is written into an automation lane', onChange: (v) => view.emit('rec_knobs', { on: v }) });
  view.root.append(h('div', { class: 'org-row', style: { flexWrap: 'wrap' } }, [UI.presetBar(view), restart.el, play.el, pos, addT.el, recK.el, snap.el, zoom.el, h('span', { class: 'org-label', text: 'lanes' }), laneDn.el, laneUp.el, fitB.el, fullT.el, splitB.el, loop.el, addL.el, expM.el, expSt]), body, split, roll.el, insp,
    UI.hint('＋ Track adds an instrument with a clip · dbl-click an instrument lane for a new clip, click a clip to open its piano roll · drop audio onto a lane · drag clips (alt = copy) · drag edges to trim · dbl-click a pattern lane for a pattern block · click the ruler to jump, drag it to loop · ⏮ / Home restart · S split · Del delete · wheel / Shift+wheel scroll, Ctrl+wheel zooms · + / − zoom · F fit · ⤢ fills the screen (Esc back)'));
  const ppb = () => view.state.pxPerBar || 64;
  const xOf = (bar) => (bar - 1) * ppb();
  const barOf = (x) => x / ppb() + 1;
  function laneY(i) { return RULER + i * laneH(); }
  const rulerY = () => body.scrollTop || 0;
  // ---- 3.53 automation lanes: the knob's range maps to the lane's height (choices: one band each)
  const knobOf = (l) => A && A.knobs && (A.knobs[l.target] || []).find(k => k.key === l.key);
  const aFrac = (k, v) => !k ? 0.5 : k.type === 'enum' ? (k.options.length > 1 ? Math.max(0, k.options.map(String).indexOf(String(v))) / (k.options.length - 1) : 0.5) : Math.max(0, Math.min(1, (+v - k.min) / ((k.max - k.min) || 1)));
  const aVal = (k, f) => { f = Math.max(0, Math.min(1, f)); if (k.type === 'enum') return k.options[Math.round(f * (k.options.length - 1))]; let v = k.min + f * (k.max - k.min); if (k.type === 'integer') v = Math.round(v); else if (k.step) v = Math.round(v / k.step) * k.step; return +Math.max(k.min, Math.min(k.max, v)).toFixed(6); };
  const aY = (i, f) => laneY(i) + 5 + (1 - f) * (laneH() - 10), aF = (i, y) => 1 - (y - laneY(i) - 5) / (laneH() - 10);
  // 3.57 a lane's oscillation, the same maths as the engine (timeline.engine oscAt): drawn around the curve so you see the swing
  const RDIV = { '4/1': 1 / 16, '2/1': 1 / 8, '1/1': 0.25, '1/2': 0.5, '1/2t': 0.75, '1/4': 1, '1/4t': 1.5, '1/8': 2, '1/8t': 3, '1/16': 4, '1/16t': 6, '1/32': 8 };
  const owave = (sh, ph) => { const f = ph - Math.floor(ph); if (sh === 'triangle') return 1 - 4 * Math.abs(f - 0.5); if (sh === 'saw') return 2 * f - 1; if (sh === 'square') return f < 0.5 ? 1 : -1; if (sh === 'random') { const x = Math.sin(Math.floor(ph) * 12.9898 + 78.233) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; } return Math.sin(2 * Math.PI * f); };
  const ptsAt = (pts, bar) => { if (bar <= pts[0][0]) return pts[0][1]; const L = pts[pts.length - 1]; if (bar >= L[0]) return L[1]; let j = 1; while (pts[j][0] < bar) j++; const a = pts[j - 1], b = pts[j]; return typeof a[1] !== 'number' ? a[1] : a[1] + (b[1] - a[1]) * (bar - a[0]) / (b[0] - a[0]); };
  const oscVal = (o, bar, v) => { const beats = (bar - 1) * 4, ph = typeof o.rate === 'number' ? beats * (60 / ((A && A.bpm) || 120)) * o.rate : beats * (RDIV[o.rate] || 1); return v + o.depth * owave(o.shape, ph); };
  const aSay = (k, v) => k ? k.label + ' ' + (k.type === 'enum' ? v : (Math.abs(v) >= 100 ? Math.round(v) : +(+v).toFixed(2)) + (k.unit ? ' ' + k.unit : '')) : '';
  function snapB(b) { const q = { none: 0, bar: 1, beat: 0.25, '1/8': 0.125, '1/16': 0.0625 }[view.state.snap]; return q ? Math.max(1, 1 + Math.round((b - 1) / q) * q) : Math.max(1, b); }
  function clipRect(c) {
    const li = A.lanes.findIndex(l => l.id === c.lane); if (li < 0) return null;
    const len = c.kind === 'audio' ? c.lengthSec / A.barSec : c.bars;
    return { x: xOf(c.startBar), y: laneY(li) + 3, w: Math.max(4, len * ppb()), h: laneH() - 6, li };
  }
  function resize() {
    if (!A) return;
    const bars = Math.max(view.state.songBars || 64, A.songEnd + 8);
    // the arrangement fills the window it is in, never smaller than its content (3.35: no width cap — only the visible part is a canvas)
    const VW = Math.max(100, scroller.clientWidth || 800), W = Math.max(bars * ppb(), VW), H = Math.max(RULER + A.lanes.length * laneH(), (body.clientHeight || 0) - 2 - (W > VW ? 14 : 0));
    if (inner.style.width !== W + 'px') inner.style.width = W + 'px';
    if (inner.style.height !== H + 'px') inner.style.height = H + 'px';
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(VW * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(VW * dpr); cv.height = Math.round(H * dpr); cv.style.width = VW + 'px'; cv.style.height = H + 'px'; }
    const sx = Math.min(scroller.scrollLeft || 0, Math.max(0, W - VW));
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, -sx * dpr, 0);   // content coordinates from here on
    return { W, H, VW, x0: sx, x1: sx + VW };
  }
  function draw() {
    if (!A) return;
    const V = resize(), x0 = V.x0, x1 = V.x1, VW = V.VW;
    const g = cv.getContext('2d'), H = V.H, pb = ppb(), b0 = Math.max(1, Math.floor(barOf(x0))), W = x1;   // W: the right edge of what is drawn
    g.fillStyle = '#0a0f15'; g.fillRect(x0, 0, VW, H);
    // loop region
    if (view.state.loopOn) { g.fillStyle = 'rgba(0,212,255,.08)'; g.fillRect(xOf(view.state.loopStartBar), 0, (view.state.loopEndBar - view.state.loopStartBar) * pb, H); }
    // bar / beat grid (the ruler itself is drawn last, pinned to the top of the visible area)
    for (let b = b0; xOf(b) < W; b++) {
      const x = xOf(b);
      g.fillStyle = '#2d3f57'; g.fillRect(x, 0, 1, H);
      if (pb >= 48) for (let q = 1; q < 4; q++) { g.fillStyle = '#16202d'; g.fillRect(x + q * pb / 4, RULER, 1, H); }
    }
    // lanes
    A.lanes.forEach((l, i) => {
      const y = laneY(i); g.fillStyle = i % 2 ? '#0c121a' : '#0e151f'; g.globalAlpha = 0.9; g.fillRect(x0, y, VW, laneH()); g.globalAlpha = 1;
      g.fillStyle = '#1a2533'; g.fillRect(x0, y + laneH() - 1, VW, 1);
      if (l.kind === 'auto') {
        const k = knobOf(l), pts = drag && drag.kind === 'auto' && drag.id === l.id ? drag.pts : (l.points || []);
        g.fillStyle = '#ffd24a14'; g.fillRect(x0, y + 4, VW, laneH() - 8);
        if (pts.length) {
          g.strokeStyle = l.mute ? '#6b5a20' : '#ffd24a'; g.lineWidth = 2; g.beginPath();
          const step = k && k.type === 'enum';
          g.moveTo(x0, aY(i, aFrac(k, pts[0][1])));
          pts.forEach((q, qi) => { const x = xOf(q[0]), yy = aY(i, aFrac(k, q[1])); if (qi === 0) g.lineTo(x, yy); else { if (step) g.lineTo(x, aY(i, aFrac(k, pts[qi - 1][1]))); g.lineTo(x, yy); } });
          g.lineTo(x1, aY(i, aFrac(k, pts[pts.length - 1][1]))); g.stroke(); g.lineWidth = 1;
          g.fillStyle = '#fff'; pts.forEach(q => { const x = xOf(q[0]); if (x < x0 - 4 || x > x1 + 4) return; g.beginPath(); g.arc(x, aY(i, aFrac(k, q[1])), 3, 0, 7); g.fill(); });
        } else { g.fillStyle = '#7f93a8'; g.font = '10px sans-serif'; g.fillText('click to add a point · right-click removes · ● records the knob while the song plays', Math.max(x0, 0) + 8, y + laneH() / 2 + 4); }
        if (l.osc && k && k.type !== 'enum') {   // the swing: a thin line around the curve (or the knob, with no points)
          g.strokeStyle = '#7cf7ff'; g.globalAlpha = l.mute ? 0.3 : 0.85; g.lineWidth = 1.2; g.beginPath();
          for (let x = Math.max(0, x0); x <= x1; x += 2) { const bar = barOf(x), base = pts.length ? ptsAt(pts, bar) : (k.def !== undefined ? k.def : 0), v = Math.max(k.min, Math.min(k.max, oscVal(l.osc, bar, +base))); const yy = aY(i, aFrac(k, v)); x === Math.max(0, x0) ? g.moveTo(x, yy) : g.lineTo(x, yy); }
          g.stroke(); g.globalAlpha = 1; g.lineWidth = 1;
        }
        if (l.rec) { g.fillStyle = '#ff4466'; g.beginPath(); g.arc(Math.max(x0, 0) + VW - 12, y + 10, 4, 0, 7); g.fill(); }
      }
      if (l.kind === 'marker') A.markers.forEach((m, mi) => { const x = xOf(m.bar); g.fillStyle = '#ffaa00'; g.fillRect(x, y + 4, 2, laneH() - 8); g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 12, y + 10); g.lineTo(x, y + 16); g.fill(); g.font = '600 11px sans-serif'; g.fillText(m.name, x + 6, y + 30); g.fillStyle = 'rgba(255,170,0,.25)'; g.fillRect(x, RULER, 1, H - RULER); });
    });
    // clips
    A.clips.forEach(c => {
      const r = clipRect(c); if (!r || r.x > x1 || r.x + r.w < x0) return;   // off screen: not drawn
      const lane = A.lanes[r.li], isSel = sel === c.id;
      const cc = c.kind === 'pattern' ? '#00d4ff' : lane.color;
      g.fillStyle = cc + (isSel ? '66' : '38'); g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = isSel ? '#fff' : cc; g.lineWidth = isSel ? 2 : 1; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      if (c.kind === 'audio') {
        const pk = A.peaks[c.assetHash];
        if (pk) {
          g.fillStyle = lane.color; const n = pk.length / 2; const dur = pk.dur || null;
          for (let x = Math.max(0, Math.floor(x0 - r.x)), xe = Math.min(r.w, Math.ceil(x1 - r.x)); x < xe; x++) {
            const tSec = c.offsetSec + (x / r.w) * c.lengthSec; const frac = tSec / (c.bufDur || (c.offsetSec + c.lengthSec)); const i = Math.min(n - 1, Math.max(0, Math.floor(frac * n)));
            const mn = pk[i * 2], mx = pk[i * 2 + 1], cy = r.y + r.h / 2 + 5;
            g.fillRect(r.x + x, cy - mx * (r.h - 14) / 2, 1, Math.max(1, (mx - mn) * (r.h - 14) / 2));
          }
        }
        // fades
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath();
        if (c.fadeIn) { g.moveTo(r.x, r.y + r.h); g.lineTo(r.x + c.fadeIn / c.lengthSec * r.w, r.y); }
        if (c.fadeOut) { g.moveTo(r.x + r.w - c.fadeOut / c.lengthSec * r.w, r.y); g.lineTo(r.x + r.w, r.y + r.h); }
        g.stroke();
        g.fillStyle = '#fff'; g.font = '10px sans-serif'; g.fillText(c.name.replace(/\.[a-z0-9]+$/i, '').slice(0, Math.max(3, Math.floor(r.w / 6))), r.x + 4, r.y + 11);
      } else if (c.kind === 'notes') {
        const ns = c.notes || [];
        if (ns.length) {
          let lo = 127, hi = 0; ns.forEach(n => { lo = Math.min(lo, n.n); hi = Math.max(hi, n.n); });
          const span = Math.max(12, hi - lo + 1), ih = r.h - 16, per = r.w / (c.bars * 16);
          g.fillStyle = lane.color;
          // 3.58 a bent note is drawn bent: a strip along its pitch curve (smooth shape, from → to, starting where its bend starts)
          const th = Math.max(1.5, ih / span), sm = (x) => x * x * (3 - 2 * x), yAt = (n, st) => r.y + 13 + (hi - n.n - st) / span * ih + th / 2;
          // 3.62 a repeating clip draws its pattern in every repeat — the first one solid, the repeats faded (they follow the first)
          const L = c.loop || 0, reps = L ? Math.ceil(c.bars * 16 / L) : 1, max = c.bars * 16;
          for (let k = 0; k < reps; k++) { g.globalAlpha = k ? 0.45 : 1; ns.forEach(n0 => {
            if (L && (n0.s >= L || k * L + n0.s >= max)) return;
            const n = L ? Object.assign({}, n0, { s: k * L + n0.s, l: Math.min(n0.l, L - n0.s, max - k * L - n0.s) }) : n0;
            const x0 = r.x + n.s * per, w = Math.max(1.5, n.l * per - 1);
            if (!n.b) { g.fillRect(x0, r.y + 13 + (hi - n.n) / span * ih, w, th); return; }
            g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip(); g.strokeStyle = lane.color; g.lineWidth = th; g.lineCap = 'butt'; g.beginPath();
            const at = n.b.at || 0; for (let k = 0; k <= 16; k++) { const f = k / 16, kk = f <= at ? 0 : (n.b.shape === 'linear' ? (f - at) / (1 - at) : sm((f - at) / (1 - at))), yy = yAt(n, n.b.from + (n.b.to - n.b.from) * kk); k ? g.lineTo(x0 + w * f, yy) : g.moveTo(x0, yy); }
            g.stroke(); g.restore();
          }); }
          g.globalAlpha = 1;
          if (L) { g.fillStyle = '#fff'; for (let k = 1; k * L < max; k++) { const lx = r.x + k * L * per; g.fillRect(lx, r.y + 2, 2, r.h - 4); g.beginPath(); g.moveTo(lx + 2, r.y + 2); g.lineTo(lx + 8, r.y + 2); g.lineTo(lx + 2, r.y + 8); g.fill(); } }
        }
        for (let b = 1; b < c.bars; b++) { g.fillStyle = lane.color + '55'; g.fillRect(r.x + b * pb, r.y + 2, 1, r.h - 4); }
        g.fillStyle = '#fff'; g.font = '10px sans-serif'; g.fillText((ns.length ? '' : '＋ ') + (c.name || 'clip').slice(0, Math.max(3, Math.floor(r.w / 6))), r.x + 4, r.y + 11);
      } else {
        g.fillStyle = '#fff'; g.font = '700 16px monospace'; g.fillText(c.slot, r.x + 6, r.y + r.h / 2 + 6);
        g.font = '9px monospace'; g.fillStyle = '#9cf'; g.fillText(c.target ? '' : 'no target', r.x + 24, r.y + r.h / 2 + 4);
        for (let b = 1; b < c.bars; b++) { g.fillStyle = 'rgba(0,212,255,.35)'; g.fillRect(r.x + b * pb, r.y + 4, 1, r.h - 8); }
      }
    });
    if (frame) {   // 3.62 the frame: the stretch to cut, over the lanes it covers (a single line when it is a click)
      const fy = laneY(frame.l0), fh = (frame.l1 - frame.l0 + 1) * laneH(), fx = xOf(frame.a), fw = (frame.b - frame.a) * pb;
      if (fw > 0) { g.fillStyle = 'rgba(255,210,74,.13)'; g.fillRect(fx, fy, fw, fh); }
      g.fillStyle = '#ffd24a'; g.fillRect(fx - 1, fy, 2, fh); if (fw > 0) g.fillRect(fx + fw - 1, fy, 2, fh);
      g.font = '600 11px sans-serif'; g.fillText('✂', fx + 4, fy + 13);
    }
    // ruler — stays at the top while the lanes scroll under it
    const ry = rulerY();
    g.fillStyle = '#111823'; g.fillRect(x0, ry, VW, RULER); g.fillStyle = '#2d3f57'; g.fillRect(x0, ry + RULER - 1, VW, 1);
    for (let b = b0; xOf(b) < W; b++) { const x = xOf(b); g.fillStyle = '#2d3f57'; g.fillRect(x, ry, 1, RULER); if (pb >= 24 || b % 4 === 1 || (pb >= 12 && b % 2 === 1)) { g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(String(b), x + 3, ry + 12); } }
    if (view.state.loopOn) { g.fillStyle = '#00d4ff'; g.fillRect(xOf(view.state.loopStartBar), ry + RULER - 4, (view.state.loopEndBar - view.state.loopStartBar) * pb, 4); }
    if (playBar) { const x = xOf(playBar); g.fillStyle = '#fff'; g.fillRect(x, 0, 2, H); g.beginPath(); g.moveTo(x - 5, ry); g.lineTo(x + 7, ry); g.lineTo(x + 1, ry + 8); g.fill(); }
    if (drag && drag.ghost) { g.strokeStyle = '#00ff88'; g.setLineDash([4, 3]); g.strokeRect(drag.ghost.x, drag.ghost.y, drag.ghost.w, drag.ghost.h); g.setLineDash([]); }
  }
  // 3.57 the ∿ panel of a curve lane: rate (locked to the song, or Hz), depth (in the knob's own units), shape — live
  let oscP = null;
  function oscPanel(l, k, anchor) {
    if (oscP) { oscP.remove(); oscP = null; return; }
    const r = anchor.getBoundingClientRect(), o = Object.assign({ rate: '1/8', depth: k.key === '@pitch' ? 1 : +((k.max - k.min) / 8).toFixed(3), shape: 'sine' }, l.osc || {});
    const send = (patch) => { Object.assign(o, patch); view.emit('lane_edit', { id: l.id, patch: { osc: o.rate ? o : null } }); };
    const rates = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'].map(v => ({ value: v, label: v })).concat([0.5, 1, 2, 4, 6, 8].map(v => ({ value: 'hz' + v, label: v + ' Hz' })));
    const rs = UI.Select({ label: 'Rate', options: rates, value: typeof o.rate === 'number' ? 'hz' + o.rate : o.rate, onChange: (v) => send({ rate: String(v).startsWith('hz') ? +String(v).slice(2) : v }) });
    const dk = UI.Knob({ label: 'Depth', min: 0, max: (k.max - k.min) / 2, step: k.step || 0.01, value: o.depth, default: o.depth, unit: k.unit, size: 34, onChange: (v) => send({ depth: v }) });
    const ss = UI.Select({ label: 'Shape', options: ['sine', 'triangle', 'saw', 'square', 'random'].map(v => ({ value: v, label: v })), value: o.shape, onChange: (v) => send({ shape: v }) });
    const off = UI.Button({ label: 'Off', onClick: () => { view.emit('lane_edit', { id: l.id, patch: { osc: null } }); oscP.remove(); oscP = null; } });
    const close = UI.Button({ label: '✓', onClick: () => { oscP.remove(); oscP = null; } });
    oscP = h('div', { class: 'tl-oscp', style: { position: 'fixed', left: Math.round(r.right + 6) + 'px', top: Math.round(r.top - 8) + 'px', zIndex: 160000, background: '#0d1520', border: '1px solid #7cf7ff', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end', boxShadow: '0 8px 24px rgba(0,0,0,.5)' } },
      [h('b', { text: '∿ ' + k.label, style: { color: '#7cf7ff', font: '600 11px var(--font)', alignSelf: 'center' } }), rs.el, dk.el, ss.el, off.el, close.el]);
    ['pointerdown', 'keydown', 'wheel'].forEach(t => oscP.addEventListener(t, (e) => e.stopPropagation()));
    document.body.appendChild(oscP); if (!l.osc) send({});
  }
  // "C3", "f#4", "Bb2" or a MIDI number → MIDI (C4 = 60), else null
  function noteNum(t) {
    t = String(t || '').trim(); if (/^\d+$/.test(t)) return Math.max(0, Math.min(127, +t));
    const m = /^([a-g])([#b]?)(-?\d)$/i.exec(t); if (!m) return null;
    return Math.max(0, Math.min(127, { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1)));
  }
  view.noteNum = noteNum;
  function drawHeads() {
    heads.innerHTML = '';
    A.lanes.forEach((l) => {
      const nm = h('span', { style: { font: '600 11px var(--font)', color: l.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1', cursor: 'text', minWidth: '0' }, text: (l.kind === 'pattern' ? '▦ ' : l.kind === 'marker' ? '⚑ ' : l.kind === 'inst' ? '🎹 ' : l.kind === 'auto' ? '⤴ ' : '♫ ') + l.name, title: 'dbl-click to rename' });
      nm.addEventListener('dblclick', () => UI.ask('Lane name', l.name).then((n) => { if (n) view.emit('lane_edit', { id: l.id, patch: { name: n } }); }));
      const btn = (label, key, title) => h('button', { class: 'uk-toggle' + (l[key] ? ' on' : ''), title, style: { padding: '0 4px', fontSize: '10px' }, text: label, onclick: (e) => { e.stopPropagation(); view.emit('lane_edit', { id: l.id, patch: { [key]: !l[key] } }); } });
      const x = h('button', { class: 'uk-btn', style: { padding: '0 4px', fontSize: '10px' }, text: '×', onclick: () => { if (confirm('Remove lane ' + l.name + ' and its clips?')) view.emit('lane_remove', { id: l.id }); } });
      const row = h('div', { style: { height: laneH() + 'px', display: 'flex', alignItems: 'center', gap: '3px', padding: '0 4px', borderBottom: '1px solid #1a2533', boxSizing: 'border-box' } }, [nm]);
      if (l.kind === 'audio') { row.append(btn('M', 'mute', 'mute'), btn('S', 'solo', 'solo'), btn('⏺', 'armed', 'arm for recording')); const gk = UI.Knob({ min: 0, max: 2, step: 0.01, value: l.gain, default: 1, size: 22, label: '', onChange: (v) => view.emit('lane_edit', { id: l.id, patch: { gain: v } }) }); gk.el.style.width = '28px'; gk.el.querySelector('.uk-knob-val').style.display = 'none'; row.append(gk.el); }
      if (l.kind === 'inst') {
        row.append(btn('M', 'mute', 'mute'), btn('S', 'solo', 'solo'));
        const live = A.instruments.some(o => o.value === l.target);
        const pick = h('select', { class: 'uk-select', title: live ? 'instrument this track plays' : 'instrument missing — pick one', style: { width: '58px', fontSize: '10px', padding: '0 2px', borderColor: live ? '' : '#ff4466' } },
          [h('option', { value: '', text: live ? '—' : '⚠ pick' })].concat(A.instruments.map(o => h('option', { value: o.value, text: o.label }))));
        pick.value = live ? l.target : '';
        pick.addEventListener('change', () => view.emit('lane_edit', { id: l.id, patch: { target: pick.value || null } }));
        pick.addEventListener('pointerdown', (e) => e.stopPropagation());
        row.append(pick);
        // 3.53 ⤴ automate one of this tool's knobs: a lane under the track
        const ks = (A.knobs && A.knobs[l.target]) || [];
        if (live && ks.length) {
          // visible on purpose: a bare ⤴ arrow went unnoticed ("how do I curve the notes? I don't see anything")
          const au = h('select', { class: 'uk-select', 'aria-label': 'Add a curve for a knob', title: 'draw a curve for one of this tool’s knobs (wobble, cutoff, depth…) — it gets its own lane under the track', style: { width: '68px', fontSize: '10px', padding: '0 2px', color: '#ffd166', borderColor: '#ffd16688' } }, [h('option', { value: '', text: '〰 curve' })].concat(ks.map(k => h('option', { value: k.key, text: (k.group ? k.group.toLowerCase() + ' · ' : '') + k.label }))));
          au.addEventListener('change', () => { if (au.value) view.emit('lane_add', { kind: 'auto', target: l.target, key: au.value }); au.value = ''; });
          au.addEventListener('pointerdown', (e) => e.stopPropagation()); row.append(au);
        }
        // 3.62 ✂ split the lane ("adding a way to split the lanes"): drums one lane per pad, or low / high notes on lanes of their own
        const drumsHere = !!(A.drumNames && A.drumNames[l.target] && A.drumNames[l.target].length);
        const sp = h('select', { class: 'uk-select', 'aria-label': 'Split this lane', title: 'split this lane into several — each can then play its own tool, be muted, soloed or given its own curves', style: { width: '38px', fontSize: '10px', padding: '0 2px' } },
          [h('option', { value: '', text: '✂' })].concat(drumsHere ? [h('option', { value: 'pad', text: '✂ one lane per drum pad' })] : [], [h('option', { value: 'pitch', text: '✂ low / high notes (where they part)' }), h('option', { value: 'at', text: '✂ at a note… (e.g. C3)' })]));
        sp.addEventListener('change', () => { const v = sp.value; sp.value = ''; if (!v) return;
          if (v !== 'at') return view.emit('lane_split', { id: l.id, by: v });
          UI.ask('Split at which note? Notes from here up get their own lane (e.g. C3, F#4 or 48)', 'C3').then((t) => { const n = noteNum(t); if (n !== null) view.emit('lane_split', { id: l.id, by: 'pitch', at: n }); }); });
        sp.addEventListener('pointerdown', (e) => e.stopPropagation()); row.append(sp);
      }
      if (l.kind === 'auto') {
        const k = knobOf(l); nm.title = (k ? k.label : l.key) + ' of ' + l.target + ' — click the lane to add points, drag them, right-click removes';
        row.append(btn('M', 'mute', 'mute this automation (the knob is the tool’s own again)'), h('button', { class: 'uk-toggle' + (l.rec ? ' on' : ''), title: 'record: while the song plays, turning this knob writes it here', style: { padding: '0 4px', fontSize: '10px', color: l.rec ? '#ff4466' : '' }, text: '●', onclick: (e) => { e.stopPropagation(); view.emit('lane_edit', { id: l.id, patch: { rec: !l.rec } }); } }));
        if (k && k.type !== 'enum') { const ob = h('button', { class: 'uk-toggle' + (l.osc ? ' on' : ''), title: 'oscillate: swing this curve — vibrato, trill, wobble, a siren', style: { padding: '0 4px', fontSize: '11px', color: l.osc ? '#7cf7ff' : '' }, text: '∿' });
          ob.addEventListener('click', (e) => { e.stopPropagation(); oscPanel(l, k, ob); }); row.append(ob); }
      }
      row.append(x);
      // 3.62: an instrument lane carries M · S · tool · curve · ✂ — with room (lanes ≥ 40 px) its name gets a line of its own above them
      if (l.kind === 'inst' && laneH() >= 40) { row.style.flexWrap = 'wrap'; row.style.alignContent = 'center'; row.style.rowGap = '2px'; nm.style.flex = '1 0 100%'; }
      heads.appendChild(row);
    });
  }
  // 3.62 ("the adjustment doesn't work"): every edit comes back as arrangement_sync — rebuilding here threw away the knob / bars field
  // under the pointer after its first step. Same clip, same kind of controls: the controls stay and only take the new values.
  let inspSig = '', inspSet = [];
  function drawInsp() {
    const c = A && A.clips.find(x => x.id === sel);
    const sig = c ? [c.id, c.kind, c.name, c.kind === 'notes' ? (c.notes || []).length : '', c.kind === 'audio' ? c.lengthSec : '', c.kind === 'pattern' ? (A.sequencers || []).map(s => s.value).join() : ''].join('|') : '';
    if (c && sig === inspSig) { inspSet.forEach(f => f(c)); return; }
    inspSig = sig; inspSet = []; insp.innerHTML = '';
    if (!c) return;
    const live = (ctl, get) => { inspSet.push((cc) => { if (ctl.set && !ctl.el.matches(':active') && !ctl.el.contains(document.activeElement)) ctl.set(get(cc)); }); return ctl.el; };
    const e = (patch) => view.emit('clip_edit', { id: c.id, patch });
    if (c.kind === 'notes') {
      // 3.62 Repeat every: the clip plays its first N bars again and again across its length — stretch it and the pattern keeps going
      const LOOPS = [{ value: '0', label: 'off' }, { value: '4', label: '1 beat' }, { value: '8', label: '½ bar' }, { value: '16', label: '1 bar' }, { value: '32', label: '2 bars' }, { value: '64', label: '4 bars' }, { value: '128', label: '8 bars' }];
      insp.append(h('span', { class: 'org-label', text: '🎹 ' + (c.name || 'clip') + ' · ' + (c.notes || []).length + ' notes' }),
        UI.Button({ label: 'Rename', onClick: () => UI.ask('Clip name', c.name || '').then((n) => { if (n) e({ name: n }); }) }).el,
        live(UI.Select({ label: '⟳ Repeat every', hint: 'the clip plays its first bars again and again across its length — stretch the clip (drag its right edge) and the pattern keeps going; edit the first bars and every repeat follows', options: LOOPS, value: String(c.loop || 0), onChange: (v) => e(+v && c.bars * 16 <= +v ? { loop: +v, bars: Math.max(c.bars, (+v / 16) * 4) } : { loop: +v }) }), cc => String(cc.loop || 0)));
    } else if (c.kind === 'audio') {
      insp.append(h('span', { class: 'org-label', text: '♫ ' + c.name }),
        live(UI.Knob({ label: 'Gain', min: 0, max: 2, step: 0.01, value: c.gain, default: 1, size: 26, onChange: (v) => e({ gain: v }) }), cc => cc.gain),
        live(UI.Knob({ label: 'Fade in', min: 0, max: Math.min(8, c.lengthSec), step: 0.01, unit: 's', value: c.fadeIn, default: 0, size: 26, onChange: (v) => e({ fadeIn: v }) }), cc => cc.fadeIn),
        live(UI.Knob({ label: 'Fade out', min: 0, max: Math.min(8, c.lengthSec), step: 0.01, unit: 's', value: c.fadeOut, default: 0, size: 26, onChange: (v) => e({ fadeOut: v }) }), cc => cc.fadeOut),
        live(UI.Toggle({ label: 'Loop', value: c.loop, onChange: (v) => e({ loop: v }) }), cc => !!cc.loop));
    } else {
      insp.append(h('span', { class: 'org-label', text: '▦ pattern block' }),
        live(UI.Select({ label: 'Slot', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], value: c.slot, onChange: (v) => e({ slot: v }) }), cc => cc.slot),
        live(UI.Select({ label: 'Sequencer', options: [{ value: '', label: '—' }].concat(A.sequencers), value: c.target || '', onChange: (v) => e({ target: v || null }) }), cc => cc.target || ''),
        live(UI.NumberDrag({ label: 'bars', min: 1, max: 128, step: 1, value: c.bars, suffix: ' bars', onChange: (v) => e({ bars: v }) }), cc => cc.bars));
    }
    const repSel = UI.Select({ options: [{ value: '', label: '⧉ Repeat ×…' }, { value: '1', label: '×1 (duplicate)' }, { value: '3', label: '×3 (to 4 in a row)' }, { value: '7', label: '×7 (to 8 in a row)' }, { value: '15', label: '×15 (to 16 in a row)' }],
      onChange: (v) => { setTimeout(() => repSel.set(''), 50); if (+v) view.emit('clip_repeat', { id: c.id, times: +v }); } });
    repSel.el.title = 'copies laid end to end after this clip — each its own clip (to keep them in step, use ⟳ Repeat every instead)';
    insp.append(repSel.el);
    const lenC = c.kind === 'audio' ? c.lengthSec / A.barSec : c.bars;
    insp.append(UI.Button({ label: '✂ In half', hint: 'cut this clip in the middle (note and pattern clips: on a whole bar)', onClick: () => { const mid = c.kind === 'audio' ? c.startBar + lenC / 2 : c.startBar + Math.max(1, Math.round(lenC / 2)); if (c.kind !== 'audio' && lenC < 2) { expSt.textContent = 'This clip is 1 bar long — make it longer to cut it on a bar'; return; } view.emit('clip_split', { id: c.id, bar: mid }); } }).el);
    insp.append(UI.Button({ label: 'Split at playhead', onClick: () => playBar && view.emit('clip_split', { id: c.id, bar: playBar }) }).el, UI.Button({ label: 'Duplicate', onClick: () => view.emit('clip_duplicate', { id: c.id }) }).el, UI.Button({ label: 'Delete', kind: 'danger', onClick: () => { view.emit('clip_remove', { id: c.id }); sel = null; } }).el);
  }
  view.on('auto_live', (p) => { const l = A && A.lanes.find(x => x.id === p.id); if (l) { l.points = p.points; draw(); } });
  function posSay(t) { pos.textContent = t; }   // the value under the pointer while a point is placed or dragged (the playhead takes the readout back)
  view.on('arrangement_sync', (a) => {
    // attach buffer durations to clips for waveform mapping
    a.clips.forEach(c => { if (c.kind === 'audio') { const as = view.K.assets.get(c.assetHash); c.bufDur = as && as.buffer ? as.buffer.duration : c.offsetSec + c.lengthSec; } });
    A = a;
    if (pendingSel) { const ln = a.lanes.find(l => l.target === pendingSel.target || l.id === pendingSel.lane); const c = ln && a.clips.find(x => x.lane === ln.id && x.kind === 'notes' && Math.abs(x.startBar - pendingSel.startBar) < 1e-6); if (c) { sel = c.id; pendingSel = null; } }
    if (sel && !a.clips.some(c => c.id === sel)) sel = null;
    // 3.34: lane heads are rebuilt only when what they show changes — a gain knob is not destroyed by its own drag
    const sig = JSON.stringify([a.lanes.map(l => [l.id, l.kind, l.name, l.color, l.mute, l.solo, l.armed, l.target, l.rec, l.key]), (a.instruments || []).map(o => o.value + o.label), Object.keys(a.knobs || {}).map(t => t + (a.knobs[t] || []).length), Object.keys(a.drumNames || {}), laneH()]);
    if (recK.set) recK.set(!!a.recKnobs);
    if (sig !== headSig) { headSig = sig; drawHeads(); }
    drawInsp(); syncRoll(); draw();
  });
  function syncRoll() {
    const c = A && A.clips.find(x => x.id === sel);
    if (c && c.kind === 'notes') roll.show(c, A.lanes.find(l => l.id === c.lane), A); else if (roll.open) roll.hide();
  }
  view.on('playhead_update', (p) => {
    if (p.bar === null) { playBar = null; roll.playhead(null); draw(); return; }
    const apply = () => { playBar = p.bar; roll.playhead(p.bar); pos.textContent = `${Math.floor(p.bar)}.${Math.floor((p.bar % 1) * 4) + 1}`; draw(); if (view.state.follow && playBar) { const x = xOf(playBar); if (x > scroller.scrollLeft + scroller.clientWidth - 40 || x < scroller.scrollLeft) scroller.scrollLeft = x - 40; } };
    if (p.time) UI.atTime(view.ac, p.time, apply); else apply();
  });
  ['pxPerBar', 'loopOn', 'loopStartBar', 'loopEndBar', 'snap'].forEach(k => view.bind(k, () => draw()));
  view.bind('laneH', () => { headSig = ''; if (A) { drawHeads(); draw(); } });
  // 3.34 sizing: follows the window (maximize ⤢, resize grip, dock) · Ctrl+wheel zooms time around the pointer ·
  // Alt+wheel changes the lane height · Fit shows the whole song
  const cfgKey = (k, v) => view.emit('config_change', { key: k, value: v });
  function setLaneH(v) { cfgKey('laneH', Math.round(Math.max(28, Math.min(160, v)))); }
  function setZoom(v, anchorClientX) {
    const old = ppb(), nv = Math.round(Math.max(8, Math.min(400, v))); if (nv === old) return;
    const sx = anchorClientX !== undefined ? toContent(anchorClientX, 0).x - scroller.scrollLeft : scroller.clientWidth / 2;
    const bar = barOf(scroller.scrollLeft + sx);
    view.state.pxPerBar = nv; cfgKey('pxPerBar', nv); draw(); scroller.scrollLeft = Math.max(0, xOf(bar) - sx);
  }
  function fit() {
    if (!A) return; const end = Math.max(4, A.songEnd + 1, view.state.loopOn ? view.state.loopEndBar : 0);
    view.state.pxPerBar = Math.max(8, Math.min(400, Math.floor((scroller.clientWidth - 12) / (end - 0.5)))); cfgKey('pxPerBar', view.state.pxPerBar);
    setLaneH(Math.floor(((body.clientHeight || 300) - RULER - 4) / Math.max(1, A.lanes.length))); scroller.scrollLeft = 0; body.scrollTop = 0;
  }
  scroller.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); setZoom(ppb() * Math.exp(-e.deltaY * 0.002), e.clientX); }
    else if (e.altKey) { e.preventDefault(); e.stopPropagation(); setLaneH(laneH() - Math.sign(e.deltaY) * 6); }
    // 3.35: a plain wheel scrolls the lanes; when they all fit it scrolls TIME instead (it used to do nothing)
    else if (!e.shiftKey && body.scrollHeight <= body.clientHeight + 1 && scroller.scrollWidth > scroller.clientWidth) { e.preventDefault(); e.stopPropagation(); scroller.scrollLeft += e.deltaY + e.deltaX; }
  }, { passive: false });
  let rafD = 0; const drawSoon = () => { if (!rafD) rafD = requestAnimationFrame(() => { rafD = 0; draw(); }); };
  body.addEventListener('scroll', () => draw());
  scroller.addEventListener('scroll', drawSoon);
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => draw()); ro.observe(body); }
  view.fit = fit;

  // pointer interaction
  function hit(x, y) {
    if (!A) return null;
    for (let i = A.clips.length - 1; i >= 0; i--) { const c = A.clips[i], r = clipRect(c); if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { c, r }; }
    return null;
  }
  // client → canvas content px through the live rect vs the drawn (layout) size: correct at any CanvasWM zoom / pan / DPR
  // (the old `clientX - rect.left` ignored the world's scale(z) — see EravosTimelinePianoRoll.mapPoint)
  const toContent = (clientX, clientY) => { const p = window.EravosTimelinePianoRoll.toContent(cv, clientX, clientY); return { x: p.x + (scroller.scrollLeft || 0), y: p.y }; };
  const local = (e) => toContent(e.clientX, e.clientY);
  cv._toContent = toContent; cv._hit = (x, y) => { const r = hit(x, y); return r ? r.c.id : null; }; cv._state = () => ({ sel, dragging: !!drag }); // test/debug probes
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); cv.focus({ preventScroll: true }); if (!A) return;
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone: the drag still ends on up/cancel/buttonless move */ }
    const { x, y } = local(e);
    if (y < rulerY() + RULER) { drag = { kind: 'ruler', x0: x }; return; }
    const li = Math.floor((y - RULER) / laneH()), lane = A.lanes[li];
    if (lane && lane.kind === 'auto') {   // 3.53 points: click adds, drag moves, right-click removes
      const k = knobOf(lane); if (!k) return;
      const pts = (lane.points || []).map(q => q.slice()), near = pts.findIndex(q => Math.abs(xOf(q[0]) - x) < 7 && Math.abs(aY(li, aFrac(k, q[1])) - y) < 8);
      if (e.button === 2) { if (near >= 0) { pts.splice(near, 1); view.emit('auto_points', { id: lane.id, points: pts }); } return; }
      let at = near;
      if (at < 0) { pts.push([snapB(barOf(x)), aVal(k, aF(li, y))]); pts.sort((a, b) => a[0] - b[0]); at = pts.findIndex(q => q[0] === snapB(barOf(x))); }
      drag = { kind: 'auto', id: lane.id, li, k, pts, at }; posSay(aSay(k, pts[at][1])); draw(); return;
    }
    if (lane && lane.kind === 'marker') {
      const mi = A.markers.findIndex(m => Math.abs(xOf(m.bar) - x) < 8);
      if (e.button === 2 && mi >= 0) { view.emit('marker_edit', { op: 'remove', index: mi }); return; }
      if (mi >= 0) drag = { kind: 'marker', index: mi };
      return;
    }
    const hc = hit(x, y);
    // 3.62 FRAME: press on empty space in a track (or Shift+drag anywhere, over clips too) and drag — that stretch of time over those lanes is the frame; ✂ Split (or S) cuts
    // every clip there at the frame's edges. A click without a drag is one cut line.
    if (!hc || (e.shiftKey && lane && lane.kind !== 'auto')) { sel = null; drawInsp(); syncRoll(); frame = null; if (lane && lane.kind !== 'marker') { drag = { kind: 'frame', x0: x, b0: snapB(barOf(x)), b1: snapB(barOf(x)), l0: li, l1: li }; } draw(); return; }
    frame = null; sel = hc.c.id; drawInsp(); syncRoll();
    const edge = x - hc.r.x < 7 ? 'left' : hc.r.x + hc.r.w - x < 7 ? 'right' : null;
    const top = y - hc.r.y < 9;
    const mode = hc.c.kind === 'audio' && top && edge === 'left' ? 'fadeIn' : hc.c.kind === 'audio' && top && edge === 'right' ? 'fadeOut' : hc.c.kind === 'notes' && edge === 'left' ? 'move' : edge ? 'trim-' + edge : 'move';
    drag = { kind: 'clip', mode, c: Object.assign({}, hc.c), x0: x, y0: y, r: hc.r, alt: e.altKey };
    draw();
  });
  // a drag is only ever live while the pointer is held: a cancelled / lost capture (alt-tab, touch cancel, the window
  // re-parented mid-drag) or a release we never saw drops it, so the timeline can't get stuck editing on hover
  const cancelDrag = () => { if (!drag) return; drag = null; draw(); };
  // 3.34: registered with the shared guard — ends even if every release event on this canvas is missed
  cv.addEventListener('pointerdown', () => { if (drag && !drag.done) drag.done = UI.drag.begin(cancelDrag); });
  cv.addEventListener('pointercancel', cancelDrag);
  cv.addEventListener('lostpointercapture', cancelDrag); // fires after pointerup, which has already consumed the drag
  cv.addEventListener('pointermove', (e) => {
    if (drag && e.buttons === 0 && e.pointerType === 'mouse') { cancelDrag(); return; }
    if (!drag || !A) return;
    const { x, y } = local(e);
    if (drag.kind === 'ruler') { if (Math.abs(x - drag.x0) > 6) { const a = snapB(barOf(Math.min(x, drag.x0))), b = snapB(barOf(Math.max(x, drag.x0))); drag.loop = [Math.round(a), Math.max(Math.round(a) + 1, Math.round(b))]; } return; }
    if (drag.kind === 'marker') { drag.bar = snapB(barOf(x)); return; }
    if (drag.kind === 'frame') { drag.b1 = snapB(barOf(x)); drag.l1 = Math.max(0, Math.min(A.lanes.length - 1, Math.floor((y - RULER) / laneH()))); drag.moved = drag.moved || Math.abs(x - drag.x0) > 4; frame = frameOf(drag); posSay(frameSay()); draw(); return; }
    if (drag.kind === 'auto') { const q = drag.pts[drag.at], lo = drag.at > 0 ? drag.pts[drag.at - 1][0] + 1e-3 : 1, hi = drag.at < drag.pts.length - 1 ? drag.pts[drag.at + 1][0] - 1e-3 : 1e9; q[0] = Math.max(lo, Math.min(hi, snapB(barOf(x)))); q[1] = aVal(drag.k, aF(drag.li, y)); posSay(aSay(drag.k, q[1])); draw(); return; }
    const c = drag.c, dxBar = (x - drag.x0) / ppb();
    if (drag.mode === 'move') {
      const li = Math.max(0, Math.min(A.lanes.length - 1, Math.floor((y - RULER) / laneH())));
      const lane = A.lanes[li].kind === laneKindFor(c) ? A.lanes[li] : A.lanes[drag.r.li];
      drag.patch = { startBar: snapB(c.startBar + dxBar), lane: lane.id };
      drag.ghost = { x: xOf(drag.patch.startBar), y: laneY(A.lanes.indexOf(lane)) + 3, w: drag.r.w, h: drag.r.h };
    } else if (drag.mode === 'trim-right') {
      drag.patch = c.kind === 'audio' ? { lengthSec: Math.max(0.02, c.lengthSec + dxBar * A.barSec) } : { bars: Math.max(1, Math.round(c.bars + dxBar)) };
    } else if (drag.mode === 'trim-left') {
      const nb = snapB(c.startBar + dxBar);
      const d = nb - c.startBar;
      drag.patch = c.kind === 'audio' ? { startBar: nb, offsetSec: Math.max(0, c.offsetSec + d * A.barSec), lengthSec: Math.max(0.02, c.lengthSec - d * A.barSec) } : { startBar: Math.round(nb), bars: Math.max(1, Math.round(c.bars - d)) };
    } else if (drag.mode === 'fadeIn') drag.patch = { fadeIn: Math.max(0, Math.min(c.lengthSec, (x - drag.r.x) / drag.r.w * c.lengthSec)) };
    else if (drag.mode === 'fadeOut') drag.patch = { fadeOut: Math.max(0, Math.min(c.lengthSec, (drag.r.x + drag.r.w - x) / drag.r.w * c.lengthSec)) };
    if (drag.patch && drag.mode !== 'move') view.emit('clip_edit', { id: c.id, patch: drag.patch });
    draw();
  });
  cv.addEventListener('pointerup', (e) => {
    if (!drag) return; const d = drag; drag = null; const { x } = local(e);
    if (d.kind === 'ruler') { if (d.loop) view.emit('loop_set', { start: d.loop[0], end: d.loop[1], on: true }); else view.emit('seek', { bar: barOf(x) }); return; }
    if (d.kind === 'marker') { if (d.bar) view.emit('marker_edit', { op: 'move', index: d.index, bar: d.bar }); return; }
    if (d.kind === 'frame') { frame = frameOf(d); posSay(frameSay()); splitB.el.classList.add('on'); draw(); return; }
    if (d.kind === 'auto') { view.emit('auto_points', { id: d.id, points: d.pts }); return; }
    if (d.mode === 'move' && d.patch) { if (d.alt) view.emit('clip_duplicate', { id: d.c.id, startBar: d.patch.startBar }); else view.emit('clip_edit', { id: d.c.id, patch: d.patch }); }
    draw();
  });
  // 3.70: right-click deletes on a curve lane and a marker lane (its own job there); anywhere else the right-click menu opens with the
  // timeline's own items (view.contextMenu below) — the clip under the pointer, the frame, the song
  cv.addEventListener('contextmenu', (e) => { if (!A) return e.preventDefault(); const { y } = local(e); const ln = A.lanes[Math.floor((y - RULER) / laneH())]; if (y < rulerY() + RULER || (ln && (ln.kind === 'auto' || ln.kind === 'marker'))) e.preventDefault(); });
  view.contextMenu = (e) => {
    if (!A) return [];
    const items = [], p = e && e.target === cv ? local(e) : null, hc = p ? hit(p.x, p.y) : null, c = hc ? hc.c : A.clips.find(x => x.id === sel);
    if (frame) items.push({ label: '✂ Split at the frame', hint: 'cut every clip in the frame at its edges', run: () => doSplit() });
    if (c) {
      const len = c.kind === 'audio' ? c.lengthSec / A.barSec : c.bars, at = p ? snapB(barOf(p.x)) : null;
      items.push({ section: (c.name || 'clip') + ' · ' + (Math.round(len * 100) / 100) + ' bars' });
      if (at && at > c.startBar && at < c.startBar + len) items.push({ label: '✂ Split here (bar ' + (Math.round(at * 4) / 4) + ')', run: () => view.emit('clip_split_at', { lanes: [c.lane], bars: [at] }) });
      if (len >= 2 || c.kind === 'audio') items.push({ label: '✂ In half', run: () => view.emit('clip_split', { id: c.id, bar: c.kind === 'audio' ? c.startBar + len / 2 : c.startBar + Math.max(1, Math.round(len / 2)) }) });
      items.push({ label: '⧉ Repeat ×1', run: () => view.emit('clip_repeat', { id: c.id, times: 1 }) }, { label: '⧉ Repeat ×3 (four in a row)', run: () => view.emit('clip_repeat', { id: c.id, times: 3 }) });
      if (c.kind === 'notes') items.push({ label: '🎹 Edit its notes', run: () => { sel = c.id; drawInsp(); syncRoll(); draw(); } });
      items.push({ label: '🗑 Delete the clip', danger: true, run: () => { view.emit('clip_remove', { id: c.id }); if (sel === c.id) sel = null; } }, { sep: true });
    }
    items.push({ label: tlFull ? '⤡ Back to the canvas' : '⛶ The whole timeline full screen', run: () => setTlFull(!tlFull) },
      { label: '⤢ Fit the song', run: () => fit() },
      { label: '⤓ Bounce to WAV', hint: 'plays the song once, in real time', run: () => view.emit('bounce', {}) },
      { label: '⤓ Export MIDI', run: () => view.emit('export_midi', {}) });
    return items;
  };
  cv.addEventListener('dblclick', (e) => {
    if (!A) return; const { x, y } = local(e); const li = Math.floor((y - RULER) / laneH()), lane = A.lanes[li];
    if (!lane) return;
    if (lane.kind === 'marker') { const mi = A.markers.findIndex(m => Math.abs(xOf(m.bar) - x) < 8); if (mi >= 0) UI.ask('Marker name (DROP fires the Drop Builder)', A.markers[mi].name).then((n) => { if (n) view.emit('marker_edit', { op: 'rename', index: mi, name: n }); }); else { const at = barOf(x); UI.ask('Marker name (e.g. intro, build, DROP)', 'section').then((n) => view.emit('marker_edit', { op: 'add', bar: at, name: n || 'section' })); } }
    else if (lane.kind === 'pattern' && !hit(x, y)) view.emit('clip_add', { kind: 'pattern', lane: lane.id, startBar: Math.floor(barOf(x)), bars: 4, slot: 'A' });
    else if (lane.kind === 'inst' && !hit(x, y)) { const at = Math.floor(barOf(x)); pendingSel = { lane: lane.id, startBar: at }; view.emit('clip_add', { kind: 'notes', lane: lane.id, startBar: at, bars: 4 }); }
  });
  cv.addEventListener('keydown', (e) => {
    const c = A && A.clips.find(x => x.id === sel);
    if (e.key === 'Delete' || e.key === 'Backspace') { if (c) { view.emit('clip_remove', { id: c.id }); sel = null; } e.preventDefault(); }
    else if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && (frame || (c && playBar))) { e.preventDefault(); doSplit(); }
    else if (e.key === 'Escape' && frame) { e.preventDefault(); e.stopPropagation(); frame = null; splitB.el.classList.remove('on'); draw(); }
    else if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey) && c) { view.emit('clip_duplicate', { id: c.id }); e.preventDefault(); }
    else if ((e.key === 'l' || e.key === 'L') && c) { const len = c.kind === 'audio' ? c.lengthSec / A.barSec : c.bars; view.emit('loop_set', { start: Math.floor(c.startBar), end: Math.ceil(c.startBar + len), on: true }); }
    else if (e.key === 'Home') { e.preventDefault(); view.emit('restart', {}); }
    // 3.35 zoom keys: + / − zoom time around the playhead (or the middle), F fits the song
    else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_')) {
      e.preventDefault(); const r = cv.getBoundingClientRect(), s = r.width / (cv.offsetWidth || 1);
      const ax = playBar && xOf(playBar) >= scroller.scrollLeft && xOf(playBar) <= scroller.scrollLeft + scroller.clientWidth ? r.left + (xOf(playBar) - scroller.scrollLeft) * s : undefined;
      setZoom(ppb() * (e.key === '+' || e.key === '=' ? 1.25 : 0.8), ax);
    }
    else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); fit(); }
  });
  scroller.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  scroller.addEventListener('drop', async (e) => {
    e.preventDefault(); e.stopPropagation(); if (!A) return;
    const f = e.dataTransfer.files[0]; if (!f) return;
    const { x, y } = local(e); const lane = A.lanes[Math.floor((y - RULER) / laneH())];
    view.emit('drop_file', { arrayBuffer: await f.arrayBuffer(), name: f.name, bar: barOf(x), lane: lane && lane.kind === 'audio' ? lane.id : undefined });
  });
  view.emit('request_state', {});
});

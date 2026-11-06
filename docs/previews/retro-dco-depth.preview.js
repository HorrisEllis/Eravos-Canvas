/* PREVIEW ONLY — Retro DCO's new depth (his words, 2026-11-06: "What about the shapes and modularity. Like the supersaw amp or like the
 * wobble base" · "Like as much ways to manipulate sound as possible. Especially per tool."). Drawn with the real kit in the real canvas,
 * silent, interactive (drag the envelope handles, add / drag LFO points, draw the wave). Not built: tools/music/planned/retro-dco-depth.ui.md.
 * Each section is planned as a SHARED part (every tool can take it), not Retro DCO's own code. */
(function () {
  const ACC = '#3be8ff', DIM = 'rgba(59,232,255,.18)', TXT = '#8f8f99';
  const S = OrganismSDK.STD;
  const SRC = ['off', 'LFO', 'LFO 2', 'amp env', 'filter env', 'velocity', 'key', 'card', 'random', 'mod wheel', 'aftertouch'];
  const DST = ['pitch', 'width', 'saw', 'pulse', 'sub', 'noise', 'cutoff', 'res', 'drive', 'pan', 'level', 'chorus mix', 'LFO rate', 'wave morph'];
  const rows = 6, cfg = [];
  for (let i = 0; i < rows; i++) cfg.push({ key: 'm' + i + 's', type: 'enum', options: SRC, default: ['LFO', 'filter env', 'velocity', 'card', 'off', 'off'][i], label: 'Source', group: 'MATRIX' },
    { key: 'm' + i + 'd', type: 'enum', options: DST, default: ['width', 'pitch', 'cutoff', 'cutoff', 'pitch', 'pitch'][i], label: 'To', group: 'MATRIX' },
    { key: 'm' + i + 'a', type: 'number', default: [0.35, 0.1, 0.4, 0.2, 0, 0][i], min: -1, max: 1, step: 0.01, label: 'Amount', group: 'MATRIX' });
  cfg.push({ key: 'lfoSync', type: 'enum', options: ['free', '1/4', '1/8', '1/16', '1 bar', '1/8t'], default: '1/8', label: 'Sync', group: 'LFO' },
    { key: 'lfoRate', type: 'number', default: 5, min: 0.05, max: 30, step: 0.01, unit: 'Hz', label: 'Rate', group: 'LFO' },
    { key: 'lfoSmooth', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Smooth', group: 'LFO' },
    { key: 'morph', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Morph', group: 'WAVE' },
    { key: 'waveFrom', type: 'enum', options: ['saw', 'pulse', 'triangle', 'sine'], default: 'saw', label: 'From', group: 'WAVE' });
  OrganismFactory.define({
    id: 'eravos.retro-dco-depth-preview', domain: 'music', version: '0.0.1', label: 'Retro DCO — new depth (preview)', icon: '🌃', accent: ACC,
    category: 'Genre instruments', blurb: 'preview only', size: { w: 640, h: 980 }, minSize: { w: 480, h: 600 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'], hooks: [S.audio_out('rdp.hook.audio_out')], config: cfg,
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' }); return {}; },
  });
  OrganismFactory.reg('eravos.retro-dco-depth-preview', function (view) {
    const UI = view.ui, h = UI.h, cfgOf = (k) => view.descriptor.config.find(c => c.key === k);
    const title = (t, sub) => h('div', { class: 'uk-group-title', text: t + (sub ? '  ·  ' + sub : '') });
    const drag = (cv, hit, move, up) => { let on = null; const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left), (e.clientY - r.top)]; };
      cv.addEventListener('pointerdown', (e) => { on = hit(...pos(e), e); if (on !== null) cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (on !== null) move(on, ...pos(e)); }); cv.addEventListener('pointerup', () => { if (on !== null && up) up(on); on = null; }); };
    // ---- 1. ENVELOPES you drag (Supersaw's, for amp AND filter; a bend handle on every segment)
    const env = { amp: { a: 0.08, d: 0.25, s: 0.65, r: 0.35, ba: 0, bd: -0.5, br: -0.5 }, filter: { a: 0.02, d: 0.35, s: 0.3, r: 0.3, ba: 0.3, bd: -0.6, br: -0.4 } };
    const envCv = (name) => {
      const cv = UI.Canvas(290, 110), E = env[name];
      const pts = () => { const W = cv.W, H = 110, x0 = 8, top = 14, bot = H - 16, span = W - 16, X = (t) => x0 + t * span;
        const xa = X(E.a * 0.3), xd = X(E.a * 0.3 + E.d * 0.3), xs = X(0.72), xr = X(0.72 + E.r * 0.28), ys = bot - (bot - top) * E.s;
        return { x0, top, bot, xa, xd, xs, xr, ys, span }; };
      const seg = (g, xa, ya, xb, yb, bend) => { g.beginPath(); for (let i = 0; i <= 24; i++) { const t = i / 24, k = bend >= 0 ? Math.pow(t, 1 + bend * 3) : 1 - Math.pow(1 - t, 1 - bend * 3); const x = xa + (xb - xa) * t, y = ya + (yb - ya) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
      UI.loop(cv, () => { const g = cv.g; cv.fit(); const p = pts(); g.fillStyle = '#050505'; g.fillRect(0, 0, cv.W, 110);
        g.strokeStyle = ACC; g.lineWidth = 2; seg(g, p.x0, p.bot, p.xa, p.top, E.ba); seg(g, p.xa, p.top, p.xd, p.ys, E.bd);
        g.beginPath(); g.moveTo(p.xd, p.ys); g.lineTo(p.xs, p.ys); g.stroke(); seg(g, p.xs, p.ys, p.xr, p.bot, E.br);
        g.fillStyle = ACC; [[p.xa, p.top], [p.xd, p.ys], [p.xs, p.ys], [p.xr, p.bot]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4.5, 0, 6.283); g.fill(); });
        g.fillStyle = DIM; [[(p.x0 + p.xa) / 2, (p.bot + p.top) / 2], [(p.xa + p.xd) / 2, (p.top + p.ys) / 2], [(p.xs + p.xr) / 2, (p.ys + p.bot) / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); });
        g.fillStyle = TXT; g.font = '10px ui-monospace, monospace'; g.fillText(name.toUpperCase() + `  A ${(E.a * 1000).toFixed(0)}ms  D ${(E.d * 1000).toFixed(0)}ms  S ${E.s.toFixed(2)}  R ${(E.r * 1000).toFixed(0)}ms`, 8, 11); }, 30);
      drag(cv, (x, y) => { const p = pts(); const H = [[p.xa, p.top], [p.xd, p.ys], [p.xs, p.ys], [p.xr, p.bot]]; let best = null, bd = 12; H.forEach(([hx, hy], i) => { const d = Math.hypot(x - hx, y - hy); if (d < bd) { bd = d; best = i; } }); return best; },
        (i, x, y) => { const p = pts(), t = (x - p.x0) / p.span; if (i === 0) E.a = Math.max(0.001, Math.min(1, t / 0.3)); if (i === 1) { E.d = Math.max(0.01, Math.min(1, t / 0.3 - E.a)); E.s = Math.max(0, Math.min(1, (p.bot - y) / (p.bot - p.top))); }
          if (i === 2) E.s = Math.max(0, Math.min(1, (p.bot - y) / (p.bot - p.top))); if (i === 3) E.r = Math.max(0.01, Math.min(1, (t - 0.72) / 0.28)); });
      return cv;
    };
    // ---- 2. LFO SHAPE you draw (Wobble Bass's editor, moved into the shared lfo component so every tool has it)
    let lfo = [[0, 0], [0.18, 1], [0.5, -0.3], [0.62, 0.8], [1, 0]];
    const lfoCv = UI.Canvas(600, 120); let ph = 0;
    const shapeAt = (t) => { for (let i = 0; i < lfo.length - 1; i++) if (t >= lfo[i][0] && t <= lfo[i + 1][0]) { const [a, va] = lfo[i], [b, vb] = lfo[i + 1], k = b > a ? (t - a) / (b - a) : 0, sm = view.state && view.state.lfoSmooth !== undefined ? view.state.lfoSmooth : 0.2, kk = k * (1 - sm) + (0.5 - 0.5 * Math.cos(Math.PI * k)) * sm; return va + (vb - va) * kk; } return 0; };
    UI.loop(lfoCv, () => { const g = lfoCv.g; lfoCv.fit(); const W = lfoCv.W, H = 120, Y = (v) => H / 2 - v * (H / 2 - 12), X = (t) => 10 + t * (W - 20);
      g.fillStyle = '#050505'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(X(i / 8), 6); g.lineTo(X(i / 8), H - 6); g.stroke(); }
      g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200, x = X(t), y = Y(shapeAt(t)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.fillStyle = ACC; lfo.forEach(([t, v]) => { g.beginPath(); g.arc(X(t), Y(v), 4.5, 0, 6.283); g.fill(); });
      ph = (ph + 0.006) % 1; g.fillStyle = '#d9fbff'; g.beginPath(); g.arc(X(ph), Y(shapeAt(ph)), 3, 0, 6.283); g.fill();
      g.fillStyle = TXT; g.font = '10px ui-monospace, monospace'; g.fillText('click to add a point · drag to move · double-click to remove', 12, H - 8); }, 30);
    drag(lfoCv, (x, y, e) => { const W = lfoCv.W, H = 120, t = (x - 10) / (W - 20), v = (H / 2 - y) / (H / 2 - 12); let best = null, bd = 10;
        lfo.forEach(([pt, pv], i) => { const d = Math.hypot(x - (10 + pt * (W - 20)), y - (H / 2 - pv * (H / 2 - 12))); if (d < bd) { bd = d; best = i; } });
        if (best === null && t > 0 && t < 1) { lfo.push([t, Math.max(-1, Math.min(1, v))]); lfo.sort((a, b) => a[0] - b[0]); best = lfo.findIndex(p => p[0] === t); } return best; },
      (i, x, y) => { const W = lfoCv.W, H = 120; let t = (x - 10) / (W - 20); if (i === 0) t = 0; else if (i === lfo.length - 1) t = 1; else t = Math.max(lfo[i - 1][0] + 0.01, Math.min(lfo[i + 1][0] - 0.01, t)); lfo[i] = [t, Math.max(-1, Math.min(1, (H / 2 - y) / (H / 2 - 12)))]; });
    lfoCv.addEventListener('dblclick', (e) => { const r = lfoCv.getBoundingClientRect(), x = e.clientX - r.left; const i = lfo.findIndex(([t]) => Math.abs(10 + t * (lfoCv.W - 20) - x) < 8); if (i > 0 && i < lfo.length - 1) lfo.splice(i, 1); });
    const STARTS = { sine: Array.from({ length: 9 }, (_, i) => [i / 8, Math.sin(i / 8 * 2 * Math.PI)]), triangle: [[0, 0], [0.25, 1], [0.75, -1], [1, 0]], saw: [[0, 1], [0.999, -1], [1, 1]], square: [[0, 1], [0.499, 1], [0.5, -1], [0.999, -1], [1, 1]], random: Array.from({ length: 9 }, (_, i) => [i / 8, i === 0 || i === 8 ? 0 : Math.sin(i * 12.9898) * 0.9]) };
    const lfoBtns = h('div', { class: 'uk-row' }, Object.keys(STARTS).map(n => UI.Button({ label: n, size: 'sm', onClick: () => { lfo = STARTS[n].map(p => p.slice()); } }).el));
    // ---- 3. WAVE you draw (osc-wavetable: draw a cycle, Morph between a classic DCO wave and it)
    const wav = Array.from({ length: 32 }, (_, i) => Math.sin(i / 32 * 2 * Math.PI) * 0.6 + (i < 16 ? 0.3 : -0.3));
    const waveCv = UI.Canvas(600, 110);
    UI.loop(waveCv, () => { const g = waveCv.g; waveCv.fit(); const W = waveCv.W, H = 110, m = view.state && view.state.morph !== undefined ? view.state.morph : 0.5, from = (view.state && view.state.waveFrom) || 'saw';
      const base = (t) => from === 'saw' ? 1 - 2 * t : from === 'pulse' ? (t < 0.35 ? 1 : -1) : from === 'triangle' ? (t < 0.5 ? 4 * t - 1 : 3 - 4 * t) : Math.sin(2 * Math.PI * t);
      const drawn = (t) => { const x = t * 32, i = Math.floor(x) % 32, k = x - Math.floor(x); return wav[i] + (wav[(i + 1) % 32] - wav[i]) * k; };
      g.fillStyle = '#050505'; g.fillRect(0, 0, W, H); const Y = (v) => H / 2 - v * (H / 2 - 10), X = (t) => 10 + t * (W - 20);
      g.strokeStyle = DIM; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200; i ? g.lineTo(X(t), Y(base(t))) : g.moveTo(X(t), Y(base(t))); } g.stroke();
      g.strokeStyle = 'rgba(59,232,255,.45)'; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200; i ? g.lineTo(X(t), Y(drawn(t))) : g.moveTo(X(t), Y(drawn(t))); } g.stroke();
      g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200, v = base(t) * (1 - m) + drawn(t) * m; i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)); } g.stroke();
      g.fillStyle = TXT; g.font = '10px ui-monospace, monospace'; g.fillText(`draw the wave with the mouse · Morph ${m.toFixed(2)} from ${from} (faint) to yours (mid) = what plays (bright)`, 12, H - 8); }, 30);
    drag(waveCv, () => 0, (_, x, y) => { const W = waveCv.W, H = 110, i = Math.max(0, Math.min(31, Math.round((x - 10) / (W - 20) * 32))); wav[i] = Math.max(-1, Math.min(1, (H / 2 - y) / (H / 2 - 10))); });
    // ---- 4. MOD MATRIX: any source to any destination, with an amount (no fixed wiring)
    const matrix = h('div', { class: 'uk-panel' }, Array.from({ length: rows }, (_, i) => h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center' } }, [
      h('span', { class: 'org-label', text: String(i + 1) }), UI.paramControl(view, cfgOf('m' + i + 's'), { segMax: 0 }).el, h('span', { class: 'org-label', text: '→' }),
      UI.paramControl(view, cfgOf('m' + i + 'd'), { segMax: 0 }).el, UI.paramControl(view, cfgOf('m' + i + 'a'), { size: 28 }).el])));
    // ---- 5. OPEN AS PARTS: the tool as its components on the canvas, wired — rewire, swap, plug other tools in
    const parts = UI.Canvas(600, 120);
    UI.loop(parts, () => { const g = parts.g; parts.fit(); const W = parts.W, H = 120; g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
      const box = (x, y, w, t) => { g.strokeStyle = ACC; g.lineWidth = 1.5; g.strokeRect(x, y, w, 26); g.fillStyle = '#d9fbff'; g.font = '11px ui-monospace, monospace'; g.fillText(t, x + 6, y + 17); return [x, y, w]; };
      const wire = (a, b, dashed) => { g.strokeStyle = dashed ? 'rgba(59,232,255,.5)' : ACC; g.setLineDash(dashed ? [4, 4] : []); g.beginPath(); g.moveTo(a[0] + a[2], a[1] + 13); g.lineTo(b[0], b[1] + 13); g.stroke(); g.setLineDash([]); };
      const u = W / 6.2, o = box(8, 12, u - 10, 'osc-va ×cards'), s = box(8, 72, u - 10, 'osc-sub + noise'), f = box(8 + u * 1.25, 42, u - 10, 'filter ladder'), a = box(8 + u * 2.5, 42, u - 10, 'amp env'),
        b = box(8 + u * 3.75, 42, u - 10, 'bbd-line'), e = box(8 + u * 5, 42, u * 1.1 - 10, 'ensemble → out'), l = box(8 + u * 1.25, 90, u - 10, 'lfo (drawn)');
      wire(o, f); wire(s, f); wire(f, a); wire(a, b); wire(b, e); g.strokeStyle = 'rgba(59,232,255,.5)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(l[0] + l[2] / 2, l[1]); g.lineTo(f[0] + f[2] / 2, f[1] + 26); g.stroke(); g.setLineDash([]); }, 15);
    const openParts = UI.Button({ label: '⧉ Open as parts', kind: 'primary', hint: 'Retro DCO opens on the canvas as its components, wired as it plays — rewire, swap a part, plug another tool in', onClick: () => {} });
    const sect = (t, sub, ...kids) => h('div', { class: 'uk-group' }, [title(t, sub)].concat(kids));
    view.root.append(
      h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [h('b', { text: 'The new depth — preview (silent, try the handles)' }), openParts.el]),
      sect('ENVELOPES', 'drag the dots; the faint dots bend each segment', h('div', { class: 'org-row', style: { gap: '8px' } }, [envCv('amp'), envCv('filter')])),
      sect('LFO SHAPE', 'draw it, or start from one', lfoCv, h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center' } }, [lfoBtns, UI.paramControl(view, cfgOf('lfoSync'), { segMax: 6 }).el, UI.paramControl(view, cfgOf('lfoRate'), { size: 28 }).el, UI.paramControl(view, cfgOf('lfoSmooth'), { size: 28 }).el])),
      sect('WAVE', 'draw a cycle; Morph from the DCO wave to yours', waveCv, h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center' } }, [UI.paramControl(view, cfgOf('waveFrom'), { segMax: 6 }).el, UI.paramControl(view, cfgOf('morph'), { size: 28 }).el])),
      sect('MOD MATRIX', 'any source → any destination', matrix),
      sect('OPEN AS PARTS', 'the same sound as wired components', parts),
      UI.hint('Every section is a shared part: the drawn LFO and the envelope editor go into lfo and env-adsr, the matrix into a new mod-matrix component — so every tool can take them, not just Retro DCO.'));
  });
})();

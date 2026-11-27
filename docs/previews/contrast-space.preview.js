/* PREVIEW ONLY — the seven new UI elements for components (RIPPLE · WAVELENGTH · COLLISION · SPACE · PENDULUM · TENSION · EMERGENCE),
 * drawn with the real kit inside the real canvas, gathered on one proposed tool, Contrast Space. Silent: no engine yet.
 * His words (2026-11-27): "i want a bunch of spacial tools and ui elements for components. tension, oscillations. wavelengths, emergence."
 * Spec: specs/eravos.contrast-space.spec (CS0–CS9). Each element belongs to a COMPONENT (its contract's "element"), so it appears in every
 * tool that holds that component; Contrast Space is only where they are seen together. */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit, element) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, element });
  OrganismFactory.define({
    id: 'eravos.contrast-space', domain: 'music', version: '0.1.0', label: 'Contrast Space', icon: '◐', accent: '#ff5a3c',
    category: 'Effects', blurb: 'Where frequencies meet: ripples between close notes, a low and a mid that collide, each band its own place in space, tension held and released.',
    size: { w: 900, h: 1180 }, minSize: { w: 640, h: 560 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_in('cs.hook.audio_in'), S.audio_out('cs.hook.audio_out'), S.transport_in('cs.hook.transport_in'),
      S.mod_out('cs.hook.tension', 'tension'), S.mod_out('cs.hook.sync', 'sync')],
    config: [
      n('note', 'Note', 'RIPPLE', 49, 30, 120, 0.1, 'Hz', 'unison-stack'), n('beat', 'Beat', 'RIPPLE', 1.6, 0, 12, 0.01, 'Hz', 'unison-stack'),
      n('voices', 'Voices', 'RIPPLE', 2, 2, 7, 1, '', 'unison-stack'),
      n('pitch', 'Pitch', 'WAVELENGTH', 41.2, 20, 2000, 0.1, 'Hz', 'scale-key'),
      n('split', 'Split', 'COLLISION', 110, 40, 400, 1, 'Hz', 'masking-analyzer'), n('duck', 'Duck', 'COLLISION', 9, 0, 24, 0.1, 'dB', 'ducker'),
      n('distance', 'Distance', 'SPACE', 0.35, 0, 1, 0.01, '', 'early-reflections'), n('width', 'Width', 'SPACE', 1.4, 0, 2, 0.01, '', 'stereo-tools'),
      n('bassMono', 'Bass mono', 'SPACE', 120, 20, 400, 1, 'Hz', 'stereo-tools'),
      n('rate', 'Rate', 'PENDULUM', 0.5, 0.05, 8, 0.01, 'Hz', 'lfo'), n('swing', 'Swing', 'PENDULUM', 0.85, 0, 1, 0.01, '', 'lfo'),
      n('lean', 'Lean', 'PENDULUM', 0.3, -1, 1, 0.01, '', 'lfo'),
      n('hold', 'Hold', 'TENSION', 8, 1, 32, 1, 'bars', 'tension-meter'), n('release', 'Release', 'TENSION', 0.15, 0.01, 2, 0.01, 's', 'tension-meter'),
      n('coupling', 'Coupling', 'EMERGENCE', 0.3, 0, 3, 0.01, '', 'oscillator-population'), n('spread', 'Spread', 'EMERGENCE', 0.6, 0, 2, 0.01, 'Hz', 'oscillator-population'),
      n('count', 'Count', 'EMERGENCE', 24, 3, 64, 1, '', 'oscillator-population'),
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('in', { kind: 'audio', direction: 'in', node: g, label: 'in' }); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' });
      const d = ctx.ac.createConstantSource(); d.start(); ctx.track(d);
      ctx.port('tension', { kind: 'mod', direction: 'out', node: d, label: 'tension' }); ctx.port('sync', { kind: 'mod', direction: 'out', node: d, label: 'sync' }); return {}; },
  });
  OrganismFactory.reg('eravos.contrast-space', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    const ACC = '#ff5a3c', ACC2 = '#5ac8ff', DIM = '#8f8f99', BG = '#050505', TAU = Math.PI * 2;
    let t = 0, released = 0;
    const label = (g, s, x, y, c) => { g.fillStyle = c || DIM; g.font = '10px ui-monospace, monospace'; g.fillText(s, x, y); };
    const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 6 }); c.el.dataset.key = k; return c.el; };
    // one element card: its name, the component it belongs to, its live drawing, its controls
    function element(name, comp, draw, keys, H) {
      const cv = UI.Canvas(400, H || 104);
      UI.loop(cv, () => { const g = cv.g; cv.fit(); const W = cv.W, HH = H || 104; g.fillStyle = BG; g.fillRect(0, 0, W, HH); draw(g, W, HH); }, 30);
      return h('div', { class: 'uk-group', style: { flex: '1 1 400px', minWidth: '300px' } }, [
        h('div', { class: 'uk-group-title', text: name + '  ·  ' + comp }), cv, h('div', { class: 'uk-row' }, keys.map(ctl))]);
    }
    UI.loop(UI.Canvas(1, 1), () => { t += 1 / 30; released = Math.max(0, released - 1 / 30 / Math.max(0.05, P('release') * 4)); }, 30);

    // RIPPLE — two (or more) close notes and what they make together: the sum swells and empties at the beat (|f1 − f2| Hz)
    const ripple = element('RIPPLE', 'unison-stack (Hz detune)', (g, W, H) => {
      const f = P('note'), b = P('beat'), N = P('voices'), span = 1.5, mid = H / 2;   // 1.5 s of sound across the card, the waves slowed to be seen
      const shown = (x) => t * 0.25 + x / W * span;
      [[0, ACC2, 0.18], [1, ACC, 0.18]].forEach(([k, c, a]) => { g.strokeStyle = c; g.globalAlpha = 0.45; g.lineWidth = 1; g.beginPath();
        for (let x = 0; x < W; x++) { const s = shown(x), y = mid - 14 - 10 * Math.sin(TAU * (f / 12 + k * b) * s); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
      g.globalAlpha = 1; g.strokeStyle = '#e8e8ea'; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x < W; x++) { const s = shown(x); let v = 0; for (let k = 0; k < N; k++) v += Math.sin(TAU * (f / 12 + (k - (N - 1) / 2) * b / Math.max(1, N - 1)) * s);
        const y = mid + 18 - 26 * v / N; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath();   // the envelope of two: |cos(π Δ t)|
      for (let x = 0; x < W; x++) { const y = mid + 18 - 26 * Math.abs(Math.cos(Math.PI * b * shown(x))); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
      label(g, `${f.toFixed(1)} Hz + ${(f + b).toFixed(1)} Hz → a ripple ${b.toFixed(2)} times a second`, 6, 12);
      label(g, b < 0.05 ? 'one note: no ripple' : b < 7 ? 'heard as a swell (the room breathes)' : 'heard as roughness (a growl)', 6, H - 6, b < 7 ? DIM : ACC);
    }, ['note', 'beat', 'voices']);

    // WAVELENGTH — a pitch as a length in the room: λ = 343 / f metres; the period in ms; where it fits (a speaker, a room)
    const wave = element('WAVELENGTH', 'scale-key (any pitch)', (g, W, H) => {
      const f = P('pitch'), lam = 343 / f, roomM = 12, px = (W - 20) / roomM, mid = H / 2 + 4;
      g.strokeStyle = '#2a2a2e'; g.lineWidth = 1; for (let m = 0; m <= roomM; m++) { const x = 10 + m * px; g.beginPath(); g.moveTo(x, H - 16); g.lineTo(x, H - (m % 5 ? 12 : 8)); g.stroke(); }
      label(g, '0', 8, H - 2); label(g, '5 m', 10 + 5 * px - 8, H - 2); label(g, '10 m', 10 + 10 * px - 10, H - 2);
      g.strokeStyle = ACC; g.lineWidth = 1.6; g.beginPath();
      for (let x = 10; x < W - 10; x++) { const m = (x - 10) / px, y = mid - 26 * Math.sin(TAU * (m / lam - t * 0.3)); x > 10 ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      const w = Math.min(W - 20, lam * px); g.strokeStyle = '#e8e8ea'; g.beginPath(); g.moveTo(10, 22); g.lineTo(10 + w, 22); g.stroke();
      label(g, `${f.toFixed(1)} Hz · one wave = ${lam >= 1 ? lam.toFixed(2) + ' m' : (lam * 100).toFixed(1) + ' cm'} · ${(1000 / f).toFixed(2)} ms`, 6, 12, '#e8e8ea');
      label(g, lam > 4 ? 'longer than most rooms: felt more than placed' : lam > 0.5 ? 'room-sized: where it sits matters' : 'small: easy to place and to beam', 6, 36);
    }, ['pitch']);

    // COLLISION — a low part and a mid part, their spectra; where both are loud they mask each other (lit); a split hands the band to one
    const coll = element('COLLISION', 'masking-analyzer + ducker', (g, W, H) => {
      const x = (hz) => 6 + (Math.log(hz / 20) / Math.log(1000)) * (W - 12), split = P('split'), duck = P('duck'), base = H - 14;
      const sub = (hz) => Math.exp(-Math.pow(Math.log(hz / 55) / 0.6, 2));
      const raw = (hz) => 0.85 * Math.exp(-Math.pow(Math.log(hz / 300) / 1.05, 2)) * (0.8 + 0.2 * Math.sin(hz / 37 + t * 3)), mid = (hz) => raw(hz) * (hz < split ? Math.pow(10, -duck / 20) : 1);
      const draw = (fn, c) => { g.strokeStyle = c; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i <= 200; i++) { const hz = 20 * Math.pow(1000, i / 200), y = base - fn(hz) * (H - 34); i ? g.lineTo(x(hz), y) : g.moveTo(x(hz), y); } g.stroke(); };
      for (let i = 0; i < 200; i++) { const hz = 20 * Math.pow(1000, i / 200), o = Math.min(sub(hz), mid(hz)); if (o > 0.12) { g.fillStyle = `rgba(255,90,60,${Math.min(0.85, o)})`; g.fillRect(x(hz), base - o * (H - 34), (W - 12) / 200 + 1, o * (H - 34)); } }
      draw(sub, ACC2); draw(mid, '#e8e8ea');
      g.strokeStyle = ACC; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x(split), 16); g.lineTo(x(split), base); g.stroke(); g.setLineDash([]);
      [50, 100, 200, 500, 1000, 5000].forEach(hz => label(g, hz >= 1000 ? hz / 1000 + 'k' : '' + hz, x(hz) - 6, H - 2));
      label(g, 'low (sub)', 6, 12, ACC2); label(g, 'mid (growl)', 80, 12, '#e8e8ea'); label(g, `lit = where they collide · under ${split} Hz the mid steps back ${duck.toFixed(0)} dB`, 6, 26, ACC);
    }, ['split', 'duck']);

    // SPACE — from above: you in the middle, each band its own place; the sub stays in the centre (mono under Bass mono), the mids spread
    const space = element('SPACE', 'panner + stereo-tools + early-reflections', (g, W, H) => {
      const cx = W / 2, cy = H / 2 + 6, R = Math.min(W / 2 - 20, H / 2 - 12) * 1.6, ry = Math.min(H / 2 - 12, R / 2.2), dist = P('distance'), wid = P('width');
      g.strokeStyle = '#2a2a2e'; [0.33, 0.66, 1].forEach(r => { g.beginPath(); g.ellipse(cx, cy, R * r, ry * r, 0, 0, TAU); g.stroke(); });
      g.fillStyle = '#e8e8ea'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill(); label(g, 'you', cx - 9, cy + 16);
      const band = (name, c, spreadK, r, wob) => { const a0 = -Math.PI / 2, sp = Math.min(1.2, spreadK * wid) * 1.1, rr = 0.2 + r * 0.8 * (0.35 + dist);
        for (const s of [-1, 1]) { const a = a0 + s * sp + wob * Math.sin(t * 1.3), px = cx + Math.cos(a) * R * rr, py = cy + Math.sin(a) * ry * rr;
          g.fillStyle = c; g.globalAlpha = 0.85; g.beginPath(); g.arc(px, py, sp < 0.05 ? 7 : 5, 0, TAU); g.fill(); g.globalAlpha = 1; if (sp < 0.05) break; }
        label(g, '● ' + name, 6, H - 34 + legendY, c); legendY += 12; };
      let legendY = 0;
      legendY = 0; band(`sub < ${P('bassMono')} Hz (mono)`, ACC2, 0, 0.15, 0); band('growl', '#e8e8ea', 0.35, 0.5, 0.05); band('air', ACC, 0.9, 0.95, 0.12);
      label(g, `distance ${Math.round(dist * 100)} % · width ${wid.toFixed(2)}`, 6, 12);
    }, ['distance', 'width', 'bassMono'], 120);

    // PENDULUM — an oscillation as a swing between LOW and HIGH; Swing = how far, Lean = which side it lingers on; its trail behind it
    const trail = [];
    const pend = element('PENDULUM', 'lfo (pendulum shape)', (g, W, H) => {
      const cx = W / 2, top = 14, L = H - 34, sw = P('swing'), lean = P('lean');
      const ph = Math.sin(TAU * P('rate') * t), skew = ph + lean * (1 - ph * ph) * 0.8, a = skew * sw * 1.05;
      const bx = cx + Math.sin(a) * (W / 2 - 30), by = top + Math.cos(a) * L * 0.9;
      trail.push([bx, by]); if (trail.length > 40) trail.shift();
      trail.forEach(([x, y], i) => { g.fillStyle = `rgba(255,90,60,${i / trail.length * 0.5})`; g.fillRect(x - 1, y - 1, 3, 3); });
      g.strokeStyle = '#4a4a50'; g.beginPath(); g.moveTo(cx, top); g.lineTo(bx, by); g.stroke();
      g.fillStyle = ACC; g.beginPath(); g.arc(bx, by, 8, 0, TAU); g.fill();
      label(g, 'LOW', 8, H - 8, ACC2); label(g, 'HIGH', W - 34, H - 8, ACC);
      label(g, `${P('rate').toFixed(2)} swings / s · reaches ${Math.round(sw * 100)} % · lingers ${lean > 0.05 ? 'high' : lean < -0.05 ? 'low' : 'nowhere'}`, 6, 12);
    }, ['rate', 'swing', 'lean']);

    // TENSION — five kinds stacked (harmony, rhythm, spectrum, density, pitch); they climb while it is held, the sum lets go at RELEASE
    const tens = element('TENSION', 'tension-meter + energy-curve', (g, W, H) => {
      const hold = P('hold'), bars = hold + 4, x = (b) => 6 + b / bars * (W - 12), now = (t * 0.5) % bars, base = H - 14;
      const kinds = [['harmony', '#b48cff', 0.7], ['rhythm', ACC2, 1], ['spectrum', '#e8e8ea', 0.85], ['density', '#7fe08a', 0.6], ['pitch', ACC, 0.9]];
      const v = (b, k) => b < hold ? Math.pow(b / hold, 1.4 + k * 0.3) : Math.exp(-(b - hold) / Math.max(0.02, P('release') * 2)) * 0.15;
      let stack = new Array(161).fill(0);
      kinds.forEach(([name, c, w], k) => { g.fillStyle = c; g.globalAlpha = 0.55;
        for (let i = 0; i < 160; i++) { const b = i / 160 * bars, add = v(b, k) * w * (H - 40) / kinds.length; g.fillRect(x(b), base - stack[i] - add, (W - 12) / 160 + 0.6, add); stack[i] += add; } });
      g.globalAlpha = 1; g.strokeStyle = '#e8e8ea'; g.beginPath(); g.moveTo(x(now), 16); g.lineTo(x(now), base); g.stroke();
      g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x(hold), 16); g.lineTo(x(hold), base); g.stroke(); g.setLineDash([]);
      label(g, 'RELEASE', x(hold) + 4, 26, ACC); kinds.forEach(([name, c], k) => label(g, name, 6 + k * 66, 12, c));
      label(g, `held ${hold} bars, let go in ${(P('release') * 1000).toFixed(0)} ms${released > 0.01 ? ' — RELEASED' : ''}`, 6, H - 2);
    }, ['hold', 'release']);

    // EMERGENCE — many oscillators on a circle (each a phase); coupling pulls them together; the arrow is how much they agree (0 … 1)
    let ph = null, om = null;
    const emer = element('EMERGENCE', 'oscillator-population + relationship-graph', (g, W, H) => {
      const N = Math.round(P('count')), K = P('coupling'), sp = P('spread'), cx = W / 2 - 60, cy = H / 2 + 4, R = Math.min(H / 2 - 14, 52);
      if (!ph || ph.length !== N) { ph = Array.from({ length: N }, (_, i) => (i * 2.399) % TAU); om = Array.from({ length: N }, (_, i) => TAU * (0.6 + sp * ((i * 0.618) % 1 - 0.5))); }
      let re = 0, im = 0; ph.forEach(p => { re += Math.cos(p); im += Math.sin(p); }); re /= N; im /= N; const r = Math.hypot(re, im), psi = Math.atan2(im, re);
      for (let i = 0; i < N; i++) ph[i] += (om[i] + K * r * Math.sin(psi - ph[i]) * 4) / 30;   // the Kuramoto pull, one frame
      g.strokeStyle = '#2a2a2e'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      ph.forEach(p => { g.fillStyle = ACC2; g.beginPath(); g.arc(cx + Math.cos(p) * R, cy + Math.sin(p) * R, 3, 0, TAU); g.fill(); });
      g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(psi) * R * r, cy + Math.sin(psi) * R * r); g.stroke(); g.lineWidth = 1;
      label(g, `${N} voices · agree ${(r * 100).toFixed(0)} %`, cx + R + 20, cy - 12, '#e8e8ea');
      label(g, r > 0.8 ? 'locked: one big voice' : r > 0.35 ? 'finding each other' : 'a crowd: each its own', cx + R + 20, cy + 4, r > 0.8 ? ACC : DIM);
      label(g, '→ out: sync (a signal any tool can follow)', cx + R + 20, cy + 20);
    }, ['coupling', 'spread', 'count']);

    const rel = UI.Button({ label: '⇣ RELEASE', kind: 'primary', hint: 'let the held tension go now: every tension lane falls over Release; the tension output drops with it', onClick: () => { released = 1; } });
    view.root.append(
      h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), rel.el]),
      h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '10px', alignItems: 'stretch' } }, [ripple, wave, coll, space, pend, tens, emer]),
      UI.hint('Preview — nothing sounds yet. Each card is a UI element that belongs to a component, so every tool holding that component shows it. Contrast lives where two things meet: two close notes (a ripple), a low and a mid (a collision), near and far, mono and wide, held and let go, apart and together.'),
    );
  });
})();

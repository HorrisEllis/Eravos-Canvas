/* PREVIEW ONLY — seven component UI elements, each its OWN small window on the canvas (a component tool: the component's code, its own
 * window, its own ports), wired to each other with ordinary wires. No tool gathers them (his, 2026-11-27: "Okay but not one monolith.
 * Against the design philosophy" — axioms 1–3: parts, not monoliths; components any tool can use; a suite is a tool with its components
 * wired). Silent: no engines yet. Spec: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2). */
(function () {
  const S = OrganismSDK.STD, TAU = Math.PI * 2, ACC = '#ff5a3c', ACC2 = '#5ac8ff', DIM = '#8f8f99', BG = '#050505';
  const n = (key, label, def, min, max, step, unit) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group: 'MAIN', unit });
  const label = (g, s, x, y, c) => { g.fillStyle = c || DIM; g.font = '10px ui-monospace, monospace'; g.fillText(s, x, y); };

  // one component tool: its descriptor, its ports (audio and/or mod), its drawing, its controls — nothing shared but this helper
  function element(o) {
    const id = 'eravos.' + o.id, hooks = [];
    if (o.audio) hooks.push(S.audio_in(id + '.hook.audio_in'), S.audio_out(id + '.hook.audio_out'));
    (o.modIn || []).forEach(k => hooks.push(S.mod_in(id + '.hook.' + k + '_in', k)));
    (o.modOut || []).forEach(k => hooks.push(S.mod_out(id + '.hook.' + k, k)));
    OrganismFactory.define({
      id, domain: 'music', version: '0.1.0', label: o.label, icon: o.icon, accent: o.accent || ACC, category: 'Effects',
      blurb: o.blurb, size: { w: 420, h: o.h || 250 }, minSize: { w: 320, h: 200 },
      permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'], hooks, config: o.config,
      engine(ctx) {
        if (o.audio) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('in', { kind: 'audio', direction: 'in', node: g, label: 'in' }); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' }); }
        (o.modIn || []).forEach(k => ctx.modBus(k, { min: 0, max: 1 }));
        if ((o.modOut || []).length) { const d = ctx.ac.createConstantSource(); d.start(); ctx.track(d); o.modOut.forEach(k => ctx.port(k, { kind: 'mod', direction: 'out', node: d, label: k })); }
        return {};
      },
    });
    OrganismFactory.reg(id, function (view) {
      const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
      const P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
      const st = { t: 0 }, H = o.ch || 104, cv = UI.Canvas(390, H);
      UI.loop(cv, () => { st.t += 1 / 30; const g = cv.g; cv.fit(); g.fillStyle = BG; g.fillRect(0, 0, cv.W, H); o.draw(g, cv.W, H, P, st); }, 30);
      const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 6 }); c.el.dataset.key = k; return c.el; };
      const row = [h('div', { class: 'uk-row' }, o.config.map(c => ctl(c.key)))];
      if (o.button) { const b = UI.Button({ label: o.button.label, kind: 'primary', hint: o.button.hint, onClick: () => o.button.press(st) }); row.push(b.el); }
      view.root.append(cv, h('div', { class: 'org-row', style: { justifyContent: 'space-between', alignItems: 'center' } }, row),
        UI.hint(o.comp + ' — ' + o.hint));
    });
    return id;
  }

  const ids = {};
  ids.ripple = element({ id: 'el-ripple', label: 'Ripple', icon: '≈', comp: 'unison-stack (detune in Hz)', audio: true, modIn: ['beat'],
    blurb: 'Two close notes and the swell they make together.', hint: 'two notes Δ Hz apart swell Δ times a second: under 7 Hz a swell, above it a growl.',
    config: [n('note', 'Note', 49, 30, 120, 0.1, 'Hz'), n('beat', 'Beat', 1.6, 0, 12, 0.01, 'Hz'), n('voices', 'Voices', 2, 2, 7, 1, '')],
    draw(g, W, H, P, st) {
      const f = P('note'), b = P('beat'), N = P('voices'), mid = H / 2, sh = (x) => st.t * 0.25 + x / W * 1.5;
      [[0, ACC2], [1, ACC]].forEach(([k, c]) => { g.strokeStyle = c; g.globalAlpha = 0.45; g.beginPath();
        for (let x = 0; x < W; x++) { const y = mid - 14 - 10 * Math.sin(TAU * (f / 12 + k * b) * sh(x)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
      g.globalAlpha = 1; g.strokeStyle = '#e8e8ea'; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x < W; x++) { let v = 0; for (let k = 0; k < N; k++) v += Math.sin(TAU * (f / 12 + (k - (N - 1) / 2) * b / Math.max(1, N - 1)) * sh(x)); const y = mid + 18 - 26 * v / N; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); for (let x = 0; x < W; x++) { const y = mid + 18 - 26 * Math.abs(Math.cos(Math.PI * b * sh(x))); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
      label(g, `${f.toFixed(1)} + ${(f + b).toFixed(1)} Hz → ${b.toFixed(2)} ripples / s`, 6, 12);
      label(g, b < 0.05 ? 'one note: no ripple' : b < 7 ? 'a swell (the room breathes)' : 'roughness (a growl)', 6, H - 6, b < 7 ? DIM : ACC);
    } });
  ids.wave = element({ id: 'el-wavelength', label: 'Wavelength', icon: '⟷', comp: 'scale-key (any pitch control shows it)', modIn: [],
    blurb: 'A pitch as a length in the room.', hint: 'one wave = 343 / f metres. A display: it changes no sound.', h: 210,
    config: [n('pitch', 'Pitch', 41.2, 20, 2000, 0.1, 'Hz')],
    draw(g, W, H, P, st) {
      const f = P('pitch'), lam = 343 / f, px = (W - 20) / 12, mid = H / 2 + 6;
      g.strokeStyle = '#2a2a2e'; for (let m = 0; m <= 12; m++) { const x = 10 + m * px; g.beginPath(); g.moveTo(x, H - 16); g.lineTo(x, H - (m % 5 ? 12 : 8)); g.stroke(); }
      label(g, '0', 8, H - 2); label(g, '5 m', 10 + 5 * px - 8, H - 2); label(g, '10 m', 10 + 10 * px - 10, H - 2);
      g.strokeStyle = ACC; g.lineWidth = 1.6; g.beginPath(); for (let x = 10; x < W - 10; x++) { const y = mid - 22 * Math.sin(TAU * ((x - 10) / px / lam - st.t * 0.3)); x > 10 ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1;
      label(g, `${f.toFixed(1)} Hz · one wave ${lam >= 1 ? lam.toFixed(2) + ' m' : (lam * 100).toFixed(1) + ' cm'} · ${(1000 / f).toFixed(2)} ms`, 6, 12, '#e8e8ea');
      label(g, lam > 4 ? 'longer than most rooms: felt more than placed' : lam > 0.5 ? 'room-sized: where it sits matters' : 'small: easy to place', 6, 26);
    } });
  ids.coll = element({ id: 'el-collision', label: 'Collision', icon: '⨯', comp: 'masking-analyzer + ducker', audio: true, modIn: ['duck'],
    blurb: 'Where a low part and a mid part fight, and who steps back.', hint: 'lit where both are loud; under the split the mid steps back.',
    config: [n('split', 'Split', 110, 40, 400, 1, 'Hz'), n('duck', 'Duck', 9, 0, 24, 0.1, 'dB')],
    draw(g, W, H, P, st) {
      const x = (hz) => 6 + Math.log(hz / 20) / Math.log(1000) * (W - 12), split = P('split'), duck = P('duck'), base = H - 14;
      const sub = (hz) => Math.exp(-Math.pow(Math.log(hz / 55) / 0.6, 2)), raw = (hz) => 0.85 * Math.exp(-Math.pow(Math.log(hz / 300) / 1.05, 2)) * (0.8 + 0.2 * Math.sin(hz / 37 + st.t * 3));
      const mid = (hz) => raw(hz) * (hz < split ? Math.pow(10, -duck / 20) : 1), sc = H - 40;
      for (let i = 0; i < 200; i++) { const hz = 20 * Math.pow(1000, i / 200), o = Math.min(sub(hz), raw(hz)), left = Math.min(sub(hz), mid(hz)); if (o > 0.04) { g.fillStyle = left > o * 0.6 ? 'rgba(255,90,60,0.75)' : 'rgba(255,90,60,0.25)'; g.fillRect(x(hz), base - o * sc, (W - 12) / 200 + 1, o * sc); } }
      [[sub, ACC2], [mid, '#e8e8ea']].forEach(([fn, c]) => { g.strokeStyle = c; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i <= 200; i++) { const hz = 20 * Math.pow(1000, i / 200), y = base - fn(hz) * sc; i ? g.lineTo(x(hz), y) : g.moveTo(x(hz), y); } g.stroke(); }); g.lineWidth = 1;
      g.strokeStyle = ACC; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x(split), 28); g.lineTo(x(split), base); g.stroke(); g.setLineDash([]);
      [50, 100, 200, 500, 1000, 5000].forEach(hz => label(g, hz >= 1000 ? hz / 1000 + 'k' : '' + hz, x(hz) - 6, H - 2));
      label(g, 'low', 6, 12, ACC2); label(g, 'mid', 34, 12, '#e8e8ea'); label(g, `lit = they collide · mid −${duck.toFixed(0)} dB under ${split} Hz`, 62, 12, ACC);
    } });
  ids.space = element({ id: 'el-space', label: 'Space', icon: '◎', comp: 'panner + stereo-tools + early-reflections', audio: true, modIn: ['distance'],
    blurb: 'You in the middle; each band its own place.', hint: 'the sub stays mono in the centre, the growl a little wide, the air far and wide.',
    config: [n('distance', 'Distance', 0.35, 0, 1), n('width', 'Width', 1.4, 0, 2), n('bassMono', 'Bass mono', 120, 20, 400, 1, 'Hz')],
    draw(g, W, H, P, st) {
      const cx = W / 2 + 50, cy = H / 2 + 4, R = 110, ry = H / 2 - 10, dist = P('distance'), wid = P('width');
      g.strokeStyle = '#2a2a2e'; [0.33, 0.66, 1].forEach(r => { g.beginPath(); g.ellipse(cx, cy, R * r, ry * r, 0, 0, TAU); g.stroke(); });
      g.fillStyle = '#e8e8ea'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill(); label(g, 'you', cx - 9, cy + 16);
      let ly = 0; const band = (name, c, k, r, wob) => { const sp = Math.min(1.2, k * wid) * 1.1, rr = 0.2 + r * 0.8 * (0.35 + dist);
        for (const s of [-1, 1]) { const a = -Math.PI / 2 + s * sp + wob * Math.sin(st.t * 1.3); g.fillStyle = c; g.beginPath(); g.arc(cx + Math.cos(a) * R * rr, cy + Math.sin(a) * ry * rr, sp < 0.05 ? 7 : 5, 0, TAU); g.fill(); if (sp < 0.05) break; }
        label(g, '● ' + name, 6, 30 + ly, c); ly += 13; };
      band(`sub < ${P('bassMono')} Hz, mono`, ACC2, 0, 0.15, 0); band('growl', '#e8e8ea', 0.35, 0.5, 0.05); band('air', ACC, 0.9, 0.95, 0.12);
      label(g, `distance ${Math.round(dist * 100)} % · width ${wid.toFixed(2)}`, 6, 12);
    } });
  ids.pend = element({ id: 'el-pendulum', label: 'Pendulum', icon: '◡', comp: 'lfo (the pendulum shape)', modOut: ['swing'],
    blurb: 'An oscillation as a swing between low and high.', hint: 'Swing = how far; Lean = which side it lingers on. Its out moves any knob.',
    config: [n('rate', 'Rate', 0.5, 0.05, 8, 0.01, 'Hz'), n('swing', 'Swing', 0.85, 0, 1), n('lean', 'Lean', 0.3, -1, 1)],
    draw(g, W, H, P, st) {
      st.trail = st.trail || []; const cx = W / 2, top = 14, L = H - 34, ph = Math.sin(TAU * P('rate') * st.t), lean = P('lean'), a = (ph + lean * (1 - ph * ph) * 0.8) * P('swing') * 1.05;
      const bx = cx + Math.sin(a) * (W / 2 - 30), by = top + Math.cos(a) * L * 0.9; st.trail.push([bx, by]); if (st.trail.length > 40) st.trail.shift();
      st.trail.forEach(([x, y], i) => { g.fillStyle = `rgba(255,90,60,${i / st.trail.length * 0.5})`; g.fillRect(x - 1, y - 1, 3, 3); });
      g.strokeStyle = '#4a4a50'; g.beginPath(); g.moveTo(cx, top); g.lineTo(bx, by); g.stroke(); g.fillStyle = ACC; g.beginPath(); g.arc(bx, by, 8, 0, TAU); g.fill();
      label(g, 'LOW', 8, H - 8, ACC2); label(g, 'HIGH', W - 34, H - 8, ACC);
      label(g, `${P('rate').toFixed(2)} / s · reaches ${Math.round(P('swing') * 100)} % · lingers ${lean > 0.05 ? 'high' : lean < -0.05 ? 'low' : 'nowhere'}`, 6, 12);
    } });
  ids.tens = element({ id: 'el-tension', label: 'Tension', icon: '⇡', comp: 'tension-meter + energy-curve', modIn: ['release'], modOut: ['tension'],
    blurb: 'Five kinds of tension, held, then let go.', hint: 'harmony, rhythm, spectrum, density and pitch climb while held; RELEASE lets them all go.',
    config: [n('hold', 'Hold', 8, 1, 32, 1, 'bars'), n('release', 'Release', 0.15, 0.01, 2, 0.01, 's')],
    button: { label: '⇣ RELEASE', hint: 'let the held tension go now', press: (st) => { st.rel = 1; } },
    draw(g, W, H, P, st) {
      const hold = P('hold'), bars = hold + 4, x = (b) => 6 + b / bars * (W - 12), now = (st.t * 0.5) % bars, base = H - 14;
      const kinds = [['harmony', '#b48cff', 0.7], ['rhythm', ACC2, 1], ['spectrum', '#e8e8ea', 0.85], ['density', '#7fe08a', 0.6], ['pitch', ACC, 0.9]];
      const v = (b, k) => b < hold ? Math.pow(b / hold, 1.4 + k * 0.3) : Math.exp(-(b - hold) / Math.max(0.02, P('release') * 2)) * 0.15, stack = new Array(160).fill(0);
      kinds.forEach(([, c, w], k) => { g.fillStyle = c; g.globalAlpha = 0.55; for (let i = 0; i < 160; i++) { const b = i / 160 * bars, add = v(b, k) * w * (H - 40) / 5; g.fillRect(x(b), base - stack[i] - add, (W - 12) / 160 + 0.6, add); stack[i] += add; } });
      g.globalAlpha = 1; g.strokeStyle = '#e8e8ea'; g.beginPath(); g.moveTo(x(now), 16); g.lineTo(x(now), base); g.stroke();
      g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x(hold), 16); g.lineTo(x(hold), base); g.stroke(); g.setLineDash([]);
      label(g, 'RELEASE', x(hold) + 4, 26, ACC); kinds.forEach(([name, c], k) => label(g, name, 6 + k * 66, 12, c));
    } });
  ids.emer = element({ id: 'el-emergence', label: 'Emergence', icon: '⁂', comp: 'oscillator-population + relationship-graph', modIn: ['coupling'], modOut: ['sync'],
    blurb: 'Many voices finding each other.', hint: 'coupling pulls the voices together; the arrow is how much they agree (0…1), sent out as sync.',
    config: [n('coupling', 'Coupling', 0.3, 0, 3), n('spread', 'Spread', 0.6, 0, 2, 0.01, 'Hz'), n('count', 'Count', 24, 3, 64, 1, '')],
    draw(g, W, H, P, st) {
      const N = Math.round(P('count')), K = P('coupling'), sp = P('spread'), cx = 70, cy = H / 2 + 4, R = Math.min(H / 2 - 14, 46);
      if (!st.ph || st.ph.length !== N) { st.ph = Array.from({ length: N }, (_, i) => (i * 2.399) % TAU); st.om = Array.from({ length: N }, (_, i) => TAU * (0.6 + sp * ((i * 0.618) % 1 - 0.5))); }
      let re = 0, im = 0; st.ph.forEach(p => { re += Math.cos(p); im += Math.sin(p); }); re /= N; im /= N; const r = Math.hypot(re, im), psi = Math.atan2(im, re);
      for (let i = 0; i < N; i++) st.ph[i] += (st.om[i] + K * r * Math.sin(psi - st.ph[i]) * 4) / 30;
      g.strokeStyle = '#2a2a2e'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      st.ph.forEach(p => { g.fillStyle = ACC2; g.beginPath(); g.arc(cx + Math.cos(p) * R, cy + Math.sin(p) * R, 3, 0, TAU); g.fill(); });
      g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(psi) * R * r, cy + Math.sin(psi) * R * r); g.stroke(); g.lineWidth = 1;
      label(g, `${N} voices · agree ${(r * 100).toFixed(0)} %`, cx + R + 24, cy - 8, '#e8e8ea');
      label(g, r > 0.8 ? 'locked: one big voice' : r > 0.35 ? 'finding each other' : 'a crowd: each its own', cx + R + 24, cy + 8, r > 0.8 ? ACC : DIM);
    } });
  window.__contrastElements = ids;
})();

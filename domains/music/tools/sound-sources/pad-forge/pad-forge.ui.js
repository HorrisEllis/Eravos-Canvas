/* eravos.pad-forge UI — "the vault": the four corner sources are lit stones whose size and glow follow their share of
 * the mix; between them a field of points takes the blended colour of the stones; the drifting mix point is a comet
 * with a luminous trail; the pad's own spectrum rises as an aurora along the floor. Everything reads the sound — the
 * analyser on 'out', the engine's 'vec' event, and the shared living-accent vars (--live --tone --flash --acc2). */
OrganismFactory.reg('eravos.pad-forge', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), doc = document;
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  pfStyle();

  // ---- palette: every source kind has its own light (h, s, l)
  const LIGHT = { swarm: [30, 100, 62], glass: [192, 100, 72], air: [222, 70, 84], choir: [336, 95, 74], organ: [44, 100, 64], strings: [266, 95, 74], halo: [160, 90, 72] };
  const CK = ['cornerA', 'cornerB', 'cornerC', 'cornerD'], POS = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const light = (i) => LIGHT[view.state[CK[i]]] || LIGHT.halo;
  const hslRgb = (hh, s, l) => { s /= 100; l /= 100; const k = (n) => (n + hh / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (cs, w) => { const o = [0, 0, 0]; for (let i = 0; i < 4; i++) { o[0] += cs[i][0] * w[i]; o[1] += cs[i][1] * w[i]; o[2] += cs[i][2] * w[i]; } return o; };
  const bil = (u, v) => [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];

  // ---- header: presets · orbit · hold · release
  const orbit = UI.paramControl(view, cfg('orbit'), { segMax: 5, noLabel: true });
  const bar = h('div', { class: 'pf-bar' }, [UI.presetBar(view), h('span', { class: 'pf-sp' }),
    h('div', { class: 'pf-orbit' }, [h('span', { class: 'pf-lbl', text: 'Orbit' }), orbit.el]),
    UI.paramControl(view, cfg('hold')).el,
    UI.Button({ label: 'Release all', hint: 'let every sounding and held chord fade out', onClick: () => { view.emit('release_all'); pulseAll(0.5); } }).el]);

  // ---- the stage: canvas field + the four source pickers, each sitting beside its stone
  const cv = h('canvas', { class: 'pf-field', tabindex: '0', role: 'slider', 'aria-label': 'Vector mix — drag or use arrow keys to move the centre the mix orbits around' });
  const srcEls = CK.map((k, i) => { const c = UI.paramControl(view, cfg(k), { segMax: 0, noLabel: true }); const el = h('div', { class: 'pf-src pf-' + ['tl', 'tr', 'bl', 'br'][i] }, [c.el]); c.el.setAttribute && c.el.setAttribute('aria-label', 'Corner ' + 'ABCD'[i] + ' source'); return el; });
  const stage = h('div', { class: 'pf-stage' }, [cv, ...srcEls]);
  const tint = () => srcEls.forEach((el, i) => { const L = light(i); el.style.setProperty('--pf-c', `hsl(${L[0]} ${L[1]}% ${Math.min(86, L[2] + 6)}%)`); });
  CK.forEach(k => view.bind(k, tint)); tint();

  // ---- the console: knobs grouped by what they shape
  const group = (title, keys) => h('div', { class: 'pf-group' }, [h('div', { class: 'pf-gt', text: title }), h('div', { class: 'pf-knobs' }, keys.map(k => UI.paramControl(view, cfg(k), { size: 34 }).el))]);
  const deck = h('div', { class: 'pf-deck' }, [group('Motion', ['orbitRate', 'orbitSize']), group('Colour', ['cutoff', 'bloom', 'warmth', 'width']),
    group('Envelope', ['attack', 'release']), group('Shimmer', ['space', 'shimmer', 'size']), group('Out', ['level'])]);

  // ---- keyboard
  const kb = UI.Keyboard({ low: 48, high: 72, key: view.key, onDown: (n, v) => { view.emit('audition', { note: n, velocity: v, duration: 30 }); pulseAll(v); }, onUp: (n) => view.emit('audition_off', { note: n }) });
  if (view.observe) view.observe('theory:key-change', (k) => kb.setKey(k));
  const keys = h('div', { class: 'pf-keys' }, [kb.el]);
  const hint = h('div', { class: 'pf-hint', text: 'Hold a chord and let it breathe — the comet drifts between the four stones and each one glows with its share of the sound. Drag the field (or use the arrow keys) to move the centre it orbits.' });

  view.root.appendChild(h('div', { class: 'pf' }, [bar, stage, deck, keys, hint]));
  const alive = UI.alive ? UI.alive(view, { events: ['state_sync'] }) : { hit() {} };

  // ---- state from the engine
  let vp = { x: view.state.x, y: view.state.y, w: [0.5, 0.5, 0.5, 0.5] }; const hp = { x: vp.x, y: vp.y };
  view.on('vec', (v) => { if (v) vp = v; });
  const trail = [], pulses = [];
  let G = { W: 0, H: 0, m: 40, R0: 16, fx: 0, fy: 0, fw: 1, fh: 1 };
  const X = (x) => G.fx + x * G.fw, Y = (y) => G.fy + y * G.fh;
  function pulseAll(amt) {
    alive.hit(0.3 + 0.6 * (amt || 0.8)); if (reduce) return;
    const t = performance.now(), share = vp.w.map(w => w * w);
    pulses.push({ x: hp.x, y: hp.y, t, a: 0.9, c: null });
    POS.forEach((p, i) => { if (share[i] > 0.06) pulses.push({ x: p[0], y: p[1], t: t + 60, a: 0.25 + 0.7 * share[i], c: i }); });
    if (pulses.length > 40) pulses.splice(0, pulses.length - 40);
  }

  // ---- audio analysis (own analyser — the canvas needs the spectrum, not just a level)
  let an = null; try { an = view.tap('out', 2048); } catch (e) {}
  const tbuf = an ? new Float32Array(an.fftSize) : null, fbuf = an ? new Uint8Array(an.frequencyBinCount) : null;
  const NB = 72, band = new Float32Array(NB), edges = [];
  for (let i = 0; i <= NB; i++) edges.push(Math.max(1, Math.round(Math.pow(2, Math.log2(3) + i / NB * (Math.log2(fbuf ? fbuf.length * 0.75 : 768) - Math.log2(3))))));
  let live = 0, tone = 0.5, slow = 0, armed = true;

  // ---- grain: one tile of noise, laid over the field so the dark is not flat
  const grain = doc.createElement('canvas'); grain.width = grain.height = 96;
  { const g = grain.getContext('2d'), d = g.createImageData(96, 96); let s = 7; for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
  let grainPat = null;

  const g = cv.getContext('2d'); let dpr = 1, t0 = performance.now(), dragging = false, hover = false;
  function geometry() {
    const W = stage.clientWidth, H = stage.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 4 || H < 4) return false;
    if (W !== G.W || H !== G.H || cv.width !== Math.round(W * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const R0 = Math.max(11, Math.min(20, Math.min(W, H) * 0.055)), m = Math.round(R0 * 2.1 + 6);
      G = { W, H, m, R0, fx: m, fy: m, fw: W - 2 * m, fh: H - 2 * m };
      stage.style.setProperty('--pf-m', m + 'px'); stage.style.setProperty('--pf-r', Math.round(R0 * 1.25) + 'px');
      grainPat = g.createPattern(grain, 'repeat');
    }
    return true;
  }

  UI.loop(cv, (now) => {
    if (!geometry()) return;
    const W = G.W, H = G.H, t = (now - t0) / 1000, st = view.state;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // analysis
    if (an) {
      an.getFloatTimeDomainData(tbuf); let sq = 0; for (let i = 0; i < tbuf.length; i++) sq += tbuf[i] * tbuf[i];
      const l = Math.min(1, Math.sqrt(sq / tbuf.length) * 4); live += (l - live) * (l > live ? 0.3 : 0.06);
      an.getByteFrequencyData(fbuf);
      let w = 0, c = 0; for (let b = 0; b < NB; b++) { let m = 0; for (let k = edges[b]; k < Math.max(edges[b] + 1, edges[b + 1]); k++) m = Math.max(m, fbuf[k] || 0); const v = Math.pow(m / 255, 1.6); band[b] += (v - band[b]) * (v > band[b] ? 0.35 : 0.08); w += v; c += v * b; }
      if (w > 0.2) tone += ((c / w) / NB * 1.4 - tone) * 0.05; tone = Math.max(0, Math.min(1, tone));
      // onset: the level climbing faster than its slow follower (a chord arriving), re-armed once it settles
      const rise = l - slow; slow += (l - slow) * 0.04;
      if (armed && rise > 0.05 && l > 0.04) { armed = false; pulseAll(Math.min(1, rise * 6)); } else if (rise < 0.01) armed = true;
    }
    const dh = (tone - 0.5) * 46, lv = live;
    // engine weights → energy share per stone; colours shift with brightness
    const share = vp.w.map(x => x * x), cols = [0, 1, 2, 3].map(i => { const L = light(i); return hslRgb(L[0] + dh, L[1], L[2]); });
    hp.x += (vp.x - hp.x) * (reduce ? 1 : 0.22); hp.y += (vp.y - hp.y) * (reduce ? 1 : 0.22);

    // 1 · night: a deep gradient whose hue follows tone, lit from wherever the mix is
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `hsl(${226 + dh} 48% 7%)`); gr.addColorStop(1, `hsl(${248 + dh} 42% 4%)`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const hc = mix(cols, bil(hp.x, hp.y));
    gr = g.createRadialGradient(X(hp.x), Y(hp.y), 0, X(hp.x), Y(hp.y), Math.max(W, H) * 0.75);
    gr.addColorStop(0, rgba(hc, 0.10 + 0.22 * lv)); gr.addColorStop(1, rgba(hc, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);

    // 2 · aurora: the pad's own spectrum rising from the floor, coloured between the two lower stones
    g.globalCompositeOperation = 'lighter';
    const bw = W / NB, ah = H * 0.62;
    for (let b = 0; b < NB; b++) {
      const v = band[b]; if (v < 0.01) continue; const u = b / (NB - 1), c = mix([cols[2], cols[3], cols[2], cols[3]], [1 - u, u, 0, 0]);
      const top = H - v * ah; const ag = g.createLinearGradient(0, H, 0, top);
      ag.addColorStop(0, rgba(c, 0.30 * v + 0.05)); ag.addColorStop(0.6, rgba(c, 0.10 * v)); ag.addColorStop(1, rgba(c, 0));
      g.fillStyle = ag; g.fillRect(b * bw - 0.5, top, bw + 1, H - top);
    }

    // 3 · the field: a lattice of points, each the blended colour of the stones at that place, bright near the comet
    const cols2 = Math.max(10, Math.round(G.fw / 20)), rows2 = Math.max(6, Math.round(G.fh / 20)), sig = 0.09 + 0.06 * lv;
    for (let j = 0; j <= rows2; j++) for (let i = 0; i <= cols2; i++) {
      const u = i / cols2, v = j / rows2, d2 = (u - hp.x) * (u - hp.x) + (v - hp.y) * (v - hp.y), near = Math.exp(-d2 / sig);
      const sp = band[Math.min(NB - 1, Math.round(u * (NB - 1)))] || 0, a = 0.07 + 0.5 * near * (0.35 + lv) + 0.25 * sp * (1 - v * 0.5);
      const c = mix(cols, bil(u, v)), r = 0.6 + 1.3 * near + 0.8 * sp;
      g.fillStyle = rgba(c, Math.min(0.9, a)); g.fillRect(X(u) - r / 2, Y(v) - r / 2, r, r);
    }
    g.globalCompositeOperation = 'source-over';

    // 4 · the square and the orbit the mix will follow
    g.strokeStyle = 'rgba(200,215,240,.10)'; g.lineWidth = 1; g.strokeRect(X(0) + 0.5, Y(0) + 0.5, G.fw, G.fh);
    const R = st.orbitSize || 0, cx = st.x, cy = st.y, o = st.orbit;
    g.save(); g.beginPath(); g.rect(X(0), Y(0), G.fw, G.fh); g.clip();
    g.setLineDash([2, 5]); g.strokeStyle = `rgba(220,230,255,${0.16 + 0.1 * lv})`; g.beginPath();
    if (o === 'circle') g.ellipse(X(cx), Y(cy), R * G.fw, R * G.fh, 0, 0, Math.PI * 2);
    else if (o === 'figure-8') for (let k = 0; k <= 96; k++) { const p = k / 96 * Math.PI * 2, x = X(cx + Math.sin(p) * R), y = Y(cy + Math.sin(p * 2) * R * 0.6); k ? g.lineTo(x, y) : g.moveTo(x, y); }
    else if (o === 'drift') g.rect(X(cx - R), Y(cy - R), 2 * R * G.fw, 2 * R * G.fh);
    g.stroke(); g.setLineDash([]); g.restore();
    // centre handle
    const hx = X(cx), hy = Y(cy), hot = dragging || hover || doc.activeElement === cv;
    g.strokeStyle = hot ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)'; g.lineWidth = 1;
    g.beginPath(); g.arc(hx, hy, hot ? 7 : 5, 0, Math.PI * 2); g.stroke();
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(hx + a * 9, hy + b * 9); g.lineTo(hx + a * 13, hy + b * 13); g.stroke(); });

    // 5 · threads from the comet to every stone, as strong as that stone's share
    POS.forEach((p, i) => { if (share[i] < 0.01) return; const lg = g.createLinearGradient(X(hp.x), Y(hp.y), X(p[0]), Y(p[1])); lg.addColorStop(0, rgba(cols[i], 0)); lg.addColorStop(1, rgba(cols[i], 0.15 + 0.5 * share[i])); g.strokeStyle = lg; g.lineWidth = 0.6 + 1.6 * share[i]; g.beginPath(); g.moveTo(X(hp.x), Y(hp.y)); g.lineTo(X(p[0]), Y(p[1])); g.stroke(); });

    // 6 · stones
    POS.forEach((p, i) => stone(X(p[0]), Y(p[1]), i, share[i], cols[i], t, lv));

    // 7 · the comet's trail and head
    g.globalCompositeOperation = 'lighter';
    const last = trail[trail.length - 1];
    if (!last || Math.abs(last.x - hp.x) + Math.abs(last.y - hp.y) > 0.0008) trail.push({ x: hp.x, y: hp.y, c: hc });
    const TL = reduce ? 30 : 160; while (trail.length > TL) trail.shift();
    g.lineCap = 'round';
    for (let k = 1; k < trail.length; k++) {
      const f = k / trail.length, a = trail[k - 1], b = trail[k];
      g.strokeStyle = rgba(b.c, Math.pow(f, 1.7) * (0.35 + 0.55 * Math.min(1, lv * 2 + 0.25))); g.lineWidth = 0.8 + 3.2 * f * (0.6 + lv);
      g.beginPath(); g.moveTo(X(a.x), Y(a.y)); g.lineTo(X(b.x), Y(b.y)); g.stroke();
    }
    const HX = X(hp.x), HY = Y(hp.y), hr = 16 + 34 * lv;
    gr = g.createRadialGradient(HX, HY, 0, HX, HY, hr); gr.addColorStop(0, rgba(hc, 0.9)); gr.addColorStop(0.25, rgba(hc, 0.35)); gr.addColorStop(1, rgba(hc, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(HX, HY, hr, 0, Math.PI * 2); g.fill();
    // pulses: rings that leave the comet (and the stones, by share) when a chord arrives
    const nowMs = performance.now();
    for (let k = pulses.length - 1; k >= 0; k--) {
      const P = pulses[k], age = (nowMs - P.t) / 1000; if (age < 0) continue; if (age > 1.4) { pulses.splice(k, 1); continue; }
      const e = 1 - Math.pow(1 - age / 1.4, 3), c = P.c === null ? hc : cols[P.c];
      g.strokeStyle = rgba(c, P.a * (1 - age / 1.4) * 0.8); g.lineWidth = 1.5 * (1 - age / 1.4) + 0.4;
      g.beginPath(); g.arc(X(P.x), Y(P.y), (P.c === null ? 6 : G.R0) + e * Math.min(W, H) * 0.32, 0, Math.PI * 2); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.beginPath(); g.arc(HX, HY, 3.2 + 1.5 * lv, 0, Math.PI * 2); g.fill();

    // 8 · grain + vignette
    if (grainPat) { g.globalAlpha = 0.045; g.globalCompositeOperation = 'overlay'; g.fillStyle = grainPat; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }, 60);

  // a stone: halo by share and loudness, a lit body, and the source's own inner mark
  function stone(x, y, i, s, c, t, lv) {
    const R0 = G.R0, r = R0 * (0.72 + 0.55 * Math.sqrt(s)), kind = view.state[CK[i]], L = light(i);
    g.globalCompositeOperation = 'lighter';
    const hr = r * (1.6 + 3.2 * s * (0.35 + lv));
    let gr = g.createRadialGradient(x, y, r * 0.6, x, y, hr); gr.addColorStop(0, rgba(c, 0.25 + 0.5 * s)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, hr, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    const lit = 0.35 + 0.65 * Math.min(1, s * 1.3 + lv * 0.3);
    gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    gr.addColorStop(0, `hsl(${L[0]} ${L[1]}% ${Math.min(96, L[2] + 22 * lit)}%)`);
    gr.addColorStop(0.45, `hsla(${L[0]} ${L[1] * 0.85}% ${L[2] * (0.45 + 0.45 * lit)}% / 1)`);
    gr.addColorStop(1, `hsl(${L[0] + 10} ${L[1] * 0.6}% ${8 + 10 * lit}%)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    // inner mark — each source has its own
    g.save(); g.beginPath(); g.arc(x, y, r * 0.92, 0, Math.PI * 2); g.clip(); g.translate(x, y); g.rotate(reduce ? 0 : t * (0.15 + 0.25 * s) * (i % 2 ? -1 : 1));
    g.strokeStyle = `hsla(${L[0]} 100% 92% / ${0.25 + 0.45 * lit})`; g.fillStyle = g.strokeStyle; g.lineWidth = 1;
    const ring = (rr) => { g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.stroke(); };
    if (kind === 'swarm') for (let k = 0; k < 9; k++) { const a = k * 2.399 + t * (k % 3 ? 0.6 : -0.9) * (reduce ? 0 : 1), rr = r * (0.25 + 0.6 * ((k * 0.37) % 1)); g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.1, 0, 7); g.fill(); }
    else if (kind === 'glass') { g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2; k ? g.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62) : g.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); } g.stroke(); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); g.lineTo(-Math.cos(a) * r * 0.62, -Math.sin(a) * r * 0.62); g.stroke(); } }
    else if (kind === 'air') for (let k = -1; k <= 1; k++) { g.beginPath(); for (let q = -10; q <= 10; q++) { const xx = q / 10 * r, yy = k * r * 0.34 + Math.sin(q * 0.7 + t * 1.3 + k) * r * 0.08; q > -10 ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
    else if (kind === 'choir') [0.55, 0.85, 0.4].forEach((hh, k) => { const xx = (k - 1) * r * 0.36, hgt = r * hh * (0.8 + 0.2 * Math.sin(t * 1.7 + k)); g.fillRect(xx - 1.2, -hgt / 2, 2.4, hgt); });
    else if (kind === 'organ') [0.28, 0.5, 0.72].forEach(ring);
    else if (kind === 'strings') for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-r, k * r * 0.26 - r * 0.3); g.lineTo(r, k * r * 0.26 + r * 0.3); g.stroke(); }
    else { g.lineWidth = 2; ring(r * 0.55); g.beginPath(); g.arc(0, 0, 1.6, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = `hsla(${L[0]} 100% 88% / ${0.25 + 0.4 * lit})`; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(x - r * 0.38, y - r * 0.42, Math.max(1, r * 0.1), 0, 7); g.fill();
    // share of the mix, set just inside the square
    const p = POS[i], tx = x + (p[0] ? -1 : 1) * (r + 6), ty = y + (p[1] ? -1 : 1) * (r + 4);
    g.font = '500 10px ' + getMono(); g.textAlign = p[0] ? 'right' : 'left'; g.textBaseline = p[1] ? 'bottom' : 'top';
    g.fillStyle = `hsla(${L[0]} 60% 85% / ${0.45 + 0.5 * s})`; g.fillText(Math.round(s * 100) + '%', tx, ty);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  let monoF = null; function getMono() { if (!monoF) monoF = (getComputedStyle(doc.documentElement).getPropertyValue('--mono') || 'monospace').trim() || 'monospace'; return monoF; }

  // ---- interaction: drag anywhere on the field to move the centre; arrow keys nudge it
  const setFrom = (e) => {
    const r = cv.getBoundingClientRect(), sx = r.width / (G.W || r.width), sy = r.height / (G.H || r.height);
    const x = (e.clientX - r.left) / sx, y = (e.clientY - r.top) / sy;
    view.set('x', +Math.max(0, Math.min(1, (x - G.fx) / G.fw)).toFixed(3)); view.set('y', +Math.max(0, Math.min(1, (y - G.fy) / G.fh)).toFixed(3));
  };
  cv.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); cv.focus({ preventScroll: true }); dragging = true; cv.setPointerCapture(e.pointerId); setFrom(e); });
  cv.addEventListener('pointermove', (e) => { if (dragging) { e.stopPropagation(); setFrom(e); } });
  const end = () => { dragging = false; };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cv.addEventListener(ev, end));
  cv.addEventListener('pointerenter', () => { hover = true; }); cv.addEventListener('pointerleave', () => { hover = false; });
  cv.addEventListener('keydown', (e) => {
    const d = e.shiftKey ? 0.05 : 0.01, mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key]; if (!mv) return;
    e.preventDefault(); e.stopPropagation();
    if (mv[0]) view.set('x', +Math.max(0, Math.min(1, (view.state.x || 0) + mv[0])).toFixed(3));
    if (mv[1]) view.set('y', +Math.max(0, Math.min(1, (view.state.y || 0) + mv[1])).toFixed(3));
  });
  const aria = () => cv.setAttribute('aria-valuetext', `centre ${Math.round((view.state.x || 0) * 100)}% across, ${Math.round((view.state.y || 0) * 100)}% down`);
  view.bind('x', aria); view.bind('y', aria);

  function pfStyle() {
    if (doc.getElementById('pf-style')) return;
    const caret = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5'><path d='M0 0l4 5 4-5z' fill='%23b8c4d8'/></svg>\")";
    const css = `
.pf { --pf-serif: 'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  --pf-a: var(--acc2, var(--acc)); display: flex; flex-direction: column; gap: 9px; min-height: 100%; }
.pf-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pf-sp { flex: 1; }
.pf-orbit { display: flex; align-items: center; gap: 6px; }
.pf-lbl { font: italic 500 14px/1 var(--pf-serif); color: color-mix(in srgb, var(--pf-a) 35%, var(--text)); }
.pf-bar .uk-seg { border-color: color-mix(in srgb, var(--pf-a) 25%, var(--line2)); border-radius: 999px; }
.pf-bar .uk-seg button { padding: 4px 9px; background: transparent; }
.pf-bar .uk-seg button.on { background: color-mix(in srgb, var(--pf-a) 75%, #fff); color: #06101a; }
.pf-bar .uk-toggle.on { background: color-mix(in srgb, var(--pf-a) 24%, #0b1119); border-color: var(--pf-a); }
.pf-stage { position: relative; flex: 1 1 260px; min-height: 190px; border-radius: 14px; overflow: hidden; background: #05070d;
  border: 1px solid color-mix(in srgb, var(--pf-a) calc(16% + var(--live, 0) * 45%), #1b2436);
  box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 12px 32px -18px #000, 0 0 calc(var(--flash, 0) * 28px + var(--live, 0) * 14px) color-mix(in srgb, var(--pf-a) calc(var(--flash, 0) * 45% + var(--live, 0) * 25%), transparent);
  transition: border-color .3s; }
.pf-stage:focus-within { border-color: color-mix(in srgb, var(--pf-a) 60%, #fff); }
.pf-field { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: none; outline: none; }
.pf-src { position: absolute; z-index: 1; }
.pf-tl { left: calc(var(--pf-m, 40px) + var(--pf-r, 20px) + 8px); top: calc(var(--pf-m, 40px) - 13px); }
.pf-tr { right: calc(var(--pf-m, 40px) + var(--pf-r, 20px) + 8px); top: calc(var(--pf-m, 40px) - 13px); }
.pf-bl { left: calc(var(--pf-m, 40px) + var(--pf-r, 20px) + 8px); bottom: calc(var(--pf-m, 40px) - 13px); }
.pf-br { right: calc(var(--pf-m, 40px) + var(--pf-r, 20px) + 8px); bottom: calc(var(--pf-m, 40px) - 13px); }
.pf-src select.uk-select { appearance: none; -webkit-appearance: none; height: 26px; padding: 0 22px 1px 11px; border-radius: 999px; max-width: 130px;
  font: italic 500 15px/1 var(--pf-serif); color: var(--pf-c, #cfe); letter-spacing: .2px;
  background: rgba(5,8,16,.62) ${caret} no-repeat right 9px center; backdrop-filter: blur(6px);
  border: 1px solid color-mix(in srgb, var(--pf-c, #cfe) 34%, transparent); box-shadow: 0 0 14px -6px var(--pf-c, #cfe); cursor: pointer; }
.pf-src select.uk-select:hover, .pf-src select.uk-select:focus-visible { border-color: var(--pf-c, #cfe); outline: none; }
.pf-src option { background: #0c1220; color: #dfe8f5; font: 13px var(--font); }
.pf-deck { display: flex; flex-wrap: wrap; justify-content: center; row-gap: 8px; padding: 8px 2px 6px; border-radius: 12px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--pf-a) calc(4% + var(--live, 0) * 6%), transparent), transparent 70%);
  border-top: 1px solid color-mix(in srgb, var(--pf-a) calc(14% + var(--live, 0) * 30%), transparent); }
.pf-group { position: relative; padding: 0 9px; }
.pf-group::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 1px;
  background: linear-gradient(transparent, color-mix(in srgb, var(--pf-a) 32%, transparent), transparent); }
.pf-group:first-child::before { display: none; }
.pf-gt { font: italic 500 14px/1.1 var(--pf-serif); color: color-mix(in srgb, var(--pf-a) 40%, var(--text)); margin: 0 0 3px 3px; }
.pf-knobs { display: flex; gap: 0; }
.pf .uk-knob { width: 46px; }
.pf .uk-knob-arc { stroke: var(--pf-a); filter: drop-shadow(0 0 calc(2px + var(--live, 0) * 5px) var(--pf-a)); }
.pf .uk-knob-track { stroke: #1d2738; }
.pf .uk-knob-val { color: color-mix(in srgb, var(--pf-a) 20%, var(--text)); }
.pf-keys { border-radius: 9px; overflow: hidden; flex: none;
  box-shadow: 0 0 0 1px #000, 0 -1px 0 color-mix(in srgb, var(--pf-a) calc(30% + var(--live, 0) * 60%), transparent), 0 -6px calc(6px + var(--live, 0) * 22px) -6px var(--pf-a); }
.pf-keys .uk-keys { height: 58px; }
.pf-keys .uk-key.w.in { background: linear-gradient(180deg, #c9d3e2, #eef3fa 70%, #dfe6f0); }
.pf-keys .uk-key.w.root { background: linear-gradient(180deg, color-mix(in srgb, var(--pf-a) 40%, #c9d3e2), color-mix(in srgb, var(--pf-a) 30%, white)); }
.pf-keys .uk-key.w.down { background: linear-gradient(180deg, var(--pf-a), color-mix(in srgb, var(--pf-a) 55%, white)); box-shadow: inset 0 0 12px rgba(255,255,255,.5); }
.pf-keys .uk-key.b.down::before { background: var(--pf-a); box-shadow: 0 0 10px var(--pf-a); }
.pf-hint { font: 11.5px/1.45 var(--font); color: var(--dim); max-width: 70ch; }
@media (prefers-reduced-motion: reduce) { .pf-stage { transition: none; } }
`;
    doc.head.appendChild(Object.assign(doc.createElement('style'), { id: 'pf-style', textContent: css }));
  }
});

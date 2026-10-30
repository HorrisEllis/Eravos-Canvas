/* 3.58 SOUND → CSS — "the UI colours change with the sound playing: variable, event-driven CSS".
 * Listens to the master output (a tap: nothing is rerouted) and writes CSS custom properties on <html>, ~30× a second:
 *   --snd-low   0…1  the low end (30–150 Hz)        --snd-high  0…1  the top (2–12 kHz)
 *   --snd-level 0…1  how loud the mix is             --snd-pulse 0…1  jumps on each hit, then falls back
 *   --snd-hue   deg  where the sound's weight sits: deep red/violet for a bass drop … cyan/teal for bright tops
 * and on every tool window that makes sound: --tool-level 0…1 (its own output) — eravos.css makes the window glow with it.
 * 3.69 "all the accent colours, anywhere, event-driven — like a visualiser" (and no rainbows): the accent colours THEMSELVES move.
 * The app's palette (--cyan --green --pink --violet --amber --red --acc on <html>) brightens with the mix and flashes on each hit;
 * each tool's own --acc (its window, knobs, buttons, the tool page) brightens with that tool's own sound. Every colour keeps its
 * hue — only its light moves — and goes back exactly to what it was in silence or when switched off. (Merged with 3.48.2's
 * living accent: same API — liveAcc / restoreAcc, data-acc-live (hex) for canvases that draw with the accent — but no hue sweep.)
 * Quiet when nothing plays (the values fall to 0 and stop updating). Respects reduced motion (calmer, no pulse). Off/on in
 * ⋯ Options (◐ Reactive colours, remembered). Only listens while the page is visible.
 * 3.77 "the inside of the tools are supposed to react. anywhere there is color, and not one color, have options for the reactive
 * color — like changing, the way it is now (static), and a way to customize. the option needs to work, it does nothing when
 * trying to disable." MODES (⋯ Options → Reactive colours): Off · Static (each colour keeps its hue, its light moves — as before)
 * · Changing (colours travel round the wheel with the music: warmer on the low end, cooler on the top, a jump on each hit, a slow
 * drift while it plays) · Custom (three colours you pick — low end, top, hits — and every colour leans toward them with the sound).
 * AMOUNT: how far. EVERY colour a window carries reacts — not only its accent: any inline colour variable on any element in it
 * (a pad's --pc, a drum strip's --acc, a macro's colour …), and drawn displays (Changing turns their hues too). Off is off
 * everywhere, the older living-accent layer (UI.alive) included. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const root = doc.documentElement, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  let K = null, an = null, db = null, prevLow = 0, pulse = 0, level = 0, low = 0, high = 0, hue = 210, idle = 0, raf = 0, last = 0;
  const taps = new Map();   // instanceId → { an, buf, win }
  const PALETTE = ['--cyan', '--green', '--pink', '--violet', '--amber', '--red', '--acc'];
  let base = null;   // the palette as the stylesheet has it (read once, before anything is overridden)
  const live = new Set();   // elements whose --acc is moving now (to put back in silence)
  function rgbOf(c) {
    c = String(c || '').trim(); let m = /^#([0-9a-f]{3})$/i.exec(c); if (m) c = '#' + m[1].split('').map(x => x + x).join('');
    m = /^#([0-9a-f]{6})/i.exec(c); if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(c); return m ? [+m[1], +m[2], +m[3]] : null;
  }
  // the same colour, lit up by k (0…1): lighter and a touch more vivid, the hue never moves
  function lit(c, k) {
    const rgb = rgbOf(c); if (!rgb || k < 0.005) return c;
    let [r, g, b] = rgb.map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let hh = 0, sa = 0; if (d) { sa = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = (hh + 6) % 6; }
    // 3.77: lit means brighter and richer, not paler
    const L = l + (0.8 - l) * clamp(k, 0, 1) * 0.5, S = Math.min(1, sa * (1 + 0.35 * k)), C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs((hh % 2 + 2) % 2 - 1)), M = L - C / 2;
    const [a, bb, cc] = hh < 1 ? [C, X, 0] : hh < 2 ? [X, C, 0] : hh < 3 ? [0, C, X] : hh < 4 ? [0, X, C] : hh < 5 ? [X, 0, C] : [C, 0, X];
    const hx = (v) => Math.round(clamp(v + M, 0, 1) * 255).toString(16).padStart(2, '0'); return '#' + hx(a) + hx(bb) + hx(cc);
  }
  // ---- 3.77 modes: how a colour answers the sound (k 0…1 already scaled by Amount)
  const MODES = ['off', 'static', 'changing', 'custom'];
  let mode = 'static', amt = 0.8, custom = { low: '#ff2266', high: '#00d4ff', hit: '#ffffff' }, shift = 0, drift = 0;
  try {
    const L = global.localStorage, m = L.getItem('eravos.reactive.mode');
    if (MODES.includes(m)) mode = m; else if (L.getItem('eravos.reactive') === '0') mode = 'off';
    const a = parseFloat(L.getItem('eravos.reactive.amount')); if (a >= 0 && a <= 1) amt = a;
    const c = JSON.parse(L.getItem('eravos.reactive.colors') || 'null'); if (c && c.low && c.high && c.hit) custom = c;
  } catch (e) {}
  const hueDeg = (rgb) => { const [r, g, b] = rgb.map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; };
  const hex = (rgb) => '#' + rgb.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function rotate(c, deg) {   // the same colour turned round the wheel (lightness and saturation kept)
    const rgb = rgbOf(c); if (!rgb || Math.abs(deg) < 0.5) return c;
    let [r, g, b] = rgb.map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return c;
    const sa = d / (1 - Math.abs(2 * l - 1)); let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = (((hh * 60 + deg) % 360) + 360) % 360 / 60;
    const C = (1 - Math.abs(2 * l - 1)) * sa, X = C * (1 - Math.abs(hh % 2 - 1)), M = l - C / 2;
    const [a2, b2, c2] = hh < 1 ? [C, X, 0] : hh < 2 ? [X, C, 0] : hh < 3 ? [0, C, X] : hh < 4 ? [0, X, C] : hh < 5 ? [X, 0, C] : [C, 0, X];
    return hex([a2, b2, c2].map(v => (v + M) * 255));
  }
  // o (per window, 3.77): { mode, shift, colors, low, high, pulse } — each tool can have its own; the app's when it follows the app
  function colourFor(c, k, o) {
    o = o || G(); const md = o.mode; if (k < 0.005 || md === 'off') return c;
    if (md === 'changing') return lit(rotate(c, o.shift * Math.min(1, k * 1.6)), k * 0.6);
    if (md === 'custom') {   // each colour leans toward the one of yours nearest its own hue (a palette reads boldly), and flashes toward your hit colour
      const rgb = rgbOf(c), C = o.colors; if (!rgb) return c; const h0 = hueDeg(rgb), dist = (x) => { const d = Math.abs(hueDeg(rgbOf(x)) - h0) % 360; return d > 180 ? 360 - d : d; };
      const near = dist(C.low) <= dist(C.high) ? C.low : C.high, tgt = mixRGB(rgbOf(near), rgbOf(C.hit), clamp(o.pulse * 0.55, 0, 1));
      return lit(hex(mixRGB(rgb, tgt, clamp(0.35 + k * 0.65, 0, 0.95) * Math.min(1, k * 3))), k * 0.12); }
    return lit(c, k);
  }
  const G = () => ({ mode, amt, shift, colors: custom, low, high, pulse });   // the app's own
  const hashOf = (str) => { let x = 2166136261; for (const ch of String(str || '')) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return x >>> 0; };
  const CanvasWin = (id) => global.CanvasWM && global.CanvasWM.windowOf ? global.CanvasWM.windowOf(id) : null;
  // every inline colour variable an element carries (--acc, --pc, --c …): lit from its own base; a base the tool changes is taken up
  const isCol = (v) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) || /^rgba?\(/i.test(v);
  function light(el, k, o) {
    const st = el.style; el._cb = el._cb || {}; el._cs = el._cs || {};
    for (let i = 0; i < st.length; i++) { const n = st[i]; if (n.charCodeAt(0) !== 45 || n.charCodeAt(1) !== 45 || n === '--tool-level' || n === '--lvl') continue;
      const v = st.getPropertyValue(n).trim(); if (!isCol(v)) continue; if (el._cs[n] !== v) el._cb[n] = v;
      const c = colourFor(el._cb[n], k, o); if (c !== v) st.setProperty(n, c); el._cs[n] = c;
      if (n === '--acc') { el.dataset.accLive = c; if (el.dataset.acc0 === undefined) el.dataset.acc0 = el._cb[n]; } }
    live.add(el);
  }
  function unlight(el) { if (el._cb) Object.keys(el._cb).forEach(n => el.style.setProperty(n, el._cb[n])); el._cs = {}; delete el.dataset.accLive; live.delete(el); }
  // a sounding window (and everything in it that carries a colour) lit by its level lv 0…1; restoreAcc = its own colours again
  // a window's own settings (its ⚙ → Reactive colours): 'follow' = the app's; else its own mode, amount and colours
  function settingsOf(w) {
    const r = w && w.dataset.instance && global.OrganismFactory && global.OrganismFactory.handle(w.dataset.instance), x = r && r.ctx && r.ctx.params && r.ctx.params.get && r.ctx.params.get('_react');
    if (!x || !x.mode || x.mode === 'follow' || !MODES.includes(x.mode)) return { mode, amt, colors: custom, own: false };
    return { mode: x.mode, amt: typeof x.amount === 'number' ? clamp(x.amount, 0, 1) : amt, colors: Object.assign({}, custom, x.colors || {}), own: true };
  }
  function liveAcc(w, lv, ts, o) {
    o = o || Object.assign(G(), settingsOf(w), { shift: w._shift !== undefined ? w._shift : shift });
    if (o.mode === 'off') { restoreAcc(w); return; }
    const k = clamp((lv * 0.85 + (o.pulse || 0) * 0.25 * lv) * o.amt * 1.25, 0, 1); light(w, k, o); accented(w, ts || performance.now()).forEach(el => light(el, k, o));
  }
  function restoreAcc(w) { [w].concat(w._accEls || []).forEach(el => { if (el._cb) unlight(el); }); }
  // what in a window carries a colour — found once a second
  function accented(root, ts) { if (!root._accAt || ts - root._accAt > 1000) { root._accAt = ts; root._accEls = Array.from(root.querySelectorAll('[style*="--"]')); } return root._accEls; }
  let on = mode !== 'off', ownScan = -1e9, ownAny = false;
  const calm = () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const set = (k, v) => root.style.setProperty(k, v);
  function zero() {
    ['--snd-low', '--snd-high', '--snd-level', '--snd-pulse'].forEach(k => set(k, '0')); doc.querySelectorAll('.wm-win[style*="--tool-level"]').forEach(w => w.style.setProperty('--tool-level', '0'));
    PALETTE.forEach(k => root.style.removeProperty(k));
    Array.from(live).forEach(unlight); live.clear(); set('--snd-shift', '0deg');
  }
  function ensure() {
    if (an || !K || !K.audio || !K.audio.ctx || !K.audio.output) return !!an;
    const ac = K.audio.ctx; an = ac.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0.6; an.minDecibels = -110; an.maxDecibels = -10;
    try { K.audio.output.connect(an); } catch (e) { an = null; return false; }
    db = new Float32Array(an.frequencyBinCount); return true;
  }
  function toolTap(win) {
    const id = win.dataset.instance; if (!id || !K || !K.audio || !K.audio.ports) return null;
    let t = taps.get(id); if (t && t.win === win) return t;
    const p = (K.audio.ports(id) || []).find(x => x.kind === 'audio' && x.direction === 'out' && x.node); if (!p) { taps.set(id, { none: true, win }); return null; }
    const a = K.audio.ctx.createAnalyser(); a.fftSize = 512; try { p.node.connect(a); } catch (e) { return null; }
    t = { an: a, buf: new Float32Array(a.fftSize), win, node: p.node }; taps.set(id, t); return t;
  }
  function frame(ts) {
    raf = global.requestAnimationFrame(frame);
    if (doc.hidden || ts - last < 33) return;
    // the app is Off: only windows with their own reactive setting (⚙ → Reactive colours) still answer — looked for once a second
    if (!on) { if (ts - ownScan > 1000) { ownScan = ts; ownAny = Array.from(doc.querySelectorAll('.wm-win')).some(w => { const x = settingsOf(w); return x.own && x.mode !== 'off'; }); } if (!ownAny) return; }
    last = ts;
    if (!ensure()) return;
    an.getFloatFrequencyData(db);
    const hz = K.audio.ctx.sampleRate / an.fftSize; let lo = 0, nl = 0, hi = 0, nh = 0, all = 0, cen = 0;
    for (let i = 1; i < db.length; i++) { const f = i * hz, p = Math.pow(10, db[i] / 10); if (f >= 30 && f < 150) { lo += p; nl++; } else if (f >= 2000 && f < 12000) { hi += p; nh++; } all += p; cen += p * Math.log2(Math.max(20, f)); }
    const lv = (s) => clamp((10 * Math.log10(s + 1e-12) + 70) / 55, 0, 1);
    const L = lv(lo), H = lv(hi), A = lv(all), c = all > 1e-12 ? cen / all : 9;   // log2 Hz: 5 (32 Hz) … 13 (8 kHz)
    if (A < 0.04 && level < 0.02) { if (++idle === 3) zero(); return; }   // nothing playing: settle once, then rest
    idle = 0;
    const k = calm() ? 0.08 : 0.35; low += (L - low) * k; high += (H - high) * k; level += (A - level) * k;
    if (!calm() && L - prevLow > 0.12) pulse = 1; prevLow = L; pulse *= 0.82;
    const target = 280 - clamp((c - 6) / 6, 0, 1) * 110;   // bass-weighted → 280° (violet/red) … bright → 170° (teal)
    hue += (target - hue) * 0.1;
    // Changing: where the colours turn — the sound's weight (warm low end ↔ cool top), a kick on each hit, a slow drift while it plays
    drift += 0.012; shift = mode === 'changing' ? clamp((hue - 225) * 1.1 + Math.sin(drift) * 40 + pulse * 35, -150, 150) * amt : 0; set('--snd-shift', shift.toFixed(1) + 'deg');
    set('--snd-low', low.toFixed(3)); set('--snd-high', high.toFixed(3)); set('--snd-level', level.toFixed(3)); set('--snd-pulse', pulse.toFixed(3)); set('--snd-hue', hue.toFixed(1));
    // the app's accents: the mix lights them, each hit flashes them
    if (!base) { const cs = global.getComputedStyle(root); base = {}; PALETTE.forEach(k => { base[k] = cs.getPropertyValue(k).trim(); }); }
    const kMix = clamp((level * 0.55 + pulse * 0.5) * amt * 1.25, 0, 1); if (on) PALETTE.forEach(k => { if (base[k]) set(k, colourFor(base[k], kMix, G())); });
    // a tool shown on its page (or a suite's page) lights with the mix
    if (on) doc.querySelectorAll('.tp-overlay').forEach(o => { light(o, kMix, G()); accented(o, ts).forEach(el => light(el, kMix, G())); });
    if (Math.random() < 0.02) taps.forEach((t, id) => { if (!t.win || !t.win.isConnected) { try { if (t.node && t.an) t.node.disconnect(t.an); } catch (e) {} taps.delete(id); } });   // closed windows let go
    // each window that makes sound: its own level
    // 3.73 "all of the accents … when sound plays — in the tools, the ui": a window that makes no sound of its own (a pattern tool,
    // the timeline, a modulator) follows the tools it plays (wired from it), or else the mix — so every window answers the sound
    const lvOf = new Map(), quiet = [];
    doc.querySelectorAll('.wm-win').forEach(w => {
      if (w.classList.contains('collapsed') || w.offsetParent === null) return; const t = toolTap(w); if (!t || t.none) { quiet.push(w); return; }
      t.an.getFloatTimeDomainData(t.buf); let s = 0, pk = 0; for (let i = 0; i < t.buf.length; i++) { const x = t.buf[i]; s += x * x; const a = x < 0 ? -x : x; if (a > pk) pk = a; }
      // 3.73 a meter's envelope: the loudness or the peak (a drum hit is short — its peak is what you see), up fast, down slower
      const vr = clamp((10 * Math.log10(s / t.buf.length + 1e-12) + 50) / 44, 0, 1), vp = clamp((20 * Math.log10(pk + 1e-9) + 36) / 36, 0, 1), v = Math.max(vr, vp * 0.95);
      const before = t.lv || 0; t.lv = before + (v - before) * (v > before ? 0.6 : 0.12); w.style.setProperty('--tool-level', t.lv.toFixed(3));
      lvOf.set(w.dataset.instance, t.lv);
      // 3.77 "changing … each sound": this tool's own colour turn — from where ITS sound sits (its own spectrum), its own hits and
      // its own slow drift (each window starts at its own phase), so every tool moves with what it plays, not all together
      const S = settingsOf(w), o = Object.assign(G(), S); w.dataset.react = o.mode;
      if (o.mode === 'changing' && t.lv > 0.02) {
        if (!t.fb) t.fb = new Uint8Array(t.an.frequencyBinCount); t.an.getByteFrequencyData(t.fb); let wsum = 0, tsum = 0; for (let i = 2; i < t.fb.length; i++) { wsum += t.fb[i]; tsum += t.fb[i] * i; }
        const cen = wsum ? Math.log2(1 + tsum / wsum) / Math.log2(t.fb.length) : 0.5;   // 0 dark … 1 bright
        t.hue = (t.hue === undefined ? cen : t.hue + (cen - t.hue) * 0.15); t.ph = (t.ph === undefined ? (hashOf(w.dataset.instance) % 628) / 100 : t.ph + 0.012 + t.lv * 0.02);
        t.pu = Math.max((v - before > 0.18 ? 1 : 0), (t.pu || 0) * 0.82);
        w._shift = clamp((t.hue - 0.5) * 220 + Math.sin(t.ph) * 45 + t.pu * 40, -160, 160) * o.amt; w.style.setProperty('--win-shift', w._shift.toFixed(1) + 'deg');
      }
      o.shift = w._shift || 0; o.pulse = t.pu || 0;
      if (t.lv > 0.02) liveAcc(w, t.lv, ts, o); else restoreAcc(w);
    });
    if (quiet.length) {
      const wires = (K.wires && K.wires.list && K.wires.list()) || [];
      quiet.forEach(w => {
        const id = w.dataset.instance, outs = wires.filter(x => x.src && x.src.instanceId === id).map(x => lvOf.get(x.dst.instanceId)).filter(v => v !== undefined);
        const v = outs.length ? Math.max(...outs) : clamp(level * 0.6 + pulse * 0.25, 0, 1), prev = +w.dataset.lv || 0, lv = prev + (v - prev) * 0.4;
        w.dataset.lv = lv.toFixed(3); w.style.setProperty('--tool-level', lv.toFixed(3));
        // its colour turn: the tool it plays (its first wired destination that has one), else its own drift over the mix
        const S = settingsOf(w), o = Object.assign(G(), S); w.dataset.react = o.mode;
        const dst = wires.filter(x => x.src && x.src.instanceId === id).map(x => CanvasWin(x.dst.instanceId)).find(x => x && x._shift !== undefined);
        if (o.mode === 'changing') { w._ph = (w._ph === undefined ? (hashOf(id) % 628) / 100 : w._ph + 0.012); w._shift = dst ? dst._shift : clamp((hue - 225) * 0.8 + Math.sin(w._ph) * 50 + pulse * 30, -160, 160) * o.amt; w.style.setProperty('--win-shift', w._shift.toFixed(1) + 'deg'); }
        o.shift = w._shift || 0;
        if (lv > 0.02) liveAcc(w, lv, ts, o); else restoreAcc(w);
      });
    }
  }
  const listeners = [];
  const fire = () => listeners.forEach(fn => { try { fn(SoundCSS); } catch (e) {} });
  function save() { try { const L = global.localStorage; L.setItem('eravos.reactive', on ? '1' : '0'); L.setItem('eravos.reactive.mode', mode); L.setItem('eravos.reactive.amount', String(amt)); L.setItem('eravos.reactive.colors', JSON.stringify(custom)); } catch (e) {} }
  const SoundCSS = {
    init(kernel) { K = kernel; if (!raf) raf = global.requestAnimationFrame(frame); root.classList.toggle('snd-off', !on); root.dataset.react = mode; return SoundCSS; },
    get on() { return on; },
    set(v) { SoundCSS.setMode(v ? (mode === 'off' ? 'static' : mode) : 'off'); },
    get mode() { return mode; }, get amount() { return amt; }, get colors() { return Object.assign({}, custom); }, MODES,
    setMode(m) { if (!MODES.includes(m)) return; mode = m; on = m !== 'off'; ownScan = -1e9; save(); root.classList.toggle('snd-off', !on); root.dataset.react = m; zero(); fire(); },
    rescan() { ownScan = -1e9; },
    setAmount(a) { amt = clamp(+a || 0, 0, 1); save(); fire(); },
    setColors(c) { custom = Object.assign({}, custom, c || {}); save(); fire(); },
    onChange(fn) { listeners.push(fn); },
    // tests: one analysis step on demand (offline pages have no running clock)
    step() { last = -1e9; frame(performance.now() + 1e6); global.cancelAnimationFrame(raf); raf = global.requestAnimationFrame(frame); },
    liveAcc, restoreAcc,   // tests
    _taps: taps, lit, colourFor, rotate, settingsOf,
  };
  global.SoundCSS = SoundCSS;
  // ⋯ Options → Reactive colours: core/react-panel.js (the panel, and the same panel in every tool's ⚙ settings)
  // ⊞ Tidy up order for music: the timeline, then the song tools, drums, instruments, effects, the rest
  function tidyOrder() { if (!global.CanvasWM) return; global.CanvasWM.tidyRank = (d) => { const id = d.id || '', c = String(d.category || '').toLowerCase();
    return /timeline/.test(id) ? 0 : /session|recorder|mixer|master/.test(id) ? 1 : /drum|pads|sequencer|rhythm/.test(id + ' ' + c) ? 2 : /sound source|instrument|synth|forge|bass|wub|xen|organ|coven|poly/.test(id + ' ' + c) ? 3 : /effect|fx|mix/.test(id + ' ' + c) ? 4 : 5; }; }
  const boot = () => { tidyOrder(); if (global.Kernel && global.Kernel.audio) SoundCSS.init(global.Kernel); else setTimeout(boot, 500); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);

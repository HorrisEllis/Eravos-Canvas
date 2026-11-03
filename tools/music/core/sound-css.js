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
 * drift while it plays — 3.84: no drift, only the sound) · Custom (three colours you pick — low end, top, hits — and every colour leans toward them with the sound).
 * AMOUNT: how far. EVERY colour a window carries reacts — not only its accent: any inline colour variable on any element in it
 * (a pad's --pc, a drum strip's --acc, a macro's colour …), and drawn displays (Changing turns their hues too). Off is off
 * everywhere, the older living-accent layer (UI.alive) included.
 * 3.80 "i love what's in the menu, but nothing in the actual theme changes, and it's supposed to be all the colors in the canvas,
 * tools, ui, anywhere": the SURFACES react too — the page and canvas background, its grid, panels, a tool's chassis and wells, every
 * line and the dim text (SURFACES below). With the mix they lean toward the mode's colour now — Changing: the colour travelling
 * round the wheel; Static: the accent; Custom: your low / top colours by where the sound sits, flashing toward your hit colour —
 * each by its own share (a line more than a background), and come back exactly in silence or when switched off.
 * 3.82 DRAW WITH (his words: "move to main. get to step 2" — Looking Glass inside the canvas, specs/eravos.2026-10-22-brainstorm.map.spec
 * addendum 2026-10-31): 'glass' (default where it runs) — the same modes and colours, but drawn by the GPU on a Looking Glass layer over
 * the page (canvas/runtime/glass-layer.js): the mix tints everything under it (a 'wash'), each sounding window lights its edge and halo
 * in its own colour (a 'glow'). Nothing on the page is written while it plays, so nothing is restyled. 'page' — 3.80 as it was: the
 * colour variables themselves move (every accent, pad and surface by its own share).
 * 3.83 "i want the colors in the tools to use the reactive colors" — the colours a tool DRAWS and WRITES react, not only its
 *   variables: every colour drawn on a canvas inside a window (fillStyle, strokeStyle, shadowColor) passes through colourIn(), and
 *   every literal colour a tool's UI writes inline (ui-kit h() turns it into a --rc-* variable) is lit with the window. Each by its
 *   share: a dark surface leans a little, a grey a bit more, an accent fully (shareOf). In glass mode the windows answer too (only
 *   the page palette is left to the glass layer). Quiet, Off, or outside a window: the colour is returned exactly as given. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const root = doc.documentElement, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  let lastPal = -1e9, K = null, an = null, db = null, prevLow = 0, pulse = 0, level = 0, low = 0, high = 0, hue = 210, idle = 0, raf = 0, last = 0;
  const taps = new Map();   // instanceId → { an, buf, win }
  const PALETTE = ['--cyan', '--green', '--pink', '--violet', '--amber', '--red', '--acc'];
  // 3.80 the surfaces and how far each leans toward the colour of the moment at full sound (a line reads more than a background)
  const SURFACES = { '--bg': 0.10, '--bg2': 0.12, '--panel': 0.14, '--panel2': 0.16, '--chassis': 0.14, '--chassis2': 0.16, '--well': 0.10,
    '--grid': 0.5, '--line': 0.45, '--line2': 0.5, '--dim': 0.25, '--faint': 0.3 };
  let base = null, surfScale = null;   // the palette as the stylesheet has it (read once, before anything is overridden)
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
  const MODES = ['off', 'static', 'changing', 'custom'], DRAWS = ['glass', 'page'];
  let draw = 'glass'; try { const d = global.localStorage.getItem('eravos.reactive.draw'); if (DRAWS.includes(d)) draw = d; } catch (e) {}
  const GL = () => global.GlassLayer, glass = () => draw === 'glass' && !!GL();
  let mode = 'static', amt = 0.8, custom = { low: '#ff2266', high: '#00d4ff', hit: '#ffffff' }, shift = 0, bright = 0.5;
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
  // 3.80 the colour of the moment, that the surfaces lean toward
  function tintNow() {
    const acc = (base && base['--acc']) || '#00d4ff';
    if (mode === 'changing') return rotate(acc, shift);
    if (mode === 'custom') { const t = clamp(high / Math.max(1e-6, low + high), 0, 1); return hex(mixRGB(mixRGB(rgbOf(custom.low), rgbOf(custom.high), t), rgbOf(custom.hit), clamp(pulse * 0.5, 0, 1))); }
    return lit(acc, 0.3);
  }
  function surfaces(k) {
    if (!base) return; const tint = rgbOf(tintNow()); if (!tint) return;
    // 3.91 the theme says how far a surface may lean (--react-surface: Dusk .55, Midnight .3, Studio 1)
    const sc = surfScale === null ? (surfScale = parseFloat(global.getComputedStyle(root).getPropertyValue('--react-surface')) || 1) : surfScale;
    Object.keys(SURFACES).forEach(n => { const b = rgbOf(base[n]); if (b) set(n, k < 0.005 ? base[n] : hex(mixRGB(b, tint, k * SURFACES[n] * sc))); });
  }
  const hashOf = (str) => { let x = 2166136261; for (const ch of String(str || '')) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return x >>> 0; };
  const CanvasWin = (id) => global.CanvasWM && global.CanvasWM.windowOf ? global.CanvasWM.windowOf(id) : null;
  // every inline colour variable an element carries (--acc, --pc, --c …): lit from its own base; a base the tool changes is taken up
  const isCol = (v) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) || /^rgba?\(/i.test(v);
  function light(el, k, o) {
    if (!writing) { live.add(el); return; }
    const st = el.style; el._cb = el._cb || {}; el._cs = el._cs || {};
    for (let i = 0; i < st.length; i++) { const n = st[i]; if (n.charCodeAt(0) !== 45 || n.charCodeAt(1) !== 45 || n === '--tool-level' || n === '--lvl') continue;
      const v = st.getPropertyValue(n).trim(); if (!isCol(v)) continue; if (el._cs[n] !== v) el._cb[n] = v;
      const c = n.startsWith('--rc-') ? colourIn0(el._cb[n], k, o) : colourFor(el._cb[n], k, o); if (c !== v) st.setProperty(n, c); el._cs[n] = c;
      if (n === '--acc') { el.dataset.accLive = c; if (el.dataset.acc0 === undefined) el.dataset.acc0 = el._cb[n]; } }
    live.add(el);
  }
  function unlight(el) { if (!writing) return; if (el._cb) Object.keys(el._cb).forEach(n => el.style.setProperty(n, el._cb[n])); el._cs = {}; delete el.dataset.accLive; live.delete(el); }
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
    // 3.78 k in steps of 5 %, so the same colour strings repeat and are not written again
    if (!w._acc0) w._acc0 = w.style.getPropertyValue('--acc').trim() || (w.dataset && w.dataset.acc0) || global.getComputedStyle(w).getPropertyValue('--acc').trim() || '#00d4ff';
    if (!o.acc) o = Object.assign({}, o, { acc: (w._cb && w._cb['--acc']) || w._acc0 });   // the window's own accent: the hue its dark colours follow
    const k = q(clamp((lv * 0.85 + (o.pulse || 0) * 0.25 * lv) * o.amt * 1.25, 0, 1), 20); w._rk = k; w._ro = o; light(w, k, o); accented(w, ts || performance.now()).forEach(el => light(el, k, o));
  }
  function lvSet(w, v) { if (!writing) return; const s2 = q(v, 25).toFixed(2); if (w._lvS !== s2) { w._lvS = s2; w.style.setProperty('--tool-level', s2); } }   // 3.78
  function restoreAcc(w) { w._rk = 0; [w].concat(w._accEls || []).forEach(el => { if (el._cb) unlight(el); }); }
  // ---- 3.83 colours a tool draws or writes: by its share (a dark surface leans a little, a grey more, an accent fully), alpha kept
  function shareOf(rgb) { const mx = Math.max(...rgb) / 255, mn = Math.min(...rgb) / 255, l = (mx + mn) / 2, sa = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); return l < 0.3 ? 0.12 : sa < 0.35 ? 0.3 : 1; }
  const memo = new Map();
  function colourIn0(c, k, o) {
    if (!(k >= 0.005) || !o || o.mode === 'off' || typeof c !== 'string') return c;
    const key = c + '|' + k + '|' + o.mode + '|' + (o.shift || 0) + '|' + (o.acc || '') + '|' + (o.mode === 'custom' ? q(o.pulse || 0, 10) + JSON.stringify(o.colors) : ''), hit = memo.get(key); if (hit !== undefined) return hit;
    const rgb = rgbOf(c); let out = c;
    if (rgb) { let a = null; const t = c.trim(), m = /^rgba\([^)]*,\s*([\d.]+)\s*\)$/i.exec(t), m8 = /^#[0-9a-f]{6}([0-9a-f]{2})$/i.exec(t); if (m) a = +m[1]; else if (m8) a = parseInt(m8[1], 16) / 255;
      // Changing turns EVERY colour's hue by the full amount (a dark pink background that stayed pink under green accents read as a red
      // cast — his note on the Shape and Perform screens); only how much it brightens follows its share
      // Changing: an accent turns round the wheel (the palette keeps its variety); a dark or grey colour takes the hue the window's
      // accent has turned to (turning it by the same amount made blue-grey grids pink under a green accent: his "red tint")
      const sh = shareOf(rgb), f = Math.min(1, k * 1.6); let lit2;
      if (o.mode === 'changing') { if (sh >= 1 || !o.acc) lit2 = lit(rotate(hex(rgb), (o.shift || 0) * f), k * sh * 0.6);
        else { const th = hueDeg(rgbOf(rotate(o.acc, o.shift || 0))), d = ((th - hueDeg(rgb) + 540) % 360) - 180; lit2 = lit(rotate(hex(rgb), d * f), k * sh * 0.6); } }
      else lit2 = colourFor(hex(rgb), k * sh, o);
      const r2 = rgbOf(lit2); out = a === null ? lit2 : 'rgba(' + r2[0] + ',' + r2[1] + ',' + r2[2] + ',' + (+a.toFixed(3)) + ')'; }
    if (memo.size > 4000) memo.clear(); memo.set(key, out); return out;
  }
  // the reacting colour for something inside a window or a tool page (else exactly c)
  let lastScan = 0;
  function colourIn(el, c) {
    if (!on && !ownAny) return c; let w = el && el._rw;
    if (!w || !w.isConnected || el._rwAt <= lastScan) { w = el && el.closest ? el.closest('.wm-win, .tp-overlay') : null; if (el) { el._rw = w; el._rwAt = lastScan + 1; } }
    return w && w._rk ? colourIn0(c, w._rk, w._ro) : c;
  }
  // every 2D canvas: what it is told to draw with passes through colourIn (a canvas outside any window gets its colour back unchanged)
  (function patchCanvas() {
    const P = global.CanvasRenderingContext2D && global.CanvasRenderingContext2D.prototype; if (!P || P._eravosRC) return; P._eravosRC = true;
    ['fillStyle', 'strokeStyle', 'shadowColor'].forEach(name => { const d = Object.getOwnPropertyDescriptor(P, name); if (!d || !d.set) return;
      Object.defineProperty(P, name, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, typeof v === 'string' && this.canvas && this.canvas.closest ? colourIn(this.canvas, v) : v); } }); });
  })();

  // what in a window carries a colour — found once a second
  function accented(root, ts) { if (!root._accAt || ts - root._accAt > 1000) { root._accAt = ts; root._accEls = Array.from(root.querySelectorAll('[style*="--"]')); } return root._accEls; }
  let on = mode !== 'off', ownScan = -1e9, ownAny = false;
  const calm = () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 3.78 perf (build/perf-ui.mjs, a song playing, 8 windows): every write of a colour variable restyles everything under it — on
  // <html> that is the whole page. 30 writes a second of the palette, each window's level and each element's colours = 15 fps.
  // Same look, fewer writes: a value is written only when it changed by a visible step, the page palette at most 10× a second,
  // and every window is read before any is written (no layout between writes).
  const rootV = {};
  // and the sound is still read 30× a second, but colours are written on one frame in every ~80 ms (WRITE_MS): the frames between
  // restyle nothing. `writing` is that frame.
  const WRITE_MS = 80; let writing = true, lastW = -1e9;
  let pageOff = false;   // 3.83 glass mode: the page palette is the glass layer's; the windows still answer
  const set = (k, v) => { if (!writing || pageOff || rootV[k] === v) return; rootV[k] = v; root.style.setProperty(k, v); };
  // 3.96 "All the colors are meant to be reactive … the button contents and their border": the accents are written in glass mode too.
  // The glass layer still owns the surfaces (its wash); but the toolbar's buttons, a tool page and anything else outside a window take
  // their border, text and icons from the page accents, and with pageOff those never moved.
  const setPal = (k, v) => { if (!writing || rootV[k] === v) return; rootV[k] = v; root.style.setProperty(k, v); };
  const q = (v, n) => Math.round(v * n) / n;   // a visible step: n per unit
  function zero() {
    const w0 = writing; writing = true;   // 3.78 putting colours back is never skipped
    ['--snd-low', '--snd-high', '--snd-level', '--snd-pulse'].forEach(k => set(k, '0')); ['--snd-hn', '--snd-lv'].forEach(k => setPal(k, '0')); doc.querySelectorAll('.wm-win[style*="--tool-level"]').forEach(w => { w.style.setProperty('--tool-level', '0'); w._lvS = '0.00'; });
    PALETTE.concat(Object.keys(SURFACES)).forEach(k => { root.style.removeProperty(k); delete rootV[k]; }); lastPal = -1e9;
    Array.from(live).forEach(unlight); live.clear(); set('--snd-shift', '0deg');
    writing = w0; glassRest();
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
  // 3.78 the skip between writes lives only inside the loop: a call from outside (liveAcc, restoreAcc, setMode) always writes
  function frame(ts) { try { frameBody(ts); } finally { writing = true; } }
  function frameBody(ts) {
    raf = global.requestAnimationFrame(frame);
    if (doc.hidden || ts - last < 33) return;
    // the app is Off: only windows with their own reactive setting (⚙ → Reactive colours) still answer — looked for once a second
    if (!on) { if (ts - ownScan > 1000) { ownScan = ts; ownAny = Array.from(doc.querySelectorAll('.wm-win')).some(w => { const x = settingsOf(w); return x.own && x.mode !== 'off'; }); } if (!ownAny) return; }
    last = ts; writing = ts - lastW >= WRITE_MS; if (writing) lastW = ts;
    const G2 = glass(); pageOff = G2;   // 3.82 drawn on the glass layer: the page is not written; 3.83 the windows still are
    const lit = G2 ? [] : null;
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
    // Changing: where the colours turn — the sound's weight (warm low end ↔ cool top), a kick on each hit
    // 3.84 "the changing setting is supposed to change the color based on the sound": no clock in it any more (it had a ±40° sine drift
    // that moved with nothing playing). The turn is where the sound sits — deep low end ≈ −150°, bright top ≈ +150° — plus a kick on each
    // hit; steps of 6° (fewer page writes, more repeats of the same colour)
    bright = bright + (clamp((c - 7) / 5, 0, 1) - bright) * 0.3;   // log2 Hz: 7 = 128 Hz … 12 = 4 kHz
    shift = mode === 'changing' ? q(clamp((bright - 0.5) * 300 + pulse * 35, -160, 160) * amt, 1 / 6) : 0; set('--snd-shift', q(shift, 0.25).toFixed(0) + 'deg');
    set('--snd-low', q(low, 25).toFixed(2)); set('--snd-high', q(high, 25).toFixed(2)); set('--snd-level', q(level, 25).toFixed(2)); set('--snd-pulse', q(pulse, 10).toFixed(1)); set('--snd-hue', q(hue, 0.2).toFixed(0));
    // the app's accents: the mix lights them, each hit flashes them
    if (!base) { const cs = global.getComputedStyle(root); base = {}; PALETTE.concat(Object.keys(SURFACES)).forEach(k => { base[k] = cs.getPropertyValue(k).trim(); }); }
    const kMix = q(clamp((level * 0.55 + pulse * 0.5) * amt * 1.25, 0, 1), 20);
    // 3.98 the Field theme: one turn (degrees, a plain number) and one light (0…1) for every colour at once — written in both ways of
    // drawing, so every accent on the page moves together ("changing to sync them all, and change with the sounds")
    if (on) { setPal('--snd-hn', String(Math.round(shift))); setPal('--snd-lv', kMix.toFixed(2)); } if (on && ts - lastPal >= 100) { lastPal = ts; PALETTE.forEach(k => { if (base[k]) setPal(k, colourFor(base[k], kMix, G())); }); surfaces(kMix); }
    if (G2 && on) glassMix(kMix);
    // a tool shown on its page (or a suite's page) lights with the mix
    if (on) doc.querySelectorAll('.tp-overlay').forEach(o => { o._rk = kMix; o._ro = G(); light(o, kMix, G()); accented(o, ts).forEach(el => light(el, kMix, G())); });
    if (Math.random() < 0.05) lastScan++;   // 3.83 a canvas looks up its window again now and then (it may have moved)
    if (Math.random() < 0.02) taps.forEach((t, id) => { if (!t.win || !t.win.isConnected) { try { if (t.node && t.an) t.node.disconnect(t.an); } catch (e) {} taps.delete(id); } });   // closed windows let go
    // each window that makes sound: its own level
    // 3.73 "all of the accents … when sound plays — in the tools, the ui": a window that makes no sound of its own (a pattern tool,
    // the timeline, a modulator) follows the tools it plays (wired from it), or else the mix — so every window answers the sound
    const lvOf = new Map(), quiet = [];
    Array.from(doc.querySelectorAll('.wm-win')).filter(w => !w.classList.contains('collapsed') && w.offsetParent !== null).forEach(w => {   // 3.78 every read first
      const t = toolTap(w); if (!t || t.none) { quiet.push(w); return; }
      t.an.getFloatTimeDomainData(t.buf); let s = 0, pk = 0; for (let i = 0; i < t.buf.length; i++) { const x = t.buf[i]; s += x * x; const a = x < 0 ? -x : x; if (a > pk) pk = a; }
      // 3.73 a meter's envelope: the loudness or the peak (a drum hit is short — its peak is what you see), up fast, down slower
      const vr = clamp((10 * Math.log10(s / t.buf.length + 1e-12) + 50) / 44, 0, 1), vp = clamp((20 * Math.log10(pk + 1e-9) + 36) / 36, 0, 1), v = Math.max(vr, vp * 0.95);
      const before = t.lv || 0; t.lv = before + (v - before) * (v > before ? 0.6 : 0.12); lvSet(w, t.lv);
      lvOf.set(w.dataset.instance, t.lv);
      // 3.77 "changing … each sound": this tool's own colour turn — from where ITS sound sits (its own spectrum), its own hits and
      // (3.84: no slow drift — only the sound), so every tool moves with what it plays, not all together
      const S = settingsOf(w), o = Object.assign(G(), S); w.dataset.react = o.mode;
      if (o.mode === 'changing' && t.lv > 0.02) {
        // 3.84 weighted by energy (the byte spectrum's floor counted every empty bin and pulled every tool toward the top)
        if (!t.ff) t.ff = new Float32Array(t.an.frequencyBinCount); t.an.getFloatFrequencyData(t.ff); let wsum = 0, tsum = 0; for (let i = 1; i < t.ff.length; i++) { const pw = Math.pow(10, t.ff[i] / 10); wsum += pw; tsum += pw * i; }
        // 3.84 where this tool's sound sits, in Hz on the ear's scale: 128 Hz → 0 (dark) … 4 kHz → 1 (bright) — the same scale as the mix
        const cen = wsum ? clamp((Math.log2(Math.max(1, (tsum / wsum) * K.audio.ctx.sampleRate / t.an.fftSize)) - 7) / 5, 0, 1) : 0.5;
        t.hue = (t.hue === undefined ? cen : t.hue + (cen - t.hue) * 0.3);   // 3.84 its own sound only: no drift
        t.pu = Math.max((v - before > 0.18 ? 1 : 0), (t.pu || 0) * 0.82);
        w._shift = q(clamp((t.hue - 0.5) * 300 + t.pu * 40, -160, 160) * o.amt, 1 / 6); if (writing && w._shS !== w._shift) { w._shS = w._shift; w.style.setProperty('--win-shift', w._shift.toFixed(0) + 'deg'); }
      }
      o.shift = w._shift || 0; o.pulse = t.pu || 0;
      if (lit) lit.push([w, t.lv, o]);
      if (t.lv > 0.02) liveAcc(w, t.lv, ts, o); else restoreAcc(w);
    });
    if (quiet.length) {
      const wires = (K.wires && K.wires.list && K.wires.list()) || [];
      quiet.forEach(w => {
        const id = w.dataset.instance, outs = wires.filter(x => x.src && x.src.instanceId === id).map(x => lvOf.get(x.dst.instanceId)).filter(v => v !== undefined);
        const v = outs.length ? Math.max(...outs) : clamp(level * 0.6 + pulse * 0.25, 0, 1), prev = +w.dataset.lv || 0, lv = prev + (v - prev) * 0.4;
        w.dataset.lv = lv.toFixed(3); lvSet(w, lv);
        // its colour turn: the tool it plays (its first wired destination that has one), else the mix's (3.84: no drift)
        const S = settingsOf(w), o = Object.assign(G(), S); w.dataset.react = o.mode;
        const dst = wires.filter(x => x.src && x.src.instanceId === id).map(x => CanvasWin(x.dst.instanceId)).find(x => x && x._shift !== undefined);
        if (o.mode === 'changing') { w._shift = dst ? dst._shift : shift * (o.amt / (amt || 1)); if (writing) w.style.setProperty('--win-shift', w._shift.toFixed(1) + 'deg'); }
        o.shift = w._shift || 0;
        if (lit) lit.push([w, lv, o]);
        if (lv > 0.02) liveAcc(w, lv, ts, o); else restoreAcc(w);
      });
    }
    if (lit) glassWindows(lit);
  }
  // ---- 3.82 the glass layer: one wash for the mix, one glow per window. Same colours as the page way (colourFor, tintNow).
  const accBase = (w) => w.style.getPropertyValue('--facc').trim() || (w._cb && w._cb['--acc']) || w.dataset.acc0 || w.style.getPropertyValue('--acc').trim() || (base && base['--acc']) || '#00d4ff';
  function glassMix(kMix) {
    const L = GL().layer('reactive', { depth: 99990, cover: coverWins });
    GL().vars.set('react.tint', tintNow()); GL().vars.set('react.mix', +(kMix * 0.2).toFixed(3));   // the surfaces' shares in the page way are 10–16 %; a wash over text needs a touch more
    if (!L.items.has('mix')) L.set('mix', { type: 'wash', color: { var: 'react.tint' }, alpha: { var: 'react.mix' } });
  }
  const glowed = new Set();
  // 3.97 "the border should not be showing above tools that are above them": each glow knows its window's place in the stack and stays
  // inside the canvas; the windows in front cut it out (GlassLayer cover)
  const zOf = (w) => parseInt(w.style.zIndex || global.getComputedStyle(w).zIndex, 10) || 0;
  const coverWins = () => Array.from(doc.querySelectorAll('.wm-win')).filter(w => !w.classList.contains('docked') && w.offsetParent !== null).map(w => {
    const r = w.getBoundingClientRect(); return { box: [r.left, r.top, r.width, r.height], z: zOf(w), radius: parseFloat(global.getComputedStyle(w).borderTopLeftRadius) || 0 }; });
  function glassWindows(list) {
    const L = GL().layer('reactive', { depth: 99990, cover: coverWins }), seen = new Set();
    list.forEach(([w, lv, o]) => { const id = 'win:' + (w.dataset.instance || ''); seen.add(id);
      const k = o.mode === 'off' ? 0 : clamp((lv * 0.85 + (o.pulse || 0) * 0.25 * lv) * o.amt * 1.25, 0, 1);
      L.set(id, { type: 'glow', anchor: w, z: () => zOf(w), clip: w.closest('#canvas, .wm-canvas, .canvas') || null, color: colourFor(accBase(w), k * 0.45, o), intensity: +Math.min(1, 0.15 + k * 1.3).toFixed(3) * (k > 0.02 ? 1 : 0), radius: 6, spread: 18 + 34 * k, fill: 0.035 }); });   // the tool's own hue, only a little lit (lit fully, it washes to white)
    glowed.forEach(id => { if (!seen.has(id)) L.remove(id); }); glowed.clear(); seen.forEach(id => glowed.add(id));
  }
  function glassRest() { const G0 = GL(); if (G0 && G0.has('reactive')) G0.layer('reactive').clear(); glowed.clear(); }
  const listeners = [];
  const fire = () => listeners.forEach(fn => { try { fn(SoundCSS); } catch (e) {} });
  function save() { try { const L = global.localStorage; L.setItem('eravos.reactive', on ? '1' : '0'); L.setItem('eravos.reactive.mode', mode); L.setItem('eravos.reactive.amount', String(amt)); L.setItem('eravos.reactive.colors', JSON.stringify(custom)); L.setItem('eravos.reactive.draw', draw); } catch (e) {} }
  const SoundCSS = {
    init(kernel) { K = kernel; if (!raf) raf = global.requestAnimationFrame(frame); root.classList.toggle('snd-off', !on); root.dataset.react = mode; return SoundCSS; },
    get on() { return on; },
    set(v) { SoundCSS.setMode(v ? (mode === 'off' ? 'static' : mode) : 'off'); },
    get mode() { return mode; }, get amount() { return amt; }, get colors() { return Object.assign({}, custom); }, MODES,
    setMode(m) { if (!MODES.includes(m)) return; mode = m; on = m !== 'off'; ownScan = -1e9; save(); root.classList.toggle('snd-off', !on); root.dataset.react = m; zero(); fire(); },
    rescan() { ownScan = -1e9; },
    get draw() { return draw; }, DRAWS, get renderer() { return GL() ? GL().renderer : null; },
    setDraw(d) { if (!DRAWS.includes(d) || d === draw) return; draw = d; save(); zero(); fire(); },   // 3.82 glass · page
    setAmount(a) { amt = clamp(+a || 0, 0, 1); save(); fire(); },
    setColors(c) { custom = Object.assign({}, custom, c || {}); save(); fire(); },
    onChange(fn) { listeners.push(fn); },
    // tests: one analysis step on demand (offline pages have no running clock)
    step() { last = -1e9; lastW = -1e9; frame(performance.now() + 1e6); global.cancelAnimationFrame(raf); raf = global.requestAnimationFrame(frame); },
    liveAcc, restoreAcc,   // tests
    colourIn, shareOf,     // 3.83 the colour a tool draws or writes, reacting (tests, and code that draws outside a 2D canvas)
    _taps: taps, lit, colourFor, rotate, settingsOf, SURFACES, tintNow,
  };
  // 3.91 a new theme is a new palette: put every colour back, read the palette (and how far surfaces may lean) again
  global.addEventListener && global.addEventListener('eravos:theme', () => { zero(); base = null; surfScale = null; });
  global.SoundCSS = SoundCSS;
  // ⋯ Options → Reactive colours: core/react-panel.js (the panel, and the same panel in every tool's ⚙ settings)
  // ⊞ Tidy up order for music: the timeline, then the song tools, drums, instruments, effects, the rest
  function tidyOrder() { if (!global.CanvasWM) return; global.CanvasWM.tidyRank = (d) => { const id = d.id || '', c = String(d.category || '').toLowerCase();
    return /timeline/.test(id) ? 0 : /session|recorder|mixer|master/.test(id) ? 1 : /drum|pads|sequencer|rhythm/.test(id + ' ' + c) ? 2 : /sound source|instrument|synth|forge|bass|wub|xen|organ|coven|poly/.test(id + ' ' + c) ? 3 : /effect|fx|mix/.test(id + ' ' + c) ? 4 : 5; }; }
  const boot = () => { tidyOrder(); if (global.Kernel && global.Kernel.audio) SoundCSS.init(global.Kernel); else setTimeout(boot, 500); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);

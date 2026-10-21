/* ERAVOS music domain — ui-music.js: widgets music UIs need, added to UIKit
 * atTime (audio clock → UI), level Meter, readLevel / Scope / Spectrum over real analysers,
 * scale-highlighted playable Keyboard, divisionLadder. */
(function (global) {
  const doc = global.document;
  'use strict';
  const UI = global.UIKit, h = UI.h, Canvas = UI.Canvas, loop = UI.loop, Segmented = UI.Segmented, Button = UI.Button;
  function atTime(ac, t, fn) {
    const dt = Math.max(0, (t - ac.currentTime) * 1000);
    return setTimeout(fn, dt);
  }
  function Meter(o) {
    const c = Canvas(o.width || 14, o.height || 120, 'uk-meter');
    const state = { hold: -90, holdT: 0 };
    c.draw = function (peakDb, rmsDb) {
      const g = c.g, W = c.W, H = c.H;
      const n = (db) => Math.max(0, Math.min(1, (db + 60) / 60));
      g.clearRect(0, 0, W, H); g.fillStyle = '#0b0f14'; g.fillRect(0, 0, W, H);
      const now = performance.now();
      if (peakDb > state.hold || now - state.holdT > 1500) { state.hold = peakDb; state.holdT = now; }
      const grad = g.createLinearGradient(0, H, 0, 0); grad.addColorStop(0, '#00ff88'); grad.addColorStop(0.75, '#ffdd00'); grad.addColorStop(1, '#ff2266');
      g.fillStyle = grad; g.globalAlpha = 0.45; g.fillRect(0, H - n(peakDb) * H, W, n(peakDb) * H);
      g.globalAlpha = 1; g.fillRect(0, H - n(rmsDb) * H, W, n(rmsDb) * H);
      g.fillStyle = '#fff'; g.fillRect(0, H - n(state.hold) * H, W, 2);
    };
    return c;
  }
  function readLevel(an, buf) {
    buf = buf && buf.length === an.fftSize ? buf : new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(buf);
    let pk = 0, sq = 0; for (let i = 0; i < buf.length; i++) { const x = Math.abs(buf[i]); if (x > pk) pk = x; sq += buf[i] * buf[i]; }
    return { peakDb: 20 * Math.log10(pk + 1e-9), rmsDb: 10 * Math.log10(sq / buf.length + 1e-18), buf };
  }
  function Scope(an, o) {
    o = o || {};
    const c = Canvas(o.width || 260, o.height || 70, 'uk-scope');
    let buf = new Float32Array(an ? an.fftSize : 2048);
    c.stop = loop(c, () => {
      const g = c.g, W = c.W, H = c.H;
      g.fillStyle = 'rgba(8,11,16,0.55)'; g.fillRect(0, 0, W, H);
      if (!an) return;
      if (buf.length !== an.fftSize) buf = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(buf);
      let start = 0; for (let i = 1; i < buf.length / 2; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { start = i; break; }
      g.strokeStyle = o.color || '#00ff88'; g.lineWidth = 1.5; g.beginPath();
      const n = Math.min(buf.length - start, o.samples || 1024);
      for (let i = 0; i < n; i++) { const x = i / n * W, y = H / 2 - buf[start + i] * H * 0.45 * (o.gain || 1); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }, 40);
    return c;
  }
  function Spectrum(an, o) {
    o = o || {};
    const c = Canvas(o.width || 260, o.height || 80, 'uk-spectrum');
    let bins = new Float32Array(an ? an.frequencyBinCount : 1024);
    c.stop = loop(c, () => {
      if (c.fit) c.fit();   // draw at the size it is shown (stretched pixels blur the labels)
      const g = c.g, W = c.W, H = c.H;
      g.clearRect(0, 0, W, H); g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
      // 3.48.1 the display at rest is still a display: a frequency grid (100 · 1k · 10k) and dB lines, never a blank box
      const xf = (f) => Math.log(f / 20) / Math.log(1000) * W;
      g.fillStyle = '#121a25'; [50, 200, 500, 2000, 5000].forEach(f => g.fillRect(Math.round(xf(f)), 0, 1, H));
      g.fillStyle = '#1c2838'; [100, 1000, 10000].forEach(f => g.fillRect(Math.round(xf(f)), 0, 1, H)); [0.25, 0.5, 0.75].forEach(t => g.fillRect(0, Math.round(H * t), W, 1));
      if (H >= 40) { g.fillStyle = '#4d6178'; g.font = '9px monospace'; [[100, '100'], [1000, '1k'], [10000, '10k']].forEach(([f, t]) => g.fillText(t, xf(f) + 3, H - 4)); }
      if (!an) return;
      if (bins.length !== an.frequencyBinCount) bins = new Float32Array(an.frequencyBinCount);
      an.getFloatFrequencyData(bins);
      const sr = an.context.sampleRate, ny = sr / 2;
      let loud = 0;
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x < W; x++) {
        const f = 20 * Math.pow(1000, x / W); const b = Math.min(bins.length - 1, Math.round(f / ny * bins.length));
        const db = bins[b]; const v = Math.max(0, Math.min(1, (db + 100) / 90)), y = H - v * H; if (v > loud) loud = v;
        g.lineTo(x, y);
      }
      g.lineTo(W, H); g.closePath();
      g.fillStyle = (o.color || '#00d4ff') + '55'; g.fill(); g.strokeStyle = o.color || '#00d4ff'; g.stroke();
      if (loud < 0.02) { g.fillStyle = (o.color || '#00d4ff') + '55'; g.fillRect(0, H - 1.5, W, 1.5); if (H >= 40) { g.fillStyle = '#4d6178'; g.font = '10px sans-serif'; g.textAlign = 'right'; g.fillText('play a note to see its spectrum', W - 8, 14); g.textAlign = 'left'; } }
      if (o.overlay) o.overlay(g, W, H);
    }, 30);
    return c;
  }
  // playable keyboard, scale-highlighted.
  // 3.48.7 it grows with its window (eravos.phase48-map P48.7, D-48.7). The tool's own range [low, high] is the least it shows.
  // A wider window adds whole white keys below and above in turn, so the register stays in the middle, up to a piano's 88 keys
  // (A0 = 21 … C8 = 108). A narrower one gives them back. o.grow === false keeps the fixed range. o.keyWidth sets the px per white key.
  // James, 2026-10-21: "make it so the tools expand when resized, like that way it can expand to capture the full range of piano keys"
  const PIANO_LO = 21, PIANO_HI = 108, WHITE = [0, 2, 4, 5, 7, 9, 11];
  const isWhite = (n) => WHITE.includes(((n % 12) + 12) % 12);
  function keyRange(lo0, hi0, width, keyW) {
    let a = Math.max(PIANO_LO, lo0), b = Math.min(PIANO_HI, hi0), whites = 0;
    for (let n = a; n <= b; n++) if (isWhite(n)) whites++;
    const want = Math.floor(width / (keyW || 24)); let below = true;
    while (whites < want && (a > PIANO_LO || b < PIANO_HI)) {
      if (below && a > PIANO_LO) { do { a--; } while (a > PIANO_LO && !isWhite(a)); whites++; }
      else if (b < PIANO_HI) { do { b++; } while (b < PIANO_HI && !isWhite(b)); whites++; }
      else { do { a--; } while (a > PIANO_LO && !isWhite(a)); whites++; }
      below = !below;
    }
    return [a, b];
  }
  function Keyboard(o) {
    const el = h('div', { class: 'uk-keys' });
    const lo0 = o.low || 48, hi0 = o.high || 72;
    let lo = lo0, hi = hi0;
    let root = (o.key && o.key.root) || 9, scale = (o.key && o.key.scale) || 'minor', lock = o.lock !== false;
    let keys = [];
    function build() {
      el.innerHTML = ''; keys = [];
      for (let n = lo; n <= hi; n++) {
        const k = h('div', { class: 'uk-key ' + (isWhite(n) ? 'w' : 'b'), 'data-n': n });
        k.appendChild(h('span', { text: '' }));
        k.addEventListener('pointerdown', (e) => down(e, n));
        keys.push([n, k]); el.appendChild(k);
      }
      el.classList.toggle('grown', lo < lo0 || hi > hi0);
      el.dataset.range = lo + '-' + hi;
    }
    const held = new Map();
    const down = (e, n) => {
      e.preventDefault(); e.stopPropagation();
      const MT = global.MusicTheory;
      const play = lock && !MT.inScale(n, root, scale) ? MT.quantize(n, root, scale) : n;
      held.set(e.pointerId, play); o.onDown && o.onDown(play, 0.8); mark(play, true);
    };
    const up = (e) => { const n = held.get(e.pointerId); if (n !== undefined) { held.delete(e.pointerId); o.onUp && o.onUp(n); mark(n, false); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
    function mark(n, on) { keys.forEach(([m, k]) => { if (m === n) k.classList.toggle('down', on); }); }
    // P11.4 (gate A): playable from the keyboard — Tab to it, ←/→ pick a note (in key), Space or Enter plays it
    el.setAttribute('tabindex', '0'); el.setAttribute('role', 'group');
    const MTn = (n) => global.MusicTheory.noteName(n);
    let cur = lo, kHeld = null;
    for (let n = lo; n <= hi; n++) if ((n - root) % 12 === 0) { cur = n; break; }
    const label = () => el.setAttribute('aria-label', `Keyboard ${MTn(lo)}–${MTn(hi)} — ${MTn(cur)} selected. Left and right arrows choose a note, Space plays it.`);
    const showCur = () => { keys.forEach(([n, k]) => k.classList.toggle('kcur', n === cur && el === doc.activeElement)); label(); };
    el.addEventListener('focus', showCur); el.addEventListener('blur', () => { keys.forEach(([, k]) => k.classList.remove('kcur')); if (kHeld !== null) { o.onUp && o.onUp(kHeld); mark(kHeld, false); kHeld = null; } });
    el.addEventListener('keydown', (e) => {
      const MT = global.MusicTheory;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); const d = e.key === 'ArrowRight' ? 1 : -1; let n = cur + d; while (n >= lo && n <= hi && lock && !MT.inScale(n, root, scale)) n += d; if (n >= lo && n <= hi) cur = n; showCur(); return; }
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); kHeld = cur; o.onDown && o.onDown(cur, 0.8); mark(cur, true); }
    });
    el.addEventListener('keyup', (e) => { if ((e.key === ' ' || e.key === 'Enter') && kHeld !== null) { e.preventDefault(); o.onUp && o.onUp(kHeld); mark(kHeld, false); kHeld = null; } });
    function paint() {
      const grown = lo < lo0 || hi > hi0;
      keys.forEach(([n, k]) => {
        const inS = global.MusicTheory.inScale(n, root, scale), isRoot = (n - root) % 12 === 0;
        k.classList.toggle('in', inS); k.classList.toggle('out', !inS && lock); k.classList.toggle('root', isRoot);
        // grown past its own range: every C carries its octave, so you can tell where you are
        k.firstChild.textContent = isRoot || (grown && n % 12 === 0) ? global.MusicTheory.noteName(n) : '';
      });
      // a note still held keeps its lit key across a rebuild
      held.forEach(n => mark(n, true)); if (kHeld !== null) mark(kHeld, true);
    }
    function setRange(a, b) {
      if (a === lo && b === hi && keys.length) return false;
      lo = a; hi = b; if (cur < lo || cur > hi) cur = Math.max(lo, Math.min(hi, cur));
      build(); paint(); label(); return true;
    }
    build(); paint(); label();
    if (o.grow !== false && global.UIKit && global.UIKit.fit) global.UIKit.fit(el, ({ w }) => { const r = keyRange(lo0, hi0, w, o.keyWidth); setRange(r[0], r[1]); });
    return { el, setKey(k) { root = k.root; scale = k.scale; paint(); }, setLock(v) { lock = v; paint(); }, mark, range: () => [lo, hi], own: [lo0, hi0], setWidth: (w) => { const r = keyRange(lo0, hi0, w, o.keyWidth); return setRange(r[0], r[1]); } };
  }

  function divisionLadder(view, key, options) {
    const c = (view.descriptor.config || []).find(x => x.key === key);
    const opts = options || (c && c.options) || [];
    return Segmented({ options: opts, value: view.state[key], onChange: (v) => view.emit('config_change', { key, value: v }) });
  }
  // P10 · routing readout for audio processors: what is wired into this window, where its sound goes
  function audioRouting(view, o) {
    o = o || {};
    const el = h('div', { class: 'uk-hint', style: { lineHeight: '1.5' } });
    function row(text, wireId) { const r = h('div', { class: 'org-row', style: { margin: '1px 0', gap: '4px' } }, [h('span', { text })]); if (wireId) r.appendChild(Button({ label: '×', hint: 'disconnect', onClick: () => view.K.wires.remove(wireId, 'user') }).el); return r; }
    function paint() {
      el.innerHTML = '';
      const ws = view.K.wires.list().filter(w => w.wire_type === 'audio' && !(w.meta && w.meta.insert));   // its own mods are not cables
      const ins = ws.filter(w => w.dst.instanceId === view.instanceId), outs = ws.filter(w => w.src.instanceId === view.instanceId);
      if (!ins.length) el.appendChild(row(o.emptyIn || 'Nothing plugged in yet — drag the orange dot on the right edge of any sound (synth, drums, sample) and let go on this window.'));
      ins.forEach(w => el.appendChild(row('⇢ in: ' + view.label(w.src.instanceId), w.wire_id)));
      if (!outs.length) el.appendChild(row('⇢ out: Master (default)'));
      outs.forEach(w => el.appendChild(row('⇢ out: ' + view.label(w.dst.instanceId), w.wire_id)));
    }
    view.observe('kernel:wire-registered', paint); view.observe('kernel:wire-removed', paint); paint();
    return { el, refresh: paint };
  }
  // P14 · shared instrument face: preset bar (+ extra header controls), live spectrum of its own output with a
  // tool-specific overlay, grouped knobs, playable keyboard. Every tool still draws its own signature in `overlay`.
  function instrumentPanel(view, o) {
    o = o || {};
    const an = view.tap(o.port || 'out', 4096);
    const spec = Spectrum(an, { width: 480, height: o.height || 96, color: o.color || view.descriptor.accent, overlay: o.overlay });
    const parts = [h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [presetBar(view)].concat(o.header || []))];
    if (o.top) parts.push(...o.top);
    parts.push(spec);
    if (o.middle) parts.push(...o.middle);
    parts.push(paramPanel(view, o.keys, { size: o.size || 32 }));
    if (o.keyboard !== false) {
      const kb = Keyboard({ low: o.low || 36, high: o.high || 60, key: view.key, lock: o.lock, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) });
      if (view.observe) view.observe('theory:key-change', (k) => kb.setKey(k));
      parts.push(h('div', { style: { height: '6px' } }), kb.el);
    }
    if (o.hint) parts.push(hint(o.hint));
    view.root.append(...parts);
    return { spec, an };
  }
  // 3.33 · LIVING ACCENTS — one shared layer so every tool's surface reacts to its own sound and events:
  //   --live  0…1  smoothed loudness of the tool's output        --peak 0…1  fast transient follower
  //   --tone  0…1  brightness (spectral centroid)                 --flash 0…1 decays after an event (a hit, a section, a drop)
  //   --acc   the tool's accent; --acc2 a second hue rotated by brightness
  // CSS reads them (class "alive" + music.css textures). Reduced motion: values are set once, no animation.
  function alive(view, o) {
    o = o || {};
    const root = view.root, win = root.closest ? root.closest('.wm-win') : null, el = win || root;
    el.classList.add('alive'); root.classList.add('alive-body');
    const acc = o.accent || view.descriptor.accent || '#00d4ff'; el.style.setProperty('--acc', acc);
    const hx = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const rgb = hx(acc), hue0 = (() => { const [r, g, b] = rgb.map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360; })();
    let live = 0, peak = 0, flash = 0, tone = 0.5; const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let an = null; try { an = view.tap(o.port || 'out', 2048); } catch (e) {}
    const buf = an ? new Float32Array(an.fftSize) : null, fbuf = an ? new Uint8Array(an.frequencyBinCount) : null;
    const set = () => { el.style.setProperty('--live', live.toFixed(3)); el.style.setProperty('--peak', peak.toFixed(3)); el.style.setProperty('--flash', flash.toFixed(3)); el.style.setProperty('--tone', tone.toFixed(3)); el.style.setProperty('--acc2', `hsl(${(hue0 + (tone - 0.5) * 120 + 360) % 360} 90% 65%)`); };
    const hit = (amt) => { flash = Math.min(1, flash + (typeof amt === 'number' ? amt : 0.8)); if (reduce) set(); };
    (o.events || []).forEach(ev => view.on(ev, (p) => hit(p && typeof p.velocity === 'number' ? 0.4 + 0.6 * p.velocity : 0.85)));
    set(); if (reduce) return { hit };
    loop(el, () => {
      if (an) {
        an.getFloatTimeDomainData(buf); let sq = 0, pk = 0; for (let i = 0; i < buf.length; i++) { const x = buf[i]; sq += x * x; const a = x < 0 ? -x : x; if (a > pk) pk = a; }
        const l = Math.min(1, Math.sqrt(sq / buf.length) * 4); live += (l - live) * (l > live ? 0.35 : 0.08); peak = Math.max(pk > 0.02 ? Math.min(1, pk * 1.4) : 0, peak * 0.86);
        if (live > 0.02) { an.getByteFrequencyData(fbuf); let w = 0, t = 0; for (let i = 2; i < fbuf.length; i++) { w += fbuf[i]; t += fbuf[i] * i; } if (w) tone += ((Math.log2(1 + t / w) / Math.log2(fbuf.length)) - tone) * 0.1; }
      }
      flash *= 0.9; if (flash < 0.004) flash = 0; set();
    }, 30);
    return { hit };
  }
  const presetBar = (view) => global.UIKit.presetBar(view), paramPanel = (v, k, op) => global.UIKit.paramPanel(v, k, op), hint = (t) => global.UIKit.hint(t);
  UI.extend({ atTime, Meter, readLevel, Scope, Spectrum, Keyboard, keyRange, divisionLadder, audioRouting, instrumentPanel, alive });
})(typeof window !== 'undefined' ? window : globalThis);

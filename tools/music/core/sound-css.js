/* 3.58 SOUND → CSS — "the UI colours change with the sound playing: variable, event-driven CSS".
 * Listens to the master output (a tap: nothing is rerouted) and writes CSS custom properties on <html>, ~30× a second:
 *   --snd-low   0…1  the low end (30–150 Hz)        --snd-high  0…1  the top (2–12 kHz)
 *   --snd-level 0…1  how loud the mix is             --snd-pulse 0…1  jumps on each hit, then falls back
 *   --snd-hue   deg  where the sound's weight sits: deep red/violet for a bass drop … cyan/teal for bright tops
 * and on every tool window that makes sound: --tool-level 0…1 (its own output) — eravos.css makes the window glow with it.
 * Quiet when nothing plays (the values fall to 0 and stop updating). Respects reduced motion (calmer, no pulse). Off/on in
 * ⋯ Options (◐ Reactive colours, remembered). Only listens while the page is visible. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const root = doc.documentElement, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  let K = null, an = null, db = null, prevLow = 0, pulse = 0, level = 0, low = 0, high = 0, hue = 210, idle = 0, raf = 0, last = 0;
  const taps = new Map();   // instanceId → { an, buf, win }
  let on = true; try { on = global.localStorage.getItem('eravos.reactive') !== '0'; } catch (e) {}
  const calm = () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const set = (k, v) => root.style.setProperty(k, v);
  function zero() { ['--snd-low', '--snd-high', '--snd-level', '--snd-pulse'].forEach(k => set(k, '0')); doc.querySelectorAll('.wm-win[style*="--tool-level"]').forEach(w => w.style.setProperty('--tool-level', '0')); }
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
    if (!on || doc.hidden || ts - last < 33) return; last = ts;
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
    set('--snd-low', low.toFixed(3)); set('--snd-high', high.toFixed(3)); set('--snd-level', level.toFixed(3)); set('--snd-pulse', pulse.toFixed(3)); set('--snd-hue', hue.toFixed(1));
    if (Math.random() < 0.02) taps.forEach((t, id) => { if (!t.win || !t.win.isConnected) { try { if (t.node && t.an) t.node.disconnect(t.an); } catch (e) {} taps.delete(id); } });   // closed windows let go
    // each window that makes sound: its own level
    doc.querySelectorAll('.wm-win').forEach(w => {
      if (w.classList.contains('collapsed') || w.offsetParent === null) return; const t = toolTap(w); if (!t || t.none) return;
      t.an.getFloatTimeDomainData(t.buf); let s = 0; for (let i = 0; i < t.buf.length; i++) s += t.buf[i] * t.buf[i];
      const v = clamp((10 * Math.log10(s / t.buf.length + 1e-12) + 50) / 44, 0, 1); t.lv = (t.lv || 0) + (v - (t.lv || 0)) * 0.4; w.style.setProperty('--tool-level', t.lv.toFixed(3));
    });
  }
  const SoundCSS = {
    init(kernel) { K = kernel; if (!raf) raf = global.requestAnimationFrame(frame); root.classList.toggle('snd-off', !on); return SoundCSS; },
    get on() { return on; },
    set(v) { on = !!v; try { global.localStorage.setItem('eravos.reactive', on ? '1' : '0'); } catch (e) {} root.classList.toggle('snd-off', !on); if (!on) zero(); },
    // tests: one analysis step on demand (offline pages have no running clock)
    step() { last = -1e9; frame(performance.now() + 1e6); global.cancelAnimationFrame(raf); raf = global.requestAnimationFrame(frame); },
    _taps: taps,
  };
  global.SoundCSS = SoundCSS;
  // ⋯ Options: the on/off switch (in the domain's own slot of the menu)
  function optionButton() {
    const slot = doc.getElementById('slot-options'); if (!slot || doc.getElementById('reactBtn')) return;
    const b = doc.createElement('button'); b.className = 'tb-btn'; b.id = 'reactBtn'; b.title = 'Reactive colours — windows glow with their own sound, the screen follows the mix (remembered)';
    const say = () => { b.textContent = on ? '◐ Reactive colours: on' : '◑ Reactive colours: off'; }; b.onclick = () => { SoundCSS.set(!on); say(); }; say(); slot.appendChild(b);
  }
  // ⊞ Tidy up order for music: the timeline, then the song tools, drums, instruments, effects, the rest
  function tidyOrder() { if (!global.CanvasWM) return; global.CanvasWM.tidyRank = (d) => { const id = d.id || '', c = String(d.category || '').toLowerCase();
    return /timeline/.test(id) ? 0 : /session|recorder|mixer|master/.test(id) ? 1 : /drum|pads|sequencer|rhythm/.test(id + ' ' + c) ? 2 : /sound source|instrument|synth|forge|bass|wub|xen|organ|coven|poly/.test(id + ' ' + c) ? 3 : /effect|fx|mix/.test(id + ' ' + c) ? 4 : 5; }; }
  const boot = () => { tidyOrder(); optionButton(); if (global.Kernel && global.Kernel.audio) SoundCSS.init(global.Kernel); else setTimeout(boot, 500); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);

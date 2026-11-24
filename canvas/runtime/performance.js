/* ERAVOS runtime — performance.js → window.Performance_ (3.222). Domain-free: it is about the machine, never a domain.
 * His words (2026-11-24): "needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu
 * cores, animations, graphics acceloratoin. maybe invent a better driver".
 * Measured first (10 tools playing together): the main thread in long tasks ~46 % of every second, ~32 fps, stalls to 150 ms — the CPU's
 * other cores idle. One loop did most of it (a domain's reactive colours restyling the page); with it off: 60 fps, no long task.
 * So: one thread is the bottleneck, not the machine. This file
 *   MEASURES   frames per second, how much of each second the main thread is blocked (long tasks), the cores, the GPU's status (desktop)
 *   ADAPTS     Auto ("a better driver"): when the page lags, the costly effects step down (level 0 → 1 → 2); with room again they come back.
 *              On a machine with headroom nothing changes — today's look.
 *   SETS       the custom settings, each written as a data-attribute on <html> that the canvas and any domain read:
 *                data-fps     auto | 60 | 30 | 15      how often displays (spectra, meters, scopes) redraw — ui-kit's loop
 *                data-fx      full | light | off       how much the costly effects (a domain's reactive colours, the glow layer) do
 *                             (auto: full, light at level ≥ 1)
 *                data-motion  on | off                 transitions and animations
 *                data-res     sharp | standard         displays at the screen's pixel density, or 1×
 *                data-blur    on | off                 blur and shadows behind panels
 *              graphics acceleration (desktop, on the next start): eravosDesktop.gpu(on)
 *   Performance_.level → 0 | 1 | 2 · .stats() → { fps, busy, cores, level } · .get(key) · .set(key, value) · event 'eravos:perf' */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const root = doc.documentElement;
  const KEYS = {
    fps: { def: 'auto', vals: ['auto', '60', '30', '15'], label: 'Display rate', say: { auto: 'Auto — full speed, slower when the screen lags', 60: '60 a second', 30: '30 a second', 15: '15 a second' } },
    fx: { def: 'auto', vals: ['auto', 'full', 'light', 'off'], label: 'Reactive colours & glow', say: { auto: 'Auto — full, lighter when the screen lags', full: 'Full — every change, as designed', light: 'Light — the same colours, a few times a second', off: 'Off — the cheapest' } },
    motion: { def: 'on', vals: ['on', 'off'], label: 'Animations & transitions', say: { on: 'On', off: 'Off — everything moves at once' } },
    res: { def: 'sharp', vals: ['sharp', 'standard'], label: 'Display resolution', say: { sharp: 'Sharp — the screen\'s full detail', standard: 'Standard — 1×, cheaper' } },
    blur: { def: 'on', vals: ['on', 'off'], label: 'Blur & shadows', say: { on: 'On', off: 'Off — cheaper on the graphics card' } },
  };
  const get = (k) => { let v = null; try { v = global.localStorage.getItem('eravos.perf.' + k); } catch (e) {} return KEYS[k].vals.includes(v) ? v : KEYS[k].def; };
  let level = 0;
  function apply() {
    const fx = get('fx'), fps = get('fps');
    root.dataset.fx = fx === 'auto' ? (level >= 1 ? 'light' : 'full') : fx;
    root.dataset.fps = fps === 'auto' ? (level >= 2 ? '30' : '60') : fps;
    root.dataset.motion = get('motion'); root.dataset.res = get('res'); root.dataset.blur = get('blur');
    root.dataset.perfLevel = String(level);
    try { global.dispatchEvent(new CustomEvent('eravos:perf', { detail: { level } })); } catch (e) {}
  }
  function set(k, v) { if (!KEYS[k] || !KEYS[k].vals.includes(v)) return; try { global.localStorage.setItem('eravos.perf.' + k, v); } catch (e) {} apply(); }
  // ---- the measure: long tasks (the main thread blocked ≥ 50 ms) and frames, over a moving second
  let longMs = 0, frames = 0, busy = 0, fps = 60, lastT = 0, over = 0, under = 0;
  try { new PerformanceObserver((l) => l.getEntries().forEach(e => { longMs += e.duration; })).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  function tick(t) {
    frames++;
    if (!lastT) lastT = t;
    if (t - lastT >= 1000) {
      const s = (t - lastT) / 1000; fps = frames / s; busy = Math.min(1, longMs / 1000 / s); frames = 0; longMs = 0; lastT = t;
      // Auto, with hysteresis: 2 s lagging (busy > 18 % or fps < 45) → a level down; 6 s calm (busy < 5 %, fps > 55) → a level back up
      if (!doc.hidden) {
        if (busy > 0.18 || fps < 45) { over++; under = 0; } else if (busy < 0.05 && fps > 55) { under++; over = 0; } else { over = 0; under = 0; }
        if (over >= 2 && level < 2) { level++; over = 0; apply(); }
        if (under >= 6 && level > 0) { level--; under = 0; apply(); }
      }
    }
    global.requestAnimationFrame(tick);
  }
  apply(); global.requestAnimationFrame(tick);
  const cores = () => global.navigator && global.navigator.hardwareConcurrency || 0;
  const stats = () => ({ fps: Math.round(fps), busy: Math.round(busy * 100), cores: cores(), level });

  // ---- Settings › Performance
  function section() {
    const UI = global.UIKit, h = UI.h, D = global.eravosDesktop;
    const live = h('div', { class: 'as-row as-perf-live' }), lv = () => { const s = stats(); live.textContent = `${s.fps} frames a second · the screen's thread blocked ${s.busy} % of the time · ${s.cores} CPU threads · Auto level ${s.level}${s.level ? ' (effects lighter while it lags)' : ''}`; };
    lv(); const timer = setInterval(() => { if (!live.isConnected) return clearInterval(timer); lv(); }, 1000);
    const rows = Object.keys(KEYS).map(k => {
      const K = KEYS[k], say = h('span', { class: 'as-say', text: K.say[get(k)] });
      const seg = UI.Segmented({ label: K.label, options: K.vals.map(v => ({ value: v, label: v === 'auto' ? 'Auto' : /^\d+$/.test(v) ? v : v[0].toUpperCase() + v.slice(1) })), value: get(k), onChange: (v) => { set(k, v); say.textContent = K.say[v]; } });
      return h('div', { class: 'as-row' }, [seg.el, say]);
    });
    const gpu = h('div', { class: 'as-row' });
    if (D && D.gpu) {
      const say = h('span', { class: 'as-say', text: '…' }), b = h('button', { class: 'uk-toggle', type: 'button', text: 'Graphics acceleration' });
      const paint = (g) => { const on = !g || g.accel !== false; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
        say.textContent = (on ? 'On — the graphics card draws the screen' : 'Off — the CPU draws everything (try only if the screen glitches)') + (g && g.status ? ' · now: ' + g.status : '') + (g && g.pending ? ' · takes effect when ERAVOS starts again' : ''); };
      D.gpu().then(paint).catch(() => paint(null));
      b.onclick = () => D.gpu().then(g => D.gpu({ accel: !(g && g.accel !== false) })).then(paint);
      gpu.append(b, say);
      if (D.relaunch) gpu.append(h('button', { class: 'uk-btn', type: 'button', text: 'Restart ERAVOS now', onclick: () => D.relaunch() }));
    } else gpu.append(h('span', { class: 'as-say', text: 'Graphics acceleration: set by the browser here (in ERAVOS.exe it is a switch).' }));
    return h('div', {}, [
      h('div', { class: 'as-card' }, [live, h('p', { class: 'as-say', text: 'A tool\'s real-time work (what you hear, what must keep time) runs on its own thread and is never slowed by any of this. What lags is the screen\'s one thread — these settings decide how much it draws. Auto steps the costly effects down only while the screen lags, and brings them back when there is room.' })]),
      h('div', { class: 'as-card' }, rows),
      h('div', { class: 'as-card' }, [gpu, h('p', { class: 'as-say', text: 'CPU threads: real-time work uses one thread and the screen one; heavy background work (synthesizing a tool, measuring, bouncing) spreading across all ' + (cores() || 'your') + ' threads is the next step (specs/eravos.performance-plan.spec PF6).' })]),
    ]);
  }
  function register() { const AS = global.AppSettings; if (!AS || !global.UIKit) return false; AS.addSection({ id: 'performance', label: 'Performance', order: 14, sub: 'How much the screen draws — measured live, adapted automatically, or set by hand.', make: section }); return true; }
  if (!register()) doc.addEventListener('DOMContentLoaded', register);
  global.Performance_ = { get level() { return level; }, stats, get, set, KEYS };
})(typeof window !== 'undefined' ? window : globalThis);

/* ERAVOS music — proximity.js · 3.90 HEAR BY PLACE. James, 2026-11-01: "what about a setting to play tools in proximity also zooming out
 * makes it quiter."
 * Off by default (⋯ Options › 🎧 Hear by place, remembered). On: the canvas is a room you look into.
 *   · a tool that makes sound is as loud as its window is near the middle of the view: full within the inner third, falling smoothly to
 *     a whisper (−22 dB) once it is well off screen; it pans left or right with where it sits (up to 60 %)
 *   · zooming out quietens every one of them: 1 at 100 % and closer, about −6 dB at 50 %, −10 dB at 25 %
 *   · effects are left alone: they pass on what feeds them, which is already placed (else it would be quietened twice)
 * It moves each tool's PLACE stage (a gain and a balance before its trim, built the first time it is on — core/audio.js), never its
 * volume or its saved state. Off: nothing is added to any tool.
 * Reads window rectangles about 12 times a second, only while it is on and the page is visible. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, FLOOR = 0.08;
  let on = false; try { on = global.localStorage.getItem('eravos.place') === '1'; } catch (e) {}
  let K = null, timer = 0;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const isSource = (id) => { const r = K && K.registry.get(id), d = r && global.OrganismFactory && global.OrganismFactory.def(r.organism_id); return !!d && !(d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'in'); };
  const outs = (id, make) => ((K && K.audio && K.audio.ports && K.audio.ports(id)) || []).filter(p => p.kind === 'audio' && p.direction === 'out' && !p.internal && (p.place || (make && K.audio.placeStage && K.audio.placeStage(p))));
  // where a window sits → its gain and pan (also used by the tests)
  function placeOf(win, view, z) {
    const r = win.getBoundingClientRect(), cx = view.left + view.width / 2, cy = view.top + view.height / 2, R = Math.hypot(view.width, view.height) / 2;
    const wx = r.left + r.width / 2, wy = r.top + r.height / 2, u = Math.hypot(wx - cx, wy - cy) / (R || 1);
    const near = 1 - (1 - FLOOR) * smooth(0.35, 1.4, u), zoom = z >= 1 ? 1 : clamp(0.15 + 0.85 * Math.pow(z, 1.2), 0.15, 1);
    return { gain: near * zoom, pan: clamp((wx - cx) / ((view.width / 2) || 1), -1, 1) * 0.6, u, zoom };
  }
  function set(port, g, p) { const t = K.audio.ctx.currentTime; port.place.gain.setTargetAtTime(g, t, 0.08); if (port.pan && port.pan.set) port.pan.set(p); }
  function step() {
    if (!K || !K.audio || !K.audio.ctx || doc.hidden) return;
    const WM = global.CanvasWM, host = WM && (WM.canvas || doc.getElementById('canvas')); if (!host) return;
    const view = host.getBoundingClientRect(), z = (WM.view && WM.view.z) || 1;
    const wins = Array.from(doc.querySelectorAll('.wm-win[data-instance]')).map(w => [w, w.dataset.instance]).filter(([, id]) => isSource(id));
    const placed = wins.map(([w, id]) => [id, w.classList.contains('collapsed') || !w.offsetParent ? { gain: FLOOR, pan: 0 } : placeOf(w, view, z)]);   // every read first
    placed.forEach(([id, pl]) => outs(id, true).forEach(p => set(p, pl.gain, pl.pan)));
  }
  function rest() { if (!K || !K.audio || !K.registry) return; K.registry.list().forEach(r => outs(r.instance_id).forEach(p => set(p, 1, 0))); }
  function run() { clearInterval(timer); timer = 0; if (on) { step(); timer = setInterval(step, 80); } else rest(); }
  const Proximity = {
    init(kernel) { K = kernel; run(); return Proximity; },
    get on() { return on; },
    set(v) { on = !!v; try { global.localStorage.setItem('eravos.place', on ? '1' : '0'); } catch (e) {} run(); say(); },
    step, placeOf, FLOOR,
  };
  global.Proximity = Proximity;
  // 3.110 a section of ⚙ Settings: Sound (it was a switch in the ⋯ Options dropdown)
  let btn = null; const say = () => { if (btn && btn.set) btn.set(on); };
  function optionButton() {
    if (!global.AppSettings || !global.UIKit) return false; if (optionButton.done) return true; optionButton.done = true;
    global.AppSettings.addSection({ id: 'sound', label: 'Sound', order: 30, make: () => {
      const UI = global.UIKit, h = UI.h;
      btn = UI.Toggle({ label: 'Hear by place', value: on, hint: 'a tool is as loud as its window is near the middle of your view', onChange: (v) => Proximity.set(v) });
      return h('div', { class: 'as-card' }, [h('div', { class: 'as-row' }, [btn.el, h('p', { class: 'as-say', text: 'A tool is as loud as its window is near the middle of your view, and pans with where it sits; zooming out makes everything quieter. Effects follow what feeds them. Off: every tool at its own level.' })])]);
    } });
    return true;
  }
  const boot = () => { if (global.Kernel && global.Kernel.audio && global.Kernel.audio.ctx !== undefined) Proximity.init(global.Kernel); if (!optionButton() || !K) setTimeout(boot, 500); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);

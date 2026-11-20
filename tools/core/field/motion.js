/* ERAVOS core — field/motion.js → window.FieldMotion (2026-11-20). Domain-free: it names no domain, tool or topic (tests/boundary.test.js).
 * His words (2026-11-20): "What about animated transition for the dynamic canvas changing. Like opening the field dynamically changes the ui.
 * Animated and beautiful." · "I like that. But do that with the workshop as well. It's supposed to be the same thing"
 * ONE motion for everything that opens over the canvas — the Field board (board.js) and the Workshop (field.js) — never copied (axiom 2).
 * Every move is a Web Animation: seekable (a recording steps it frame by frame) and the same live. Reduced motion (the system's setting) or
 * window.ERAVOS_NO_MOTION (the in-page tests) → the end state at once.
 *   FieldMotion.A(el, keyframes, timing) → Animation (fill 'both' unless said) · .EASE · .still() · .finite(anim)
 *   FieldMotion.scene(keep, k) → [Animation]   the bar slides away, the canvas takes the screen, every window but `keep` (and the cables, the
 *                                               dock) softens back · FieldMotion.unscene(anims, k, delay) → the same coming back
 *   FieldMotion.glide(view, ms) → Promise       the canvas camera glides to { x, y, z }, then the view is the canvas's own again
 *   FieldMotion.origin(el?) → rect              where a thing that opens comes from: el, else the last place he pressed (within 4 s), else the
 *                                               focused window, else the middle of the screen
 *   FieldMotion.enterApp(root, parts, o) / leaveApp(root, parts, o)   a full-screen app assembled from the origin: each part flies out of it
 *                                               to its place (o.core blooms last); leaving, each flies home into it and the canvas comes back */
(function (global) {
  'use strict';
  const doc = global.document;
  const still = () => !!(global.ERAVOS_NO_MOTION || (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const A = (el, kf, o) => (el && el.animate) ? el.animate(kf, Object.assign({ fill: 'both' }, o)) : null;
  const finite = (a) => { try { return isFinite(a.effect.getComputedTiming().endTime); } catch (e) { return false; } };
  const EASE = { glide: 'cubic-bezier(.65,0,.35,1)', out: 'cubic-bezier(.16,1,.3,1)', land: 'cubic-bezier(.22,1.12,.36,1)', in: 'cubic-bezier(.55,0,.75,.1)', away: 'cubic-bezier(.6,0,.2,1)' };
  const WM = () => global.CanvasWM;

  function scene(keep, k) {   // everything but `keep`: the bar, the canvas edge, the other windows, the cables, the dock
    const wm = WM(), out = [], T = (ms) => ms * k, bar = doc.getElementById('topbar'), cv = wm && wm.canvas;
    if (bar) out.push(A(bar, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: T(650), easing: EASE.away }));
    if (cv && cv.id === 'canvas') { const top = getComputedStyle(cv).top; out.push(A(cv, [{ top }, { top: '0px' }], { duration: T(650), easing: EASE.away })); }
    if (wm && wm.world) [].slice.call(wm.world.querySelectorAll('.wm-win')).filter(w => w !== keep).concat([].slice.call(wm.world.querySelectorAll('svg.wires')), [doc.getElementById('dock')]).filter(Boolean)
      .forEach((el, i) => out.push(A(el, [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(10px)' }], { duration: T(700), delay: T(Math.min(i, 8) * 25), easing: EASE.away })));
    return out.filter(Boolean);
  }
  function unscene(anims, k, delay) {   // the same, coming back (a delay, not a timer: seekable)
    return (anims || []).map(a => {
      const el = a.effect && a.effect.target, kf = a.effect ? a.effect.getKeyframes().reverse().map(f => { const o = Object.assign({}, f); delete o.offset; delete o.computedOffset; delete o.composite; return o; }) : null;
      const t = a.effect ? a.effect.getTiming() : {}; a.cancel();
      return el && kf ? A(el, kf, { duration: k * (+t.duration || 650), delay: k * (delay || 0), easing: EASE.out }) : null; }).filter(Boolean);
  }
  function glide(view, ms) {
    const wm = WM(); if (!wm || !wm.world) return Promise.resolve();
    const from = wm.world.style.transform || `translate(${wm.view.x}px, ${wm.view.y}px) scale(${wm.view.z})`, to = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    const a = ms ? A(wm.world, [{ transform: from }, { transform: to }], { duration: ms, easing: EASE.glide, fill: 'forwards' }) : null;
    const done = () => { wm.view = { x: view.x, y: view.y, z: view.z }; wm.applyView(); if (a) a.cancel(); };
    return a ? a.finished.then(done, done) : (done(), Promise.resolve());
  }
  // where he last pressed: a thing that opens grows out of what he touched
  let press = null;
  if (doc) doc.addEventListener('pointerdown', (e) => { const t = e.target && e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
    press = { at: Date.now(), r: t && t.width && t.width < 600 && t.height < 400 ? t : { left: e.clientX - 20, top: e.clientY - 12, width: 40, height: 24 } }; }, true);
  function origin(el) {
    if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); if (r.width || r.height) return r; }
    if (press && Date.now() - press.at < 4000) return press.r;
    const wm = WM(), w = wm && wm.focused && wm.windowOf && wm.windowOf(wm.focused); if (w) { const r = w.getBoundingClientRect(); if (r.width) return r; }
    return { left: global.innerWidth / 2 - 40, top: global.innerHeight / 2 - 24, width: 80, height: 48 };
  }
  // a full-screen app assembled out of where it came from
  function enterApp(root, parts, o) {
    o = o || {}; const k = still() ? 0 : 1, T = (ms) => ms * k, from = origin(o.from), fc = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    if (!k) return { sceneAnims: [], done: Promise.resolve(true), from };   // no motion: as it always was
    const sceneAnims = scene(null, k);
    const bg = getComputedStyle(root).backgroundColor;
    A(root, [{ backgroundColor: 'rgba(3,5,8,0)' }, { backgroundColor: bg }], { duration: T(700), delay: T(150), easing: EASE.away });
    const list = parts.filter(Boolean).map(p => ({ p, r: p.getBoundingClientRect() })).filter(x => x.r.width && x.r.height);
    list.sort((a, b) => (a.p === o.core) - (b.p === o.core) || Math.hypot(a.r.left + a.r.width / 2 - fc.x, a.r.top + a.r.height / 2 - fc.y) - Math.hypot(b.r.left + b.r.width / 2 - fc.x, b.r.top + b.r.height / 2 - fc.y));
    list.forEach(({ p, r }, n) => {
      const core = p === o.core, s = Math.max(0.06, Math.min(1, from.width / r.width, from.height / r.height)), dx = from.left - r.left, dy = from.top - r.top, d = T(380 + n * 70);
      p.style.transformOrigin = '0 0';
      if (core) A(p, [{ opacity: 0, transform: 'scale(.94)', filter: 'brightness(1.8) drop-shadow(0 0 0 rgba(0,212,255,0))', transformOrigin: '50% 50%' },
        { opacity: 1, transform: 'scale(1.012)', filter: 'brightness(1.25) drop-shadow(0 0 30px rgba(0,212,255,.35))', offset: 0.6, transformOrigin: '50% 50%' },
        { opacity: 1, transform: 'scale(1)', filter: 'brightness(1) drop-shadow(0 0 0 rgba(0,212,255,0))', transformOrigin: '50% 50%' }], { duration: T(1100), delay: T(380 + list.length * 70), easing: EASE.out });
      else A(p, [{ opacity: 0, transform: `translate(${dx}px,${dy}px) scale(${s})`, boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 0, easing: EASE.out },
        { opacity: 1, transform: `translate(${dx * 0.12}px,${dy * 0.12 - 10}px) scale(${0.96 + s * 0.04})`, boxShadow: '0 22px 48px -12px rgba(0,0,0,.9)', offset: 0.55, easing: EASE.land },
        { opacity: 1, transform: 'translate(0px,0px) scale(1)', boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 1 }], { duration: T(1250), delay: d });
    });
    const anims = root.getAnimations({ subtree: true }).filter(finite);
    const done = Promise.all(anims.map(a => a.finished)).then(() => { list.forEach(({ p }) => { p.style.transformOrigin = ''; }); anims.forEach(a => { try { a.cancel(); } catch (e) {} }); return true; }, () => true);
    return { sceneAnims, done, from };
  }
  function leaveApp(root, parts, o) {   // → a promise; root is the caller's to remove after
    o = o || {}; const k = still() ? 0 : 1, T = (ms) => ms * k, from = o.from || origin();
    root.getAnimations({ subtree: true }).filter(finite).forEach(a => { try { a.finish(); } catch (e) {} });
    const list = parts.filter(Boolean).map(p => ({ p, r: p.getBoundingClientRect() })).filter(x => x.r.width && x.r.height);
    const fl = list.map(({ p, r }, n) => { const s = Math.max(0.06, Math.min(1, from.width / r.width, from.height / r.height)), dx = from.left - r.left, dy = from.top - r.top; p.style.transformOrigin = '0 0';
      return A(p, [{ opacity: 1, transform: 'translate(0px,0px) scale(1)' }, { opacity: 1, transform: `translate(${dx * 0.1}px,${dy * 0.1 - 8}px) scale(.98)`, offset: 0.3 }, { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(${s})` }],
        { duration: T(820), delay: T((list.length - n) * 40), easing: EASE.glide, fill: 'forwards' }); }).filter(Boolean);
    const bg = getComputedStyle(root).backgroundColor;
    const fade = A(root, [{ backgroundColor: bg }, { backgroundColor: 'rgba(3,5,8,0)' }], { duration: T(600), delay: T(350), easing: EASE.in, fill: 'forwards' });
    const back = unscene(o.sceneAnims, k, 520);
    const end = () => { back.forEach(a => { try { a.cancel(); } catch (e) {} }); return true; };   // the canvas is its own again
    return Promise.all(fl.concat([fade], back).filter(Boolean).map(a => a.finished)).then(end, end);
  }
  global.FieldMotion = { A, EASE, still, finite, scene, unscene, glide, origin, enterApp, leaveApp };
})(window);

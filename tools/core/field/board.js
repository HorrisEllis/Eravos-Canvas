/* ERAVOS core — field/board.js → window.FieldBoard (2026-11-20; specs/eravos.compat-graph.spec ADDENDUM 2026-11-20 (5)). Domain-free: it names no
 * domain, tool or topic (tests/boundary.test.js scans it).
 * His words (2026-11-20): "okay now let me edit and change the wobble base. also i feel it should be a canvas in itself. so i can scroll around"
 * A tool EXPLODED ON THE CANVAS: its live window's parts (cards, controls) lifted out of the window into a board — each in its gate frame, labelled,
 * wired to the tool's core — on the canvas itself (the world: pan, zoom, scroll as everywhere). The parts are the tool's own live DOM, moved, not
 * copied: every control and drawn surface still works and edits the tool. Assemble puts every part back where it was.
 * A tool offers this by defining its board (its own content: e.g. <tool>.board.js, files.extra in tool.json):
 *   FieldBoard.define(toolId, { title, size: [w, h], header, core, legend (markup), pieces: [{ id, take, x, y, w, frame, col, dash, to, label: { x, y, text, status } }],
 *                                more: [ … the same, without frame / to: placed under the board ] })
 *     take: { title } a card or group by its title · { keys: [...] } controls by their data-key · { sel } a selector — inside the tool's window
 *   FieldBoard.explode(instanceId, toolId) · FieldBoard.assemble(instanceId) · FieldBoard.isOpen(instanceId) · FieldBoard.has(toolId)
 * Moving a gate: drag its label (kept per tool on this device). Put back: right-click the board, or the window's menu. */
(function (global) {
  'use strict';
  const boards = new Map(), open = new Map(), NS = 'http://www.w3.org/2000/svg';
  const WM = () => global.CanvasWM, h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const moved = (toolId) => { try { return JSON.parse(localStorage.getItem('eravos.fieldboard.' + toolId) || '{}') || {}; } catch (e) { return {}; } };
  const keepMoved = (toolId, m) => { try { localStorage.setItem('eravos.fieldboard.' + toolId, JSON.stringify(m)); } catch (e) {} };

  function define(toolId, layout) { boards.set(toolId, layout); }
  function has(toolId) { return boards.has(toolId); }
  function isOpen(instanceId) { return open.has(instanceId); }
  function partsOf(root, take) {
    if (take.title) { const t = [].slice.call(root.querySelectorAll('.uk-group-title')).find(x => x.textContent.trim() === take.title); return t ? [t.parentElement] : []; }
    if (take.keys) return take.keys.map(k => root.querySelector('[data-key="' + k + '"]')).filter(Boolean);
    if (take.sel) { const e = root.querySelector(take.sel); return e ? [e] : []; }
    return [];
  }
  const union = (rs) => rs.reduce((u, r) => u ? { left: Math.min(u.left, r.left), top: Math.min(u.top, r.top), right: Math.max(u.right, r.right), bottom: Math.max(u.bottom, r.bottom) } : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }, null);

  // ---- MOTION (2026-11-20, his words: "What about animated transition for the dynamic canvas changing. Like opening the field dynamically changes
  // the ui. Animated and beautiful."). Every move is a Web Animation — seekable (a recording can step it frame by frame) and the same live. The scene:
  // the bar slides away and the canvas takes the whole screen, every other window softens back, the camera glides to frame the board, the tool's
  // frame dissolves while its parts lift off it and fly to their places (nearest the core first, settling as they land), the core blooms, each
  // wire draws itself into it, the labels, header and legend come up. Put back: the same, in reverse. Reduced motion: the end state at once.
  const reduced = () => !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const A = (el, kf, o) => (el && el.animate) ? el.animate(kf, Object.assign({ fill: 'both' }, o)) : null;
  const finite = (a) => { try { return isFinite(a.effect.getComputedTiming().endTime); } catch (e) { return false; } };   // the live face may run endless CSS animations of its own
  const EASE = { glide: 'cubic-bezier(.65,0,.35,1)', out: 'cubic-bezier(.16,1,.3,1)', land: 'cubic-bezier(.22,1.12,.36,1)', in: 'cubic-bezier(.55,0,.75,.1)', away: 'cubic-bezier(.6,0,.2,1)' };
  function scene(win, on, k) {   // everything but the tool: the bar, the canvas edge, the other windows, the cables, the dock
    const wm = WM(), out = [], T = (ms) => ms * k, bar = document.getElementById('topbar'), cv = wm.canvas;
    if (bar) out.push(A(bar, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: T(650), easing: EASE.away }));
    if (cv && cv.id === 'canvas') { const top = getComputedStyle(cv).top; out.push(A(cv, [{ top }, { top: '0px' }], { duration: T(650), easing: EASE.away })); }
    [].slice.call(wm.world.querySelectorAll('.wm-win')).filter(w => w !== win).concat([].slice.call(wm.world.querySelectorAll('svg.wires')), [document.getElementById('dock')]).filter(Boolean)
      .forEach((el, i) => out.push(A(el, [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(10px)' }], { duration: T(700), delay: T(Math.min(i, 8) * 25), easing: EASE.away })));
    return out.filter(Boolean);
  }
  function glideTo(view, ms) {   // the camera moves as one smooth glide, then the view is the canvas's own again
    const wm = WM(); if (!wm || !wm.world) return Promise.resolve();
    const from = wm.world.style.transform || `translate(${wm.view.x}px, ${wm.view.y}px) scale(${wm.view.z})`, to = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    const a = A(wm.world, [{ transform: from }, { transform: to }], { duration: ms, easing: EASE.glide, fill: 'forwards' });
    const done = () => { wm.view = { x: view.x, y: view.y, z: view.z }; wm.applyView(); if (a) a.cancel(); };
    return a ? a.finished.then(done, done) : (done(), Promise.resolve());
  }
  function fitView(board) {   // the whole screen (the bar is going away) looks at the board
    const wm = WM(), cv = wm && wm.canvas; if (!cv) return null;
    const r = cv.getBoundingClientRect(), Wd = cv.id === 'canvas' ? global.innerWidth : r.width, Hd = cv.id === 'canvas' ? global.innerHeight : r.height; if (!Wd) return null;
    const W = board.offsetWidth, Hh = Math.min(board.offsetHeight, 1340), z = Math.max(0.2, Math.min(1, (Wd - 40) / W, (Hd - 40) / Hh));
    return { z, x: (Wd - W * z) / 2 - board.offsetLeft * z, y: 20 - board.offsetTop * z };
  }

  function explode(instanceId, toolId) {
    const L = boards.get(toolId), wm = WM(), win = wm && wm.windowOf(instanceId); if (!L || !win || open.has(instanceId)) return null;
    const k = reduced() ? 0 : 1, T = (ms) => ms * k;
    const z = (wm.view && wm.view.z) || 1, bx = win.offsetLeft, by = win.offsetTop, user = moved(toolId), before = Object.assign({}, wm.view);
    const all = L.pieces.concat(L.more || []), H = Math.max(L.size[1], ...all.map(p => p.y + 340));
    const board = h('div', 'fb-board'); board.dataset.instance = instanceId; board.style.cssText = 'left:' + bx + 'px;top:' + by + 'px;width:' + L.size[0] + 'px;height:' + H + 'px;z-index:' + (1e6);   // above every window: the parts leave the window over it
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fb-wires'); svg.setAttribute('width', L.size[0]); svg.setAttribute('height', H); board.appendChild(svg);
    const head = h('div', 'fb-head', L.header || ''); board.appendChild(head);
    const core = h('div', 'fb-core', L.core || ''); board.appendChild(core);
    const legend = L.legend ? h('div', 'fb-legend', L.legend) : null; if (legend) board.appendChild(legend);
    let since = null; if (L.more && L.more.length) { since = h('div', 'fb-since'); since.textContent = 'SINCE THIS BOARD — what ' + (L.title || 'the tool') + ' has grown, every part live'; since.style.cssText = 'left:34px;top:' + (Math.min(...L.more.map(p => p.y)) - 52) + 'px'; board.appendChild(since); }
    wm.world.appendChild(board);
    const wr = wm.world.getBoundingClientRect(), toWorld = (r) => ({ x: (r.left - wr.left) / z, y: (r.top - wr.top) / z });
    const took = [], gates = [], missing = [];
    // where every part is in the window, measured BEFORE any leaves (each that leaves reflows the window under the rest)
    const wrW = win.getBoundingClientRect();
    const found = all.map(p => { const parts = partsOf(win, p.take), rs = parts.map(e => e.getBoundingClientRect()).filter(r => r.width || r.height);
      // a part hidden in the window (behind its More depth) has no place on screen: it rises out of the window's foot, fading in
      return { p, parts, was: rs.length ? union(rs) : parts.length ? { left: wrW.left + wrW.width / 2 - 120, top: wrW.bottom - 60, right: 0, bottom: 0, hidden: true } : null }; });
    found.forEach(({ p, parts, was }, i) => {
      if (!parts.length) { missing.push(p.id); return; }
      const at = user[p.id] || { x: p.x, y: p.y }, g = h('div', 'fb-gate' + (p.dash ? ' dash' : '')); g.dataset.piece = p.id; g.style.setProperty('--c', p.col);
      g.style.cssText += ';left:' + (at.x - 6) + 'px;top:' + (at.y - 6) + 'px;min-width:' + ((p.frame ? p.frame[2] : p.w + 12)) + 'px';
      const lab = h('div', 'fb-lab', esc(p.label.text) + ' &#160;<span>' + esc(p.label.status) + '</span>'); lab.style.color = p.col; g.appendChild(lab);
      const inner = h('div', 'fb-inner' + (p.take.keys ? ' row' : '')); if (!p.take.keys && p.w) inner.style.width = p.w + 'px'; g.appendChild(inner);
      parts.forEach(e => { const ph = document.createComment('field-board'); e.parentNode.insertBefore(ph, e); took.push({ e, ph, hidden: e.hidden, display: e.style.display }); e.hidden = false; if (e.style.display === 'none') e.style.display = ''; inner.appendChild(e); });
      board.appendChild(g); gates.push({ p, g, lab, was, wasW: was && toWorld(was), i });
      drag(lab, g, p, toolId, instanceId);
    });
    // a live part can be taller than the picture on the board it replaces: a gate that would cover the one under it pushes that one down
    // (only the board's own places — a gate he moved stays where he put it)
    const placed = gates.filter(x => !user[x.p.id]).sort((a, b) => a.g.offsetTop - b.g.offsetTop);
    placed.forEach((x, i) => { const r = { l: x.g.offsetLeft, t: x.g.offsetTop, r: x.g.offsetLeft + x.g.offsetWidth, b: x.g.offsetTop + x.g.offsetHeight };
      placed.slice(i + 1).forEach(y => { const o = { l: y.g.offsetLeft, r: y.g.offsetLeft + y.g.offsetWidth }; if (o.l < r.r && o.r > r.l && y.g.offsetTop < r.b + 26 && y.g.offsetTop >= r.t) { y.g.style.top = (r.b + 26) + 'px'; y.pushed = true; } }); });
    win.classList.add('fb-away');
    const st = { board, took, gates, win, toolId, L, svg, core, head, legend, since, missing, before, k, anims: {} };
    open.set(instanceId, st);
    wires(st);
    // ---- the scene
    st.anims.scene = scene(win, true, k);
    st.anims.win = A(win, [{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }, { opacity: 0, transform: 'scale(.985)', filter: 'blur(3px)' }], { duration: T(700), delay: T(250), easing: EASE.in, fill: 'forwards' });
    const cc = { x: core.offsetLeft + core.offsetWidth / 2, y: core.offsetTop + core.offsetHeight / 2 };
    const order = gates.slice().sort((a, b) => Math.hypot(a.g.offsetLeft - cc.x, a.g.offsetTop - cc.y) - Math.hypot(b.g.offsetLeft - cc.x, b.g.offsetTop - cc.y));
    order.forEach((x, n) => {
      const now = x.g.getBoundingClientRect(), dx = x.was ? (x.was.left - now.left) / z : 0, dy = x.was ? (x.was.top - now.top) / z : 0, d = T(600 + n * 38);
      if (x.was && x.was.hidden) A(x.g, [{ opacity: 0 }, { opacity: 1 }], { duration: T(700), delay: d, easing: 'ease-out' });
      A(x.g, [{ transform: `translate(${dx}px,${dy}px) scale(1)`, boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 0, easing: EASE.out },
        { transform: `translate(${dx}px,${dy - 16}px) scale(1.035)`, boxShadow: '0 22px 48px -12px rgba(0,0,0,.9)', offset: 0.18, easing: EASE.land },
        { transform: 'translate(0px,0px) scale(1)', boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 1 }], { duration: T(1500), delay: d });
      A(x.g, [{ borderColor: 'transparent' }, { borderColor: getComputedStyle(x.g).borderColor }], { duration: T(600), delay: d + T(1100), composite: 'replace' });
      A(x.lab, [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: T(520), delay: T(2150) + T(n * 22), easing: EASE.out });
    });
    A(core, [{ opacity: 0, transform: 'scale(.8)', filter: 'drop-shadow(0 0 0 rgba(255,34,102,0))' }, { opacity: 1, transform: 'scale(1.035)', filter: 'drop-shadow(0 0 34px rgba(255,34,102,.55))', offset: 0.6 },
      { opacity: 1, transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(255,34,102,0))' }], { duration: T(1150), delay: T(1500), easing: EASE.out });
    A(head, [{ opacity: 0, transform: 'translateY(-18px)' }, { opacity: 1, transform: 'none' }], { duration: T(800), delay: T(1750), easing: EASE.out });
    [legend, since].filter(Boolean).forEach(el => A(el, [{ opacity: 0 }, { opacity: 1 }], { duration: T(900), delay: T(2500), easing: 'ease-out' }));
    drawWires(st, T(1900));
    const view = fitView(board), cam = view ? glideTo(view, T(1300)) : Promise.resolve();
    board.addEventListener('contextmenu', (e) => { if (e.target.closest('.fb-inner')) return; e.preventDefault(); e.stopPropagation(); const CM = global.ContextMenu;
      if (CM && CM.show) CM.show(e.clientX, e.clientY, [{ label: '◱ Put it back together', hint: 'every part back into its window (Esc)', run: () => assemble(instanceId) },
        { label: '↺ Gates back to the board', hint: 'undo your moves of the gates', run: () => { keepMoved(toolId, {}); assemble(instanceId, { now: true }); explode(instanceId, toolId); } }], (L.title || 'the tool') + ' · exploded'); else assemble(instanceId); });
    st.onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented && open.get(instanceId) === st && !st.leaving) assemble(instanceId); };
    document.addEventListener('keydown', st.onKey);
    if (global.Shell && global.Shell.toast && k) setTimeout(() => { if (open.get(instanceId) === st) global.Shell.toast('Esc or right-click — put it back together'); }, 3400);
    st.done = Promise.all(board.getAnimations({ subtree: true }).filter(finite).map(a => a.finished).concat([cam])).then(() => true, () => true);
    return { pieces: gates.length, missing, done: st.done };
  }
  function drawWires(st, delay) {   // each wire draws itself from its part into the core; its two ends come up with it
    const paths = [].slice.call(st.svg.querySelectorAll('path')), dots = [].slice.call(st.svg.querySelectorAll('circle'));
    paths.forEach((pa, n) => {
      const d = delay + st.k * n * 30;
      if (pa.getAttribute('stroke-dasharray')) { A(pa, [{ opacity: 0 }, { opacity: 1 }], { duration: st.k * 900, delay: d, easing: 'ease-out' }); return; }
      let len = 0; try { len = pa.getTotalLength(); } catch (e) {} if (!len) return;
      A(pa, [{ strokeDasharray: len + ' ' + len, strokeDashoffset: len }, { strokeDasharray: len + ' ' + len, strokeDashoffset: 0 }], { duration: st.k * 900, delay: d, easing: EASE.glide });
    });
    dots.forEach((c, n) => A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: st.k * 400, delay: delay + st.k * (Math.floor(n / 2) * 30 + (n % 2 ? 800 : 0)), easing: 'ease-out' }));
  }
  function wires(st) {
    const { svg, gates, core, board } = st; while (svg.firstChild) svg.removeChild(svg.firstChild);
    const C = { x: core.offsetLeft, y: core.offsetTop, w: core.offsetWidth, h: core.offsetHeight };
    gates.forEach(({ p, g }, k) => {
      const r = { x: g.offsetLeft, y: g.offsetTop, w: g.offsetWidth, h: g.offsetHeight }, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const to = p.to && !st.dragged ? { x: p.to[0], y: p.to[1] } : null; let x1, y1, x2, y2, vert;   // to: the board's own point on the core
      if (r.y + r.h < C.y) { x1 = cx; y1 = r.y + r.h; vert = true; x2 = Math.max(C.x + 10, Math.min(C.x + C.w - 10, cx)); y2 = C.y; }
      else if (r.y > C.y + C.h) { x1 = cx; y1 = r.y; vert = true; x2 = Math.max(C.x + 10, Math.min(C.x + C.w - 10, cx)); y2 = C.y + C.h; }
      else if (r.x + r.w < C.x) { x1 = r.x + r.w; y1 = cy; vert = false; x2 = C.x; y2 = Math.max(C.y + 10, Math.min(C.y + C.h - 10, cy)); }
      else { x1 = r.x; y1 = cy; vert = false; x2 = C.x + C.w; y2 = Math.max(C.y + 10, Math.min(C.y + C.h - 10, cy)); }
      if (to) { x2 = to.x; y2 = to.y; }   // the board's own point on the core, until a gate is moved
      const d = vert ? `M${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}` : `M${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
      const pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', d); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke', p.col); pa.setAttribute('stroke-opacity', '0.75'); pa.setAttribute('stroke-width', '1.6');
      if (p.dash) pa.setAttribute('stroke-dasharray', '6 4'); svg.appendChild(pa);
      const a = document.createElementNS(NS, 'circle'); a.setAttribute('cx', x1); a.setAttribute('cy', y1); a.setAttribute('r', 4); a.setAttribute('fill', '#04070C'); a.setAttribute('stroke', p.col); a.setAttribute('stroke-width', '1.6'); svg.appendChild(a);
      const b = document.createElementNS(NS, 'circle'); b.setAttribute('cx', x2); b.setAttribute('cy', y2); b.setAttribute('r', 3); b.setAttribute('fill', p.col); svg.appendChild(b);
    });
  }
  function drag(lab, g, p, toolId, instanceId) {   // move a gate by its label; the wires follow; kept per tool
    let s = null;
    lab.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); s = { x: e.clientX, y: e.clientY, l: g.offsetLeft, t: g.offsetTop }; g.classList.add('lifting'); try { lab.setPointerCapture(e.pointerId); } catch (_) {} });
    lab.addEventListener('pointermove', (e) => { if (!s) return; const z = (WM().view && WM().view.z) || 1; g.style.left = (s.l + (e.clientX - s.x) / z) + 'px'; g.style.top = (s.t + (e.clientY - s.y) / z) + 'px'; const st = open.get(instanceId); if (st) { st.dragged = true; wires(st); } });
    const end = () => { if (!s) return; s = null; g.classList.remove('lifting'); const m = moved(toolId); m[p.id] = { x: g.offsetLeft + 6, y: g.offsetTop + 6 }; keepMoved(toolId, m); };
    lab.addEventListener('pointerup', end); lab.addEventListener('pointercancel', end);
  }
  function assemble(instanceId, o) {   // → a promise: true once every part is back in its window
    const st = open.get(instanceId); if (!st) return Promise.resolve(false);
    if (st.leaving) return st.leaving;
    const now = (o && o.now) || reduced() || !st.k, T = (ms) => now ? 0 : ms, wm = WM();
    document.removeEventListener('keydown', st.onKey);
    const finish = () => {
      st.took.slice().reverse().forEach(({ e, ph, hidden, display }) => { if (ph.parentNode) { ph.parentNode.insertBefore(e, ph); ph.remove(); } e.hidden = hidden; e.style.display = display; });
      st.board.remove(); st.win.classList.remove('fb-away'); open.delete(instanceId);
      [st.anims.win].concat(st.anims.scene || []).forEach(a => { if (a) a.cancel(); });
      return true;
    };
    if (now) { const r = finish(); if (wm && wm.applyView) { wm.view = Object.assign({}, st.before); wm.applyView(); } st.leaving = Promise.resolve(r); return st.leaving; }
    st.board.getAnimations({ subtree: true }).filter(finite).forEach(a => a.finish());   // whatever is still landing, landed
    // the late things go first, then every part flies back into the window as it re-forms, the rest of the canvas returns, the camera glides home
    const late = [].slice.call(st.svg.children).concat([st.core, st.head, st.legend, st.since], st.gates.map(x => x.lab)).filter(Boolean);
    late.forEach(el => A(el, [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: T(320), easing: 'ease-in', fill: 'forwards' }));
    const z = (wm.view && wm.view.z) || 1;
    const flights = st.gates.map((x, n) => {
      const to = x.wasW || { x: st.board.offsetLeft + x.g.offsetLeft, y: st.board.offsetTop + x.g.offsetTop };
      const dx = to.x - (st.board.offsetLeft + x.g.offsetLeft) - 6, dy = to.y - (st.board.offsetTop + x.g.offsetTop) - 6;
      return A(x.g, [{ transform: 'translate(0px,0px) scale(1)', borderColor: getComputedStyle(x.g).borderColor },
        { transform: `translate(${dx}px,${dy - 12}px) scale(1.02)`, offset: 0.82 }, { transform: `translate(${dx}px,${dy}px) scale(1)`, borderColor: 'transparent' }],
        { duration: T(1050), delay: T(220 + (st.gates.length - n) * 18), easing: EASE.glide, fill: 'forwards' });
    }).filter(Boolean);
    if (st.anims.win) { st.anims.win.cancel(); st.anims.win = A(st.win, [{ opacity: 0, transform: 'scale(.985)', filter: 'blur(3px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }], { duration: T(520), delay: T(1050), easing: EASE.out, fill: 'forwards' }); }
    st.anims.scene = (st.anims.scene || []).map(a => {   // the bar, the canvas edge and the other windows come back (seekable: a delay, not a timer)
      const el = a.effect && a.effect.target, kf = a.effect ? a.effect.getKeyframes().reverse().map(f => { const o = Object.assign({}, f); delete o.offset; delete o.computedOffset; delete o.composite; return o; }) : null;
      const t = a.effect ? a.effect.getTiming() : {}; a.cancel();
      return el && kf ? A(el, kf, { duration: T(+t.duration || 650), delay: T(900), easing: EASE.out }) : null; }).filter(Boolean);
    const home = glideTo(st.before, T(1250));
    const winIn = st.anims.win ? st.anims.win.finished : Promise.resolve();
    st.leaving = Promise.all(flights.map(a => a.finished).concat([home, winIn, new Promise(r => setTimeout(r, T(1900)))])).then(finish, finish);
    return st.leaving;
  }
  // the window's menu offers it, for a tool that has a board
  function hook() {
    const CM = global.ContextMenu; if (!CM || !CM.contribute) return false;
    CM.contribute(({ rec }) => !rec || !has(rec.id) ? [] : [isOpen(rec.instanceId)
      ? { label: '◱ Put it back together', hint: 'every part back into its window', run: () => assemble(rec.instanceId) }
      : { label: '✦ Explode on the canvas', hint: 'every part of it apart, wired to its core — all of it still live: play it, turn it, move the pieces', run: () => explode(rec.instanceId, rec.id) }]);
    return true;
  }
  if (!hook()) document.addEventListener('DOMContentLoaded', hook);
  global.FieldBoard = { define, has, explode, assemble, isOpen, boards };
})(window);

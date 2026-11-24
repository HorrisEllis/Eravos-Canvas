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
 * Moving a gate: drag its label (kept per tool on this device). Put back: right-click the board, or the window's menu.
 * SOCKETS AND MUTATION (2026-11-20, his: "okay now i want to be able to mutate, and swap components for the wobble bass."): a tool whose settings
 * say which are sockets (config { socket: name, options: the parts that fit, near?: the key of the tool's own part it stands in for }) and which settings belong to a part (config { part: id | [ids] }) gets,
 * on its board: a ⇄ chip on every gate that holds a socket (swap on the spot), and ⚄ MUTATE under its core — a new combination of parts and their
 * settings, played at once; ✓ KEEP / ✗ THROW (throw = back to before). It learns from each keep and throw (what was kept comes up more often,
 * what was thrown less) and never offers the same combination twice (kept per tool on this device). Each mutation or swap is one undo step. */
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
  // the motion is shared with the Workshop: tools/core/field/motion.js (window.FieldMotion), never copied
  const M = () => global.FieldMotion, reduced = () => M().still(), A = (el, kf, o) => M().A(el, kf, o), finite = (a) => M().finite(a);
  const EASE = new Proxy({}, { get: (t, k) => M().EASE[k] });
  const scene = (win, on, k) => M().scene(win, k), glideTo = (view, ms) => M().glide(view, ms);
  function fitView(board) {   // the whole screen (the bar is going away) looks at the board
    const wm = WM(), cv = wm && wm.canvas; if (!cv) return null;
    const r = cv.getBoundingClientRect(), Wd = cv.id === 'canvas' ? global.innerWidth : r.width, Hd = cv.id === 'canvas' ? global.innerHeight : r.height; if (!Wd) return null;
    const W = board.offsetWidth, Hh = Math.min(board.offsetHeight, 1340), z = Math.max(0.2, Math.min(1, (Wd - 40) / W, (Hd - 40) / Hh));
    return { z, x: (Wd - W * z) / 2 - board.offsetLeft * z, y: 20 - board.offsetTop * z };
  }

  function explode(instanceId, toolId) {
    const wm = WM(), win = wm && wm.windowOf(instanceId); if (!win || open.has(instanceId)) return null;
    const L = boards.get(toolId) || autoLayout(win, rec(instanceId)); if (!L.pieces.length) return null;
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
      if (L.auto && !p.w) p.w = was && !was.hidden ? Math.max(160, Math.min(520, Math.round((was.right - was.left) / z))) : 380;   // as wide as it was in the window
      const at = user[p.id] || { x: p.x, y: p.y }, g = h('div', 'fb-gate' + (p.dash ? ' dash' : '')); g.dataset.piece = p.id; g.style.setProperty('--c', p.col);
      g.style.cssText += ';left:' + (at.x - 6) + 'px;top:' + (at.y - 6) + 'px;min-width:' + ((p.frame ? p.frame[2] : p.w + 12)) + 'px';
      const lab = h('div', 'fb-lab', esc(p.label.text) + ' &#160;<span>' + esc(p.label.status) + '</span>'); lab.style.color = p.col; g.appendChild(lab);
      const inner = h('div', 'fb-inner' + (p.take.keys ? ' row' : '')); if (!p.take.keys && p.w) inner.style.width = p.w + 'px'; g.appendChild(inner);
      parts.forEach(e => { const ph = document.createComment('field-board'); e.parentNode.insertBefore(ph, e); took.push({ e, ph, hidden: e.hidden, display: e.style.display }); e.hidden = false; if (e.style.display === 'none') e.style.display = ''; inner.appendChild(e); });
      board.appendChild(g); gates.push({ p, g, lab, was, wasW: was && toWorld(was), i });
      drag(lab, g, p, toolId, instanceId);
    });
    gates.forEach(x => grab(x, instanceId, toolId));   // 3.211 the whole box: drag it from anywhere on it, Ctrl+click selects
    if (L.auto) { placeAuto({ gates, core, board, svg, head }); gates.forEach(x => { const u = user[x.p.id]; if (u) { x.g.style.left = (u.x - 6) + 'px'; x.g.style.top = (u.y - 6) + 'px'; } }); }   // where he moved a gate wins
    components(instanceId, toolId, gates);   // every component box: a click picks a new one or another tool's
    // (2026-11-20: no ⇄ chips — each component box carries its component as a tile: drag it, ✕ it, drop a new one from the tray)
    // a live part can be taller than the picture on the board it replaces: a gate that would cover the one under it pushes that one down
    // (only the board's own places — a gate he moved stays where he put it)
    const placed = L.auto ? [] : gates.filter(x => !user[x.p.id]).sort((a, b) => a.g.offsetTop - b.g.offsetTop);
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
    mutateDock(instanceId, st, T); tray(instanceId, st, T); fuseTile(instanceId, st);
    const view = fitView(board), cam = view ? glideTo(view, T(1300)) : Promise.resolve();
    board.addEventListener('contextmenu', (e) => { if (e.target.closest('.fb-inner')) return; e.preventDefault(); e.stopPropagation(); const CM = global.ContextMenu;
      const cg = e.target.closest('.fb-gate.fb-comp'), cx = cg && st.gates.find(x => x.g === cg);
      if (sel.size && CM && CM.show) return CM.show(e.clientX, e.clientY, selItems().concat(cx ? [{ sep: true }].concat(partItems(instanceId, cx)) : []), sel.size + ' parts selected');
      if (cx && CM && CM.show) return CM.show(e.clientX, e.clientY, partItems(instanceId, cx), partIn(instanceId, cx).label + ' · a part');
      if (CM && CM.show) CM.show(e.clientX, e.clientY, [{ label: '◱ Put it back together', hint: 'every part back into its window (Esc)', run: () => assemble(instanceId) },
        { label: '↺ Gates back to the board', hint: 'undo your moves of the gates', run: () => { keepMoved(toolId, {}); assemble(instanceId, { now: true }); explode(instanceId, toolId); } }], (L.title || 'the tool') + ' · exploded'); else assemble(instanceId); });
    st.onKey = (e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && sel.size && !(e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable]'))) { e.preventDefault(); removeSel(); return; }
      if (e.key !== 'Escape' || e.defaultPrevented) return; if (sel.size) { e.preventDefault(); clearSel(); return; } if (open.get(instanceId) === st && !st.leaving) assemble(instanceId); };
    board.addEventListener('pointerdown', (e) => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.target.closest('.fb-gate') && sel.size) clearSel(); });
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
      // 2026-11-21 (his: "You make those, like, the wires, too …" · "consistent, and … in relation to the themes"): each wire runs through the
      // theme's three wire colours — from the part into the core — glowing, with light flowing along it into the core
      const gid = 'fbw-' + (st.wid = (st.wid || 0) + 1), gr = document.createElementNS(NS, 'linearGradient');
      [['gradientUnits', 'userSpaceOnUse'], ['x1', x1], ['y1', y1], ['x2', x2], ['y2', y2], ['id', gid]].forEach(([k2, v]) => gr.setAttribute(k2, v));
      [['0', '--wire1', '#00d4ff'], ['0.5', '--wire2', '#b066ff'], ['1', '--wire3', '#ff2266']].forEach(([o, v, f]) => { const sp = document.createElementNS(NS, 'stop'); sp.setAttribute('offset', o); sp.setAttribute('style', 'stop-color:var(' + v + ',' + f + ')'); gr.appendChild(sp); });
      let defs = svg.querySelector('defs'); if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.insertBefore(defs, svg.firstChild); } defs.appendChild(gr);
      const pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', d); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke', 'url(#' + gid + ')'); pa.setAttribute('stroke-opacity', '0.9'); pa.setAttribute('stroke-width', '2');
      pa.setAttribute('class', 'fb-wire'); if (p.dash) pa.setAttribute('stroke-dasharray', '6 4'); svg.appendChild(pa);
      const fl = document.createElementNS(NS, 'path'); fl.setAttribute('d', d); fl.setAttribute('fill', 'none'); fl.setAttribute('stroke', 'url(#' + gid + ')'); fl.setAttribute('stroke-width', '3.2');
      fl.setAttribute('stroke-linecap', 'round'); fl.setAttribute('stroke-dasharray', '2 26'); fl.setAttribute('class', 'fb-flow'); fl.style.animationDelay = (-(k % 7) * 0.17) + 's'; svg.appendChild(fl);
      const a = document.createElementNS(NS, 'circle'); a.setAttribute('cx', x1); a.setAttribute('cy', y1); a.setAttribute('r', 4); a.setAttribute('fill', '#000'); a.setAttribute('stroke', 'var(--wire1, #00d4ff)'); a.setAttribute('stroke-width', '1.6'); a.setAttribute('class', 'fb-end'); svg.appendChild(a);
      const b = document.createElementNS(NS, 'circle'); b.setAttribute('cx', x2); b.setAttribute('cy', y2); b.setAttribute('r', 3.2); b.setAttribute('fill', 'var(--wire3, #ff2266)'); b.setAttribute('class', 'fb-end'); svg.appendChild(b);
    });
  }
  function drag(lab, g, p, toolId, instanceId) {   // move a gate by its label; the wires follow; kept per tool
    let s = null;
    lab.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); s = { x: e.clientX, y: e.clientY, l: g.offsetLeft, t: g.offsetTop }; g.classList.add('lifting'); try { lab.setPointerCapture(e.pointerId); } catch (_) {} });
    lab.addEventListener('pointermove', (e) => { if (!s) return; const z = (WM().view && WM().view.z) || 1; g.style.left = (s.l + (e.clientX - s.x) / z) + 'px'; g.style.top = (s.t + (e.clientY - s.y) / z) + 'px'; const st = open.get(instanceId); if (st) { st.dragged = true; wires(st); } });
    const end = () => { if (!s) return; s = null; g.classList.remove('lifting'); const m = moved(toolId); m[p.id] = { x: g.offsetLeft + 6, y: g.offsetTop + 6 }; keepMoved(toolId, m); };
    lab.addEventListener('pointerup', end); lab.addEventListener('pointercancel', end);
  }
  // ---- 3.211 THE WHOLE BOX (his words, 2026-11-22: "i want to be able to drag any component from the tools, not grabbing a small area but
  // anywhere on the ui of the component when exploded, drag then around. maybe holding control to select multiple parts at a time and right
  // click with a synthesize into one tool"). Press anywhere on a box that is not a control and drag: the box moves (with every selected box
  // when it is selected); let go over another component box and its part goes there (a swap, or it replaces — as the tile does), and the
  // box glides back. Alt drags even from a control. Ctrl+click (anywhere on a box) adds it to the selection, across tools; Esc or a click on
  // the board clears it; right-click → synthesize the selection into one tool, mutate only those parts.
  const LIVE = 'input,select,textarea,button,a,canvas,svg,[contenteditable],[role="slider"],[data-key],.uk-knob,.uk-fader,.uk-keys,.uk-seg,.uk-xy,.uk-toggle,.fb-del,.fb-tile,.fb-lab,.fb-block';
  const sel = new Set();   // { inst, x }
  const selected = () => [...sel];
  function select(inst, x, on) {
    const was = [...sel].find(o => o.x === x); if (on === undefined) on = !was;
    if (on && !was) sel.add({ inst, x }); if (!on && was) sel.delete(was);
    x.g.classList.toggle('fb-sel', !!on); count();
  }
  function clearSel() { sel.forEach(o => o.x.g.classList.remove('fb-sel')); sel.clear(); count(); }
  function count() { const n = sel.size; document.querySelectorAll('.fb-board').forEach(b => { let t = b.querySelector('.fb-selbar'); if (!n) { if (t) t.remove(); return; }
      if (!t) { t = h('div', 'fb-selbar'); b.appendChild(t); } t.textContent = n + ' selected · right-click to synthesize them into one tool · Esc clears'; }); }
  function grab(x, instanceId, toolId) {
    x.g.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); select(instanceId, x); return; }
      if (!e.altKey && e.target.closest(LIVE)) return;
      e.preventDefault(); e.stopPropagation(); lift(e, instanceId, x, toolId);
    }, true);
  }
  function lift(e, instanceId, x, toolId) {
    const z = () => (WM().view && WM().view.z) || 1, group = sel.size && [...sel].some(o => o.x === x) ? [...sel] : [{ inst: instanceId, x }];
    const from = group.map(o => ({ o, l: o.x.g.offsetLeft, t: o.x.g.offsetTop })), x0 = e.clientX, y0 = e.clientY;
    const part = x.g.classList.contains('fb-comp') && group.length === 1 ? partIn(instanceId, x) : null;
    const src = part && !part.empty ? { from: instanceId, x, part: part.part, comp: part.comp, label: part.label } : null;
    let live = false, ok = null, over = null, tag = null;
    const move = (ev) => {
      const dx = (ev.clientX - x0) / z(), dy = (ev.clientY - y0) / z();
      if (!live) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return; live = true; from.forEach(f => f.o.x.g.classList.add('lifting', 'fb-carried'));
        if (src) { ok = targets(src).filter(k => k.o.g !== x); ok.forEach(({ o, patch }) => o.g.g.classList.add(patch ? 'fb-can' : 'fb-cannot')); tag = h('div', 'fb-ghost'); document.body.appendChild(tag); } }
      from.forEach(f => { f.o.x.g.style.left = (f.l + dx) + 'px'; f.o.x.g.style.top = (f.t + dy) + 'px'; });
      [...new Set(from.map(f => f.o.inst))].forEach(i => { const st = open.get(i); if (st) { st.dragged = true; wires(st); } });
      if (src) { const el = document.elementFromPoint(ev.clientX, ev.clientY), g = el && el.closest('.fb-gate.fb-comp'), hit = g && ok.find(k => k.o.g.g === g && k.patch);
        if (over && over !== hit) over.o.g.g.classList.remove('fb-over'); over = hit || null; if (over) over.o.g.g.classList.add('fb-over');
        tag.style.display = over ? '' : 'none'; tag.style.left = (ev.clientX + 14) + 'px'; tag.style.top = (ev.clientY + 12) + 'px'; if (over) tag.textContent = src.label + '  ' + over.verb; }
    };
    const up = () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerup', up, true);
      if (tag) tag.remove(); if (ok) ok.forEach(({ o }) => o.g.g.classList.remove('fb-can', 'fb-cannot', 'fb-over'));
      from.forEach(f => f.o.x.g.classList.remove('lifting', 'fb-carried')); if (!live) return;
      if (over) {   // its part goes there; the box glides home
        drop(src, over); const f = from[0], g = f.o.x.g, l = g.offsetLeft, t = g.offsetTop; g.style.left = f.l + 'px'; g.style.top = f.t + 'px';
        A(g, [{ transform: 'translate(' + (l - f.l) + 'px,' + (t - f.t) + 'px)' }, { transform: 'none' }], { duration: 380, easing: EASE.out, fill: 'none' });
        const st = open.get(f.o.inst); if (st) setTimeout(() => wires(st), 0); return;
      }
      from.forEach(f => { const st = open.get(f.o.inst); if (!st) return; const m = moved(st.toolId); m[f.o.x.p.id] = { x: f.o.x.g.offsetLeft + 6, y: f.o.x.g.offsetTop + 6 }; keepMoved(st.toolId, m); });
    };
    document.addEventListener('pointermove', move, true); document.addEventListener('pointerup', up, true);
  }
  function removeSel() {   // 3.212 his: "also need to be able to remove the component" — Delete on a selection: each part out (empty, or the tool's own)
    selected().filter(o => partIn(o.inst, o.x).clearable).forEach(o => remove(o.inst, o.x)); clearSel();
  }
  function selItems() {
    const list = selected(), comps = list.filter(o => o.x.slot || o.x.socket), out = [];
    if (exchange && exchange.synthesizeParts && comps.some(o => o.x.slot)) out.push({ label: '◆ Synthesize these ' + comps.length + ' parts into one tool', hint: 'each part takes its place in one new tool; the rest from the tool most of them came from — checked: it plays, it is no twin', run: () => synthesizeSel() });
    if (comps.some(o => o.x.socket)) out.push({ label: '⚄ Mutate only these parts', hint: 'another component in each, its own settings fresh — nothing else moves', run: () => comps.filter(o => o.x.socket).forEach(o => mutatePart(o.inst, o.x)) });
    if (comps.some(o => partIn(o.inst, o.x).clearable)) out.push({ label: '✕ Remove these parts', hint: 'Delete — each box empty again, or back to its tool\'s own part', run: () => removeSel() });
    out.push({ label: 'Clear the selection', hint: 'Esc', run: () => clearSel() });
    return out;
  }
  function synthesizeSel() {
    const say = (t2, kind) => { if (global.Shell && global.Shell.toast) global.Shell.toast(t2, kind || '', 4200); };
    const list = selected().filter(o => o.x.slot), insts = [...new Set(list.map(o => o.inst))], last = open.get(insts[insts.length - 1]);
    if (!list.length) return Promise.resolve(null);
    list.forEach(o => o.x.g.classList.add('fb-busy')); say('◆ synthesizing ' + list.length + ' parts into one tool — measuring it against everything…');
    return Promise.resolve(exchange.synthesizeParts(list.map(o => ({ inst: o.inst, slot: o.x.slot })))).then((r) => {
      list.forEach(o => o.x.g.classList.remove('fb-busy')); if (!r || !r.ok) { say('not made — ' + ((r && r.why) || 'it did not build'), 'bad'); return null; }
      const F = global.OrganismFactory, b = last && last.board, x = b ? b.offsetLeft + b.offsetWidth + 120 : 40, y = b ? b.offsetTop : 40, inst = F.spawn(r.id, { x, y });
      say('◆ ' + r.rec.name + ' — a tool of its own (' + r.verdict + (r.near ? ', nearest ' + r.near : '') + ')' + (r.left && r.left.length ? ' · not in the engine yet: ' + r.left.join(', ') : ''), 'good');
      clearSel(); if (inst) setTimeout(() => { if (!open.has(inst)) explode(inst, r.id); }, 700);
      return { inst, id: r.id, rec: r.rec };
    }, (er) => { list.forEach(o => o.x.g.classList.remove('fb-busy')); say('not made — ' + er.message, 'bad'); return null; });
  }
  function assemble(instanceId, o) {   // → a promise: true once every part is back in its window
    const st = open.get(instanceId); if (!st) return Promise.resolve(false);
    [...sel].forEach(o2 => { if (o2.inst === instanceId) { o2.x.g.classList.remove('fb-sel'); sel.delete(o2); } }); count();
    if (st.leaving) return st.leaving;
    const now = (o && o.now) || reduced() || !st.k, T = (ms) => now ? 0 : ms, wm = WM();
    document.removeEventListener('keydown', st.onKey);
    const finish = () => {
      st.took.slice().reverse().forEach(({ e, ph, hidden, display }) => { if (ph.parentNode) { ph.parentNode.insertBefore(e, ph); ph.remove(); } e.hidden = hidden; e.style.display = display; });
      st.gates.forEach(x => { if (x.swap) x.swap.remove(); if (x.block) x.block.remove(); if (x.tile) x.tile.remove(); }); if (st.fuse) st.fuse.remove(); st.board.remove(); st.win.classList.remove('fb-away'); open.delete(instanceId);
      [st.anims.win].concat(st.anims.scene || []).forEach(a => { if (a) a.cancel(); });
      return true;
    };
    if (now) { const r = finish(); if (wm && wm.applyView) { wm.view = Object.assign({}, st.before); wm.applyView(); } st.leaving = Promise.resolve(r); return st.leaving; }
    st.board.getAnimations({ subtree: true }).filter(finite).forEach(a => a.finish());   // whatever is still landing, landed
    // the late things go first, then every part flies back into the window as it re-forms, the rest of the canvas returns, the camera glides home
    const late = [].slice.call(st.svg.children).concat([st.core, st.head, st.legend, st.since, st.dock, st.tray], st.gates.map(x => x.lab)).filter(Boolean);
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
    st.anims.scene = M().unscene(st.anims.scene, 1, 900);   // the bar, the canvas edge and the other windows come back
    const home = glideTo(st.before, T(1250));
    const winIn = st.anims.win ? st.anims.win.finished : Promise.resolve();
    st.leaving = Promise.all(flights.map(a => a.finished).concat([home, winIn, new Promise(r => setTimeout(r, T(1900)))])).then(finish, finish);
    return st.leaving;
  }
  // ---- SOCKETS AND MUTATION (all from the tool's own settings: nothing here knows a part or a tool; the mutation is FieldMutate's, shared)
  const rec = (id) => global.OrganismFactory && global.OrganismFactory.handle(id);
  const cfg = (id) => { const r = rec(id); return (r && r.def && r.def.config) || []; };
  const sockets = (id) => cfg(id).filter(c => c.socket && c.type === 'enum');
  const val = (id, k) => { const r = rec(id); return r && r.ctx && r.ctx.params ? r.ctx.params.get(k) : undefined; };
  const FM = () => global.FieldMutate;

  // ---- COMPONENT BOXES (2026-11-20, his: "when you blow up a tool on the canvas … you click on the component' box and can pick a new one or one
  // from another tool. then uses the ui element for the compoenent as a block"). A gate that holds a component — a socket of the tool's own
  // (config { socket }) or a slot the domain's exchange knows (FieldBoard.setExchange: which parts a tool has, where, what each takes) — opens a
  // picker on a click: SWAP FOR (a new component in its place) · FROM <another tool on the canvas> (that tool's part, its settings carried over).
  // What is picked shows in the box as its block: the component's own controls (the tool's settings that belong to that part). One undo step.
  let exchange = null;
  const setExchange = (x) => { exchange = x; };
  const paramsOf = (id) => { const r = rec(id); try { return (r && r.ctx.serialize().params) || {}; } catch (e) { return {}; } };
  const slotsOf = (id) => { const r = rec(id); return r && exchange && exchange.has(r.id) ? exchange.slots(r.id, paramsOf(id)) : []; };
  function gateFor(gates, find) {
    if (!find) return null;
    for (const k of [].concat(find.near || [])) { const x = gates.find(gg => gg.g.querySelector('[data-key="' + k + '"]')); if (x) return x; }
    if (find.title) { const re = new RegExp(find.title, 'i'); return gates.find(gg => re.test(String((gg.p.take && gg.p.take.title) || '').trim()) || re.test(gg.lab.textContent.trim())) || null; }
    return null;
  }
  function others(id) {   // the other tools on the canvas whose parts the exchange knows
    const r = rec(id), K = r && r.K, list = K && K.registry ? K.registry.list() : [];
    return list.filter(x => x.instance_id !== id && !(x.descriptor && x.descriptor.system) && exchange && exchange.has(x.organism_id)).map(x => ({ id: x.instance_id, label: (x.descriptor && x.descriptor.label) || x.organism_id }));
  }
  function components(id, toolId, gates) {
    const sks = sockets(id), slots = slotsOf(id);
    const holds = (sk) => { const near = (k) => k && gates.find(gg => gg.g.querySelector('[data-key="' + k + '"]')); return near(sk.near) || near(sk.key) || (sk.group && gates.find(gg => String((gg.p.take && gg.p.take.title) || '').toUpperCase().split(/[ —-]/)[0] === String(sk.group).toUpperCase())); };
    gates.forEach(x => { x.socket = null; x.slot = null; });
    sks.forEach(sk => { const x = holds(sk); if (x && !x.socket) x.socket = sk; });
    slots.forEach(sl => { const x = gateFor(gates, sl.find); if (x && !x.slot) x.slot = sl.id; });
    gates.filter(x => x.socket || x.slot).forEach(x => {
      x.g.classList.add('fb-comp'); x.inst = id; tile(id, x); block(id, x); hover(id, x);
      const R = rec(id); if (R && R.view && R.view.bind) [x.socket && x.socket.key].concat(cfg(id).filter(c => c.part).map(c => c.key)).filter(Boolean).forEach(k => R.view.bind(k, () => setTimeout(() => { tile(id, x); }, 0)));
    });
  }
  // what is in a box, as a part: the exchange's reading (another tool can take it), else the socket's component
  function partIn(id, x) {
    const sl = x.slot && slotsOf(id).find(s2 => s2.id === x.slot), sk = x.socket, comp = sk ? val(id, sk.key) : null;
    if (sl && sl.part) return { part: sl.part, label: sl.part.label, own: sl.own, clearable: sl.clearable };
    if (sk) return { comp, label: comp, own: comp === sk.default, clearable: comp !== sk.default };
    return { label: 'empty', empty: true, clearable: false };
  }
  // the TILE: the component in the box — drag it onto another box (this tool's or another blown-up tool's), ✕ deletes it
  function tile(id, x) {
    if (!x.tile) { x.tile = h('div', 'fb-tile'); x.g.insertBefore(x.tile, x.g.children[1] || null); }
    const p = partIn(id, x), grip = h('span', 'fb-grip', '⠿'), name = h('span', 'fb-tname', (p.own && !p.empty ? 'own · ' : '') + p.label);
    x.tile.replaceChildren(grip, name); x.tile.classList.toggle('empty', !!p.empty); x.tile.title = p.empty ? 'empty — drop a part here' : 'drag it onto another box (here or on another tool) · ✕ deletes it';
    if (p.clearable) { const del = h('button', 'fb-del', '✕'); del.type = 'button'; del.title = 'delete it — back to the tool\'s own part, or empty';
      del.addEventListener('pointerdown', (e) => e.stopPropagation()); del.addEventListener('click', (e) => { e.stopPropagation(); remove(id, x); }); x.tile.appendChild(del); }
    if (!p.empty) grip.parentNode.onpointerdown = (e) => { if (e.button !== 0 || e.target.closest('.fb-del')) return; e.stopPropagation(); e.preventDefault(); carry(e, { from: id, x, part: p.part, comp: p.comp, label: p.label }); };
    else x.tile.onpointerdown = null;
  }
  function clearPatch(id, x) { const r = rec(id), sk = x.socket, patch = x.slot && exchange ? exchange.clear(r.id, x.slot) : null; return patch || (sk ? { [sk.key]: sk.default } : null); }
  function remove(id, x) {
    const t = FM().toolTarget(id), pt = clearPatch(id, x); if (!pt) return;
    t.set(pt); x.origin = null; t.hear(); setTimeout(() => { tile(id, x); block(id, x); }, 0);
    A(x.g, [{ opacity: 1 }, { opacity: 0.55, offset: 0.3 }, { opacity: 1 }], { duration: 500, fill: 'none' });
  }
  // what a box can take from a carried thing → the patch (or null: it does not fit there)
  function fits(src, id, x) {
    if (src.from === id && src.x === x) return null;
    const r = rec(id), sk = x.socket;
    if (src.part && x.slot && exchange) { const sl = slotsOf(id).find(s2 => s2.id === x.slot); if (sl && sl.kinds.includes(src.part.kind)) return exchange.take(r.id, x.slot, src.part, paramsOf(id)); }
    if (src.comp && sk && sk.options.includes(src.comp)) return { [sk.key]: src.comp };
    return null;
  }
  // carry: a ghost of the tile follows the pointer; the boxes it fits light up, the rest dim; let go over one → it takes it (one undo step)
  function carry(e, src) {
    const ghost = h('div', 'fb-ghost', '⠿ ' + src.label); document.body.appendChild(ghost);
    const ok = targets(src);
    ok.forEach(({ o, patch }) => o.g.g.classList.add(patch ? 'fb-can' : 'fb-cannot'));
    let over = null;
    const move = (ev) => { ghost.style.left = (ev.clientX + 12) + 'px'; ghost.style.top = (ev.clientY + 10) + 'px';
      ghost.style.display = 'none'; const el = document.elementFromPoint(ev.clientX, ev.clientY); ghost.style.display = '';
      const g = el && el.closest('.fb-gate.fb-comp'), hit = g && ok.find(k => k.o.g.g === g && k.patch);
      if (over && over !== hit) over.o.g.g.classList.remove('fb-over'); over = hit || null; if (over) over.o.g.g.classList.add('fb-over');
      ghost.textContent = '⠿ ' + src.label + (over ? '  ' + over.verb : ''); };
    const up = () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerup', up, true); ghost.remove();
      ok.forEach(({ o }) => o.g.g.classList.remove('fb-can', 'fb-cannot', 'fb-over'));
      if (!over) return; drop(src, over); };
    move(e); document.addEventListener('pointermove', move, true); document.addEventListener('pointerup', up, true);
  }
  function targets(src) {   // every component box on every open board: what it would take from src (null: it does not fit), and what happens
    const all = [...open.entries()].flatMap(([inst, st]) => st.gates.filter(g => g.g.classList.contains('fb-comp')).map(g => ({ inst, g })));
    // 2026-11-21 (his: "drag components to one tool and have them either swap if compatible or remove the one its replacing"): what is in the
    // box it lands on goes back into the box it came from when it fits there (a SWAP); otherwise the one there is replaced — and inside one tool
    // the part MOVES (the box it left is cleared: back to its own part, or empty). From another tool or the tray it is a copy.
    const ok = all.map(o => { const patch = fits(src, o.inst, o.g); if (!patch) return { o, patch };
      const tp = partIn(o.inst, o.g), back = src.x && rec(src.from) && !tp.empty && !tp.own ? fits({ from: o.inst, x: o.g, part: tp.part, comp: tp.comp, label: tp.label }, src.from, src.x) : null;
      const verb = back ? '⇄ swaps with ' + tp.label : (tp.empty || tp.own ? '→ goes in' : '→ replaces ' + tp.label) + (src.x && src.from === o.inst ? ' (moved)' : '');
      return { o, patch, back, tp, verb }; });
    return ok;
  }
  function drop(src, hit) {
    const { o, back } = hit, same = src.x && src.from === o.inst, t = FM().toolTarget(o.inst); let patch = hit.patch;
    if (same) patch = Object.assign({}, back || clearPatch(src.from, src.x) || {}, patch);   // one tool: one step — the swap, or the move
    else if (back && rec(src.from)) { const ts = FM().toolTarget(src.from); ts.set(back); setTimeout(() => { tile(src.from, src.x); block(src.from, src.x); }, 0); flash(src.x, o.inst, o.g); }
    t.set(patch); if (same) { src.x.origin = null; setTimeout(() => { tile(src.from, src.x); block(src.from, src.x); }, 0); }
    o.g.origin = src.from && src.from !== o.inst && rec(src.from) ? { from: (rec(src.from).def.label || ''), part: src.label } : null; t.hear();
    setTimeout(() => { tile(o.inst, o.g); block(o.inst, o.g); }, 0); flash(o.g, src.from && src.from !== o.inst ? src.from : null, src.x);
    return { swapped: !!back, moved: !!(same && !back) };
  }
  // SYNTHESIZE TOGETHER (2026-11-21, his: "Do it."): the core carries a ◆ tile — drag it onto another blown-up tool's core and the two become one
  // tool of its own (the domain's exchange.synthesize decides its parts and checks it), opened blown up beside them. Nothing here knows a tool.
  function fuseTile(id, st) {
    const r = rec(id); if (!r || !exchange || !exchange.synthesize || !exchange.has(r.id)) return;
    const t = h('div', 'fb-tile fb-fuse', '⠿ ◆ drag onto another tool\'s core — synthesize them together'); t.title = 'two tools blown up on the canvas become one of their own';
    t.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); carryCore(e, id); });
    st.core.appendChild(t); st.fuse = t; settle(id);
  }
  function carryCore(e, id) {
    const ghost = h('div', 'fb-ghost', '◆ ' + (rec(id).def.label || '')); document.body.appendChild(ghost);
    const targets = [...open.entries()].filter(([inst]) => inst !== id && rec(inst) && exchange.has(rec(inst).id)).map(([inst, st]) => ({ inst, st }));
    targets.forEach(t => t.st.core.classList.add('fb-can')); let over = null;
    const move = (ev) => { ghost.style.left = (ev.clientX + 12) + 'px'; ghost.style.top = (ev.clientY + 10) + 'px'; ghost.style.display = 'none'; const el = document.elementFromPoint(ev.clientX, ev.clientY); ghost.style.display = '';
      const c = el && el.closest('.fb-core'), hit = c && targets.find(t => t.st.core === c); if (over && over !== hit) over.st.core.classList.remove('fb-over'); over = hit || null; if (over) over.st.core.classList.add('fb-over'); };
    const up = () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerup', up, true); ghost.remove(); targets.forEach(t => t.st.core.classList.remove('fb-can', 'fb-over'));
      if (over) synthesizeOnto(id, over.inst, over.st); };
    move(e); document.addEventListener('pointermove', move, true); document.addEventListener('pointerup', up, true);
  }
  function synthesizeOnto(aId, bId, bst) {
    const say = (t2, kind) => { if (global.Shell && global.Shell.toast) global.Shell.toast(t2, kind || '', 3600); };
    bst.core.classList.add('fb-busy'); say('◆ synthesizing ' + rec(aId).def.label + ' × ' + rec(bId).def.label + ' — measuring it against everything…');
    return Promise.resolve(exchange.synthesize(aId, bId)).then((r) => {
      bst.core.classList.remove('fb-busy'); if (!r || !r.ok) { say('not made — ' + ((r && r.why) || 'it did not build'), 'bad'); return null; }
      const F = global.OrganismFactory, x = bst.board.offsetLeft + bst.board.offsetWidth + 120, y = bst.board.offsetTop, inst = F.spawn(r.id, { x, y });
      say('◆ ' + r.rec.name + ' — a tool of its own (' + r.verdict + (r.near ? ', nearest ' + r.near : '') + ')', 'good');
      if (inst) setTimeout(() => { if (!open.has(inst)) explode(inst, r.id); }, 700);
      return { inst, id: r.id, rec: r.rec };
    }, (er) => { bst.core.classList.remove('fb-busy'); say('not made — ' + er.message, 'bad'); return null; });
  }
  // the PARTS tray: new components this tool's boxes take — drag one onto a box to change what is in it
  function tray(id, st, T) {
    const comps = []; sockets(id).forEach(sk => sk.options.filter(o => o !== sk.default && o !== 'none').forEach(o => { if (!comps.includes(o)) comps.push(o); }));
    if (!comps.length) return;
    const box = h('div', 'fb-tray'), head = h('div', 'fb-trayh', 'PARTS — drag one onto a box'); box.appendChild(head);
    comps.forEach(c => { const tl = h('div', 'fb-ttile', '⠿ ' + c); tl.title = 'drag onto a box that takes it'; tl.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); carry(e, { from: null, comp: c, label: c }); }); box.appendChild(tl); });
    const ref = st.dock || st.core; box.style.cssText = 'left:' + ref.offsetLeft + 'px;top:' + (ref.offsetTop + ref.offsetHeight + 16) + 'px;width:' + Math.max(380, ref.offsetWidth) + 'px';
    st.board.appendChild(box); st.tray = box; settle(id);
    A(box, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: T(700), delay: T(2400), easing: EASE.out });
  }
  // RIGHT-CLICK ON A PART (2026-11-21, his: "utilize right click, open in mutation lab"): delete it, mutate only it, how it shows (block or tile)
  const views = (toolId) => { try { return JSON.parse(localStorage.getItem('eravos.fieldboard.view.' + toolId) || '{}') || {}; } catch (e) { return {}; } };
  const keepView = (toolId, v) => { try { localStorage.setItem('eravos.fieldboard.view.' + toolId, JSON.stringify(v)); } catch (e) {} };
  const viewOf = (id, x) => (views(rec(id).id)[x.p.id] || 'block');
  function partTarget(id, x) {   // this one part as a mutation target: its socket and the settings that belong to its components
    const t = FM().toolTarget(id), sk = x.socket; if (!t || !sk) return null;
    return Object.assign({}, t, { list: () => t.list().filter(c => c.key === sk.key || (c.part && (!c.of || c.of === sk.key) && [].concat(c.part).some(q => sk.options.includes(q)))) });
  }
  function mutatePart(id, x) {
    const t = partTarget(id, x), m = t && FM().mutate(t); const say = (w) => global.Shell && global.Shell.toast && global.Shell.toast(w, '', 3200);
    if (!m) return say('nothing left to try in this part'), null;
    FM().apply(t, m); setTimeout(() => { tile(id, x); block(id, x); }, 0); flash(x, null, null); say('⚄ ' + m.words.join(' · ') + ' — Ctrl+Z puts it back'); return m;
  }
  function partItems(id, x) {
    const p = partIn(id, x), v = viewOf(id, x), out = [];
    out.push({ label: '⇄ Drag its ⠿ onto another box', hint: 'a swap when what is there fits back here; otherwise it replaces it (inside this tool it moves)', run: () => {} });
    const rep = replacements(id, x);
    if (rep.length) out.push({ sep: true }, { section: 'REPLACE WITH' }, ...rep.map(r => ({ label: r.label, hint: r.hint, run: () => replace(id, x, r) })), { sep: true });
    if (x.socket) out.push({ label: '⚄ Mutate only this part', hint: 'another component here, its own settings fresh — the rest of the tool stays', run: () => mutatePart(id, x) });
    if (p.clearable) out.push({ label: '✕ Remove it', hint: 'back to the tool\'s own part, or empty (Delete on a selection)', run: () => remove(id, x) });
    if (x.socket) out.push({ sep: true }, { label: (v === 'block' ? '● ' : '○ ') + 'Show as a block', hint: 'the component with its own controls in the box', run: () => setView(id, x, 'block') },
      { label: (v === 'tile' ? '● ' : '○ ') + 'Show as a tile only', hint: 'just its name — the box stays small', run: () => setView(id, x, 'tile') });
    out.push({ sep: true }, { label: '⚄ Open in Mutation Lab', hint: 'the whole tool: mutate, keep or throw, the parts tray', run: () => lab(id) });
    return out;
  }
  // REPLACE WITH… (3.216, his: "also right click to replace"): every component this box takes — its own options, and what is in the boxes of
  // the other tools blown up on the canvas — the same step as a drop (one undo step; from another tool a copy, its settings with it)
  function replacements(id, x) {
    const out = [], now = partIn(id, x), sk = x.socket, say = (c) => { const w = exchange && exchange.explain && exchange.explain(c); return w ? w.name : c; };
    if (sk) sk.options.filter(o => o !== val(id, sk.key)).forEach(o => { const patch = fits({ comp: o, label: o }, id, x); if (patch) out.push({ label: '→ ' + say(o), hint: (exchange && exchange.explain && (exchange.explain(o) || {}).what) || o, src: { comp: o, label: o }, patch }); });
    [...open.entries()].forEach(([inst, st]) => st.gates.filter(g => g !== x && g.g.classList.contains('fb-comp')).forEach(g => {
      const tp = partIn(inst, g); if (tp.empty || (inst === id)) return;
      const src = { from: inst, x: g, part: tp.part, comp: tp.comp, label: tp.label }, patch = fits(src, id, x); if (!patch) return;
      const r = rec(inst), from = (r && r.def && r.def.label) || inst;
      out.push({ label: '⇠ ' + tp.label + ' — from ' + from, hint: 'a copy of that part, its settings with it', src, patch }); }));
    return out;
  }
  function replace(id, x, r) { const hit = { o: { inst: id, g: x }, patch: r.patch, back: null }; const src = Object.assign({}, r.src); if (src.from === undefined) delete src.x; return drop(src, hit); }
  // THE HOVER CARD (3.216, his: "when you hover tells you what it is and the point of it and how it effects sound, in the simplest ways, so
  // even a child could understand it"): the domain's words for the component in the box (exchange.explain), said where it sits
  let card = null, cardT = 0;
  function hideCard() { clearTimeout(cardT); if (card) { card.remove(); card = null; } }
  function hover(id, x) {
    if (x.hovered) return; x.hovered = true;
    x.g.addEventListener('pointerenter', () => { clearTimeout(cardT); cardT = setTimeout(() => showCard(id, x), 450); });
    x.g.addEventListener('pointerleave', hideCard); x.g.addEventListener('pointerdown', hideCard);
  }
  function showCard(id, x) {
    hideCard(); if (!exchange || !exchange.explain || !x.g.isConnected) return;
    const p = partIn(id, x), c = p.empty ? null : p.own && !p.part ? 'own' : (p.part && p.part.component) || p.comp, w = c && exchange.explain(c); if (!w) return;
    const sl = x.slot && slotsOf(id).find(s2 => s2.id === x.slot), r = rec(id), where = (sl ? sl.label : (x.p.label && x.p.label.text) || '') + (r && r.def ? ' of ' + r.def.label : '');
    card = h('div', 'fb-card'); card.style.setProperty('--c', x.p.col);
    [['fb-cn', w.name + (p.own ? ' · its own' : '')], ['fb-cw', 'here: ' + where], ['fb-ct', w.what], ['fb-ct', w.point], ['fb-cs', '♪ ' + w.sound]].forEach(([k, t]) => card.appendChild(h('div', k, esc(t))));
    document.body.appendChild(card);
    const b = x.g.getBoundingClientRect(), W = global.innerWidth || 1200, H = global.innerHeight || 800;
    card.style.left = Math.max(8, Math.min(b.right + 12, W - card.offsetWidth - 8)) + 'px'; card.style.top = Math.max(8, Math.min(b.top, H - card.offsetHeight - 8)) + 'px';
  }
  function setView(id, x, v) { const toolId = rec(id).id, m = views(toolId); m[x.p.id] = v; keepView(toolId, m); block(id, x); settle(id); }
  function lab(id) {   // the Mutation Lab of a tool = it exploded with its dock up front: the dock glows, the first MUTATE is a click away
    const st = open.get(id); if (!st) { const r = rec(id); if (!r) return null; const res = explode(id, r.id); if (res && res.done) res.done.then(() => lab(id)); return res; }
    if (st.dock) { st.dock.scrollIntoView && st.dock.scrollIntoView({ block: 'center', inline: 'center' }); A(st.dock, [{ boxShadow: '0 0 0 0 rgba(0,212,255,0)' }, { boxShadow: '0 0 34px 4px rgba(0,212,255,.55)', offset: 0.35 }, { boxShadow: '0 0 0 0 rgba(0,212,255,0)' }], { duration: 1400, fill: 'none' }); }
    return { open: true };
  }
  function block(id, x) {   // the component in the box, as its block: its own controls (the tool's settings that belong to that part)
    if (x.block) { x.block.remove(); x.block = null; }
    const r = rec(id), UI = global.UIKit, sk = x.socket; if (!r || !r.view || !UI || !sk) { if (x.origin) badge(x); return; }
    if (viewOf(id, x) === 'tile') { if (x.origin) badge(x); return; }
    const comp = val(id, sk.key), own = cfg(id).filter(c => c.part && [].concat(c.part).includes(comp) && !c.socket); if (comp === sk.default || comp === 'none' || !own.length) { if (x.origin) badge(x); return; }
    const head = h('div', 'fb-bhead'); head.textContent = comp + (x.origin ? ' · from ' + x.origin.from : '');
    const row = h('div', 'fb-brow'); own.forEach(c => { const ctl = UI.paramControl(r.view, c, { size: 26 }); if (ctl) { ctl.el.dataset.key = c.key; row.appendChild(ctl.el); } });
    x.block = h('div', 'fb-block'); x.block.append(head, row); x.g.appendChild(x.block);
    settle(id);
  }
  function settle(id) {   // a box that grew (its block) pushes the boxes under it down, so nothing covers anything; the wires follow
    const st = open.get(id); if (!st) return;
    [st.core, st.dock, st.tray].filter(Boolean).forEach(o => { const ob = o.offsetTop + o.offsetHeight + 26;   // the dock and the tray are solid: a box under them moves below
      st.gates.forEach(l => { if (l.g.offsetLeft < o.offsetLeft + o.offsetWidth && l.g.offsetLeft + l.g.offsetWidth > o.offsetLeft && l.g.offsetTop < ob && l.g.offsetTop + l.g.offsetHeight > o.offsetTop) l.g.style.top = ob + 'px'; }); });
    for (let pass = 0; pass < 4; pass++) { let movedAny = false; const gs = st.gates.slice().sort((a, b) => a.g.offsetTop - b.g.offsetTop);
      gs.forEach((u, i) => { const ub = u.g.offsetTop + u.g.offsetHeight + 26;
        gs.slice(i + 1).forEach(l => { if (l.g.offsetLeft < u.g.offsetLeft + u.g.offsetWidth && l.g.offsetLeft + l.g.offsetWidth > u.g.offsetLeft && l.g.offsetTop < ub && l.g.offsetTop >= u.g.offsetTop) { l.g.style.top = ub + 'px'; movedAny = true; } }); });
      if (!movedAny) break; }
    const bottom = Math.max(...st.gates.map(x => x.g.offsetTop + x.g.offsetHeight)) + 200; if (bottom > st.board.offsetHeight) { st.board.style.height = bottom + 'px'; st.svg.setAttribute('height', bottom); }
    st.dragged = true; wires(st);
  }
  function badge(x) { const b = h('div', 'fb-block'); const hd = h('div', 'fb-bhead'); hd.textContent = '⇄ ' + x.origin.part + ' · from ' + x.origin.from; b.appendChild(hd); x.block = b; x.g.appendChild(b); const st = [...open.entries()].find(([, v]) => v.gates.includes(x)); if (st) settle(st[0]); }
  function flash(x, fromId, fromSlot) {   // the box takes its new part: it lights; from a tool exploded beside it, a wire draws across for a moment
    A(x.g, [{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: '0 0 0 3px var(--c), 0 0 30px var(--c)', offset: 0.3 }, { boxShadow: '0 0 0 0 transparent' }], { duration: 900, fill: 'none' });
    const fs = fromId && open.get(fromId), wm = WM(); if (!fs || !wm || !wm.world || !fromSlot) return;
    const fx = fromSlot.g ? fromSlot : fs.gates.find(gg => gg.slot === fromSlot.id); if (!fx) return;
    const wr = wm.world.getBoundingClientRect(), z = (wm.view && wm.view.z) || 1, c = (el) => { const r2 = el.getBoundingClientRect(); return [(r2.left + r2.width / 2 - wr.left) / z, (r2.top + r2.height / 2 - wr.top) / z]; };
    const [x1, y1] = c(fx.g), [x2, y2] = c(x.g), svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fb-across'); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:1000001';
    const pa = document.createElementNS(NS, 'path'), m = (x1 + x2) / 2; pa.setAttribute('d', `M${x1} ${y1} C ${m} ${y1 - 120}, ${m} ${y2 - 120}, ${x2} ${y2}`); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke', getComputedStyle(x.g).getPropertyValue('--c') || '#00D4FF'); pa.setAttribute('stroke-width', '2');
    svg.appendChild(pa); wm.world.appendChild(svg); let len = 0; try { len = pa.getTotalLength(); } catch (e) {}
    const an = A(pa, [{ strokeDasharray: len + ' ' + len, strokeDashoffset: len, opacity: 1 }, { strokeDasharray: len + ' ' + len, strokeDashoffset: 0, opacity: 1, offset: 0.5 }, { strokeDasharray: len + ' ' + len, strokeDashoffset: 0, opacity: 0 }], { duration: 1600, fill: 'forwards' });
    (an ? an.finished : Promise.resolve()).catch(() => {}).then(() => svg.remove());
  }
  // MUTATE can take another tool's part too (the domain's exchange: a part that fits one of this tool's component boxes)
  function extraFor(id) {
    return (rnd) => { const mine = slotsOf(id), offers = []; others(id).forEach(o => slotsOf(o.id).forEach(s2 => { if (!s2.part) return; mine.filter(m => m.kinds.includes(s2.part.kind)).forEach(m => offers.push({ o, s2, m })); }));
      if (!offers.length) return null; const pk = offers[Math.floor(rnd() * offers.length)], patch = exchange.take(rec(id).id, pk.m.id, pk.s2.part, paramsOf(id));
      return patch ? { patch, words: pk.m.label + ' ← ' + pk.s2.part.label + ' (' + pk.o.label + ')' } : null; };
  }
  function mutateDock(id, st, T) {
    const t = FM() && FM().toolTarget(id); if (!t || !t.list().some(c => FM().usable(t, c))) return;
    const dock = FM().dock(t, { extra: extraFor(id), hint: (sockets(id).length ? 'swaps parts and moves a few settings' : 'moves a few of its settings') + ' — played at once; keep it or throw it',
      onMutate: () => A(dock, [{ boxShadow: '0 0 0 0 rgba(0,212,255,0)' }, { boxShadow: '0 0 30px 2px rgba(0,212,255,.45)', offset: 0.3 }, { boxShadow: '0 0 0 0 rgba(0,212,255,0)' }], { duration: T(900), fill: 'none' }) });
    dock.classList.add('fb-mut'); const core = st.core;
    dock.style.cssText = 'left:' + core.offsetLeft + 'px;top:' + (core.offsetTop + core.offsetHeight + 18) + 'px;width:' + Math.max(380, core.offsetWidth) + 'px';
    st.board.appendChild(dock); st.dock = dock;
    A(dock, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: T(700), delay: T(2300), easing: EASE.out });
  }
  // ---- A BOARD FOR ANY TOOL (2026-11-20, his: "then i want each tool to be able to be able to do that"): a tool with no board of its own is
  // exploded from its window — every section (a titled group or card, outermost only) and its keys, each in a gate, half each side of its core.
  function autoLayout(win, r) {
    const titles = [].slice.call(win.querySelectorAll('.uk-group-title')).map(t => t.parentElement).filter(Boolean);
    const outer = titles.filter(e => !titles.some(o => o !== e && o.contains(e)));
    const seen = new Set(), pieces = [];
    outer.forEach((e, i) => { const t = e.querySelector('.uk-group-title').textContent.trim(); if (!t || seen.has(t)) return; seen.add(t);
      pieces.push({ id: 'auto-' + i, take: { title: t }, x: 0, y: 0, w: 0, col: '', dash: false, label: { text: t.toLowerCase(), status: '' } }); });
    if (win.querySelector('.uk-keys')) pieces.push({ id: 'auto-keys', take: { sel: '.uk-keys' }, x: 0, y: 0, w: 0, col: '', label: { text: 'keys · every key its own note', status: '' } });
    const label = (r && r.def && r.def.label) || 'the tool', blurb = (r && r.def && (r.def.blurb || r.def.summary)) || '';
    const BCOL = ['#00D4FF', '#3DDC97', '#CC44FF', '#FFCC00', '#FF2266', '#9FB3C8', '#00FF88', '#FF8A3D'];
    pieces.forEach((p, i) => { p.col = BCOL[i % BCOL.length]; });
    return { auto: true, title: label.toUpperCase(), size: [1600, 1000], pieces, more: [],
      header: '<div style="font:500 11px DM Mono,monospace;letter-spacing:2px;color:#4E6A80;white-space:nowrap"><b style="font:600 18px DM Mono,monospace;letter-spacing:6px;color:#00D4FF;margin-right:16px">FIELD</b>' + esc(label.toUpperCase()) + ' · EXPLODED · every part apart, live, wired to its core</div>',
      core: '<div style="width:300px;padding:16px 18px;border:2px solid ' + esc((r && r.def && r.def.accent) || '#FF2266') + ';background:#04070C"><div style="font:500 24px DM Mono,monospace;letter-spacing:4px;color:#EAF6FF">' + esc(label.toUpperCase()) + '</div><div style="font:500 13px DM Mono,monospace;letter-spacing:3px;color:#9FB3C8;margin:4px 0 8px">· CORE</div><div style="font:400 11px DM Mono,monospace;line-height:1.5;color:#B8CFE0">' + esc(blurb) + '</div></div>' };
  }
  function placeAuto(st) {   // after the parts are in their gates (their real sizes): half each side of the core, in columns, in the window's order
    const gs = st.gates, GAP = 46, COLG = 80, maxH = 900, half = Math.ceil(gs.length / 2), sides = [gs.slice(0, half), gs.slice(half)];
    const cols = (list) => { const out = [[]]; let hgt = 0; list.forEach(x => { const gh = x.g.offsetHeight + GAP; if (hgt + gh > maxH && out[out.length - 1].length) { out.push([]); hgt = 0; } out[out.length - 1].push(x); hgt += gh; }); return out.filter(c => c.length); };
    const L = cols(sides[0]).reverse(), R = cols(sides[1]), wOf = (c) => Math.max(...c.map(x => x.g.offsetWidth)), hOf = (c) => c.reduce((a, x) => a + x.g.offsetHeight + GAP, 0);
    const H = Math.max(600, ...L.concat(R).map(hOf)) + 120, cw = st.core.offsetWidth || 300, ch = st.core.offsetHeight || 160;
    let x = 40; L.forEach(c => { let y = 90 + (H - 90 - hOf(c)) / 2; c.forEach(g => { g.g.style.left = x + 'px'; g.g.style.top = y + 'px'; y += g.g.offsetHeight + GAP; }); x += wOf(c) + COLG; });
    const cx = x + 20; st.core.style.left = cx + 'px'; st.core.style.top = (90 + (H - 90) / 2 - ch / 2 - 60) + 'px'; x = cx + cw + COLG + 20;
    R.forEach(c => { let y = 90 + (H - 90 - hOf(c)) / 2; c.forEach(g => { g.g.style.left = x + 'px'; g.g.style.top = y + 'px'; y += g.g.offsetHeight + GAP; }); x += wOf(c) + COLG; });
    st.board.style.width = x + 'px'; st.board.style.height = (H + 260) + 'px'; st.svg.setAttribute('width', x); st.svg.setAttribute('height', H + 260); st.head.style.left = '40px'; st.head.style.top = '30px';
  }
  // the window's menu offers it, for a tool that has a board
  function hook() {
    const CM = global.ContextMenu; if (!CM || !CM.contribute) return false;
    CM.contribute(({ rec }) => !rec || !WM() || !WM().windowOf(rec.instanceId) ? [] : [isOpen(rec.instanceId)
      ? { label: '◱ Put it back together', hint: 'every part back into its window', run: () => assemble(rec.instanceId) }
      : { label: '✦ Explode on the canvas', hint: 'every part of it apart, wired to its core — all of it still live: play it, turn it, move the pieces', run: () => explode(rec.instanceId, rec.id) },
      { label: '⚄ Open in Mutation Lab', hint: 'exploded, with MUTATE · KEEP · THROW up front — drag parts between boxes and tools', run: () => lab(rec.instanceId) }]);
    return true;
  }
  if (!hook()) document.addEventListener('DOMContentLoaded', hook);
  global.FieldBoard = { define, has, explode, lab, select, clearSel, selected: () => selected().map(o => ({ inst: o.inst, piece: o.x.p.id, slot: o.x.slot })), synthesizeSel, selItems, mutatePart, partItems, replacements, replace, showCard, drop, partIn, gates: (id) => (open.get(id) || {}).gates || [], assemble, isOpen, boards, sockets, setExchange, synthesizeOnto: (a, b) => open.get(b) ? synthesizeOnto(a, b, open.get(b)) : Promise.resolve(null), get exchange() { return exchange; }, learned: (toolId) => FM().learned(toolId), mutate: (id) => FM().mutate(FM().toolTarget(id)) };
})(window);

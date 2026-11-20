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

  function explode(instanceId, toolId) {
    const L = boards.get(toolId), wm = WM(), win = wm && wm.windowOf(instanceId); if (!L || !win || open.has(instanceId)) return null;
    const z = (wm.view && wm.view.z) || 1, bx = win.offsetLeft, by = win.offsetTop, user = moved(toolId);
    const all = L.pieces.concat(L.more || []), H = Math.max(L.size[1], ...all.map(p => p.y + 340));
    const board = h('div', 'fb-board'); board.dataset.instance = instanceId; board.style.cssText = 'left:' + bx + 'px;top:' + by + 'px;width:' + L.size[0] + 'px;height:' + H + 'px';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fb-wires fb-late'); svg.setAttribute('width', L.size[0]); svg.setAttribute('height', H); board.appendChild(svg);
    const head = h('div', 'fb-head fb-late', L.header || ''); board.appendChild(head);
    const core = h('div', 'fb-core fb-late', L.core || ''); board.appendChild(core);
    if (L.legend) board.appendChild(h('div', 'fb-legend fb-late', L.legend));
    if (L.more && L.more.length) { const t = h('div', 'fb-since fb-late'); t.textContent = 'SINCE THIS BOARD — what ' + (L.title || 'the tool') + ' has grown, every part live'; t.style.cssText = 'left:34px;top:' + (Math.min(...L.more.map(p => p.y)) - 52) + 'px'; board.appendChild(t); }
    wm.world.appendChild(board);
    const took = [], gates = [], missing = [];
    all.forEach((p, i) => {
      const parts = partsOf(win, p.take); if (!parts.length) { missing.push(p.id); return; }
      const was = union(parts.map(e => e.getBoundingClientRect()));
      const at = user[p.id] || { x: p.x, y: p.y }, g = h('div', 'fb-gate' + (p.dash ? ' dash' : '')); g.dataset.piece = p.id; g.style.setProperty('--c', p.col);
      g.style.cssText += ';left:' + (at.x - 6) + 'px;top:' + (at.y - 6) + 'px;min-width:' + ((p.frame ? p.frame[2] : p.w + 12)) + 'px';
      const lab = h('div', 'fb-lab', esc(p.label.text) + ' &#160;<span>' + esc(p.label.status) + '</span>'); lab.style.color = p.col; g.appendChild(lab);
      const inner = h('div', 'fb-inner' + (p.take.keys ? ' row' : '')); if (!p.take.keys && p.w) inner.style.width = p.w + 'px'; g.appendChild(inner);
      parts.forEach(e => { const ph = document.createComment('field-board'); e.parentNode.insertBefore(ph, e); took.push({ e, ph, hidden: e.hidden, display: e.style.display }); e.hidden = false; if (e.style.display === 'none') e.style.display = ''; inner.appendChild(e); });
      board.appendChild(g); gates.push({ p, g, was, i });
      drag(lab, g, p, toolId, instanceId);
    });
    win.classList.add('fb-away');
    // a live part can be taller than the picture on the board it replaces: a gate that would cover the one under it pushes that one down
    // (only the board's own places — a gate he moved stays where he put it)
    const placed = gates.filter(x => !user[x.p.id]).sort((a, b) => a.g.offsetTop - b.g.offsetTop);
    placed.forEach((x, i) => { const r = { l: x.g.offsetLeft, t: x.g.offsetTop, r: x.g.offsetLeft + x.g.offsetWidth, b: x.g.offsetTop + x.g.offsetHeight };
      placed.slice(i + 1).forEach(y => { const o = { l: y.g.offsetLeft, r: y.g.offsetLeft + y.g.offsetWidth }; if (o.l < r.r && o.r > r.l && y.g.offsetTop < r.b + 26 && y.g.offsetTop >= r.t) { y.g.style.top = (r.b + 26) + 'px'; y.pushed = true; } }); });
    // the whole tool → blown apart: each gate starts where its parts were in the window, then flies to its place on the board
    gates.forEach(({ g, was, i }) => { const now = g.getBoundingClientRect(); if (!was) return; g.style.transform = 'translate(' + ((was.left - now.left) / z) + 'px,' + ((was.top - now.top) / z) + 'px)'; g.style.transitionDelay = (i * 0.05) + 's'; });
    void board.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => { board.classList.add('apart'); gates.forEach(({ g }) => { g.style.transform = ''; }); }));
    const st = { board, took, gates, win, toolId, L, svg, core, missing };
    open.set(instanceId, st);
    board.addEventListener('contextmenu', (e) => { if (e.target.closest('.fb-inner')) return; e.preventDefault(); e.stopPropagation(); const CM = global.ContextMenu;
      if (CM && CM.show) CM.show(e.clientX, e.clientY, [{ label: '◱ Put it back together', hint: 'every part back into its window', run: () => assemble(instanceId) },
        { label: '↺ Gates back to the board', hint: 'undo your moves of the gates', run: () => { keepMoved(toolId, {}); assemble(instanceId); explode(instanceId, toolId); } }], (L.title || 'the tool') + ' · exploded'); else assemble(instanceId); });
    setTimeout(() => wires(st), 60); setTimeout(() => wires(st), 3200);   // once the gates have landed
    fit(board);
    return { pieces: gates.length, missing };
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
  function fit(board) {   // the canvas looks at the whole board
    const wm = WM(); if (!wm || !wm.canvas || !wm.applyView) return; const r = wm.canvas.getBoundingClientRect(); if (!r.width) return;
    const W = board.offsetWidth, Hh = Math.min(board.offsetHeight, 1340), z = Math.max(0.2, Math.min(1, (r.width - 40) / W, (r.height - 40) / Hh));
    wm.view = { z, x: (r.width - W * z) / 2 - board.offsetLeft * z, y: 20 - board.offsetTop * z }; wm.applyView();
  }
  function assemble(instanceId) {
    const st = open.get(instanceId); if (!st) return false;
    st.took.slice().reverse().forEach(({ e, ph, hidden, display }) => { if (ph.parentNode) { ph.parentNode.insertBefore(e, ph); ph.remove(); } e.hidden = hidden; e.style.display = display; });
    st.board.remove(); st.win.classList.remove('fb-away'); open.delete(instanceId);
    if (WM() && WM().centerOn) try { WM().centerOn(st.win); } catch (e) {}
    return true;
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

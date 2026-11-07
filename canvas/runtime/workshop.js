/* ERAVOS runtime — workshop.js → window.Workshop (3.150, W1 flat). Domain-free: it names no domain and no topic; every word, field and
 * picture comes from the KIND that is open (specs/eravos.workshop.spec and its ADDENDA 2026-11-07).
 * His words, 2026-11-07: "can you make it more like photoshop? or like a 3d renderer? then it could support a game engine, like this could be
 * the build surface for emerge." · "Yeah, we can just start with this. The small, like just the flat". The approved preview:
 * docs/previews/workshop-studio.png (its 3D viewport, its time lane and its asset browser are later phases).
 * The surface: a bar (name, the kind's stations, Apply, close) · the options bar (the selected layer's fields) · a tool strip (the kind's tools) ·
 * a tab per open document · ONE flat viewport (the kind draws it) · OUTLINER · LAYERS (grouped, as the kind groups them) · INSPECTOR / HISTORY ·
 * a status bar. Every edit is one undo step (Ctrl+Z / Ctrl+Shift+Z, or a click in HISTORY); every edit reaches its owner at once (live).
 *   Workshop.check(kind) → [] or the problems, in words · Workshop.addKind(kind) → { ok, problems } · Workshop.kinds()
 *   Workshop.open(kindId, doc, { onChange(doc), onApply(doc), onClose(), title }) → { doc(), set(key, v), select(layerId), undo(), redo(),
 *     history(), close(), el } · Workshop.current
 * A kind: { id, label, layers(doc) → [{ id, label, group, type, sub, fields: [{ key, label, type: number|enum|text, min, max, step, unit,
 *   options }] }], get(doc, key), set(doc, key, value) → doc, draw(g, W, H, doc, { selected, hover }), apply(doc)?, title(doc)?, stations(doc)?,
 *   outline(doc)? → [[depth, text, layerId?]], status(doc)? → [[label, value]], tools? [{ id, label, glyph, layer? }],
 *   pick(doc, x, y, W, H)? → a key/value edit for a click in the viewport (the kind decides what a click means) }
 * Layer types the surface knows (it draws their badges; a kind says what they mean): constraint · curve · value · events · emergent. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const TYPES = ['constraint', 'curve', 'value', 'events', 'emergent', 'raster', 'adjust'];
  const KINDS = new Map();
  const el = (tag, cls, kids, attrs) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (attrs) Object.keys(attrs).forEach(k => { if (k === 'text') e.textContent = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }); (kids || []).forEach(c => { if (c != null) e.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); }); return e; };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function check(k) {
    const p = [];
    if (!k || typeof k !== 'object') return ['a kind is an object'];
    if (typeof k.id !== 'string' || !/^[a-z][\w.-]{1,60}$/.test(k.id)) p.push('id: a short lowercase name (' + JSON.stringify(k.id) + ')');
    if (typeof k.label !== 'string' || !k.label.trim()) p.push('label: a name people read');
    ['layers', 'get', 'set', 'draw'].forEach(f => { if (typeof k[f] !== 'function') p.push(f + ': missing (a function)'); });
    if (k.apply !== undefined && typeof k.apply !== 'function') p.push('apply: a function, when given');
    if (k.tools !== undefined && !Array.isArray(k.tools)) p.push('tools: a list');
    return p;
  }
  function addKind(k) { const problems = check(k); if (!problems.length) KINDS.set(k.id, k); return { ok: !problems.length, problems }; }

  let current = null;
  function open(kindId, doc0, o) {
    o = o || {}; const K = KINDS.get(kindId); if (!K) throw new Error('Workshop: no kind "' + kindId + '"');
    if (current) current.close();
    let d = clone(doc0 || {}), selected = null, past = [], future = [], hist = [{ label: 'OPENED', doc: clone(d) }];
    const root = el('div', 'ws-app', [], { role: 'dialog', 'aria-label': K.label });
    const bar = el('div', 'ws-bar'), opts = el('div', 'ws-opts'), strip = el('div', 'ws-strip'), tabs = el('div', 'ws-tabs'), vp = el('div', 'ws-vp');
    const cv = el('canvas', 'ws-canvas'); vp.appendChild(cv);
    const outl = el('div', 'ws-pane'), lays = el('div', 'ws-pane ws-grow'), insp = el('div', 'ws-pane'), status = el('div', 'ws-status');
    const right = el('div', 'ws-right', [outl, lays, insp]), centre = el('div', 'ws-centre', [tabs, vp]);
    root.append(bar, opts, strip, centre, right, status);
    const layers = () => K.layers(d) || [];
    const layerOf = (id) => layers().find(l => l.id === id) || null;
    let inspTab = 'inspector';

    function field(f, big) {
      const v = K.get(d, f.key), wrap = el('label', 'ws-f' + (big ? ' big' : ''), [el('span', 'ws-fk', [], { text: f.label || f.key })]);
      if (f.type === 'enum') { const ch = el('span', 'ws-chips'); (f.options || []).forEach(op => ch.appendChild(el('button', 'ws-chip' + (String(op) === String(v) ? ' on' : ''), [], { type: 'button', text: String(op), onclick: () => edit(f.key, typeof v === 'number' ? +op : op, f.label) }))); wrap.appendChild(ch); }
      else if (f.type === 'number') { const inp = el('input', 'ws-num', [], { type: 'number', step: String(f.step || 1), value: String(v) }); if (f.min !== undefined) inp.min = f.min; if (f.max !== undefined) inp.max = f.max;
        inp.addEventListener('change', () => { let x = +inp.value; if (!isFinite(x)) return; if (f.min !== undefined) x = Math.max(f.min, x); if (f.max !== undefined) x = Math.min(f.max, x); edit(f.key, x, f.label); });
        wrap.appendChild(inp); if (f.unit) wrap.appendChild(el('span', 'ws-unit', [], { text: f.unit })); }
      else { const inp = el('input', 'ws-txt', [], { value: String(v == null ? '' : v) }); inp.addEventListener('change', () => edit(f.key, inp.value, f.label)); wrap.appendChild(inp); }
      return wrap;
    }
    function edit(key, value, label) {
      past.push(clone(d)); future = []; d = K.set(d, key, value) || d;
      hist.push({ label: (label || key) + ' · ' + (typeof value === 'number' ? +value.toFixed(3) : String(value)), doc: clone(d) }); if (hist.length > 200) hist.splice(1, 1);
      if (o.onChange) { try { o.onChange(clone(d)); } catch (e) { console.error(e); } } render();
    }
    function restore(x, label) { d = clone(x); if (o.onChange) { try { o.onChange(clone(d)); } catch (e) { console.error(e); } } hist.push({ label, doc: clone(d) }); render(); }
    function undo() { if (!past.length) return false; future.push(clone(d)); restore(past.pop(), 'UNDO'); return true; }
    function redo() { if (!future.length) return false; past.push(clone(d)); restore(future.pop(), 'REDO'); return true; }

    function draw() {
      const r = vp.getBoundingClientRect(), dpr = Math.min(2, global.devicePixelRatio || 1), W = Math.max(50, r.width), H = Math.max(50, r.height);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      try { K.draw(g, W, H, d, { selected }); } catch (e) { console.error(e); }
    }
    function render() {
      const L = layers(); if (!selected || !layerOf(selected)) selected = (L.find(l => l.fields && l.fields.length) || L[0] || {}).id || null;
      const sel = layerOf(selected), title = (o.title || (K.title ? K.title(d) : K.label));
      // the bar: the name, the kind's stations (where this document sits), the actions
      bar.replaceChildren(el('span', 'ws-name', [], { text: 'WORKSHOP' }), el('span', 'ws-sep'),
        el('span', 'ws-stations', (K.stations ? K.stations(d) : [K.label]).map((s, i, a) => el('span', 'ws-st' + (i === a.length - 2 || a.length === 1 ? ' on' : ''), [el('i', '', [], { text: String(i + 1).padStart(2, '0') }), String(s)]))),
        el('span', 'ws-end', [el('button', 'ws-btn ghost', [], { type: 'button', text: 'UNDO', title: 'Ctrl+Z', onclick: undo }), el('button', 'ws-btn ghost', [], { type: 'button', text: 'REDO', title: 'Ctrl+Shift+Z', onclick: redo }),
          el('button', 'ws-btn send', [], { type: 'button', text: 'APPLY →', title: 'write it back to where it came from', onclick: () => { if (o.onApply) o.onApply(clone(d)); else if (K.apply) K.apply(clone(d)); } }),
          el('button', 'ws-btn ghost', [], { type: 'button', text: '×', title: 'close (Esc)', 'aria-label': 'close', onclick: () => close() })]));
      // the options bar: the selected layer's fields
      opts.replaceChildren(el('span', 'ws-tool', [], { text: sel ? sel.label : '' }), ...((sel && sel.fields) || []).map(f => field(f, false)));
      // the tool strip: the kind's tools (a tool may select a layer)
      strip.replaceChildren(...(K.tools || []).map(t => el('button', 'ws-ti' + (t.layer && t.layer === selected ? ' on' : ''), [], { type: 'button', title: t.label, text: t.glyph || t.label.slice(0, 1), onclick: () => { if (t.layer) { selected = t.layer; render(); } } })));
      tabs.replaceChildren(el('span', 'ws-tab on', [String(title), el('i', '', [], { text: '×', onclick: () => close() })]));
      // OUTLINER
      const ol = K.outline ? K.outline(d) : [[0, title]];
      outl.replaceChildren(el('div', 'ws-ph', [el('span', 'on', [], { text: 'OUTLINER' })]), el('div', 'ws-tree', ol.map(([depth, t, lid]) => el('div', lid && lid === selected ? 'sel' : '', [], { text: ' '.repeat(depth * 3) + t, onclick: () => { if (lid) { selected = lid; render(); } } }))));
      // LAYERS, in the kind's groups
      const groups = []; L.forEach(l => { const gname = l.group || ''; let gr = groups.find(x => x[0] === gname); if (!gr) groups.push(gr = [gname, []]); gr[1].push(l); });
      lays.replaceChildren(el('div', 'ws-ph', [el('span', 'on', [], { text: 'LAYERS' }), el('span', 'ws-x', [], { text: String(L.length) })]),
        ...[].concat(...groups.map(([gname, ls]) => [gname ? el('div', 'ws-lh', [], { text: gname }) : null].concat(ls.map(l => el('div', 'ws-lay' + (l.id === selected ? ' sel' : ''), [
          el('span', 'ws-badge t-' + (TYPES.includes(l.type) ? l.type : 'value'), [], { text: (l.type || 'value').slice(0, 4).toUpperCase() }), el('div', '', [String(l.label), el('small', '', [], { text: l.sub || '' })])], { onclick: () => { selected = l.id; render(); } }))))).filter(Boolean));
      // INSPECTOR / HISTORY
      const tabsI = el('div', 'ws-ph', ['inspector', 'history'].map(t => el('span', t === inspTab ? 'on' : '', [], { text: t.toUpperCase(), onclick: () => { inspTab = t; render(); } })));
      if (inspTab === 'history') insp.replaceChildren(tabsI, el('div', 'ws-hist', hist.slice(-40).map((h2, i, a) => el('div', i === a.length - 1 ? 'now' : '', [el('i', '', [], { text: String(hist.length - a.length + i + 1).padStart(2, '0') }), h2.label], { onclick: () => { if (i < a.length - 1) { past.push(clone(d)); future = []; restore(h2.doc, 'BACK TO ' + String(hist.length - a.length + i + 1).padStart(2, '0')); } } }))));
      else insp.replaceChildren(tabsI, el('div', 'ws-ins', [sel ? el('div', 'ws-big', [], { text: sel.label }) : null, sel && sel.sub ? el('div', 'ws-sub', [], { text: sel.sub }) : null].concat(((sel && sel.fields) || []).map(f => field(f, true)))
        .concat((K.status ? K.status(d) : []).map(([k, v]) => el('div', 'ws-kv', [el('span', '', [], { text: k }), el('b', '', [], { text: String(v) })])))));
      status.replaceChildren(...(K.status ? K.status(d) : []).map(([k, v]) => el('span', '', [k + ' ', el('b', '', [], { text: String(v) })])), el('span', 'ws-r', [], { text: (past.length ? past.length + ' EDITS · ' : '') + 'LIVE' }));
      draw();
    }
    const onKey = (e) => { if (!root.isConnected) return; const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'Escape') { e.preventDefault(); close(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } };
    const onResize = () => draw();
    cv.addEventListener('pointerdown', (e) => { if (!K.pick) return; const r = cv.getBoundingClientRect(), p = K.pick(d, e.clientX - r.left, e.clientY - r.top, r.width, r.height, { selected }); if (p && p.key !== undefined) edit(p.key, p.value, p.label); });
    function close() { if (!root.isConnected) return; root.remove(); doc.documentElement.classList.remove('ws-open'); global.removeEventListener('keydown', onKey, true); global.removeEventListener('resize', onResize); if (current === api) current = null; if (o.onClose) o.onClose(clone(d)); }
    global.addEventListener('keydown', onKey, true); global.addEventListener('resize', onResize);
    doc.body.appendChild(root); doc.documentElement.classList.add('ws-open'); render(); global.requestAnimationFrame(draw);
    const api = { el: root, doc: () => clone(d), set: (k, v, label) => edit(k, v, label), select: (id) => { selected = id; render(); }, undo, redo, history: () => hist.map(h2 => h2.label), close, kind: K.id };
    current = api; return api;
  }
  global.Workshop = { check, addKind, open, kinds: () => Array.from(KINDS.keys()), TYPES, get current() { return current; } };
})(window);

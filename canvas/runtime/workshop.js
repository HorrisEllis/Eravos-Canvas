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
 * W3a (optional): drawLayer(g, W, H, doc, layerId, { wire, selected }) → the 3D viewport (layers as planes) · stroke(doc, points, W, H,
 *   { selected }) → { key, value, label } (a drag that draws) · actions(doc, { selected }) items may be { label, key, value } (an edit) ·
 *   stationKey (a station click = edit(stationKey, index)).
 * A kind: { id, label, layers(doc) → [{ id, label, group, type, sub, fields: [{ key, label, type: number|enum|text, min, max, step, unit,
 *   options }] }], get(doc, key), set(doc, key, value) → doc, draw(g, W, H, doc, { selected, hover }), apply(doc)?, title(doc)?, stations(doc)?,
 *   outline(doc)? → [[depth, text, layerId?]], status(doc)? → [[label, value]], tools? [{ id, label, glyph, layer? }],
 *   pick(doc, x, y, W, H)? → a key/value edit for a click in the viewport (the kind decides what a click means),
 *   actions(doc)? → [{ label, hint, run(doc) → words to show }] (buttons in the bar: where the document can go — the kind says) }
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
    ['drawLayer', 'stroke', 'actions', 'pick'].forEach(f => { if (k[f] !== undefined && typeof k[f] !== 'function') p.push(f + ': a function, when given'); });
    return p;
  }
  function addKind(k) { const problems = check(k); if (!problems.length) KINDS.set(k.id, k); return { ok: !problems.length, problems }; }

  let current = null;
  function open(kindId, doc0, o) {
    o = o || {}; const K = KINDS.get(kindId); if (!K) throw new Error('Workshop: no kind "' + kindId + '"');
    if (current) current.close();
    let d = clone(doc0 || {}), selected = null, note = '', past = [], future = [], hist = [{ label: 'OPENED', doc: clone(d) }];
    const root = el('div', 'ws-app', [], { role: 'dialog', 'aria-label': K.label });
    const bar = el('div', 'ws-bar'), opts = el('div', 'ws-opts'), strip = el('div', 'ws-strip'), tabs = el('div', 'ws-tabs'), vp = el('div', 'ws-vp');
    const cv = el('canvas', 'ws-canvas'), vph = el('div', 'ws-vph'); vp.append(cv, vph);
    // W3a the viewport: 2D (the kind's draw) or 3D (the kind's layers as planes; K.drawLayer) — orbit, top, front, exploded / flat, wire / lit
    let mode = '2d', exploded = true, wire = false, cam = { yaw: -0.55, pitch: 0.62, zoom: 1 }, stroke = null, orbit = null;
    const offs = new Map();
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
      hist.push({ label: (label || key) + (value !== null && typeof value === 'object' ? '' : ' · ' + (typeof value === 'number' ? +value.toFixed(3) : String(value))), doc: clone(d) }); if (hist.length > 200) hist.splice(1, 1);
      if (o.onChange) { try { o.onChange(clone(d)); } catch (e) { console.error(e); } } render();
    }
    function restore(x, label) { d = clone(x); if (o.onChange) { try { o.onChange(clone(d)); } catch (e) { console.error(e); } } hist.push({ label, doc: clone(d) }); render(); }
    function undo() { if (!past.length) return false; future.push(clone(d)); restore(past.pop(), 'UNDO'); return true; }
    function redo() { if (!future.length) return false; past.push(clone(d)); restore(future.pop(), 'REDO'); return true; }

    function draw() {
      const r = vp.getBoundingClientRect(), dpr = Math.min(2, global.devicePixelRatio || 1), W = Math.max(50, r.width), H = Math.max(50, r.height);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      try { if (mode === '3d' && K.drawLayer) draw3d(g, W, H, dpr); else K.draw(g, W, H, d, { selected }); } catch (e) { console.error(e); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stroke && stroke.pts.length > 1) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); stroke.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); }
    }
    // a plane in space is an affine map of its 2D drawing (near-orthographic camera): x = across the layer, z = into it, y = its height
    function proj(W, H, x, y, z) {
      const s = Math.min(W * 0.34, H * 0.5) * cam.zoom, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      return [W / 2 + s * (x * cy - z * sy), H / 2 - s * y * cp + s * (x * sy + z * cy) * sp];
    }
    function draw3d(g, W, H, dpr) {
      const L = layers().filter(l => !l.hidden), n = L.length, PW = 512, PH = 256, A = 1, B = 0.42, gap = exploded ? Math.min(0.42, 1.15 / Math.max(1, n)) : 0.025;
      g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
      // the floor: a faint grid under the stack
      const fy = -((n - 1) / 2) * gap - 0.18; g.strokeStyle = 'rgba(120,150,180,0.08)'; g.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { let a = proj(W, H, i / 6 * 1.3, fy, -0.9), b = proj(W, H, i / 6 * 1.3, fy, 0.9); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        a = proj(W, H, -1.3, fy, i / 6 * 0.9); b = proj(W, H, 1.3, fy, i / 6 * 0.9); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      L.forEach((l, i) => {
        let o = offs.get(l.id); if (!o) { o = doc.createElement('canvas'); o.width = PW; o.height = PH; offs.set(l.id, o); }
        const og = o.getContext('2d'); og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, PW, PH);
        try { K.drawLayer(og, PW, PH, d, l.id, { wire, selected: l.id === selected }); } catch (e) { console.error(e); }
        const h = (i - (n - 1) / 2) * gap, p0 = proj(W, H, -A, h, -B), px = proj(W, H, A, h, -B), pz = proj(W, H, -A, h, B), p3 = proj(W, H, A, h, B);
        const sel = l.id === selected;
        // the plane: glass, its frame, its name
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(px[0], px[1]); g.lineTo(p3[0], p3[1]); g.lineTo(pz[0], pz[1]); g.closePath();
        if (!wire) { g.fillStyle = sel ? 'rgba(0,212,255,0.07)' : 'rgba(140,170,200,0.035)'; g.fill(); }
        g.strokeStyle = sel ? 'rgba(0,212,255,0.75)' : 'rgba(140,170,200,0.22)'; g.lineWidth = sel ? 1.4 : 1; g.stroke();
        g.setTransform(dpr * (px[0] - p0[0]) / PW, dpr * (px[1] - p0[1]) / PW, dpr * (pz[0] - p0[0]) / PH, dpr * (pz[1] - p0[1]) / PH, dpr * p0[0], dpr * p0[1]);
        if (!wire) g.globalCompositeOperation = 'lighter';
        g.drawImage(o, 0, 0); g.globalCompositeOperation = 'source-over';
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = sel ? '#00d4ff' : 'rgba(170,190,210,0.7)'; g.font = '10px "DM Mono", monospace';
        const lx = Math.min(p0[0], pz[0]) - 8; g.textAlign = 'right'; g.fillText(String(l.label).toUpperCase(), lx, (p0[1] + pz[1]) / 2 + 3); g.textAlign = 'left';
      });
      // the axis gizmo
      const gx = W - 46, gy = 46, ax = [[1, 0, 0, '#ff4d6d', 'X'], [0, 1, 0, '#2bff88', 'Y'], [0, 0, 1, '#00d4ff', 'Z']], o0 = proj(W, H, 0, 0, 0);
      g.strokeStyle = 'rgba(140,170,200,0.25)'; g.beginPath(); g.arc(gx, gy, 30, 0, Math.PI * 2); g.stroke();
      ax.forEach(([x, y, z, c, t]) => { const q = proj(W, H, x * 0.12 / cam.zoom, y * 0.12 / cam.zoom, z * 0.12 / cam.zoom); const dx = q[0] - o0[0], dy = q[1] - o0[1], k = 24 / Math.max(1e-6, Math.hypot(dx, dy) || 1) * Math.min(1, Math.hypot(dx, dy) / 8);
        g.strokeStyle = c; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + dx * k, gy + dy * k); g.stroke(); g.fillStyle = c; g.fillText(t, gx + dx * k + 3, gy + dy * k + 3); });
    }
    function chips() {
      if (!K.drawLayer) { vph.replaceChildren(); return; }
      const chip = (t, on, fn, title) => el('button', 'ws-chip' + (on ? ' on' : ''), [], { type: 'button', text: t, title: title || '', onclick: () => { fn(); chips(); draw(); } });
      vph.replaceChildren(chip('2D', mode === '2d', () => { mode = '2d'; }), chip('3D', mode === '3d', () => { mode = '3d'; }), el('span', 'ws-vs'),
        chip('TOP', mode === '3d' && cam.pitch > 1.5, () => { mode = '3d'; cam.pitch = Math.PI / 2 - 0.001; cam.yaw = 0; }, 'look down on the stack'),
        chip('FRONT', mode === '3d' && Math.abs(cam.yaw) < 0.01 && cam.pitch < 0.3, () => { mode = '3d'; cam.pitch = 0.18; cam.yaw = 0; }, 'look at it from the front'),
        chip('ORBIT', false, () => { mode = '3d'; cam = { yaw: -0.55, pitch: 0.62, zoom: 1 }; }, 'back to the turned view (drag to turn, wheel to zoom)'), el('span', 'ws-vs'),
        chip('EXPLODED', exploded, () => { exploded = true; }), chip('FLAT', !exploded, () => { exploded = false; }), el('span', 'ws-vs'),
        chip('WIRE', wire, () => { wire = true; }), chip('LIT', !wire, () => { wire = false; }));
    }
    function render() {
      const L = layers(); if (!selected || !layerOf(selected)) selected = (L.find(l => l.fields && l.fields.length) || L[0] || {}).id || null;
      const sel = layerOf(selected), title = (o.title || (K.title ? K.title(d) : K.label));
      // the bar: the name, the kind's stations (where this document sits), the actions
      bar.replaceChildren(el('span', 'ws-name', [], { text: 'WORKSHOP' }), el('span', 'ws-sep'),
        el('span', 'ws-stations', (K.stations ? K.stations(d) : [K.label]).map((s, i, a) => el('span', 'ws-st' + (i === a.length - 1 ? ' on' : '') + (K.stationKey && i < a.length - 1 ? ' go' : ''), [el('i', '', [], { text: String(i + 1).padStart(2, '0') }), String(s)],
          K.stationKey && i < a.length - 1 ? { title: 'go up to ' + s, onclick: () => edit(K.stationKey, i, 'GO TO ' + s) } : {}))),
        el('span', 'ws-end', [].concat((K.actions ? K.actions(d, { selected }) : []).map(a => el('button', 'ws-btn ghost', [], { type: 'button', text: a.label, title: a.hint || '', disabled: !!a.disabled, onclick: () => {
          if (a.key !== undefined) return edit(a.key, a.value, a.label);   // W3a: an action that is an edit (one history step)
          let said = null; try { said = a.run(clone(d)); } catch (e) { said = 'failed: ' + e.message; console.error(e); } if (said) { note = String(said); render(); } } })), [el('button', 'ws-btn ghost', [], { type: 'button', text: 'UNDO', title: 'Ctrl+Z', onclick: undo }), el('button', 'ws-btn ghost', [], { type: 'button', text: 'REDO', title: 'Ctrl+Shift+Z', onclick: redo }),
          el('button', 'ws-btn send', [], { type: 'button', text: 'APPLY →', title: 'write it back to where it came from', onclick: () => { if (o.onApply) o.onApply(clone(d)); else if (K.apply) K.apply(clone(d)); } }),
          el('button', 'ws-btn ghost', [], { type: 'button', text: '×', title: 'close (Esc)', 'aria-label': 'close', onclick: () => close() })])));
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
      status.replaceChildren(...(K.status ? K.status(d) : []).map(([k, v]) => el('span', '', [k + ' ', el('b', '', [], { text: String(v) })])), el('span', 'ws-r', [], { text: (note ? note + ' · ' : '') + (past.length ? past.length + ' EDITS · ' : '') + 'LIVE' }));
      chips(); draw();
    }
    const onKey = (e) => { if (!root.isConnected) return; const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'Escape') { e.preventDefault(); close(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } };
    const onResize = () => draw();
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (mode === '3d' && K.drawLayer) { orbit = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
      const p = K.pick ? K.pick(d, x, y, r.width, r.height, { selected }) : null; if (p && p.key !== undefined) return edit(p.key, p.value, p.label);
      if (K.stroke) { stroke = { pts: [[x, y]] }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
    });
    cv.addEventListener('pointermove', (e) => {
      if (orbit) { cam.yaw = orbit.yaw + (e.clientX - orbit.x) * 0.008; cam.pitch = Math.max(0.02, Math.min(Math.PI / 2 - 0.001, orbit.pitch + (e.clientY - orbit.y) * 0.006)); draw(); return; }
      if (stroke) { const r = cv.getBoundingClientRect(); stroke.pts.push([e.clientX - r.left, e.clientY - r.top]); draw(); }
    });
    const endPointer = () => {
      if (orbit) { orbit = null; chips(); return; }
      if (!stroke) return; const st = stroke; stroke = null; const r = cv.getBoundingClientRect();
      if (st.pts.length > 1) { let res = null; try { res = K.stroke(d, st.pts, r.width, r.height, { selected }); } catch (e) { console.error(e); } if (res && res.key !== undefined) return edit(res.key, res.value, res.label); }
      draw();
    };
    cv.addEventListener('pointerup', endPointer); cv.addEventListener('pointercancel', endPointer);
    cv.addEventListener('wheel', (e) => { if (mode !== '3d') return; e.preventDefault(); cam.zoom = Math.max(0.3, Math.min(4, cam.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); draw(); }, { passive: false });
    function close() { if (!root.isConnected) return; root.remove(); doc.documentElement.classList.remove('ws-open'); global.removeEventListener('keydown', onKey, true); global.removeEventListener('resize', onResize); if (current === api) current = null; if (o.onClose) o.onClose(clone(d)); }
    global.addEventListener('keydown', onKey, true); global.addEventListener('resize', onResize);
    doc.body.appendChild(root); doc.documentElement.classList.add('ws-open'); render(); global.requestAnimationFrame(draw);
    const api = { el: root, doc: () => clone(d), set: (k, v, label) => edit(k, v, label), select: (id) => { selected = id; render(); }, undo, redo, history: () => hist.map(h2 => h2.label), close, kind: K.id,
      get selected() { return selected; },
      // W3a: the viewport (for tests and the kind's own buttons)
      view: (o2) => { if (o2) { if (o2.mode) mode = o2.mode; if (o2.exploded !== undefined) exploded = !!o2.exploded; if (o2.wire !== undefined) wire = !!o2.wire; if (o2.cam) Object.assign(cam, o2.cam); chips(); draw(); } return { mode, exploded, wire, cam: Object.assign({}, cam) }; },
      stroke: (pts) => { const r = cv.getBoundingClientRect(); const res = K.stroke ? K.stroke(d, pts, r.width, r.height, { selected }) : null; if (res && res.key !== undefined) edit(res.key, res.value, res.label); return !!res; },
      action: (label) => { const a = (K.actions ? K.actions(d, { selected }) : []).find(x => x.label === label); if (!a || a.disabled) return false; if (a.key !== undefined) edit(a.key, a.value, a.label); else a.run(clone(d)); return true; } };
    current = api; return api;
  }
  global.Workshop = { check, addKind, open, kinds: () => Array.from(KINDS.keys()), TYPES, get current() { return current; } };
})(window);

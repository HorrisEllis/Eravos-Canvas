/* ERAVOS music — the INSTRUMENT kind on the Workshop (I1 · specs/eravos.ui-field.spec ADDENDUM 2026-11-12) → window.InstrumentWorkshop.
 * His words (2026-11-09): "constraint field of nodes? maybe it can use what ever language it wants if the tool imports the ui elements, or the
 * canvas dynamically changes around the dag. like could always have each tool, or domain have a template or every kind, or what ever?" ·
 * "How hard would that be to edit?" · (2026-11-12) "Start."
 * ONE kind (`music.instrument`) for every tool, generated from the tool's own settings — no code per tool. Templates, inherited: the canvas's
 * Workshop → the music domain's stage words (below) → this kind → the tool: only its settings.
 * The view is the editor: drag a bar to set it — live, the tool hears it while the hand moves; one history step when it lets go (Shift = fine);
 * click a word to step to its next choice; click a node to select its stage. Undo puts the tool back. Settings reach the tool the way its own
 * knobs do (ui:config_change), and are read through the registry (readParam) — no tool's internals are touched.
 *   InstrumentWorkshop.open(instanceId) → the Workshop's api · .KIND · .stageOf(group, isInstrument) · .groupsOf(def) · .wiresOf(def) */
(function (global) {
  'use strict';
  // the MUSIC domain's stage words: a group of settings → the stage of the sound it is
  const STAGES = [
    ['CONTROL', /^(voice|cards?|arp|.*seq.*|tempo|play|keys?|pattern|steps?|notes?|trigger|gate)$/i, 'what plays it'],
    ['SOURCE', /^(dco|vco|osc.*|sub|noise|unison|wave.*|table|partials?|swarm|pop.*|body|string|exciter|tone|kit|pads?|sample.*|source)$/i, 'where the sound starts'],
    ['MOD', /^(lfo.*|poly-?mod|mod.*|velocity|env ?mod|random|drift|wobble|motion|life)$/i, 'what moves it'],
    ['SHAPE', /^(vcf|filter.*|drive|shaper|formant|eq|tone ?shape|dist.*|crush|sat.*|character)$/i, 'what shapes its tone'],
    ['AMP', /^(env.*|amp|vca|dynamics|comp.*|adsr)$/i, 'how loud, over time'],
    ['FX', /^(fx|chorus\+?|delay|echo|reverb|space|bbd|stereo|width|tape)$/i, 'what it passes through'],
    ['OUT', /^(out|output|mix|level|master)$/i, 'where it leaves'],
  ];
  const ORDER = ['CONTROL', 'SOURCE', 'SHAPE', 'AMP', 'FX', 'OUT'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = () => global.OrganismFactory, KN = () => global.Kernel;
  const isInst = (def) => (def.hooks || []).some(hk => hk.direction === 'in' && /note:trigger/.test(String(hk.event_type || '')));
  const stageOf = (g, inst) => (STAGES.find(s => s[1].test(String(g || '').trim())) || [inst ? 'SOURCE' : 'SHAPE'])[0];
  const word = (st) => (STAGES.find(s => s[0] === st) || [0, 0, ''])[2];
  const isNum = (c) => (c.type === 'number' || c.type === 'integer') && isFinite(c.min) && isFinite(c.max) && c.max > c.min;
  const optsOf = (c) => c.type === 'boolean' ? [true, false] : (c.options || []).map(o => (o && typeof o === 'object') ? o.value : o);
  const cache = new Map();
  function groupsOf(def) {
    if (cache.has(def.id)) return cache.get(def.id);
    const inst = isInst(def), cfg = (def.config || []).filter(c => !c.hidden && !c.settingsOnly && c.type !== 'object' && c.key && (isNum(c) || c.type === 'boolean' || (c.type === 'enum' && optsOf(c).length > 1)));
    const groups = []; cfg.forEach(c => { const gid = c.group || 'SETTINGS'; let g = groups.find(x => x.id === gid); if (!g) groups.push(g = { id: gid, stage: stageOf(gid, inst), knobs: [] }); g.knobs.push(c); });
    const rank = (st) => st === 'MOD' ? 9 : ORDER.indexOf(st); groups.sort((a, b) => rank(a.stage) - rank(b.stage));
    cache.set(def.id, groups); return groups;
  }
  const knobOf = (def, key) => { for (const g of groupsOf(def)) { const c = g.knobs.find(k => k.key === key); if (c) return c; } return null; };
  // the wires the settings themselves state: a modulator's setting labelled "… → x" goes to the stage that owns a setting called x
  function wiresOf(def) {
    const groups = groupsOf(def), out = [];
    groups.filter(g => g.stage === 'MOD').forEach(m => m.knobs.forEach(c => {
      const mm = /(?:→|->)\s*([\w ]+)$/.exec(String(c.label || '')); if (!mm) return; const w = mm[1].trim().toLowerCase();
      const hit = groups.find(g => g.stage !== 'MOD' && g.knobs.some(k => String(k.label || '').toLowerCase().startsWith(w) || String(k.key).toLowerCase().startsWith(w)))
        || (w === 'pitch' ? groups.find(g => g.stage === 'SOURCE') : w === 'level' ? groups.find(g => g.stage === 'OUT' || g.stage === 'AMP') : null);
      if (hit && !out.some(x => x.from === m.id && x.to === hit.id)) out.push({ from: m.id, to: hit.id, by: c.key });
    }));
    return out;
  }
  const defOf = (d) => (F() && F().def(d.organism)) || { id: d.organism, config: [] };
  const norm = (c, v) => clamp(((+v) - c.min) / (c.max - c.min), 0, 1);
  const show = (c, v) => c.type === 'boolean' ? (v ? 'on' : 'off') : isNum(c) ? String(Math.round(+v * 1000) / 1000) + (c.unit ? ' ' + c.unit : '') : String(v);

  // ---- where everything is in the view (one place: draw, pick and drag all read it)
  function layout(def, W, H) {
    const groups = groupsOf(def), mods = groups.filter(g => g.stage === 'MOD'), used = ORDER.filter(st => groups.some(g => g.stage === st)), pos = new Map();
    const top = mods.length ? Math.round(H * 0.34) : 44, cw = (W - 40) / Math.max(1, used.length), bottom = H - 30;
    used.forEach((st, ci) => { const list = groups.filter(g => g.stage === st), h = Math.min(190, (bottom - top - 8) / list.length - 12);
      list.forEach((g, i) => pos.set(g.id, { x: 20 + ci * cw + 6, y: top + 8 + i * (h + 12), w: cw - 18, h })); });
    const mw = Math.min(260, (W - 40) / Math.max(1, mods.length) - 14); mods.forEach((g, i) => pos.set(g.id, { x: 20 + i * (mw + 14) + Math.max(0, (W - 40 - mods.length * (mw + 14)) / 2), y: 40, w: mw, h: top - 78 }));
    // inside a node: number settings as bar slots, choices as word slots along its foot
    const parts = new Map();
    groups.forEach(g => { const b = pos.get(g.id), nums = g.knobs.filter(isNum), rest = g.knobs.filter(c => !isNum(c)), hasWords = rest.length > 0;
      const slot = (b.w - 16) / Math.max(1, nums.length), bw = Math.max(4, Math.min(16, slot * 0.5)), by = b.y + 24, bh = Math.max(8, b.h - 24 - 16 - (hasWords ? 18 : 4));
      const ws = (b.w - 16) / Math.max(1, rest.length);
      parts.set(g.id, { bars: nums.map((c, i) => ({ c, x: b.x + 8 + i * slot, w: slot, bx: b.x + 8 + i * slot + (slot - bw) / 2, bw, y: by, h: bh })), words: rest.map((c, i) => ({ c, x: b.x + 8 + i * ws, w: ws, y: b.y + b.h - 18, h: 16 })) }); });
    return { groups, used, pos, parts, top, cw };
  }
  function hit(def, x, y, W, H) {
    const L = layout(def, W, H);
    for (const g of L.groups) { const b = L.pos.get(g.id); if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue; const p = L.parts.get(g.id);
      const bar = p.bars.find(q => x >= q.x && x < q.x + q.w && y >= q.y - 6 && y <= q.y + q.h + 14), wd = p.words.find(q => x >= q.x && x < q.x + q.w && y >= q.y - 2);
      return { g, bar: wd ? null : bar, word: wd || null }; }
    return null;
  }

  const KIND = {
    id: 'music.instrument', label: 'Instrument', toolset: ['select', 'pen', 'orbit'],
    title: (d) => d.label || d.organism,
    stations: (d) => ['SONG', (d.label || d.organism).toUpperCase(), 'ITS SOUND'],
    layers(d) { const def = defOf(d); return groupsOf(def).map(g => ({ id: g.id, group: g.stage + ' — ' + word(g.stage), type: 'curve', label: g.id,
      sub: g.knobs.length + ' settings · ' + g.knobs.slice(0, 4).map(c => c.label || c.key).join(', ') + (g.knobs.length > 4 ? '…' : ''),
      fields: g.knobs.map(c => isNum(c) ? { key: c.key, label: c.label || c.key, type: 'number', min: c.min, max: c.max, step: c.step || (c.type === 'integer' ? 1 : (c.max - c.min) / 200), unit: c.unit || '' }
        : { key: c.key, label: c.label || c.key, type: 'enum', options: c.type === 'boolean' ? ['on', 'off'] : optsOf(c) }) })); },
    get(d, k) { const c = knobOf(defOf(d), k), v = d.values[k]; return c && c.type === 'boolean' ? (v ? 'on' : 'off') : v; },
    set(d, k, v) { const c = knobOf(defOf(d), k); if (!c) return d; const out = Object.assign({}, d, { values: Object.assign({}, d.values) });
      out.values[k] = c.type === 'boolean' ? (v === true || v === 'on') : isNum(c) ? (c.type === 'integer' ? Math.round(clamp(+v, c.min, c.max)) : clamp(+v, c.min, c.max)) : (optsOf(c).includes(v) ? v : d.values[k]);
      return out; },
    outline(d) { const def = defOf(d); return [[0, d.label || d.organism]].concat(groupsOf(def).map(g => [1, g.stage + ' · ' + g.id, g.id])); },
    status(d) { const def = defOf(d), gs = groupsOf(def); return [['SETTINGS', gs.reduce((n, g) => n + g.knobs.length, 0)], ['STAGES', gs.length], ['WIRES', wiresOf(def).length]]; },
    hint: (d, o) => o && o.mode === '3d' ? '3D — drag to turn · click a plane to select its stage · 2 for the flow'
      : 'Drag a bar to set it — you hear it while you drag (Shift: fine) · click a word for its next choice · click a stage to see all of it on the right · Space plays · Ctrl+Z undoes',
    actions(d) { const inst = isInst(defOf(d)); return inst ? [{ label: '▶ HEAR', name: 'Hear it', keys: 'Space', strip: true, icon: '▶', hint: 'play a note on it', run: () => { KN().bus.publish('ui:audition:' + d.target, {}); return ''; } }] : []; },
    // the flow: stages left to right in the order the sound goes, modulators above; a bar per number, a word per choice
    draw(g, W, H, d, o) {
      const def = defOf(d), L = layout(def, W, H), sel = (o && o.selected) || '';
      g.fillStyle = '#05080d'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a7a96'; g.font = '10px monospace'; g.fillText('THE SOUND OF ' + String(d.label || d.organism).toUpperCase() + ' — FROM ITS OWN SETTINGS', 20, 22);
      L.used.forEach((st, ci) => { g.fillStyle = '#2e4a60'; let t = st + ' · ' + word(st); while (t.length > st.length && g.measureText(t).width > L.cw - 20) t = t.slice(0, -1); g.fillText(t.length > st.length + 3 ? t : st, 20 + ci * L.cw + 6, L.top); });
      const by = (st) => L.groups.filter(x => x.stage === st);
      for (let i = 0; i < L.used.length - 1; i++) by(L.used[i]).forEach(a => by(L.used[i + 1]).forEach(b => { const p = L.pos.get(a.id), q = L.pos.get(b.id);
        g.strokeStyle = 'rgba(0,212,255,0.3)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(p.x + p.w, p.y + p.h / 2); g.bezierCurveTo(p.x + p.w + 14, p.y + p.h / 2, q.x - 14, q.y + q.h / 2, q.x, q.y + q.h / 2); g.stroke(); }));
      wiresOf(def).forEach(w => { const p = L.pos.get(w.from), q = L.pos.get(w.to), c = knobOf(def, w.by), amt = c && isNum(c) ? norm(c, d.values[w.by]) : 0.5;
        g.strokeStyle = 'rgba(255,79,216,' + (0.15 + 0.6 * amt) + ')'; g.lineWidth = 1 + 1.5 * amt; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(p.x + p.w / 2, p.y + p.h); g.bezierCurveTo(p.x + p.w / 2, p.y + p.h + 36, q.x + q.w / 2, q.y - 36, q.x + q.w / 2, q.y); g.stroke(); g.setLineDash([]); });
      L.groups.forEach(gr => { const b = L.pos.get(gr.id), P = L.parts.get(gr.id), on = gr.id === sel, mod = gr.stage === 'MOD';
        g.fillStyle = '#070b11'; g.fillRect(b.x, b.y, b.w, b.h); g.fillStyle = on ? 'rgba(0,212,255,0.07)' : 'rgba(140,170,200,0.03)'; g.fillRect(b.x, b.y, b.w, b.h);
        g.strokeStyle = on ? '#00d4ff' : mod ? 'rgba(255,79,216,0.5)' : 'rgba(140,170,200,0.28)'; g.lineWidth = on ? 1.6 : 1; g.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
        g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
        g.fillStyle = on ? '#00d4ff' : '#b8cfe0'; g.font = '600 11px monospace'; g.fillText(gr.id, b.x + 8, b.y + 15);
        P.bars.forEach(q => { const v = norm(q.c, d.values[q.c.key]); g.fillStyle = 'rgba(140,170,200,0.10)'; g.fillRect(q.bx, q.y, q.bw, q.h);
          g.fillStyle = mod ? '#ff4fd8' : on ? '#00d4ff' : '#4fb8d8'; g.fillRect(q.bx, q.y + q.h * (1 - v), q.bw, Math.max(2, q.h * v));
          g.fillStyle = '#e8fbff'; g.fillRect(q.bx - 2, q.y + q.h * (1 - v) - 1, q.bw + 4, 2);   // the grip
          g.fillStyle = '#5a7a96'; g.font = '8px monospace'; let lb = String(q.c.label || q.c.key); while (lb.length > 2 && g.measureText(lb).width > q.w - 2) lb = lb.slice(0, -1); g.fillText(lb, q.x + Math.max(0, (q.w - g.measureText(lb).width) / 2), q.y + q.h + 11); });
        P.words.forEach(q => { g.fillStyle = 'rgba(140,170,200,0.07)'; g.fillRect(q.x + 1, q.y, q.w - 2, q.h - 2); g.font = '9px monospace'; let t = (q.c.label || q.c.key) + ': ' + show(q.c, d.values[q.c.key]); while (t.length > 3 && g.measureText(t).width > q.w - 8) t = t.slice(0, -1);
          g.fillStyle = '#9fb6c9'; g.fillText(t, q.x + 5, q.y + 11); });
        g.restore(); });
    },
    drawLayer(g, W, H, d, id, o) {
      const def = defOf(d), gr = groupsOf(def).find(x => x.id === id); if (!gr) return; const nums = gr.knobs.filter(isNum), slot = (W - 40) / Math.max(1, nums.length), w2 = Math.min(18, slot * 0.35), col = gr.stage === 'MOD' ? '#ff4fd8' : (o && o.selected) ? '#00d4ff' : '#4fb8d8';
      g.shadowColor = col; g.shadowBlur = o && o.wire ? 0 : 8;
      nums.forEach((c, i) => { const v = norm(c, d.values[c.key]), x = 20 + i * slot + (slot - w2) / 2, h2 = Math.max(3, (H - 40) * v); g.globalAlpha = 0.55; g.fillStyle = col; g.fillRect(x, H - 20 - h2, w2, h2); g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x, H - 20 - h2, w2, h2); });
      g.shadowBlur = 0;
    },
    // a click: a word steps to its next choice; a stage (not on a bar) is selected
    pick(d, x, y, W, H, o) {
      const def = defOf(d), h = hit(def, x, y, W, H); if (!h) return null;
      if (h.word) { const c = h.word.c, os = optsOf(c), i = os.indexOf(d.values[c.key]), nx = os[(i + 1) % os.length]; return { key: c.key, value: c.type === 'boolean' ? (nx ? 'on' : 'off') : nx, label: c.label || c.key }; }
      if (!h.bar && o && o.selected !== h.g.id) return { run: () => { const ws = global.Workshop && global.Workshop.current; if (ws) ws.select(h.g.id); } };
      return null;
    },
    // a drag on a bar sets it: where the hand is, or — Shift — a quarter as far from where it was
    drag(d, tool, pts, W, H, o) {
      const def = defOf(d), h = hit(def, pts[0][0], pts[0][1], W, H); if (!h || !h.bar) return null;
      const q = h.bar, c = q.c, last = pts[pts.length - 1], abs = 1 - (last[1] - q.y) / q.h;
      const f = o && o.shift ? norm(c, d.values[c.key]) - (last[1] - pts[0][1]) / q.h * 0.25 : abs, v = c.min + clamp(f, 0, 1) * (c.max - c.min);
      const step = c.step || (c.type === 'integer' ? 1 : 0), val = step ? Math.round(v / step) * step : v;
      return { key: c.key, value: +clamp(val, c.min, c.max).toPrecision(8), label: c.label || c.key };
    },
  };
  function ensure() { const W = global.Workshop; if (!W) return false; if (W.kinds().includes(KIND.id)) return true; const r = W.addKind(KIND); if (!r.ok) console.error('InstrumentWorkshop: the Field refused the kind —', r.problems.join('; ')); return r.ok; }
  function open(instanceId) {
    const K = KN(), rec = K && K.registry.get(instanceId); if (!rec || !ensure()) return null;
    const def = rec.descriptor, values = {};
    groupsOf(def).forEach(g => g.knobs.forEach(c => { let v; try { v = K.registry.readParam('kernel', instanceId, c.key); } catch (e) {} values[c.key] = v === undefined ? c.default : v; }));
    // what the tool was last told: only what differs goes out (a drag sends one setting; undo sends back what it changed)
    let sent = Object.assign({}, values);
    const push = (d) => { Object.keys(d.values).forEach(k => { if (d.values[k] !== sent[k]) { sent[k] = d.values[k]; K.bus.publish('ui:config_change:' + instanceId, { key: k, value: d.values[k] }); } }); };
    return global.Workshop.open(KIND.id, { organism: def.id, target: instanceId, label: def.label || def.id, values }, { title: def.label || def.id, onChange: push, onLive: push });
  }
  // right-click any tool's window › Open on the Workshop
  if (global.ContextMenu && global.ContextMenu.contribute) global.ContextMenu.contribute(({ def, instanceId }) => {
    if (!def || !global.Workshop || !groupsOf(def).length) return [];
    return [{ label: '◇ Open on the Field', hint: 'its whole sound as a flow you can grab — every setting, live', run: () => open(instanceId) }];
  });
  global.InstrumentWorkshop = { open, KIND, ensure, stageOf, groupsOf, wiresOf, layout, STAGES, ORDER };
})(typeof window !== 'undefined' ? window : globalThis);

/* PREVIEW ONLY (not loaded by ERAVOS) — the INSTRUMENT kind, generated from any tool's settings (specs/eravos.ui-field.spec ADDENDUM 2026-11-09).
 * His words (2026-11-09): "constraint field of nodes? maybe it can use what ever language it wants if the tool imports the ui elements, or the canvas
 * dynamically changes around the dag. like could always have each tool, or domain have a template or every kind, or what ever?" · "Preview first."
 * Templates, inherited: the CANVAS's Workshop (panels, keys, toolbar, 3D) → the MUSIC domain's stage words (what a group of settings IS in a
 * sound: control, source, mod, shape, amp, fx, out) → the INSTRUMENT kind (the signal flow from those stages) → the TOOL: nothing written by
 * hand — its settings (config groups) and its spec are enough. Run on the real Retro DCO: window.__instrumentPreview(instanceId). */
(function (global) {
  'use strict';
  // the MUSIC domain template: a settings group → the stage of the sound it belongs to (words a domain gives the canvas)
  const STAGES = [
    ['CONTROL', /^(voice|cards?|arp|seq|tempo|play|keys?)$/i, 'what plays it'],
    ['SOURCE', /^(dco|vco|osc.*|sub|noise|unison|wave.*|table|partials|swarm|pop.*|body|string|exciter)$/i, 'where the sound starts'],
    ['MOD', /^(lfo.*|poly-?mod|mod.*|velocity|env ?mod|random|drift)$/i, 'what moves it'],
    ['SHAPE', /^(vcf|filter.*|drive|shaper|formant)$/i, 'what shapes its tone'],
    ['AMP', /^(env.*|amp|vca|dynamics)$/i, 'how loud, over time'],
    ['FX', /^(fx|chorus\+?|chorus|delay|reverb|space|bbd)$/i, 'what it passes through'],
    ['OUT', /^(out|output|mix|level)$/i, 'where it leaves'],
  ];
  const ORDER = ['CONTROL', 'SOURCE', 'SHAPE', 'AMP', 'FX', 'OUT'];
  const stageOf = (g) => (STAGES.find(s => s[1].test(String(g || '').trim())) || ['SOURCE'])[0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = (c, v) => c.type === 'number' || c.type === 'integer' ? clamp((v - c.min) / ((c.max - c.min) || 1), 0, 1) : null;

  function makeKind(def, values) {
    const cfg = (def.config || []).filter(c => !c.hidden && !c.settingsOnly && c.group && c.type !== 'object');
    const groups = []; cfg.forEach(c => { let g = groups.find(x => x.id === c.group); if (!g) groups.push(g = { id: c.group, stage: stageOf(c.group), knobs: [] }); g.knobs.push(c); });
    groups.sort((a, b) => (ORDER.indexOf(a.stage) < 0 ? 2.5 : ORDER.indexOf(a.stage)) - (ORDER.indexOf(b.stage) < 0 ? 2.5 : ORDER.indexOf(b.stage)));
    const field = (c) => c.type === 'enum' ? { key: c.key, label: c.label, type: 'enum', options: c.options.map(o => typeof o === 'object' ? o.value : o) }
      : c.type === 'boolean' ? { key: c.key, label: c.label, type: 'enum', options: ['on', 'off'] }
      : { key: c.key, label: c.label, type: 'number', min: c.min, max: c.max, step: c.step || (c.type === 'integer' ? 1 : (c.max - c.min) / 200), unit: c.unit || '' };
    const word = (st) => (STAGES.find(s => s[0] === st) || [0, 0, ''])[2];
    // where each stage's node sits in the flow (columns), MOD above, feeding SOURCE and SHAPE
    function layout(W, H) {
      const cols = ORDER.map(st => groups.filter(g => g.stage === st)), mods = groups.filter(g => g.stage === 'MOD'), pos = new Map();
      const cw = (W - 40) / ORDER.length, top = H * 0.36, nh = (n) => Math.min(150, (H - top - 30) / Math.max(1, n) - 12);
      cols.forEach((list, ci) => list.forEach((g, i) => { const h = nh(list.length); pos.set(g.id, { x: 20 + ci * cw + 6, y: top + i * (h + 12), w: cw - 18, h }); }));
      mods.forEach((g, i) => { const w = Math.min(220, (W - 40) / Math.max(1, mods.length) - 14); pos.set(g.id, { x: 20 + cw + i * (w + 14), y: 40, w, h: H * 0.36 - 80 }); });
      return pos;
    }
    function node(g, ctx, b, on, d, wire) {
      ctx.fillStyle = '#070b11'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.fillStyle = on ? 'rgba(0,212,255,0.08)' : 'rgba(140,170,200,0.03)'; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = on ? '#00d4ff' : g.stage === 'MOD' ? 'rgba(255,79,216,0.55)' : 'rgba(140,170,200,0.3)'; ctx.lineWidth = on ? 1.6 : 1; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      ctx.fillStyle = on ? '#00d4ff' : '#b8cfe0'; ctx.font = '600 11px monospace'; ctx.fillText(g.id, b.x + 8, b.y + 15);
      ctx.fillStyle = '#4c6a86'; ctx.font = '9px monospace'; ctx.fillText(g.stage, b.x + b.w - ctx.measureText(g.stage).width - 8, b.y + 15);
      // each number setting a thin bar with its name under it; each choice in words — clipped to the node
      const nums = g.knobs.filter(c => norm(c, 0) !== null), rest = g.knobs.filter(c => norm(c, 0) === null), slot = (b.w - 16) / Math.max(1, nums.length), bw = Math.max(3, Math.min(14, slot * 0.45)), bh = Math.max(10, b.h - 62);
      ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
      nums.forEach((c, i) => { const v = norm(c, +d.values[c.key]), x = b.x + 8 + i * slot + (slot - bw) / 2; ctx.fillStyle = 'rgba(140,170,200,0.10)'; ctx.fillRect(x, b.y + 24, bw, bh);
        ctx.fillStyle = g.stage === 'MOD' ? '#ff4fd8' : on ? '#00d4ff' : '#4fb8d8'; ctx.fillRect(x, b.y + 24 + bh * (1 - v), bw, Math.max(1, bh * v));
        ctx.fillStyle = '#5a7a96'; ctx.font = '8px monospace'; const lb = String(c.label).replace(/[^\w →+-]/g, '').slice(0, Math.max(3, Math.floor(slot / 5))); ctx.fillText(lb, b.x + 8 + i * slot + Math.max(0, (slot - ctx.measureText(lb).width) / 2), b.y + 24 + bh + 11); });
      ctx.fillStyle = '#7f93a8'; ctx.font = '9px monospace'; let txt = rest.map(c => c.label + ' ' + d.values[c.key]).join(' · '); while (txt && ctx.measureText(txt).width > b.w - 16) txt = txt.slice(0, -2); ctx.fillText(txt, b.x + 8, b.y + b.h - 8);
      ctx.restore();
      void wire;
    }
    const kind = {
      id: 'preview.instrument', label: def.label || def.id,
      title: () => def.label || def.id,
      stations: () => ['SONG', 'TRACK', (def.label || def.id).toUpperCase(), 'ITS SOUND'],
      layers: (d) => groups.map(g => ({ id: g.id, group: g.stage + ' — ' + word(g.stage), type: 'curve', label: g.id, sub: g.knobs.length + ' settings · ' + g.knobs.slice(0, 4).map(c => c.label).join(', ') + (g.knobs.length > 4 ? '…' : ''), fields: g.knobs.map(field) })),
      get: (d, k) => { const c = cfg.find(x => x.key === k); const v = d.values[k]; return c && c.type === 'boolean' ? (v ? 'on' : 'off') : v; },
      set: (d, k, v) => { const c = cfg.find(x => x.key === k); if (!c) return d; const out = Object.assign({}, d, { values: Object.assign({}, d.values) }); out.values[k] = c.type === 'boolean' ? v === 'on' : c.type === 'enum' ? v : clamp(+v, c.min, c.max); return out; },
      outline: () => [[0, def.label || def.id]].concat(groups.map(g => [1, g.stage + ' · ' + g.id, g.id])),
      status: (d) => [['SETTINGS', cfg.length], ['STAGES', groups.length], ['FROM', 'its settings + its spec — nothing by hand']],
      hint: () => 'Generated from the tool\'s own settings — every group a stage of the sound, in the order the sound flows · pick one to set it · 3 for 3D',
      // 2D: the signal flow as a field of nodes — CONTROL → SOURCE → SHAPE → AMP → FX → OUT, the modulators above feeding in
      draw(g, W, H, d, o) {
        g.fillStyle = '#05080d'; g.fillRect(0, 0, W, H); const pos = layout(W, H), sel = (o && o.selected) || '';
        g.fillStyle = '#5a7a96'; g.font = '10px monospace'; g.fillText('THE SOUND OF ' + (def.label || def.id).toUpperCase() + ' — ITS SIGNAL FLOW, FROM ITS OWN SETTINGS', 20, 22);
        ORDER.forEach((st, ci) => { const x = 20 + ci * (W - 40) / ORDER.length + 6; g.fillStyle = '#2e4a60'; g.fillText(st, x, H * 0.36 - 12); });
        // wires: each stage's nodes into the next stage's; modulators into SOURCE and SHAPE (dashed)
        const at = (id) => pos.get(id), by = (st) => groups.filter(x => x.stage === st);
        for (let i = 0; i < ORDER.length - 1; i++) { let a = by(ORDER[i]), j = i + 1, b = by(ORDER[j]); while (!b.length && j < ORDER.length - 1) b = by(ORDER[++j]);
          a.forEach(x => b.forEach(y => { const p = at(x.id), q = at(y.id); g.strokeStyle = 'rgba(0,212,255,0.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x + p.w, p.y + p.h / 2); g.bezierCurveTo(p.x + p.w + 30, p.y + p.h / 2, q.x - 30, q.y + q.h / 2, q.x, q.y + q.h / 2); g.stroke(); })); }
        by('MOD').forEach(m => ['SOURCE', 'SHAPE'].forEach(st => by(st).forEach(y => { const p = at(m.id), q = at(y.id); g.strokeStyle = 'rgba(255,79,216,0.18)'; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(p.x + p.w / 2, p.y + p.h); g.bezierCurveTo(p.x + p.w / 2, p.y + p.h + 40, q.x + q.w / 2, q.y - 40, q.x + q.w / 2, q.y); g.stroke(); g.setLineDash([]); })));
        groups.forEach(gr => node(gr, g, at(gr.id), gr.id === sel, d));
      },
      // 3D: each stage a plane, its settings as bars on it
      drawLayer(g, W, H, d, id, o) {
        const gr = groups.find(x => x.id === id); if (!gr) return;
        const nums = gr.knobs.filter(c => norm(c, 0) !== null), bw = (W - 20) / Math.max(1, nums.length) - 6;
        g.shadowColor = gr.stage === 'MOD' ? '#ff4fd8' : '#00d4ff'; g.shadowBlur = o && o.wire ? 0 : 10;
        const slot = (W - 40) / Math.max(1, nums.length), w2 = Math.min(18, slot * 0.35), col = gr.stage === 'MOD' ? '#ff4fd8' : (o && o.selected) ? '#00d4ff' : '#4fb8d8';
        nums.forEach((c, i) => { const v = norm(c, +d.values[c.key]), x = 20 + i * slot + (slot - w2) / 2, h2 = Math.max(3, (H - 40) * v); g.globalAlpha = 0.55; g.fillStyle = col; g.fillRect(x, H - 20 - h2, w2, h2); g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x, H - 20 - h2, w2, h2); });
        g.shadowBlur = 0;
      },
    };
    return kind;
  }
  global.__instrumentPreview = function (instanceId) {
    const r = Kernel.registry.get(instanceId), def = r.descriptor, values = {};
    (def.config || []).forEach(c => { try { values[c.key] = r.ctx.params.get(c.key); } catch (e) { values[c.key] = c.default; } });
    const K = makeKind(def, values); const res = Workshop.addKind(K); if (!res.ok) throw new Error(res.problems.join('; '));
    return Workshop.open(K.id, { values }, { title: def.label });
  };
})(window);

/* PREVIEW ONLY — a compartment (a pipeline) on the Workshop, its steps inside it. His words, 2026-11-08: "eravos already uses compartments. wait.
 * i wanted cos to be the boxes, to make it easier. thats find actually. show me editing a compartment. steps. the ui."
 * One level up from a step (orchestration.step): the compartment's gates (constraint: what admits the whole compartment; gating it gates every
 * step inside, as ERAVOS's own COS nests), its steps (events: each one, in DAG order, click to select, ⤓ to open it as a step), its contract (what
 * it needs, what it gives: the end state), and its runs (emergent). Every word and field is read from the document; nothing is fixed. */
(function () {
  const hue = (kind, kinds) => { const i = (kinds || []).indexOf(kind); return i >= 0 ? Math.round(i * 360 / kinds.length + 30) % 360 : 200; };
  const depth = (d, id, seen) => { seen = seen || []; if (seen.includes(id)) return 0; let m = 0; (d.wires || []).forEach(w => { if (w.to[0] === id) m = Math.max(m, depth(d, w.from[0], seen.concat(id)) + 1); }); return m; };
  function layout(d, W, H) {
    const cols = {}; d.steps.forEach(s => { const c = depth(d, s.id); (cols[c] = cols[c] || []).push(s.id); });
    const nc = Object.keys(cols).length, bw = 190, bh = 74, gx = (W - nc * bw) / (nc + 1), pos = {};
    Object.keys(cols).forEach(c => { const ids = cols[c], gy = (H - ids.length * bh) / (ids.length + 1); ids.forEach((id, r) => { pos[id] = { x: gx + c * (bw + gx), y: gy + r * (bh + gy), w: bw, h: bh }; }); });
    return pos;
  }
  const KIND = {
    id: 'orchestration.compartment', label: 'Compartment',
    title: (d) => 'COMPARTMENT · ' + d.name,
    stations: () => ['PROJECT', 'COMPARTMENT', 'STEP'],
    layers: (d) => [
      { id: 'gates', group: 'WHAT ADMITS IT', type: 'constraint', label: 'Gates', sub: (d.gates || []).length + ' · gating it gates every step inside', fields: (d.gates || []).map((g, i) => ({ key: 'gate.' + i, label: g.label, type: 'text' })) },
      { id: 'steps', group: 'INSIDE', type: 'events', label: 'Steps', sub: d.steps.length + ' steps · ' + (d.wires || []).length + ' wires · click one to select', fields: [] },
      ...d.steps.map(s => ({ id: 'step:' + s.id, group: 'INSIDE', type: 'value', label: s.ref, sub: s.kind + ' · ' + s.id + (s.gate ? ' · gated' : ''), fields: [{ key: 's.' + s.id + '.ref', label: 'Names', type: 'text' }, { key: 's.' + s.id + '.kind', label: 'Kind', type: 'enum', options: d.kinds }] })),
      { id: 'contract', group: 'THE END STATE', type: 'value', label: 'Contract', sub: 'needs ' + d.needs.join(', ') + ' · gives ' + d.gives.join(', '), fields: [{ key: 'needs', label: 'Needs', type: 'text' }, { key: 'gives', label: 'Gives', type: 'text' }] },
      { id: 'runs', group: 'WHAT EMERGES', type: 'emergent', label: 'Runs', sub: d.runs.length + ' · last ' + (d.runs[0] ? d.runs[0].state + ' in ' + d.runs[0].s + ' s' : 'none'), fields: [] },
    ],
    get: (d, k) => { if (k.startsWith('gate.')) return d.gates[+k.slice(5)].rule; if (k.startsWith('s.')) { const [, id, f] = k.split('.'); return d.steps.find(s => s.id === id)[f]; } return Array.isArray(d[k]) ? d[k].join(', ') : d[k]; },
    set: (d, k, v) => { const c = JSON.parse(JSON.stringify(d)); if (k.startsWith('gate.')) c.gates[+k.slice(5)].rule = v; else if (k.startsWith('s.')) { const [, id, f] = k.split('.'); c.steps.find(s => s.id === id)[f] = v; } else c[k] = String(v).split(',').map(x => x.trim()).filter(Boolean); return c; },
    draw: (g, W, H, d, o) => {
      g.clearRect(0, 0, W, H); const pos = layout(d, W, H - 40), sel = o && o.selected && String(o.selected).startsWith('step:') ? o.selected.slice(5) : null;
      g.strokeStyle = 'rgba(255,204,0,.35)'; g.setLineDash([6, 5]); g.strokeRect(14, 14, W - 28, H - 54); g.setLineDash([]);
      g.font = '10px DM Mono, monospace'; g.fillStyle = '#ffcc00'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('GATES · ' + d.gates.map(x => x.label.toUpperCase()).join(' · '), 26, 28);
      (d.wires || []).forEach(w => { const a = pos[w.from[0]], b = pos[w.to[0]]; if (!a || !b) return; const s = d.steps.find(x => x.id === w.from[0]);
        g.strokeStyle = 'hsl(' + hue(s.kind, d.kinds) + ' 78% 64%)'; g.globalAlpha = .8; g.lineWidth = 2; g.beginPath(); const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, dx = (x2 - x1) / 2;
        g.moveTo(x1, y1); g.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2); g.stroke(); g.globalAlpha = 1; });
      d.steps.forEach(s => { const p = pos[s.id], c = 'hsl(' + hue(s.kind, d.kinds) + ' 78% 64%)';
        g.fillStyle = '#0a0d14'; g.fillRect(p.x, p.y, p.w, p.h); g.strokeStyle = s.id === sel ? '#fff' : c; g.lineWidth = s.id === sel ? 2.5 : 1.5; g.strokeRect(p.x, p.y, p.w, p.h);
        if (s.gate) { g.fillStyle = 'rgba(255,204,0,.14)'; g.fillRect(p.x, p.y - 16, p.w, 14); g.fillStyle = '#ffcc00'; g.font = '9px DM Mono, monospace'; g.fillText('GATE · ' + s.gate.toUpperCase(), p.x + 8, p.y - 9); }
        g.font = '10px DM Mono, monospace'; g.fillStyle = c; g.fillText(s.kind.toUpperCase(), p.x + 10, p.y + 16);
        g.fillStyle = { done: '#00ff88', running: '#00d4ff', waiting: '#5a7a96', gap: '#ffcc00' }[s.state] || '#5a7a96'; g.textAlign = 'right'; g.fillText((s.state || '').toUpperCase(), p.x + p.w - 10, p.y + 16); g.textAlign = 'left';
        g.font = '12px DM Mono, monospace'; g.fillStyle = '#e7e9f1'; g.fillText(String(s.ref).slice(0, 24), p.x + 10, p.y + 38);
        g.font = '10px DM Mono, monospace'; g.fillStyle = '#5a7a96'; g.fillText(s.id + (s.ms ? ' · ' + s.ms + ' s · σ ' + s.sigma : ''), p.x + 10, p.y + 58);
        [[p.x, p.y + p.h / 2], [p.x + p.w, p.y + p.h / 2]].forEach(([x, y]) => { g.fillStyle = '#030508'; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.stroke(); }); });
      g.fillStyle = '#5a7a96'; g.textAlign = 'center'; g.fillText('NEEDS ' + d.needs.join(', ').toUpperCase() + '   →   GIVES ' + d.gives.join(', ').toUpperCase(), W / 2, H - 18);
    },
    outline: (d) => [[0, 'COMPARTMENT · ' + d.name.toUpperCase()], [1, 'WHAT ADMITS IT'], [2, 'GATES', 'gates'], [1, 'INSIDE · ' + d.steps.length + ' STEPS'], ...d.steps.map(s => [2, s.kind.toUpperCase() + ' · ' + s.id, 'step:' + s.id]), [1, 'THE END STATE'], [2, 'CONTRACT', 'contract'], [1, 'WHAT EMERGES'], [2, 'RUNS', 'runs']],
    status: (d) => [['STEPS', d.steps.length], ['DONE', d.steps.filter(s => s.state === 'done').length], ['GAPS', d.steps.filter(s => s.state === 'gap').length], ['LAST RUN', d.runs[0] ? d.runs[0].state : '—']],
  };
  Workshop.addKind(KIND);
  // the Fiverr gig pipeline, as Nexus describes it, with an illustrative run (the states and times are made up for the preview)
  window.__COMPARTMENT_DOC = { name: 'Fiverr gig', kinds: ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'],
    gates: [{ label: 'signed in', rule: 'the Fiverr tab is signed in' }, { label: 'his yes', rule: 'he takes the run before Publish' }],
    steps: [
      { id: 'overview', kind: 'macro', ref: 'Fiverr gig - choose category', gate: 'element', state: 'done', ms: 4.2, sigma: 0.1 },
      { id: 'on-pricing', kind: 'gate', ref: 'reached pricing', state: 'done', ms: 0.3, sigma: 0.0 },
      { id: 'pricing', kind: 'pipeline', ref: 'pricing-table', state: 'running', ms: 11.8, sigma: 0.9 },
      { id: 'cover', kind: 'agent', ref: 'write the description', state: 'waiting' },
      { id: 'missing', kind: 'build', ref: 'a tool for gig images', gate: 'gap', state: 'gap' },
      { id: 'publish', kind: 'gate', ref: 'his yes, then Publish', gate: 'his yes', state: 'waiting' }],
    wires: [{ from: ['overview'], to: ['on-pricing'] }, { from: ['on-pricing'], to: ['pricing'] }, { from: ['on-pricing'], to: ['cover'] }, { from: ['cover'], to: ['missing'] }, { from: ['pricing'], to: ['publish'] }, { from: ['missing'], to: ['publish'] }],
    needs: ['a signed-in Fiverr tab', 'the gig drafts'], gives: ['a gig saved before Publish'],
    runs: [{ state: 'running', s: 16 }, { state: 'done', s: 41 }] };
})();

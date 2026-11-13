/* eravos.agents.step UI — the step: its kind (coloured by its place in the kinds it was given), what it names, its state, its gate, the
 * last value through it. Only view.* : state in. No kind, system or address is named here.
 * 2026-11-08, his: "also no need to show kinds in the ui. stop doing that. adding noise to the ui": the kind is data and a colour only; no word,
 * chip, picker or status shows it.
 * The step on the Workshop (his words, 2026-11-08: "like we can use it for nodes, each compartment. like eravos needs to stay agnostic. maybe it
 * edits steps, like it does a note, or pattern."): the kind 'agents.step', added the way the Pattern adds its own (Workshop.addKind);
 * the Workshop is unchanged. Every layer is read from the step it is given: its gate's keys (a constraint layer: what admits or refuses), the
 * step itself (its kind from the kinds it was given), its settings (every leaf of what it carries), its contract, and the last value (what
 * emerged). No field name is fixed here. */
(function () {
  const hue = (kind, kinds) => { const i = (kinds || []).indexOf(kind); if (i >= 0) return Math.round(i * 360 / kinds.length + 30) % 360;
    let n = 0; for (const c of String(kind)) n = (n * 31 + c.charCodeAt(0)) % 360; return n; };
  const show = (v) => v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v);
  const read = (v, t) => { if (t === 'number') return +v; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return v; } };
  // every leaf of an object as a dotted path → value (a list or an empty object is one leaf)
  function leaves(o, pre, out) { out = out || []; if (o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length) { Object.keys(o).forEach(k => leaves(o[k], pre ? pre + '.' + k : k, out)); } else if (pre) out.push([pre, o]); return out; }
  function at(o, path) { return path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o); }
  function put(o, path, v) { const c = JSON.parse(JSON.stringify(o || {})); const ks = path.split('.'); let x = c; ks.slice(0, -1).forEach(k => { if (!x[k] || typeof x[k] !== 'object') x[k] = {}; x = x[k]; }); x[ks[ks.length - 1]] = v; return c; }
  const fld = (key, label, v, kinds) => kinds ? { key, label, type: 'enum', options: kinds } : { key, label, type: typeof v === 'number' ? 'number' : 'text' };
  // His words, 2026-11-08: "The ui is meant to dynamically change in relation to the kind." · "Yes. Follow the spec." (the approved preview,
  // docs/previews/step-dynamic-*.png): after the UI field (specs/eravos.ui-field.spec), what the step carries comes forward, ordered by how much
  // of it there is; what it does not carry drops to NOT IN PLAY with the reason; a setting is named by its own last word, and one that only repeats
  // what another layer shows is left out (counted). Worked out from the step's data alone — never from a list of kinds.
  function baseLayers(d) { return KIND._base(d); }
  function inPlay(d, all0) {
    const b = d.box || {}, shown = new Set([d.step, b.label, d.ref, JSON.stringify((b.contract || {}).requires || [])].filter(Boolean).map(String));
    const all = all0.map(l => {
      if (l.id === 'step') return Object.assign({}, l, { sub: b.label || d.step || '' });
      if (l.id !== 'settings') return l;
      const kept = l.fields.filter(f => { const v = KIND.get(d, f.key); return !shown.has(String(v)); });
      const fields = kept.map(f => { const parts = f.key.split('.'); return Object.assign({}, f, { label: parts[parts.length - 1].replace(/_/g, ' ') }); });
      return Object.assign({}, l, { fields, sub: fields.length + ' set' + (l.fields.length - fields.length ? ' · ' + (l.fields.length - fields.length) + ' shown elsewhere' : '') });
    });
    const weight = { gate: leaves(b.gate || {}, '').length, settings: (all.find(l => l.id === 'settings') || { fields: [] }).fields.length,
      contract: ((b.contract || {}).requires || []).length, last: d.last == null ? 0 : 1, step: 1 };
    const why = { gate: 'it waits on nothing: no gate', settings: 'it carries no settings', contract: 'it runs after nothing', last: 'nothing has passed through it yet' };
    const live = all.filter(l => weight[l.id] > 0).sort((a, c) => weight[c.id] - weight[a.id]).map(l => Object.assign({}, l, { group: 'IN PLAY' }));
    const off = all.filter(l => !(weight[l.id] > 0)).map(l => Object.assign({}, l, { group: 'NOT IN PLAY', sub: why[l.id] || l.sub, fields: [] }));
    return live.concat(off);
  }
  const KIND = {
    id: 'agents.step', label: 'Step',
    title: (d) => String(((d.box || {}).label) || d.ref || d.step || 'step').toUpperCase(),
    stations: () => ['PIPELINE', 'STEP'],
    layers: (d) => inPlay(d, baseLayers(d)),
    _base: (d) => {
      const b = d.box || {}, g = b.gate && typeof b.gate === 'object' ? b.gate : null, args = leaves(b.args || {}, '');
      return [
        { id: 'gate', group: 'WHAT ADMITS IT', type: 'constraint', label: 'Gate', sub: g ? Object.keys(g).join(' · ') : 'none — it always passes', fields: g ? leaves(g, '').map(([k, v]) => fld('gate.' + k, k, v)) : [] },
        { id: 'step', group: 'THE STEP', type: 'value', label: 'Step', sub: d.ref || '—', fields: [fld('ref', 'Names', d.ref), fld('step', 'Step', d.step), fld('state', 'State', d.state)] },
        { id: 'settings', group: 'THE STEP', type: 'value', label: 'Settings', sub: args.length + ' set', fields: args.map(([k, v]) => fld('arg.' + k, k, v)) },
        { id: 'contract', group: 'THE STEP', type: 'value', label: 'Contract', sub: 'after ' + (((b.contract || {}).requires || []).join(', ') || 'nothing') + ' · gives ' + (((b.contract || {}).gives || []).join(', ') || 'nothing'), fields: [fld('requires', 'After'), fld('gives', 'Gives')] },
        { id: 'last', group: 'WHAT EMERGES', type: 'emergent', label: 'Last value', sub: d.last == null ? 'nothing has passed yet' : show(d.last).slice(0, 60), fields: [] },
      ];
    },
    get: (d, k) => {
      if (k.startsWith('gate.')) return show(at((d.box || {}).gate, k.slice(5)));
      if (k.startsWith('arg.')) return show(at((d.box || {}).args, k.slice(4)));
      if (k === 'requires' || k === 'gives') return (((d.box || {}).contract || {})[k] || []).join(', ');
      return d[k];
    },
    set: (d, k, v) => {
      const b = d.box || {};
      if (k.startsWith('gate.')) return Object.assign({}, d, { box: Object.assign({}, b, { gate: put(b.gate, k.slice(5), read(v)) }) });
      if (k.startsWith('arg.')) return Object.assign({}, d, { box: Object.assign({}, b, { args: put(b.args, k.slice(4), read(v)) }) });
      if (k === 'requires' || k === 'gives') return Object.assign({}, d, { box: Object.assign({}, b, { contract: Object.assign({}, b.contract || {}, { [k]: String(v).split(',').map(x => x.trim()).filter(Boolean) }) }) });
      return Object.assign({}, d, { [k]: v });
    },
    draw: (g, W, H, d) => {
      const c = 'hsl(' + hue(d.kind, d.kinds) + ' 78% 64%)', b = d.box || {}, req = (b.contract || {}).requires || [], gv = (b.contract || {}).gives || [];
      const bw = Math.min(360, W * 0.42), bh = 120, x = (W - bw) / 2, y = (H - bh) / 2;
      g.clearRect(0, 0, W, H); g.font = '11px DM Mono, monospace'; g.textBaseline = 'middle';
      const wire = (x1, y1, x2, y2, col) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2); g.stroke(); };
      req.forEach((r, i) => { const yy = y + bh / 2 + (i - (req.length - 1) / 2) * 26; wire(x - 120, yy, x, y + bh / 2, 'rgba(160,190,220,.5)'); g.fillStyle = '#8aa'; g.textAlign = 'right'; g.fillText(String(r).toUpperCase(), x - 128, yy); });
      gv.forEach((r, i) => { const yy = y + bh / 2 + (i - (gv.length - 1) / 2) * 26; wire(x + bw, y + bh / 2, x + bw + 120, yy, c); g.fillStyle = '#8aa'; g.textAlign = 'left'; g.fillText(String(r).toUpperCase(), x + bw + 128, yy); });
      if (b.gate) { g.fillStyle = 'rgba(255,204,0,.12)'; g.fillRect(x - 6, y - 30, bw + 12, 20); g.fillStyle = '#ffcc00'; g.textAlign = 'center'; g.fillText('GATE · ' + Object.keys(b.gate).join(' · ').toUpperCase(), x + bw / 2, y - 20); }
      g.fillStyle = '#0a0d14'; g.strokeStyle = c; g.lineWidth = 2; g.fillRect(x, y, bw, bh); g.strokeRect(x, y, bw, bh);
      g.textAlign = 'left';
      g.fillStyle = '#e7e9f1'; g.font = '14px DM Mono, monospace'; g.fillText(String(((d.box || {}).label) || d.ref || '—').slice(0, 34), x + 14, y + 50);
      g.font = '11px DM Mono, monospace'; g.fillStyle = '#6f8aa3'; g.fillText((d.step || '') + (d.state ? ' · ' + String(d.state).toUpperCase() : ''), x + 14, y + 78);
      g.fillStyle = '#6f8aa3'; g.textAlign = 'center'; g.fillText(d.last == null ? 'NOTHING HAS PASSED YET' : 'LAST · ' + show(d.last).slice(0, 48), W / 2, y + bh + 30);
      [[x, y + bh / 2], [x + bw, y + bh / 2]].forEach(([px, py]) => { g.fillStyle = '#030508'; g.strokeStyle = c; g.beginPath(); g.arc(px, py, 6, 0, Math.PI * 2); g.fill(); g.stroke(); });
    },
    outline: (d) => { const L = KIND.layers(d); return [[0, String(((d.box || {}).label) || d.ref || 'STEP').toUpperCase()], [1, 'IN PLAY']].concat(L.filter(l => l.group === 'IN PLAY').map(l => [2, l.label.toUpperCase(), l.id]), [[1, 'NOT IN PLAY']], L.filter(l => l.group !== 'IN PLAY').map(l => [2, l.label.toUpperCase() + ' — ' + l.sub, l.id])); },
    status: (d) => [['STATE', d.state || '—'], ['AFTER', ((((d.box || {}).contract || {}).requires) || []).length], ['GATED', (d.box || {}).gate ? 'yes' : 'no']],
  };
  window.EravosStepKind = KIND;

OrganismFactory.reg('eravos.agents.step', function (view) {
  const UI = view.ui, h = UI.h;
  if (window.Workshop && !window.Workshop.kinds().includes(KIND.id)) { const a = window.Workshop.addKind(KIND); if (!a.ok) console.error('Step: the Field refused its kind —', a.problems.join('; ')); }
  let cur = {};
  const hue = (kind, kinds) => { const i = (kinds || []).indexOf(kind); if (i >= 0) return Math.round(i * 360 / kinds.length + 30) % 360;
    let n = 0; for (const c of String(kind)) n = (n * 31 + c.charCodeAt(0)) % 360; return n; };
  const st = h('span', { class: 'step-state' }), ref = h('div', { class: 'step-ref' }), meta = h('div', { class: 'step-meta' });
  const gate = h('div', { class: 'step-gate' }), last = h('div', { class: 'step-last' });
  view.on('state_sync', (s) => {
    cur = s;
    const p = s.params || {}, b = s.box || {}, c = `hsl(${hue(p.kind, s.kinds)} 78% 64%)`;
    ref.style.borderLeft = '3px solid ' + c; ref.style.paddingLeft = '7px';   // the kind is a colour, never a word (his, 2026-11-08: "no need to show kinds in the ui")
    st.textContent = p.state || ''; st.dataset.state = p.state || '';
    ref.textContent = b.label || p.ref || '—';   // the step's own words when it has them meta.textContent = [p.step, b.contract && (b.contract.requires || []).length ? 'after ' + b.contract.requires.join(', ') : ''].filter(Boolean).join(' · ');
    const g = b.gate; gate.textContent = g ? 'gate · ' + (typeof g === 'object' ? Object.keys(g).join(', ') : String(g)) : ''; gate.style.display = g ? '' : 'none';
    // what came in, without the wrappers each step adds on the way ({ step, …, value } inside { step, …, value }): the value itself, no noise
    let v = s.last; while (v && typeof v === 'object' && 'step' in v && 'value' in v) v = v.value;
    last.textContent = v == null ? '' : 'last · ' + (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 120); last.style.display = s.last == null ? 'none' : '';
  });
  function docNow() { const p = cur.params || {}; return { kind: p.kind, ref: p.ref, step: p.step, state: p.state, kinds: cur.kinds || [], box: cur.box || {}, last: cur.last === undefined ? null : cur.last }; }
  function openWorkshop() {
    if (!window.Workshop) return;
    window.Workshop.open(KIND.id, docNow(), { onChange: (d) => view.emit('step_set', { params: { kind: d.kind, ref: d.ref, step: d.step, state: d.state }, box: d.box }) });
  }
  view.openWorkshop = openWorkshop;
  const ws = UI.Button({ label: 'Open in Field', hint: 'the whole step on the Field: its gate, settings and contract, every change live', onClick: () => openWorkshop() });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between', alignItems: 'center' } }, [st]), ref, meta, gate, last,
    h('div', { class: 'org-row', style: { marginTop: '8px' } }, [ws.el]));
});
})();

/* PREVIEW ONLY — the step's Workshop UI reshaping itself to the step (his words, 2026-11-08: "The ui is meant to dynamically change in relation to
 * the kind. Show me the ui for the workshop" · "also no need to show kinds in the ui"). After the UI field (specs/eravos.ui-field.spec): what the
 * step carries comes forward, ordered by how much of it there is; what it does not carry drops to NOT IN PLAY, with the reason. No kind word, no
 * table of kinds: a different step reshapes the same surface because its data differs. */
(function () {
  const base = window.EravosStepKind; if (!base) return;
  const leaves = (o, pre, out) => { out = out || []; if (o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length) Object.keys(o).forEach(k => leaves(o[k], pre ? pre + '.' + k : k, out)); else if (pre) out.push([pre, o]); return out; };
  const KIND = Object.assign({}, base, {
    id: 'orchestration.step.dynamic',
    layers: (d) => {
      const b = d.box || {}, shown = new Set([d.step, b.label, d.ref, JSON.stringify((b.contract || {}).requires || [])].filter(Boolean).map(String));
      // settings: each leaf once, named by its own last word (basic_name → basic name), grouped by its parent; a leaf that only repeats what
      // another layer already shows (the step's id, its label, what it runs after) is left out — said in the count
      const all = base.layers(d).map(l => { if (l.id === 'step') return Object.assign({}, l, { sub: b.label || d.step || '' }); if (l.id !== 'settings') return l;
        const kept = l.fields.filter(f => { const v = base.get(d, f.key); return !shown.has(String(v)) && !(Array.isArray(v) && shown.has(JSON.stringify(v))); });
        const fields = kept.map(f => { const parts = f.key.split('.'); return Object.assign({}, f, { label: parts[parts.length - 1].replace(/_/g, ' ') }); });
        return Object.assign({}, l, { fields, sub: fields.length + ' set' + (l.fields.length - fields.length ? ' · ' + (l.fields.length - fields.length) + ' shown elsewhere' : '') }); });
      const weight = { gate: leaves(b.gate || {}, '').length, settings: (all.find(l => l.id === 'settings') || { fields: [] }).fields.length, contract: ((b.contract || {}).requires || []).length, last: d.last == null ? 0 : 1, step: 1 };
      const why = { gate: 'it waits on nothing: no gate', settings: 'it carries no settings', contract: 'it runs after nothing', last: 'nothing has passed through it yet' };
      const inPlay = all.filter(l => weight[l.id] > 0).sort((a, b2) => weight[b2.id] - weight[a.id]).map(l => Object.assign({}, l, { group: 'IN PLAY' }));
      const out = all.filter(l => !(weight[l.id] > 0)).map(l => Object.assign({}, l, { group: 'NOT IN PLAY', sub: why[l.id] || l.sub, fields: [] }));
      return inPlay.concat(out);
    },
    outline: (d) => { const L = KIND.layers(d); return [[0, String(((d.box || {}).label) || d.ref || 'STEP').toUpperCase()], [1, 'IN PLAY']].concat(L.filter(l => l.group === 'IN PLAY').map(l => [2, l.label.toUpperCase(), l.id]), [[1, 'NOT IN PLAY']], L.filter(l => l.group !== 'IN PLAY').map(l => [2, l.label.toUpperCase() + ' — ' + l.sub, l.id])); },
  });
  KIND.draw = (g, W, H, d, o) => base.draw(g, W, H, Object.assign({}, d, { ref: (d.box || {}).label || d.ref }), o);   // the node in the step's own words
  Workshop.addKind(KIND);
})();

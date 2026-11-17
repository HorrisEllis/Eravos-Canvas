/* ERAVOS core — compat/compat.js → window.Compat / require (CG2, specs/eravos.compat-graph.spec). Domain-free and pure: data in → verdict or
 * graph out. No DOM, no audio, no clock; randomness only through a seed handed in. A domain supplies its type table (tools/<d>/types.json:
 * types + bridges); components supply their contracts (tools/<d>/components/<id>/<id>.contract.json, CG1).
 * His words (2026-11-13): "what about a compatability graph? i want tools to mutate into new ones." · (2026-11-16) "I want that mutation done.
 * Imagine it'll be unlimited possibilities. And we're close."
 *
 *   fit(outPort, inPort, types)            → { ok, cost, bridge?, why? }   can this out-port feed that in-port (directly or through a bridge)
 *   slot(contract)                         → 'in:audio@audio|out:audio@audio'   the shape a component fills (its ports, sorted)
 *   graph(contracts, types)                → { nodes, edges, siblings, bridges }   every component pair that can connect, and who fills the same slot
 *   check(dag, contracts, types)           → { ok, why[] }   a tool's DAG: every node known, every edge fits, every variable in range, no loop
 *                                            unless the edge says feedback
 *   swap / insert / rewire / vary / remove (dag, …, contracts, types) → { dag, op } or { error }   one step each, the DAG never edited in place
 *   mutate(dag, contracts, types, { seed, count, ops }) → [{ dag, lineage }]   mutants that pass check(), each one step from the parent
 *
 * A DAG: { nodes: [{ id, component, vars? }], edges: [{ from: 'node.port', to: 'node.port', feedback? }], outs?: ['node.port'] }.
 * Rule (D4): a mutant is never offered unless check() passes; whether it is NEW is the novelty gate's advice, never decided here. */
(function (root) {
  'use strict';
  const RATE_COST = { same: 0, near: 1 };   // audio ↔ block are near (both signals); event only meets event
  const isSignal = (r) => r === 'audio' || r === 'block';

  function fit(o, i, types) {
    if (!o || !i) return { ok: false, why: 'no such port' };
    if (o.dir !== 'out') return { ok: false, why: `${o.id} is not an output` };
    if (i.dir !== 'in') return { ok: false, why: `${i.id} is not an input` };
    const ro = o.rate || 'audio', ri = i.rate || 'audio';
    let rc;
    if (ro === ri) rc = RATE_COST.same; else if (isSignal(ro) && isSignal(ri)) rc = RATE_COST.near; else return { ok: false, why: `rate ${ro} cannot feed rate ${ri}` };
    if (o.type === i.type) return { ok: true, cost: 1 + rc };
    const b = ((types && types.bridges) || []).find(x => x.from === o.type && x.to === i.type);
    if (b) return { ok: true, cost: 3 + rc, bridge: { from: b.from, to: b.to, how: b.how } };
    return { ok: false, why: `${o.type} cannot feed ${i.type}` };
  }

  const portSig = (p) => `${p.dir}:${p.type}@${p.rate || 'audio'}`;
  const slot = (c) => (c.ports || []).map(portSig).sort().join('|');
  // B covers A's ports: every port A has, B has one of the same direction, type and rate (B may have more inputs — left unwired, they idle)
  // — and B asks for no audio input A did not have (a filter cannot stand in for a noise source: with nothing to process it is silent)
  const covers = (b, a, only) => { const need = (a.ports || []).filter(p => !only || only.includes(p.id));
    if (!need.every(p => (b.ports || []).some(q => portSig(q) === portSig(p)))) return false;
    const audioIn = (c) => (c.ports || []).filter(p => p.dir === 'in' && p.type === 'audio').length;
    return audioIn(b) <= need.filter(p => p.dir === 'in' && p.type === 'audio').length; };
  const byId = (contracts) => { const m = {}; (contracts || []).forEach(c => { m[c.id] = c; }); return m; };
  const portOf = (c, pid) => (c && c.ports || []).find(p => p.id === pid);

  function graph(contracts, types) {
    const nodes = (contracts || []).map(c => ({ id: c.id, kind: c.kind, slot: slot(c), ports: c.ports.length }));
    const edges = [], bridges = {};
    contracts.forEach(a => a.ports.filter(p => p.dir === 'out').forEach(o => contracts.forEach(b => { if (a === b) return;
      b.ports.filter(p => p.dir === 'in').forEach(i => { const f = fit(o, i, types); if (!f.ok) return;
        edges.push({ from: `${a.id}.${o.id}`, to: `${b.id}.${i.id}`, cost: f.cost, bridge: f.bridge ? `${f.bridge.from}→${f.bridge.to}` : undefined });
        if (f.bridge) { const k = `${f.bridge.from}→${f.bridge.to}`; bridges[k] = (bridges[k] || 0) + 1; } }); })));
    const groups = {}; contracts.forEach(c => { (groups[slot(c)] = groups[slot(c)] || []).push(c.id); });
    const siblings = Object.keys(groups).filter(k => groups[k].length > 1).sort().map(k => ({ slot: k, components: groups[k].sort() }));
    // stand-ins: every other component that covers this one's ports (a SWAP target even when it has more inputs, as osc-wavetable for osc-va)
    const standIns = {}; contracts.forEach(a => { const s = contracts.filter(b => b !== a && covers(b, a)).map(b => b.id).sort(); if (s.length) standIns[a.id] = s; });
    return { nodes, edges, siblings, bridges, standIns };
  }

  function check(dag, contracts, types) {
    const why = [], C = byId(contracts), N = {};
    if (!dag || !Array.isArray(dag.nodes)) return { ok: false, why: ['no nodes'] };
    dag.nodes.forEach(n => {
      if (N[n.id]) why.push(`node ${n.id} twice`); N[n.id] = n;
      const c = C[n.component]; if (!c) { why.push(`node ${n.id}: no component ${n.component}`); return; }
      Object.keys(n.vars || {}).forEach(k => { const v = (c.variables || []).find(x => x.key === k), x = n.vars[k];
        if (!v) { why.push(`node ${n.id}: ${n.component} has no variable ${k}`); return; }
        if (v.type === 'number' && (typeof x !== 'number' || !isFinite(x) || x < v.min || x > v.max)) why.push(`node ${n.id}: ${k} = ${x} is outside ${v.min}…${v.max}`);
        if (v.type === 'number' && v.integer && Number.isFinite(x) && !Number.isInteger(x)) why.push(`node ${n.id}: ${k} = ${x} must be a whole number`);
        if (v.type === 'enum' && v.options && !v.options.includes(x)) why.push(`node ${n.id}: ${k} = ${x} is not one of ${v.options.join(', ')}`); });
    });
    const at = (ref) => { const [nid, pid] = String(ref).split('.'); const n = N[nid]; return n && C[n.component] ? { n, p: portOf(C[n.component], pid) } : null; };
    const adj = {};
    (dag.edges || []).forEach(e => { const a = at(e.from), b = at(e.to);
      if (!a || !a.p) { why.push(`edge ${e.from} → ${e.to}: no port ${e.from}`); return; }
      if (!b || !b.p) { why.push(`edge ${e.from} → ${e.to}: no port ${e.to}`); return; }
      const f = fit(a.p, b.p, types); if (!f.ok) why.push(`edge ${e.from} → ${e.to}: ${f.why}`);
      if (!e.feedback) (adj[a.n.id] = adj[a.n.id] || []).push(b.n.id); });
    (dag.outs || []).forEach(r => { const a = at(r); if (!a || !a.p || a.p.dir !== 'out') why.push(`out ${r} is not an output port`); });
    // a loop is only allowed through an edge marked feedback (a delay's own return, say)
    const seen = {}, stack = {}; let loop = null;
    const visit = (id) => { if (loop) return; seen[id] = stack[id] = true; (adj[id] || []).forEach(t => { if (stack[t]) loop = `${id} → ${t}`; else if (!seen[t]) visit(t); }); stack[id] = false; };
    Object.keys(N).forEach(id => { if (!seen[id]) visit(id); });
    if (loop) why.push(`a loop (${loop}) with no edge marked feedback`);
    return { ok: why.length === 0, why };
  }

  const clone = (d) => JSON.parse(JSON.stringify(d));
  const done = (dag, op, contracts, types) => { const v = check(dag, contracts, types); return v.ok ? { dag, op } : { error: v.why.join('; '), op }; };

  // SWAP: a node's component for one that fills the same slot (a sibling); its edges keep their port ids where the sibling has them,
  // else move to the sibling's port of the same direction and type; its variables keep the keys the sibling also has (clamped to its range)
  function swap(dag, nodeId, compId, contracts, types) {
    const C = byId(contracts), d = clone(dag), n = d.nodes.find(x => x.id === nodeId); if (!n) return { error: `no node ${nodeId}` };
    const from = C[n.component], to = C[compId]; if (!to) return { error: `no component ${compId}` };
    const used = [...new Set([].concat(d.edges.filter(e => e.from.split('.')[0] === nodeId).map(e => e.from.split('.')[1]), d.edges.filter(e => e.to.split('.')[0] === nodeId).map(e => e.to.split('.')[1]), (d.outs || []).filter(r => r.split('.')[0] === nodeId).map(r => r.split('.')[1])))];
    if (!covers(to, from, used)) return { error: `${compId} cannot stand in for ${n.component} (the ports it is wired by: ${used.join(', ') || 'none'})` };
    const remap = (pid) => { if (portOf(to, pid)) return pid; const p = portOf(from, pid), q = p && to.ports.find(x => portSig(x) === portSig(p)); return q ? q.id : pid; };
    d.edges.forEach(e => { const [a, pa] = e.from.split('.'), [b, pb] = e.to.split('.'); if (a === nodeId) e.from = `${a}.${remap(pa)}`; if (b === nodeId) e.to = `${b}.${remap(pb)}`; });
    d.outs = (d.outs || []).map(r => { const [a, pa] = r.split('.'); return a === nodeId ? `${a}.${remap(pa)}` : r; });
    const vars = {}; Object.keys(n.vars || {}).forEach(k => { const v = (to.variables || []).find(x => x.key === k); if (!v) return; let x = n.vars[k];
      if (v.type === 'number') { x = Math.min(v.max, Math.max(v.min, x)); if (v.integer) x = Math.round(x); } if (v.type === 'enum' && v.options && !v.options.includes(x)) return; vars[k] = x; });
    n.component = compId; n.vars = vars;
    return done(d, { op: 'swap', node: nodeId, from: from.id, to: compId }, contracts, types);
  }

  // INSERT: a new node on an edge — it takes the edge's input on one of its in-ports and feeds the edge's target from one of its out-ports
  function insert(dag, edgeIndex, compId, contracts, types, newId) {
    const C = byId(contracts), d = clone(dag), e = d.edges[edgeIndex]; if (!e) return { error: `no edge ${edgeIndex}` };
    const c = C[compId]; if (!c) return { error: `no component ${compId}` };
    const [a, pa] = e.from.split('.'), [b, pb] = e.to.split('.'), na = d.nodes.find(x => x.id === a), nb = d.nodes.find(x => x.id === b);
    const po = portOf(C[na.component], pa), pi = portOf(C[nb.component], pb);
    const inP = c.ports.filter(p => p.dir === 'in').map(p => ({ p, f: fit(po, p, types) })).filter(x => x.f.ok).sort((x, y) => x.f.cost - y.f.cost)[0];
    const outP = c.ports.filter(p => p.dir === 'out').map(p => ({ p, f: fit(p, pi, types) })).filter(x => x.f.ok).sort((x, y) => x.f.cost - y.f.cost)[0];
    if (!inP || !outP) return { error: `${compId} cannot sit between ${e.from} and ${e.to}` };
    let id = newId || compId; for (let k = 2; d.nodes.some(x => x.id === id); k++) id = (newId || compId) + k;
    d.nodes.push({ id, component: compId, vars: {} });
    d.edges.splice(edgeIndex, 1, { from: e.from, to: `${id}.${inP.p.id}` }, { from: `${id}.${outP.p.id}`, to: e.to, feedback: e.feedback });
    return done(d, { op: 'insert', component: compId, node: id, between: [e.from, e.to] }, contracts, types);
  }

  // REWIRE: an edge's target moved to another in-port (of any node) its source can feed
  function rewire(dag, edgeIndex, toRef, contracts, types) {
    const d = clone(dag), e = d.edges[edgeIndex]; if (!e) return { error: `no edge ${edgeIndex}` };
    const was = e.to; e.to = toRef; return done(d, { op: 'rewire', from: e.from, was, to: toRef }, contracts, types);
  }

  // VARY: one variable of one node set (inside its range — check() refuses anything outside)
  function vary(dag, nodeId, key, value, contracts, types) {
    const d = clone(dag), n = d.nodes.find(x => x.id === nodeId); if (!n) return { error: `no node ${nodeId}` };
    n.vars = Object.assign({}, n.vars, { [key]: value }); return done(d, { op: 'vary', node: nodeId, key, value }, contracts, types);
  }

  // REMOVE: a node with one way in and one way out, its input joined straight to what it fed (when that fits)
  function remove(dag, nodeId, contracts, types) {
    const d = clone(dag), ins = d.edges.filter(e => e.to.split('.')[0] === nodeId), outs = d.edges.filter(e => e.from.split('.')[0] === nodeId);
    if (ins.length !== 1 || !outs.length) return { error: `${nodeId} is not a single pass-through` };
    if ((d.outs || []).some(r => r.split('.')[0] === nodeId)) return { error: `${nodeId} is an output of the tool` };
    d.nodes = d.nodes.filter(n => n.id !== nodeId);
    d.edges = d.edges.filter(e => !ins.includes(e) && !outs.includes(e)).concat(outs.map(o => ({ from: ins[0].from, to: o.to, feedback: o.feedback })));
    return done(d, { op: 'remove', node: nodeId }, contracts, types);
  }

  // a small seeded generator (mulberry32) — the same seed gives the same mutants
  const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // MUTATE: up to `count` different one-step mutants that pass check(), each with its lineage line
  function mutate(dag, contracts, types, o) {
    o = o || {}; const R = rng(o.seed == null ? 1 : o.seed), C = byId(contracts), G = graph(contracts, types), OPS = o.ops || ['swap', 'insert', 'vary', 'rewire', 'remove'];
    const pick = (a) => a[Math.floor(R() * a.length)], out = [], seen = new Set([JSON.stringify(dag)]), want = o.count || 4;
    const sibsOf = (cid) => G.standIns[cid] || [];
    for (let tries = 0; out.length < want && tries < want * 60; tries++) {
      const op = pick(OPS); let r = null;
      if (op === 'swap') { const n = pick(dag.nodes), s = sibsOf(n.component); if (s.length) r = swap(dag, n.id, pick(s), contracts, types); }
      else if (op === 'insert' && dag.edges.length) { const i = Math.floor(R() * dag.edges.length), c = pick(contracts); r = insert(dag, i, c.id, contracts, types); }
      else if (op === 'vary') { const n = pick(dag.nodes), c = C[n.component], vs = (c.variables || []).filter(v => v.type === 'number' || (v.type === 'enum' && v.options));
        if (vs.length) { const v = pick(vs), x = v.type === 'number' ? (v.integer ? v.min + Math.floor(R() * (v.max - v.min + 1)) : +(v.min + (v.max - v.min) * R()).toPrecision(4)) : pick(v.options); const cur = n.vars && n.vars[v.key] !== undefined ? n.vars[v.key] : v.default; if (x !== cur) r = vary(dag, n.id, v.key, x, contracts, types); } }   // a value it already has is no mutation
      else if (op === 'rewire' && dag.edges.length) { const i = Math.floor(R() * dag.edges.length), n = pick(dag.nodes), ins = (C[n.component].ports || []).filter(p => p.dir === 'in');
        if (ins.length) { const to = `${n.id}.${pick(ins).id}`; if (to !== dag.edges[i].to) r = rewire(dag, i, to, contracts, types); } }
      else if (op === 'remove') { const n = pick(dag.nodes); r = remove(dag, n.id, contracts, types); }
      if (!r || r.error) continue;
      const key = JSON.stringify(r.dag); if (seen.has(key)) continue; seen.add(key);
      out.push({ dag: r.dag, lineage: { from: o.from || null, ops: [r.op], by: 'mutate', seed: o.seed == null ? 1 : o.seed } });
    }
    return out;
  }

  const api = { fit, slot, covers, graph, check, swap, insert, rewire, vary, remove, mutate, version: '0.1.0' };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Compat = api;
})(typeof window !== 'undefined' ? window : null);

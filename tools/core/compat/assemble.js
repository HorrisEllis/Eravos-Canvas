/* ERAVOS core — compat/assemble.js → window.Assemble / require (CG3, specs/eravos.compat-graph.spec). A tool's DAG becomes ONE running engine:
 * every node is its component's own kernel (through the domain's adapter), run block by block in the DAG's order, each edge a buffer.
 * Domain-free: the domain hands in its adapters (one per component id) and its bridges (one per "from→to" type pair). No DOM, no audio
 * context — the same engine renders offline here and runs inside a worklet later (its text is plain JS, nothing captured).
 *
 *   assemble(dag, contracts, domain, { sr, block }) → { order, render(seconds, notes) → { L, R }, ok, why }
 *     domain = { adapters: { [componentId]: (sr, contract, vars) → { run(ins, outs, n, ctx) } }, bridges: { 'control→pitch': (x, ctx) → y } }
 *     ins / outs: { [portId]: [Float32Array per channel] } · ctx: { hz, gate } — the note being played, per sample, as buffers
 *   notes: [{ t, dur, hz }] — an in-port nobody wires is the tool's own input: an unwired pitch hears the note, an unwired gate its gate.
 * A node that fails to build (no adapter) is reported in `why`, and the engine is not made (D4: a mutant that does not build is never offered). */
(function (root) {
  'use strict';
  const byId = (cs) => { const m = {}; cs.forEach(c => { m[c.id] = c; }); return m; };
  const chans = (p) => p.type === 'audio' ? (p.channels || 2) : 1;

  function topo(dag) {
    const ids = dag.nodes.map(n => n.id), indeg = {}, adj = {};
    ids.forEach(i => { indeg[i] = 0; adj[i] = []; });
    dag.edges.filter(e => !e.feedback).forEach(e => { const a = e.from.split('.')[0], b = e.to.split('.')[0]; adj[a].push(b); indeg[b]++; });
    const q = ids.filter(i => !indeg[i]), out = [];
    while (q.length) { const i = q.shift(); out.push(i); adj[i].forEach(j => { if (!--indeg[j]) q.push(j); }); }
    return out.length === ids.length ? out : null;
  }

  function assemble(dag, contracts, domain, o) {
    o = o || {}; const sr = o.sr || 48000, B = o.block || 128, C = byId(contracts), why = [];
    const order = topo(dag); if (!order) return { ok: false, why: ['the DAG has a loop with no feedback edge'] };
    const nodes = {};
    dag.nodes.forEach(n => {
      const c = C[n.component], make = domain.adapters[n.component];
      if (!c) { why.push(`${n.id}: no contract for ${n.component}`); return; }
      if (!make) { why.push(`${n.id}: ${n.component} has no adapter in this domain yet`); return; }
      const vars = {}; (c.variables || []).forEach(v => { vars[v.key] = n.vars && n.vars[v.key] !== undefined ? n.vars[v.key] : v.default; });
      const outs = {}, ins = {};
      c.ports.forEach(p => { const bufs = Array.from({ length: chans(p) }, () => new Float32Array(B)); (p.dir === 'out' ? outs : ins)[p.id] = bufs; });
      nodes[n.id] = { n, c, run: make(sr, c, vars), outs, ins, wired: {} };
    });
    if (why.length) return { ok: false, why };
    dag.edges.forEach(e => { const [b, pb] = e.to.split('.'); nodes[b].wired[pb] = (nodes[b].wired[pb] || []).concat(e); });
    const portOf = (c, id) => c.ports.find(p => p.id === id);

    function render(seconds, notes) {
      const N = Math.round(seconds * sr), L = new Float32Array(N), R = new Float32Array(N), hz = new Float32Array(B), gate = new Float32Array(B), ctx = { hz, gate, sr };
      const [on, op] = (dag.outs && dag.outs[0] || '').split('.');
      for (let s0 = 0; s0 < N; s0 += B) {
        const n = Math.min(B, N - s0);
        for (let j = 0; j < n; j++) { const t = (s0 + j) / sr; let h = 0, g = 0; for (const x of notes) if (t >= x.t && t < x.t + x.dur) { h = x.hz; g = 1; } else if (!g && t >= x.t) h = x.hz; hz[j] = h || (notes[0] ? notes[0].hz : 110); gate[j] = g; }
        for (const id of order) {
          const nd = nodes[id];
          for (const p of nd.c.ports.filter(p => p.dir === 'in')) {
            const dst = nd.ins[p.id], w = nd.wired[p.id];
            dst.forEach(ch => ch.fill(0, 0, n));
            if (!w) { const src = p.type === 'pitch' ? hz : p.type === 'gate' ? gate : null; if (src) dst.forEach(ch => ch.set(src.subarray(0, n))); continue; }
            for (const e of w) {
              const [a, pa] = e.from.split('.'), src = nodes[a].outs[pa], sp = portOf(nodes[a].c, pa);
              const bridge = sp.type !== p.type ? domain.bridges[`${sp.type}→${p.type}`] : null;
              for (let c = 0; c < dst.length; c++) { const s = src[Math.min(c, src.length - 1)], d = dst[c];
                if (src.length > 1 && dst.length === 1) { for (let j = 0; j < n; j++) d[j] += 0.5 * (src[0][j] + src[1][j]); continue; }
                const k = e.amount === undefined ? 1 : +e.amount;   // an edge may carry an amount (2026-11-20: how far a wobble moves a filter, in its unit)
                if (bridge) for (let j = 0; j < n; j++) d[j] += k * bridge(s[j], { hz: hz[j], gate: gate[j] }); else for (let j = 0; j < n; j++) d[j] += k * s[j]; }
            }
          }
          nd.run.run(nd.ins, nd.outs, n, ctx);
        }
        const out = nodes[on] && nodes[on].outs[op];
        if (out) for (let j = 0; j < n; j++) { L[s0 + j] = out[0][j]; R[s0 + j] = out[Math.min(1, out.length - 1)][j]; }
      }
      return { L, R, sr };
    }
    return { ok: true, why: [], order, render };
  }

  const api = { assemble, topo, version: '0.1.0' };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Assemble = api;
})(typeof window !== 'undefined' ? window : null);

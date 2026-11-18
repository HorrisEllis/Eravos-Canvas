// node tests/compat.test.mjs — CG2: the compatibility graph and the mutation ops (tools/core/compat/compat.js), on the real contracts.
// Pure: no browser, no audio. Every mutant mutate() offers must pass check(); the same seed gives the same mutants.
import { createRequire } from 'module'; import { execFileSync } from 'child_process';
import { load } from '../build/compat-graph.mjs';
const Compat = createRequire(import.meta.url)('../tools/core/compat/compat.js');
const { types, contracts } = load('music'), C = Object.fromEntries(contracts.map(c => [c.id, c]));
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const P = (dir, type, rate, id) => ({ id: id || dir, dir, type, rate });

// fit: same type, a bridge, a refusal; rates
ok(Compat.fit(P('out', 'audio', 'audio'), P('in', 'audio', 'audio'), types).ok, 'audio feeds audio');
const br = Compat.fit(P('out', 'control', 'audio'), P('in', 'pitch', 'audio'), types); ok(br.ok && br.bridge && br.cost > 1, 'control feeds pitch through a bridge, at a cost');
ok(!Compat.fit(P('out', 'pitch', 'audio'), P('in', 'audio', 'audio'), types).ok, 'pitch does not feed audio');
ok(!Compat.fit(P('out', 'note', 'event'), P('in', 'note', 'audio'), types).ok, 'an event does not feed an audio-rate port');
ok(Compat.fit(P('out', 'control', 'block'), P('in', 'control', 'audio'), types).ok, 'block and audio rate meet');
ok(!Compat.fit(P('in', 'audio'), P('in', 'audio'), types).ok, 'an input cannot feed');

// the graph: filters stand in for each other; an oscillator cannot be swapped for a filter; nothing stands in for itself
const G = Compat.graph(contracts, types);
ok(G.standIns['filter-svf'].includes('filter-ladder') && G.standIns['filter-ladder'].includes('filter-svf'), 'SVF ↔ ladder');
ok(G.standIns['osc-va'].includes('osc-wavetable'), 'osc-wavetable stands in for osc-va (its extra input idles)');
ok(!(G.standIns['osc-va'] || []).includes('filter-svf') && !(G.standIns['osc-noise'] || []).includes('filter-svf'), 'a filter never stands in for a source');
ok(Object.keys(G.standIns).every(k => !G.standIns[k].includes(k)), 'nothing stands in for itself');
ok(G.edges.length > 100 && G.edges.every(e => Compat.fit(C[e.from.split('.')[0]].ports.find(p => p.id === e.from.split('.')[1]), C[e.to.split('.')[0]].ports.find(p => p.id === e.to.split('.')[1]), types).ok), 'every edge in the graph fits');

// a small voice: oscillator → filter → stereo, an envelope's control into the oscillator's pitch through the bridge
const V = { nodes: [{ id: 'osc', component: 'osc-va' }, { id: 'flt', component: 'filter-svf', vars: { frequency: 800, resonance: 0.3 } }, { id: 'st', component: 'stereo-tools' }, { id: 'env', component: 'env-adsr' }],
  edges: [{ from: 'osc.out', to: 'flt.in' }, { from: 'flt.out', to: 'st.in' }, { from: 'env.out', to: 'osc.pitch' }], outs: ['st.out'] };
ok(Compat.check(V, contracts, types).ok, 'the voice checks: ' + Compat.check(V, contracts, types).why.join('; '));
ok(!Compat.check(Object.assign({}, V, { edges: V.edges.concat({ from: 'st.out', to: 'osc.pitch' }) }), contracts, types).ok, 'audio into pitch is refused');
const loop = Object.assign({}, V, { edges: V.edges.concat({ from: 'st.out', to: 'flt.in' }) });
ok(/loop/.test(Compat.check(loop, contracts, types).why.join()), 'a loop is refused');
ok(Compat.check(Object.assign({}, V, { edges: V.edges.concat({ from: 'st.out', to: 'flt.in', feedback: true }) }), contracts, types).ok, 'a loop through an edge marked feedback is allowed');
ok(/outside/.test(Compat.check({ ...V, nodes: V.nodes.map(x => x.id === 'flt' ? { ...x, vars: { frequency: 99999 } } : x) }, contracts, types).why.join()), 'a variable out of range is refused');
ok(/no component/.test(Compat.check({ ...V, nodes: V.nodes.concat({ id: 'x', component: 'nope' }) }, contracts, types).why.join()), 'an unknown component is refused');

// ops: each one step, the parent never changed
const before = JSON.stringify(V);
const sw = Compat.swap(V, 'flt', 'filter-ladder', contracts, types); ok(!sw.error && sw.dag.nodes.find(x => x.id === 'flt').component === 'filter-ladder', 'swap SVF → ladder');
ok(sw.dag.nodes.find(x => x.id === 'flt').vars.frequency === 800, 'swap keeps the variables both have');
ok(Compat.swap(V, 'osc', 'filter-svf', contracts, types).error, 'swap an oscillator for a filter is refused');
const ow = Compat.swap(V, 'osc', 'osc-wavetable', contracts, types); ok(!ow.error, 'swap osc-va → osc-wavetable: ' + ow.error);
const ins = Compat.insert(V, 1, 'saturator-tube', contracts, types); ok(!ins.error && ins.dag.nodes.length === 5 && ins.dag.edges.length === 4, 'insert a tube between filter and stereo');
ok(Compat.insert(V, 1, 'env-adsr', contracts, types).error, 'an envelope cannot sit on an audio edge');
ok(Compat.vary(V, 'flt', 'resonance', 0.9, contracts, types).dag, 'vary inside the range');
ok(Compat.vary(V, 'flt', 'resonance', 5, contracts, types).error, 'vary outside the range is refused');
ok(Compat.vary(V, 'flt', 'stages', 1.5, contracts, types).error, 'a whole-number setting refuses 1.5');
ok(Compat.mutate(V, contracts, types, { seed: 3, count: 40, ops: ['vary'] }).every(m => Compat.check(m.dag, contracts, types).ok), 'forty varied mutants all check (whole numbers stay whole)');
const rm = Compat.remove(V, 'flt', contracts, types); ok(!rm.error && rm.dag.edges.some(e => e.from === 'osc.out' && e.to === 'st.in'), 'remove the filter joins osc → stereo');
ok(Compat.remove(V, 'st', contracts, types).error, 'the tool\'s output cannot be removed');
ok(JSON.stringify(V) === before, 'the parent DAG is never changed');

// mutate: every mutant passes check, all different, one op each, the same seed = the same mutants, another seed = others
const M = Compat.mutate(V, contracts, types, { seed: 7, count: 8, from: 'voice@1' });
ok(M.length === 8, `8 mutants (got ${M.length})`);
ok(M.every(m => Compat.check(m.dag, contracts, types).ok), 'every mutant checks');
ok(new Set(M.map(m => JSON.stringify(m.dag))).size === 8 && M.every(m => JSON.stringify(m.dag) !== before), 'all different, none the parent');
ok(M.every(m => m.lineage.ops.length === 1 && m.lineage.from === 'voice@1' && m.lineage.by === 'mutate'), 'each carries its lineage');
ok(JSON.stringify(Compat.mutate(V, contracts, types, { seed: 7, count: 8 }).map(m => m.dag)) === JSON.stringify(M.map(m => m.dag)), 'the same seed, the same mutants');
ok(JSON.stringify(Compat.mutate(V, contracts, types, { seed: 8, count: 8 }).map(m => m.dag)) !== JSON.stringify(M.map(m => m.dag)), 'another seed, other mutants');
ok(new Set(M.map(m => m.lineage.ops[0].op)).size >= 3, 'mutants use several kinds of op: ' + [...new Set(M.map(m => m.lineage.ops[0].op))]);

// the report is up to date
execFileSync(process.execPath, ['build/compat-graph.mjs', '--check'], { stdio: 'pipe' }); ok(true, 'docs/compat-graph.md up to date');
console.log(`compat ${n} checks pass`);

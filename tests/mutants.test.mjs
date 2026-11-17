// node tests/mutants.test.mjs — CG3: a DAG assembled into one engine IS its components' kernels (nothing added, nothing lost), and the
// mutants mutate() offers build and play. Plain node, offline.
import { createRequire } from 'module';
import { load } from '../build/compat-graph.mjs'; import { kernels, PARENT, PHRASE, play, run } from '../build/mutants.mjs';
const require = createRequire(import.meta.url), { assemble } = require('../tools/core/compat/assemble.js'), { MusicAdapters } = require('../tools/music/compat/adapters.js');
const { contracts } = load(), MP = kernels(), domain = MusicAdapters(MP);
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };

// 1 · the null: osc-va → filter-svf assembled = the same two kernels run by hand, sample for sample
const SR = 48000, N = 9600, hz = 110;
const E = assemble({ nodes: [{ id: 'o', component: 'osc-va', vars: { shape: 'saw' } }, { id: 'f', component: 'filter-svf', vars: { frequency: 900, resonance: 0.3 } }],
  edges: [{ from: 'o.out', to: 'f.in' }], outs: ['f.out'] }, contracts, domain, { sr: SR });
ok(E.ok, 'assembles: ' + E.why);
const got = E.render(N / SR, [{ t: 0, dur: 1, hz }]).L;
const va = MP.VA(), svf = MP.SVF(); svf.setRate(SR); const P = { frequency: [900], detune: [0], resonance: [0.3], gain: [0], mode: [0], stages: [1] };
const want = new Float32Array(N); let ph = 0;
for (let s = 0; s < N; s += 128) { const m = Math.min(128, N - s), x = new Float32Array(m), y = [new Float32Array(m), new Float32Array(m)];
  for (let j = 0; j < m; j++) { const dt = hz / SR; x[j] = va.sample(0, ph, dt, 0.5); ph += dt; if (ph >= 1) ph -= 1; }
  svf.process([x, x], y, m, P); want.set(y[0], s); }
let worst = 0; for (let i = 0; i < N; i++) worst = Math.max(worst, Math.abs(got[i] - want[i]));
ok(worst === 0, `assembled engine = the kernels by hand (worst difference ${worst})`);

// 2 · the order follows the wires, a missing adapter is refused (never offered), a loop is refused
ok(E.order.join() === 'o,f', 'the oscillator runs before the filter');
ok(!assemble({ nodes: [{ id: 'x', component: 'osc-wavetable' }], edges: [], outs: ['x.out'] }, contracts, domain).ok, 'a component with no adapter is not assembled');
ok(!assemble({ nodes: PARENT.nodes, edges: PARENT.edges.concat({ from: 'st.out', to: 'flt.in' }), outs: PARENT.outs }, contracts, domain).ok, 'a loop is not assembled');

// 3 · the parent plays the phrase in tune
const p = play(PARENT, contracts, domain); ok(p.ok && p.fp, 'the parent plays: ' + p.why);
require('./audio-measure.js'); const AM = globalThis.AudioMeasure, mono = new Float32Array(p.L.length); for (let i = 0; i < mono.length; i++) mono[i] = 0.5 * (p.L[i] + p.R[i]);
const pitch = AM.pitch(mono, SR, PHRASE[0].t + 0.2, PHRASE[0].t + 0.5).hz; ok(Math.abs(1200 * Math.log2(pitch / 55)) < 20, `the first note is 55 Hz (heard ${pitch.toFixed(1)})`);
ok(AM.rms(mono, SR, 2.7, 2.79) < 1e-3, 'silent after the last note');

// 4 · offered = plays cleanly AND heard to differ; a clipping or inaudible mutant is never offered; the same seed, the same sounds
for (const [seed, count] of [[7, 6], [11, 8], [23, 10]]) {
  const R = run({ seed, count });
  ok(R.rows.every(r => r.offered === (r.ok && r.fromParent >= 0.005)), `seed ${seed}: offered means plays and heard`);
  ok(R.rows.filter(r => r.offered).length >= 2, `seed ${seed}: at least two mutants offered (got ${R.rows.filter(r => r.offered).length})`);
  ok(R.rows.filter(r => !r.ok).every(r => r.why.length && !r.offered), `seed ${seed}: every refused mutant says why`);
}
const A = run({ seed: 11, count: 8 }); ok(A.rows.some(r => !r.ok && /pinned/.test(r.why.join())), 'seed 11: a clipping mutant (the tube removed, a resonant filter peaking) is caught');
ok(A.rows.some(r => r.ok && !r.heard), 'seed 11: an inaudible change (pulse width on a saw) is caught');
const R1 = run({ seed: 7, count: 6 }), R2 = run({ seed: 7, count: 6 }); ok(R2.rows.every((r, i) => r.fromParent === R1.rows[i].fromParent), 'the same seed, the same sounds');
console.log(`mutants ${n} checks pass`);

// node tests/wobble-builder.test.mjs — the Wobble Builder's ground (tools/music/planned/wobble-builder.spec, 2026-11-20): a wobble assembled from
// shared parts only (osc-va → saturator-tube → filter-svf ← lfo, → stereo-tools) through the CG3 assembler and the music adapters. The LFO wired
// into the filter's detune moves the sound's brightness at the LFO's rate; at depth 0 it does not move; the ladder in the mouth wobbles too;
// the wobble restarts with each note (its gate rising); nothing goes over full scale.
import { createRequire } from 'module'; import path from 'path'; import { fileURLToPath } from 'url'; import assert from 'assert/strict';
import { load } from '../build/compat-graph.mjs';
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { contracts } = load(); const MP = {};
for (const c of ['osc-va', 'osc-sub', 'filter-svf', 'filter-ladder', 'saturator-tube', 'stereo-tools', 'lfo', 'env-adsr']) Object.assign(MP, require(path.join(ROOT, `tools/music/components/${c}/${c}.js`)));
const { MusicAdapters } = require(path.join(ROOT, 'tools/music/compat/adapters.js')), { assemble } = require(path.join(ROOT, 'tools/core/compat/assemble.js'));
const SR = 48000, domain = MusicAdapters(MP);
const wobble = (o) => ({ nodes: [{ id: 'osc', component: 'osc-va', vars: { shape: 'saw' } }, { id: 'lfo', component: 'lfo', vars: { rate: o.rate, shape: 'sine' } },
  { id: 'drv', component: 'saturator-tube', vars: { drive: 6, out: -6 } }, { id: 'flt', component: o.mouth || 'filter-svf', vars: { frequency: 300, resonance: 0.5 } }, { id: 'st', component: 'stereo-tools' }],
  edges: [{ from: 'osc.out', to: 'drv.in' }, { from: 'drv.out', to: 'flt.in' }, { from: 'lfo.out', to: 'flt.detune', amount: o.depth }, { from: 'flt.out', to: 'st.in' }], outs: ['st.out'] });
function brightness(L, win) { const out = []; for (let s = 0; s + win < L.length; s += win) { let a = 0, d = 0; for (let j = s + 1; j < s + win; j++) { a += L[j] ** 2; d += (L[j] - L[j - 1]) ** 2; } out.push(Math.sqrt(d / (a || 1e-12))); } return out; }
function rateOf(xs, winSec) {   // how often the brightness rises through its middle, a second
  xs = xs.map((x, i) => (xs[Math.max(0, i - 1)] + x + xs[Math.min(xs.length - 1, i + 1)]) / 3);   // smoothed over three windows
  const m = xs.reduce((a, b) => a + b, 0) / xs.length, lo = Math.min(...xs), hi = Math.max(...xs), band = (hi - lo) * 0.15; let ups = 0, below = true;
  for (const x of xs) { if (below && x > m + band) { ups++; below = false; } else if (!below && x < m - band) below = true; } return ups / (xs.length * winSec);   // with hysteresis: one rise a cycle
}
const spread = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length) / m; };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
for (const mouth of ['filter-svf', 'filter-ladder']) {
  const e = assemble(wobble({ rate: 4, depth: 2400, mouth }), contracts, domain, { sr: SR }); ok(e.ok, mouth + ' builds: ' + e.why);
  const o = e.render(2, [{ t: 0, dur: 2, hz: 60 }]), b = brightness(o.L, 1600);   // windows of exactly two cycles of the note (60 Hz: 1600 samples), so the note itself never beats against them
  const r = rateOf(b.slice(3), 1600 / SR); ok(Math.abs(r - 4) <= 0.6, `${mouth}: the brightness moves at the LFO's rate (4 Hz; measured ${r.toFixed(2)} Hz)`);
  ok(spread(b.slice(3)) > 0.15, `${mouth}: and moves a lot (spread ${spread(b.slice(3)).toFixed(3)})`);
  let pk = 0; for (const x of o.L) { ok(isFinite(x), 'finite'); n--; pk = Math.max(pk, Math.abs(x)); } ok(pk < 1, `${mouth}: under full scale (${pk.toFixed(3)})`);
}
{ const e = assemble(wobble({ rate: 4, depth: 0 }), contracts, domain, { sr: SR }), b = brightness(e.render(1.5, [{ t: 0, dur: 1.5, hz: 60 }]).L, 1600).slice(8);
  ok(spread(b) < 0.05, `depth 0: no wobble (spread ${spread(b).toFixed(3)})`); }
{ // the wobble restarts with each note: two notes, the second starting mid-cycle, both start from the same place in the wobble
  const e = assemble(wobble({ rate: 3, depth: 2400 }), contracts, domain, { sr: SR }), o = e.render(1.6, [{ t: 0, dur: 0.7, hz: 60 }, { t: 0.8, dur: 0.7, hz: 60 }]);
  const b = brightness(o.L, 1600), a1 = b.slice(1, 9), a2 = b.slice(25, 33); let d = 0; for (let i = 0; i < a1.length; i++) d += Math.abs(a1[i] - a2[i]) / a1[i];
  ok(d / a1.length < 0.1, `each note restarts the wobble (difference ${(d / a1.length).toFixed(3)})`); }
console.log(`wobble-builder ground: ${n} checks pass`);

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

// ---- WB1 (2026-11-20): the tool's own model and Voice — the ONE function that plays offline (here) and in the worklet
{
  const WB = require(path.join(ROOT, 'tools/music/tools/bass/wobble-builder/wobble-builder.engine.js'));
  const A = require(path.join(ROOT, 'tools/core/compat/assemble.js')), MA = MusicAdapters;
  for (const c of ['saturator-tape', 'bitcrusher', 'delay-line']) Object.assign(MP, require(path.join(ROOT, `tools/music/components/${c}/${c}.js`)));
  const s = WB.defaults(), d = WB.dag(s, 140), notes = [{ t: 0.02, dur: 0.8, hz: 55 }, { t: 0.9, dur: 0.6, hz: 73.42 }];
  // 1. the Voice = the assembled chain + the gate's envelope + the level (what the preview played), sample for sample
  const v = WB.Voice(A, MA, MP, contracts, SR).render(d, notes, 1.6, s.level, 0);
  ok(v.ok, 'the Classic Wobble builds');
  const raw = assemble(JSON.parse(JSON.stringify(d)), contracts, domain, { sr: SR }).render(1.6, notes); let g = 0, worst = 0;
  for (let i = 0; i < raw.L.length; i++) { const t = i / SR, on = notes.some(x => t >= x.t && t < x.t + x.dur); g = on ? Math.min(1, g + 1 / (0.004 * SR)) : Math.max(0, g - 1 / (0.05 * SR)); worst = Math.max(worst, Math.abs(raw.L[i] * g * s.level - v.L[i])); }
  ok(worst < 1e-6, `the Voice plays exactly the assembled chain (worst difference ${worst.toExponential(2)})`);
  // 2. every slot × every part builds, plays, stays under full scale
  for (const [k, opts] of [['drive', WB.K.drive.options], ['mouth', WB.K.mouth.options], ['fx', WB.K.fx.options]]) for (const o of opts) {
    const s2 = Object.assign({}, s, { [k]: o }), r = WB.Voice(A, MA, MP, contracts, SR).render(WB.dag(s2, 140), notes, 1.6, s2.level, 0); let pk = 0, bad = 0;
    for (let i = 0; i < r.L.length; i++) { if (!isFinite(r.L[i])) bad++; pk = Math.max(pk, Math.abs(r.L[i]), Math.abs(r.R[i])); }
    ok(r.ok && !bad && pk > 0.02 && pk < 1, `${k} = ${o}: plays, under full scale (peak ${pk.toFixed(3)})`);
  }
  // 3. a knob while it plays: the part takes it in place (no rebuild) — no jump at the change bigger than the sound's own steps
  { const V = WB.Voice(A, MA, MP, contracts, SR); V.load(d); const L = new Float32Array(128), R = new Float32Array(128), hz = new Float32Array([55]), gt = new Float32Array([1]); let prev = 0, jumpBefore = 0, jumpAt = 0;
    for (let b = 0; b < 200; b++) { if (b === 120) { const d2 = WB.dag(Object.assign({}, s, { cutoff: 900, reso: 0.3 }), 140); ok(d2.nodes.every((x, i) => V.set(x.id, x.vars) !== false), 'every part takes new settings in place'); }
      V.process(L, R, 128, hz, gt, 0.8, 0); for (let j = 0; j < 128; j++) { const dj = Math.abs(L[j] - prev); prev = L[j]; if (b >= 100 && b < 120) jumpBefore = Math.max(jumpBefore, dj); if (b === 120) jumpAt = Math.max(jumpAt, dj); } }
    ok(jumpAt <= jumpBefore * 1.5 + 1e-3, `no click when a knob moves (largest step ${jumpAt.toFixed(3)} vs ${jumpBefore.toFixed(3)} before)`); }
  // 4. a slot swapped while it plays: the new chain cross-fades in (no step over the sound's own)
  { const V = WB.Voice(A, MA, MP, contracts, SR); V.load(d); const L = new Float32Array(128), R = new Float32Array(128), hz = new Float32Array([55]), gt = new Float32Array([1]); let prev = 0, before = 0, at = 0;
    for (let b = 0; b < 200; b++) { if (b === 120) V.load(WB.dag(Object.assign({}, s, { mouth: 'filter-ladder', drive: 'bitcrusher' }), 140));
      V.process(L, R, 128, hz, gt, 0.8, 0); for (let j = 0; j < 128; j++) { const dj = Math.abs(L[j] - prev); prev = L[j]; if (b >= 100 && b < 120) before = Math.max(before, dj); if (b >= 120 && b < 124) at = Math.max(at, dj); } }
    ok(at <= Math.max(before * 2, 0.2), `a slot swap cross-fades (largest step ${at.toFixed(3)} vs ${before.toFixed(3)} before)`); }
  // 5. the worklet's text is whole: it evaluates on its own (no page) and its processor class is there
  { const src = WB.source(MP, A, MA); let reg = null; new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', 'globalThis', src)(class {}, (n, c) => { reg = [n, c]; }, SR, {});
    ok(reg && reg[0] === 'eravos-wobble-builder', 'the worklet source stands alone and registers its processor'); }
  console.log(`wobble-builder tool: ${n} checks pass in all`);
}

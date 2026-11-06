// node tools/music/components/unison-stack/unison-stack.test.mjs — the unison stack proves its numbers, and that its layout is
// Supersaw's (the same arithmetic as supersaw.engine.js makeVoice, written out here), so Supersaw can later stand on it and null.
import { createRequire } from 'module'; const req = createRequire(import.meta.url);
const { UnisonStack } = req('./unison-stack.js'), { VA } = req('../osc-va/osc-va.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const near = (a, b, t) => Math.abs(a - b) <= t;
const U = UnisonStack();
// ---- Supersaw's layout, voice for voice
const d = (x) => x * (0.25 + 0.75 * x * x);
for (const [vn, det, mix, sp] of [[7, 0.35, 0.5, 0.7], [1, 0.8, 0.2, 1], [16, 1, 1, 0], [2, 0.1, 0, 0.5]]) {
  const L = U.layout(vn, det, 2, sp, mix, 0, 0); ok(L.count === vn, 'count');
  for (let i = 0; i < vn; i++) {
    const x = vn === 1 ? 0 : (i / (vn - 1)) * 2 - 1, centre = Math.abs(x) < 1e-6 || vn === 1;
    const lv = (centre ? 1 - mix * 0.4 : mix) / Math.sqrt(vn), th = (x * sp + 1) * Math.PI / 4;
    ok(near(L.cents[i], d(x) * det * 100, 1e-12), `voice ${i}/${vn} detune as Supersaw's`);
    ok(near(L.gainL[i], lv * Math.cos(th), 1e-12) && near(L.gainR[i], lv * Math.sin(th), 1e-12), `voice ${i}/${vn} level and pan as Supersaw's`);
  }
}
// ---- curves: symmetric, end at ±1, linear is linear, exp bends below linear, supersaw sits low in the middle (dense centre)
for (const c of [0, 1, 2]) { ok(near(U.curveAt(c, 1), 1, 1e-12) && near(U.curveAt(c, -1), -1, 1e-12) && U.curveAt(c, 0) === 0, `curve ${c} runs −1 … 1 through 0`);
  for (const x of [0.1, 0.4, 0.8]) ok(near(U.curveAt(c, -x), -U.curveAt(c, x), 1e-12), `curve ${c} symmetric at ${x}`); }
ok(U.curveAt(1, 0.5) < 0.5 && U.curveAt(2, 0.5) < U.curveAt(1, 0.5) + 0.2 && U.curveAt(2, 0.2) < 0.2 * 0.5, 'exp and supersaw keep the inner voices close');
// ---- the outermost voice is detune × 100 cents for every curve; 0 detune = all in tune
for (const c of [0, 1, 2]) { const L = U.layout(9, 0.6, c, 0, 0.5, 0, 0); ok(near(L.cents[0], -60, 1e-9) && near(L.cents[8], 60, 1e-9), `curve ${c}: outer voices ±60 cents`); }
{ const L = U.layout(9, 0, 2, 1, 0.5, 0, 0); let m = 0; for (let i = 0; i < 9; i++) m = Math.max(m, Math.abs(L.cents[i])); ok(m === 0, 'no detune: all voices in tune'); }
// ---- spread 0 = mono (every voice L = R), spread 1 = the outer voices hard left / hard right; power is kept
{ const L = U.layout(5, 0.5, 2, 0, 0.5, 0, 0); for (let i = 0; i < 5; i++) ok(near(L.gainL[i], L.gainR[i], 1e-12), 'spread 0 is centred'); }
{ const L = U.layout(5, 0.5, 2, 1, 0.5, 0, 0); ok(near(L.gainR[0], 0, 1e-12) && near(L.gainL[4], 0, 1e-12), 'spread 1 puts the outer voices hard left and right');
  for (let i = 0; i < 5; i++) ok(near(L.gainL[i] ** 2 + L.gainR[i] ** 2, L.gain[i] ** 2, 1e-12), 'equal-power pan'); }
// ---- clamps: 0 and 40 voices → 1 and 16; unused slots silent
ok(U.layout(0, 1, 2, 1, 1, 0, 0).count === 1 && U.layout(40, 1, 2, 1, 1, 0, 0).count === 16, 'voices clamp to 1…16');
{ const L = U.layout(3, 1, 2, 1, 1, 0, 0); let s = 0; for (let i = 3; i < 16; i++) s += Math.abs(L.gain[i]); ok(s === 0, 'slots past the count are silent'); }
// ---- phase: free leaves voices (−1), reset starts them at 0, seeded random is the same for the same seed, differs for another, in 0…1
{ const f = U.layout(4, 0.3, 2, 0.5, 0.5, 0, 1); ok([0, 1, 2, 3].every(i => f.phase[i] === -1), 'free: voices keep their phase');
  const r = U.layout(4, 0.3, 2, 0.5, 0.5, 1, 1); ok([0, 1, 2, 3].every(i => r.phase[i] === 0), 'reset: every voice starts at 0');
  const a = Array.from(U.layout(8, 0.3, 2, 0.5, 0.5, 2, 42).phase.slice(0, 8)), b = Array.from(U.layout(8, 0.3, 2, 0.5, 0.5, 2, 42).phase.slice(0, 8)), c = Array.from(U.layout(8, 0.3, 2, 0.5, 0.5, 2, 43).phase.slice(0, 8));
  ok(a.every((v, i) => v === b[i]), 'seeded: the same seed, the same starts'); ok(a.some((v, i) => v !== c[i]), 'another seed, other starts');
  ok(a.every(v => v >= 0 && v < 1) && new Set(a).size === 8, 'seeded starts lie in 0…1, all different'); }
// ---- with a source: 7 detuned saws (osc-va) — the stack beats (its level swings), one saw does not; the sum's peak stays bounded
{ const SR = 48000, va = VA();
  const render = (vn, det) => { const L = U.layout(vn, det, 2, 0, 0.5, 2, 7), ph = Float64Array.from(L.phase.slice(0, vn)), dt = new Float64Array(vn), N = SR, y = new Float64Array(N);
    for (let i = 0; i < vn; i++) dt[i] = 220 * Math.pow(2, L.cents[i] / 1200) / SR;
    let peak = 0; for (let j = 0; j < N; j++) { let s = 0; for (let i = 0; i < vn; i++) { s += L.gainL[i] * va.saw(ph[i], dt[i]); ph[i] += dt[i]; if (ph[i] >= 1) ph[i] -= 1; } y[j] = s; peak = Math.max(peak, Math.abs(s)); }
    const rms = []; for (let w = 0; w < N; w += 2400) { let a = 0; for (let j = w; j < w + 2400; j++) a += y[j] * y[j]; rms.push(Math.sqrt(a / 2400)); }
    return { peak, swing: Math.max(...rms) / Math.min(...rms) }; };
  const one = render(1, 0), seven = render(7, 0.5);
  ok(one.swing < 1.02, `one voice is steady (${one.swing.toFixed(3)})`); ok(seven.swing > 1.1, `seven detuned voices beat (level swings ×${seven.swing.toFixed(2)})`);
  ok(seven.peak < 2.5, `the stack stays bounded (peak ${seven.peak.toFixed(2)})`); }
// ---- no allocation per layout (the same arrays every call)
{ const a = U.layout(5, 1, 2, 1, 1, 0, 0).cents, b = U.layout(9, 0.2, 0, 0.1, 0.3, 2, 9).cents; ok(a === b, 'layout reuses its arrays'); }
console.log(`unison-stack: ${n} checks pass`);

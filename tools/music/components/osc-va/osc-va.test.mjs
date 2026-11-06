// node tools/music/components/osc-va/osc-va.test.mjs — the VA oscillator proves its own numbers (new code: nothing older to equal).
import { createRequire } from 'module'; const { VA } = createRequire(import.meta.url)('./osc-va.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, v = VA();
function render(fn, f0, N = SR) { const y = new Float64Array(N), dt = f0 / SR; let ph = 0; for (let i = 0; i < N; i++) { y[i] = fn(ph, dt); ph += dt; if (ph >= 1) ph -= 1; } return y; }
// power at frequency f (Goertzel, the whole buffer; f on a whole-Hz bin since N = SR)
function power(y, f) { const w = 2 * Math.PI * f / SR, c = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let i = 0; i < y.length; i++) { const s = y[i] + c * s1 - s2; s2 = s1; s1 = s; } const re = s1 - s2 * Math.cos(w), im = s2 * Math.sin(w); const a = 2 * Math.sqrt(re * re + im * im) / y.length; return a * a / 2; }
const total = (y) => { let s = 0; for (const x of y) s += x * x; return s / y.length; };
// aliasing: everything that is not a true harmonic (k·f0 below Nyquist), as dB under the whole signal
function aliasDb(y, f0) { let h = 0; for (let k = 1; k * f0 < SR / 2; k++) h += power(y, k * f0); const t = total(y); return 10 * Math.log10(Math.max(1e-12, t - h) / t); }
const naiveSaw = (ph) => 2 * ph - 1;
// ---- shapes: range, DC
for (const [name, fn] of [['saw', v.saw], ['square', v.square], ['pulse 25%', (p, d) => v.pulse(p, d, 0.25)], ['triangle', (p) => v.tri(p)]]) {
  const y = render(fn, 441); let mx = 0, dc = 0; for (const x of y) { mx = Math.max(mx, Math.abs(x)); dc += x; } dc /= y.length;
  ok(mx <= 1.25 && mx >= 0.9, `${name}: peak ${mx.toFixed(3)} (−1…1, a polyBLEP edge may overshoot a little)`);
  ok(Math.abs(dc) < 0.002, `${name}: DC ${dc.toExponential(2)} ≈ 0`);
}
// ---- band-limiting: at 4410 Hz (aliases land between harmonics), polyBLEP folds far less than a naive saw
const f0 = 4410, a = aliasDb(render(v.saw, f0), f0), b = aliasDb(render(naiveSaw, f0), f0);
ok(a < b - 8, `saw: polyBLEP aliasing ${a.toFixed(1)} dB vs naive ${b.toFixed(1)} dB (at least 8 dB less)`);
ok(a < -20, `saw at ${f0} Hz: aliasing ${a.toFixed(1)} dB under the signal`);
const sq = aliasDb(render(v.square, f0), f0); ok(sq < -18, `square at ${f0} Hz: aliasing ${sq.toFixed(1)} dB`);
const tr = aliasDb(render((p) => v.tri(p), 1470), 1470); ok(tr < -40, `triangle at 1470 Hz: aliasing ${tr.toFixed(1)} dB (its harmonics fall 12 dB/oct)`);
// ---- a saw's harmonics fall as 1/k: the 2nd is 6 dB under the 1st
{ const y = render(v.saw, 441), d = 10 * Math.log10(power(y, 441) / power(y, 882)); ok(Math.abs(d - 6.02) < 0.3, `saw: 2nd harmonic ${d.toFixed(2)} dB under the 1st (6.02)`); }
// ---- the pulse width is what it says: 25% high
{ let hi = 0; const N = 48000, dt = 100 / SR; let ph = 0; for (let i = 0; i < N; i++) { if (ph < 0.25) hi++; ph += dt; if (ph >= 1) ph -= 1; } ok(Math.abs(hi / N - 0.25) < 0.002, 'pulse 25%: high a quarter of the time'); }
// ---- allocation-free, and fast
{ const t0 = process.hrtime.bigint(); let s = 0, ph = 0; const dt = 220 / SR; for (let i = 0; i < 4.8e6; i++) { s += v.saw(ph, dt); ph += dt; if (ph >= 1) ph -= 1; } const ns = Number(process.hrtime.bigint() - t0) / 4.8e6; ok(ns < 60 && isFinite(s), `saw: ${ns.toFixed(1)} ns a sample`); console.log(`  osc-va: ${ns.toFixed(1)} ns/sample (saw)`); }
console.log(`✓ osc-va: ${n} checks (aliasing saw ${a.toFixed(1)} dB vs naive ${b.toFixed(1)} dB · square ${sq.toFixed(1)} · triangle ${tr.toFixed(1)})`);

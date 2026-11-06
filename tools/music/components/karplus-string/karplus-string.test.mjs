// node tools/music/components/karplus-string/karplus-string.test.mjs — the string proves its own numbers (new code).
import { createRequire } from 'module'; const { KString, kstringLoopDelay, phaseDelay } = createRequire(import.meta.url)('./karplus-string.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
// pluck: a short soft burst (a hammer), then let it ring
function pluck(f0, o, secs) { const k = KString(); k.set(f0, SR, o); const N = Math.round(SR * (secs || 3)), y = new Float64Array(N); let s = 12345;
  const L = Math.max(4, Math.round(SR / f0 / 2)); for (let j = 0; j < N; j++) { let x = 0; if (j < L) { s = (s * 16807) % 2147483647; x = (s / 2147483647 - 0.5) * Math.sin(Math.PI * j / L); } y[j] = k.tick(x); } return { y, k }; }
// Goertzel amplitude at hz over [from, from+len)
const amp = (y, hz, from, len) => { const w = 2 * Math.PI * hz / SR, cw = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let j = from; j < from + len; j++) { const s0 = y[j] + cw * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(s1 * s1 + s2 * s2 - cw * s1 * s2) * 2 / len; };
// the peak near hz, searched ± range cents in 0.05-cent steps (with a Hann-free long window the peak is sharp)
function peak(y, hz, range, from, len) { let best = -1, at = hz; for (let c = -range; c <= range; c += 0.05) { const f = hz * Math.pow(2, c / 1200), a = amp(y, f, from, len); if (a > best) { best = a; at = f; } } return at; }
const cents = (a, b) => 1200 * Math.log2(a / b);
// ---- tuning: exact at 55, 220, 440, 1760 Hz (stretch 0 and 0.6, dark and bright)
for (const f0 of [55, 220, 440, 1760]) for (const o of [{ stretch: 0, bright: 0.6 }, { stretch: 0.6, bright: 0.2 }]) {
  if (f0 >= 1000 && o.bright < 0.5) continue;   // a dark, high string loses ~10 % a pass: its peak is ~55 cents wide, so no measured pitch means a cent — its tuning is the worked-out check below
  const { y } = pluck(f0, Object.assign({ t60: 20 }, o), 4); const from = Math.round(SR / f0) + 64, got = peak(y, f0, 8, from, SR / 2);   // measured while it rings (a dark, high string is gone in a tenth of a second — see t60)
  ok(Math.abs(cents(got, f0)) < 0.5, `${f0} Hz (stretch ${o.stretch}, bright ${o.bright}): measured ${cents(got, f0).toFixed(3)} cents`); }
// ---- tuning, worked out: the loop's phase delay at f0 is sr / f0 exactly (what the measured pitch above confirms to half a cent)
{ const k = KString(); for (const f0 of [27.5, 110, 440, 1760, 4186]) for (const st of [0, 0.6, 1]) { k.set(f0, SR, { stretch: st, bright: 0.3 }); const d = k.loop(); ok(Math.abs(kstringLoopDelay(d.N, d.eta, d.c, d.p, 2 * Math.PI * f0 / SR) - SR / f0) < 1e-6, `${f0} Hz stretch ${st}: loop delay = sr/f0 (${(kstringLoopDelay(d.N, d.eta, d.c, d.p, 2 * Math.PI * f0 / SR) - SR / f0).toExponential(1)})`); } }
// ---- stretch: the 12th partial goes sharp with it (a stiff string), and only up
// the k-th resonance, worked out from the loop (phase 2πk): f · delay(f) = k · sr
const kth = (lp, k, f0) => { let lo = f0 * (k - 0.6), hi = f0 * (k + 1.4); for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (m * kstringLoopDelay(lp.N, lp.eta, lp.c, lp.p, 2 * Math.PI * m / SR) > k * SR) hi = m; else lo = m; } return lo; };
{ const f0 = 440, dev = [0, 0.3, 0.6, 1].map(s => { const { y, k } = pluck(f0, { t60: 8, bright: 1, stretch: s }, 3); const want = kth(k.loop(), 12, f0), got = peak(y, want, 4, SR / 2, SR * 2);
    ok(Math.abs(cents(got, want)) < 1, `stretch ${s}: the 12th partial rings where the loop puts it (${cents(got, want).toFixed(2)} c)`); return cents(got, 12 * f0); });
  ok(Math.abs(dev[0]) < 2, `no stretch: the 12th partial in tune (${dev[0].toFixed(2)} c)`);
  ok(dev[1] > dev[0] && dev[2] > dev[1] && dev[3] > dev[2], `stretch 0 · 0.3 · 0.6 · 1: the 12th partial ${dev.map(d => d.toFixed(1)).join(' · ')} cents sharp — rising`);
  ok(dev.some(d => d >= 10 && d <= 30), 'a piano\'s 10–30 cents at A4 is inside the range'); }
// ---- t60: the fundamental falls 60 dB in t60 (2 s → 30 dB from 0.5 s to 1.5 s)
{ const { y } = pluck(220, { t60: 2, bright: 0.9 }, 2.5); const a0 = amp(y, 220, SR * 0.5, 4800), a1 = amp(y, 220, SR * 1.5, 4800), drop = 20 * Math.log10(a1 / a0);
  ok(Math.abs(drop + 30) < 1.5, `t60 2 s: the fundamental falls ${drop.toFixed(1)} dB in a second (30)`); }
// ---- bright: a darker string has less top (the 8th partial against the fundamental, half a second in)
{ const r = (b) => { const { y } = pluck(220, { t60: 4, bright: b }, 1); return amp(y, 1760, SR / 2, 4800) / amp(y, 220, SR / 2, 4800); };
  ok(r(0.9) > r(0.2) * 4, `bright 0.9 keeps ${(r(0.9) / r(0.2)).toFixed(1)}× the 8th partial of bright 0.2`); }
// ---- detune: +5 cents is 5 cents
{ const { y } = pluck(330, { t60: 20, detune: 5 }, 4); ok(Math.abs(cents(peak(y, 330, 12, SR, SR * 3), 330) - 5) < 0.3, 'detune +5 cents'); }
// ---- rings out; every sample finite; energy falls to nothing
for (const o of [{ t60: 20, stretch: 1, bright: 0 }, { t60: 20, stretch: 0.6, bright: 0.2 }]) for (const f0 of [55, 440, 2000]) { const { y } = pluck(f0, o, 3); let a = 0, b = 0; for (let j = 0; j < SR / 2; j++) a = Math.max(a, Math.abs(y[j])); for (let j = SR * 2; j < SR * 3; j++) b = Math.max(b, Math.abs(y[j])); ok(b <= a + 1e-9, `${f0} Hz, dark and long (bright ${o.bright}): it only ever decays — stable (${a.toFixed(3)} → ${b.toFixed(3)})`); }
{ const { y, k } = pluck(98, { t60: 1, stretch: 1, bright: 0.5 }, 12); ok(y.every(Number.isFinite), 'finite'); ok(k.energy < 1e-12, `rung out after 12 s (energy ${k.energy.toExponential(1)})`);
  const z = pluck(5000, { t60: 1, stretch: 1 }, 1).y; ok(z.every(Number.isFinite), '5 kHz with full stretch: finite (stretch eased to fit)'); }
console.log(`karplus-string: ${n} checks passed — tuned exactly (the loop worked out; half a cent measured), stretched like a piano, stable, decays on time, dark and bright`);

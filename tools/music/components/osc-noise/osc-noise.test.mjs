// node tools/music/components/osc-noise/osc-noise.test.mjs — every colour of noise proves its spectrum, its seed and its stereo.
// The spectrum is MEASURED: Welch's method (Hann windows of 4096, averaged), power read in octave bands.
import { createRequire } from 'module'; const { Noise, NOISE_WORKLET, NOISE_PARAMS } = createRequire(import.meta.url)('./osc-noise.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t;
const DEF = Object.fromEntries(NOISE_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
function gen(o, N, seed) { const k = Noise(); k.setRate(SR); k.reset(seed || 1); const L = new Float32Array(N), R = new Float32Array(N);
  for (let j = 0; j < N; j += 128) k.process([L.subarray(j, j + 128), R.subarray(j, j + 128)], Math.min(128, N - j), P(o)); return [L, R]; }
// power spectrum (Welch) by a radix-2 FFT
function fft(re, im) { const N = re.length; for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), s = Math.sin(a * k), xr = re[i + k + len / 2], xi = im[i + k + len / 2], tr = xr * c - xi * s, ti = xr * s + xi * c; re[i + k + len / 2] = re[i + k] - tr; im[i + k + len / 2] = im[i + k] - ti; re[i + k] += tr; im[i + k] += ti; } } }
function psd(x) { const M = 4096, p = new Float64Array(M / 2); let segs = 0;
  for (let a = 0; a + M <= x.length; a += M / 2) { const re = new Float64Array(M), im = new Float64Array(M); for (let j = 0; j < M; j++) re[j] = x[a + j] * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / M)); fft(re, im); for (let k = 0; k < M / 2; k++) p[k] += re[k] * re[k] + im[k] * im[k]; segs++; }
  return (f) => { let s = 0, c = 0; for (let k = Math.round(f / Math.SQRT2 * M / SR); k <= Math.round(f * Math.SQRT2 * M / SR); k++) { s += p[k]; c++; } return 10 * Math.log10(s / c / segs); }; }  // mean power density in the octave around f
const slope = (S, a, b) => (S(b) - S(a)) / Math.log2(b / a);
const N = SR * 8;
// ---- white flat · pink −3 dB/oct · brown −6 dB/oct (100 Hz → 6.4 kHz, six octaves)
{ const S = psd(gen({ colour: 0 }, N)[0]); ok(near(slope(S, 100, 6400), 0, 0.3), `white is flat: ${slope(S, 100, 6400).toFixed(2)} dB/oct`); }
{ const S = psd(gen({ colour: 1 }, N)[0]); ok(near(slope(S, 100, 6400), -3, 0.3), `pink falls 3 dB/oct: ${slope(S, 100, 6400).toFixed(2)}`); }
{ const S = psd(gen({ colour: 2 }, N)[0]); ok(near(slope(S, 200, 6400), -6, 0.4), `brown falls 6 dB/oct: ${slope(S, 200, 6400).toFixed(2)}`); }
// ---- every colour is a usable level (RMS 0.05 … 0.8 at level 1) and never past ±4
for (const c of [0, 1, 2, 3, 4, 5]) { const [L] = gen({ colour: c, level: 1, density: 2000 }, SR * 2); let s = 0, pk = 0; for (const v of L) { s += v * v; pk = Math.max(pk, Math.abs(v)); }
  const r = Math.sqrt(s / L.length); ok(r > (c === 4 ? 0.001 : 0.05) && r < 0.8 && pk <= 4, `colour ${c}: RMS ${r.toFixed(3)}, peak ${pk.toFixed(2)}`); }
// ---- velvet: exactly `density` impulses a second, each ±1, zeros between, and flat in spectrum
{ const [L] = gen({ colour: 3, density: 1500, level: 1 }, SR * 4); let hits = 0, other = 0; for (const v of L) { if (v === 1 || v === -1) hits++; else if (v !== 0) other++; }
  ok(near(hits, 6000, 2) && other === 0, `velvet: ${hits} ±1 impulses in 4 s at 1500 a second, nothing else`);
  const S = psd(L); ok(near(slope(S, 100, 6400), 0, 0.5), `velvet is flat: ${slope(S, 100, 6400).toFixed(2)} dB/oct`); }
// ---- crackle: about `density` clicks a second (Poisson), most small, a few loud
{ const [L] = gen({ colour: 4, density: 40, level: 1 }, SR * 20); let clicks = 0, loud = 0; for (let j = 1; j < L.length; j++) { const d = Math.abs(L[j]) - Math.abs(L[j - 1]) * 0.93; if (d > 1e-6) { clicks++; if (Math.abs(L[j]) > 0.5) loud++; } }
  ok(near(clicks, 800, 120), `crackle: ${clicks} clicks in 20 s at 40 a second`); ok(loud > 30 && loud < clicks / 3, `crackle: a few loud ones (${loud})`); }
// ---- band-limited: its energy sits under `rate`; at 4× the rate it is 30 dB down
{ const S = psd(gen({ colour: 5, rate: 300, level: 1 }, N)[0]); ok(S(1200) < S(100) - 30, `band-limited 300: ${(S(100) - S(1200)).toFixed(1)} dB less at 1.2 kHz than at 100 Hz`);
  const S2 = psd(gen({ colour: 5, rate: 3000, level: 1 }, N)[0]); ok(S2(900) > S2(100) - 3, `band-limited 3000 is flat to 0.3 × its rate (900 Hz: ${(S2(900) - S2(100)).toFixed(2)} dB)`); }
// ---- tilt: lows (a one-pole low-pass at 1 kHz) × 10^(−6·tilt/20), the rest × 10^(+6·tilt/20). Measured against the kernel's own
//      discrete transfer function H(z) = gHi + (gLo − gHi)·a/(1 − (1−a)z⁻¹), averaged over the same octave band as the measurement
{ const W = psd(gen({ colour: 0 }, N)[0]), a = 1 - Math.exp(-2 * Math.PI * 1000 / SR);
  const theory = (t, f) => { const gl = Math.pow(10, -6 * t / 20), gh = Math.pow(10, 6 * t / 20); let s = 0, c = 0;
    for (let k = Math.round(f / Math.SQRT2 * 4096 / SR); k <= Math.round(f * Math.SQRT2 * 4096 / SR); k++) { const w = 2 * Math.PI * k / 4096, dr = 1 - (1 - a) * Math.cos(w), di = (1 - a) * Math.sin(w), m = dr * dr + di * di;
      const lr = a * dr / m, li = -a * di / m, hr = gh + (gl - gh) * lr, hi = (gl - gh) * li; s += hr * hr + hi * hi; c++; } return 10 * Math.log10(s / c); };
  for (const t of [1, -1, 0.5]) { const T = psd(gen({ colour: 0, tilt: t }, N)[0]);
    for (const f of [100, 1000, 12800]) { const want = theory(t, f), got = T(f) - W(f); ok(near(got, want, 0.4), `tilt ${t} at ${f} Hz: ${got.toFixed(2)} dB (theory ${want.toFixed(2)})`); } }
  const U = psd(gen({ colour: 0, tilt: 1 }, N)[0]); ok((U(12800) - W(12800)) - (U(100) - W(100)) > 10, 'tilt +1 lifts the highs over the lows by more than 10 dB'); }
// ---- seed: the same seed, the same noise; another seed, another noise
{ const a = gen({ colour: 1 }, 48000, 7)[0], b = gen({ colour: 1 }, 48000, 7)[0], c = gen({ colour: 1 }, 48000, 8)[0];
  ok(a.every((v, i) => v === b[i]), 'the same seed gives the same noise, sample for sample'); ok(a.some((v, i) => v !== c[i]), 'another seed, another noise'); }
// ---- width: 0 the same in both channels; 1 two uncorrelated noises; power kept between
{ const corr = (L, R) => { let a = 0, b = 0, c = 0; for (let j = 0; j < L.length; j++) { a += L[j] * R[j]; b += L[j] * L[j]; c += R[j] * R[j]; } return a / Math.sqrt(b * c); };
  const [L0, R0] = gen({ colour: 0, width: 0 }, SR), [L1, R1] = gen({ colour: 0, width: 1 }, SR), [Lh, Rh] = gen({ colour: 0, width: 0.5 }, SR);
  ok(L0.every((v, i) => v === R0[i]), 'width 0: both channels the same'); ok(Math.abs(corr(L1, R1)) < 0.02, `width 1: uncorrelated (${corr(L1, R1).toFixed(3)})`);
  const pw = (x) => x.reduce((s, v) => s + v * v, 0); ok(near(10 * Math.log10(pw(Rh) / pw(Lh)), 0, 0.2), 'width 0.5: the right channel keeps its power'); }
ok(NOISE_WORKLET.includes(Noise.toString()) && NOISE_PARAMS.length === 6, 'the worklet is the tested kernel, 6 AudioParams');
{ const k = Noise(); k.setRate(SR); const L = new Float32Array(128), R = new Float32Array(128), p = P({ colour: 1, tilt: 0.3 }), M = SR * 4;
  const t = process.hrtime.bigint(); for (let j = 0; j < M; j += 128) k.process([L, R], 128, p); const ns = Number(process.hrtime.bigint() - t) / M;
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample (pink, tilted)`); ok(ns < 2000, 'under 2 µs per stereo sample'); }
console.log(`osc-noise: ${n} checks pass`);

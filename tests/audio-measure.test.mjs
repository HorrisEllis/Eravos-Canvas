// The test instrument is tested first: every measure in tests/audio-measure.js against signals whose answer is known.
//   node tests/audio-measure.test.mjs
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
require('./audio-measure.js'); const M = globalThis.AudioMeasure;
const SR = 48000; let fail = 0, pass = 0;
const check = (ok, msg) => { if (ok) pass++; else { fail++; console.log('✗ ' + msg); } };
const buf = (chs) => ({ sampleRate: SR, numberOfChannels: chs.length, getChannelData: (c) => chs[c] });
const gen = (sec, fn) => { const d = new Float32Array(Math.round(sec * SR)); for (let i = 0; i < d.length; i++) d[i] = fn(i / SR, i); return d; };
const saw = (hz) => (t) => 2 * ((t * hz) % 1) - 1;
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// pitch: sine, saw, square at bass/mid/high notes — within 1 cent
for (const n of [28, 33, 45, 57, 60, 69, 81]) {
  const hz = M.midiHz(n);
  for (const [name, fn] of [['sine', (t) => Math.sin(2 * Math.PI * hz * t)], ['saw', saw(hz)], ['square', (t) => Math.sign(Math.sin(2 * Math.PI * hz * t))]]) {
    const p = M.pitch(gen(0.6, fn), SR, 0.05, 0.55);
    check(Math.abs(M.cents(p.hz, hz)) < 1, `pitch ${name} midi ${n}: ${p.hz.toFixed(3)} Hz vs ${hz.toFixed(3)} (${M.cents(p.hz, hz).toFixed(2)} c)`);
  }
}
// pitch with a detuned unison (supersaw-like, ±12 cents) still reads the centre within 5 cents
{ const hz = M.midiHz(57), d = gen(0.6, (t) => [-12, -5, 0, 5, 12].reduce((a, c) => a + saw(hz * Math.pow(2, c / 1200))(t + c * 0.001), 0) / 5);
  const p = M.pitch(d, SR, 0.05, 0.55); check(Math.abs(M.foldCents(p.hz, hz)) < 5, `pitch unison: ${M.foldCents(p.hz, hz).toFixed(2)} c`); }
// a deliberately 30-cent-sharp tone is reported as 30 cents sharp (the instrument can see a real error)
{ const hz = M.midiHz(45) * Math.pow(2, 30 / 1200), p = M.pitch(gen(0.6, saw(hz)), SR, 0.05, 0.55); check(Math.abs(M.cents(p.hz, M.midiHz(45)) - 30) < 1, 'pitch sees +30 c'); }
// octave folding: an octave-up tone folds to ~0
check(Math.abs(M.foldCents(220, 110)) < 1e-9 && Math.abs(M.foldCents(M.midiHz(45) * Math.pow(2, 7 / 1200), M.midiHz(45)) - 7) < 1e-6, 'foldCents');

// onsets: clicks placed on a 16th grid at 140 BPM, with noise between — found to the sample (≤ 0.05 ms)
{ const bpm = 140, step = 60 / bpm / 4, t0 = 0.1, d = gen(3, () => (rnd() - 0.5) * 0.002), at = [];
  for (let k = 0; k < 12; k++) { const t = t0 + k * step * 2, s = Math.round(t * SR); at.push(s / SR); for (let i = 0; i < 400; i++) d[s + i] += Math.exp(-i / 80) * Math.sin(i * 0.3) * 0.8 + (i === 0 ? 0.5 : 0); }
  const o = M.onsets(d, SR); check(o.length === 12, `onsets found ${o.length} of 12`);
  const err = M.gridError(o, bpm, t0); check(err.every(e => Math.abs(e.errMs) < 0.05), 'onset grid error ' + err.map(e => e.errMs.toFixed(3)).join(','));
  // one hit moved 3 ms late is reported as 3 ms late
  const d2 = gen(1, () => 0), s = Math.round((t0 + step * 4) * SR + 0.003 * SR); for (let i = 0; i < 400; i++) d2[s + i] = Math.exp(-i / 80) * 0.8 + (i === 0 ? 0.2 : 0);
  const e2 = M.gridError(M.onsets(d2, SR), bpm, t0); check(e2.length === 1 && Math.abs(e2[0].errMs - 3) < 0.05, 'sees a 3 ms late hit: ' + JSON.stringify(e2)); }

// a quieter hit (−6 dB under the first) on top of a loud decaying tail is still found to within 0.1 ms (was read up to one 2 ms frame early)
{ const d = gen(1.2, (t) => t > 0.1 ? 0.8 * Math.exp(-(t - 0.1) / 0.6) * Math.sin(2 * Math.PI * 55 * t) : 0), s = Math.round(0.6 * SR);
  for (let i = 0; i < 300; i++) d[s + i] += 0.4 * Math.exp(-i / 60) * Math.sin(i * 1.1);
  const o = M.onsets(d, SR, { floorDb: -40, ratio: 1.5, diff: true }), hit = o.find(t => Math.abs(t - 0.6) < 0.01);
  check(hit !== undefined && Math.abs(hit - s / SR) < 0.0001, 'quiet hit over a tail: ' + (hit === undefined ? 'missed' : ((hit - s / SR) * 1000).toFixed(3) + ' ms')); }
// modRate: a 110 Hz saw gated by an LFO at 140 BPM 1/8 triplet... use plain divisions: 1/4 at 140 = 2.333 Hz, 1/16 = 9.333 Hz
for (const [div, hz] of [['1/4', 140 / 60], ['1/8', 140 / 60 * 2], ['1/16', 140 / 60 * 4], ['1/8T', 140 / 60 * 3]]) {
  const d = gen(4, (t) => saw(55)(t) * (0.55 + 0.45 * Math.cos(2 * Math.PI * hz * t)));
  const r = M.modRate(d, SR, 0.5, 3.5); check(Math.abs(r.hz - hz) / hz < 0.01, `modRate ${div}: ${r.hz.toFixed(3)} vs ${hz.toFixed(3)}`);
}
// scan: NaN, clip, DC
{ const d = gen(0.1, (t, i) => (i === 10 ? NaN : i === 20 ? 1.0 : 0.1)); const s = M.scan(buf([d])); check(s.nan === 1 && s.clip === 1 && Math.abs(s.dc - 0.1) < 0.01, 'scan ' + JSON.stringify(s)); }
// correlation: mono 1, inverted −1, independent noise ~0
{ const a = gen(0.5, () => rnd() - 0.5), b = a.map(v => -v), c = gen(0.5, () => rnd() - 0.5);
  check(Math.abs(M.correlation(buf([a, a])) - 1) < 1e-9 && Math.abs(M.correlation(buf([a, b])) + 1) < 1e-9 && Math.abs(M.correlation(buf([a, c]))) < 0.05, 'correlation'); }

console.log(`${pass}/${pass + fail} instrument checks passed`); process.exit(fail ? 1 : 0);

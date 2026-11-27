// node tools/music/components/pitch-tracker/pitch-tracker.test.mjs — the pitch tracker proves its readings (new code, VL1 of the Voice Lab).
import { createRequire } from 'module'; const { PitchTracker } = createRequire(import.meta.url)('./pitch-tracker.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
// feed a signal, return the readings after the first full frame
function track(f, sec, o) { const p = PitchTracker(); p.set(o || {}, SR); const r = []; for (let i = 0; i < sec * SR; i++) if (p.push(f(i))) r.push({ hz: p.hz, conf: p.conf, voiced: p.voiced }); return r; }
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const cents = (a, b) => 1200 * Math.log2(a / b);
// ---- sines from a low male voice to a high soprano: within ±3 cents
for (const hz of [82.41, 110, 196, 261.63, 440, 659.25, 987.77]) { const r = track((i) => 0.5 * Math.sin(2 * Math.PI * hz * i / SR), 0.4), m = median(r.map(x => x.hz));
  ok(r.every(x => x.voiced) && Math.abs(cents(m, hz)) < 3, `sine ${hz} Hz → ${m.toFixed(3)} Hz (${cents(m, hz).toFixed(2)} c)`); }
// ---- a synthetic sung vowel: a glottal pulse train (all harmonics, falling) through three formants — within ±3 cents, voiced
function vowel(f0, F) { const g = (i) => { let s = 0; for (let k = 1; k * f0 < 6000; k++) { const fk = k * f0; let a = 1 / k; for (const [fc, bw] of F) a *= 1 + 6 / (1 + Math.pow((fk - fc) / bw, 2)); s += a * Math.sin(2 * Math.PI * fk * i / SR + k * 0.7); } return s; };
  let mx = 0; for (let i = 0; i < 2000; i++) mx = Math.max(mx, Math.abs(g(i))); return (i) => 0.4 * g(i) / mx; }
for (const [f0, F, name] of [[130.81, [[730, 90], [1090, 110], [2440, 160]], 'AH at C3'], [220, [[300, 60], [870, 90], [2240, 150]], 'OO at A3'], [349.23, [[270, 60], [2290, 120], [3010, 200]], 'EE at F4']]) {
  const r = track(vowel(f0, F), 0.4), m = median(r.map(x => x.hz)); ok(r.filter(x => x.voiced).length > r.length * 0.95 && Math.abs(cents(m, f0)) < 3, `${name}: ${m.toFixed(3)} Hz (${cents(m, f0).toFixed(2)} c)`); }
// ---- the octave guard: a tone whose 2nd harmonic is twice as loud as its fundamental still reads the fundamental
{ const f0 = 150, r = track((i) => 0.2 * Math.sin(2 * Math.PI * f0 * i / SR) + 0.4 * Math.sin(2 * Math.PI * 2 * f0 * i / SR) + 0.1 * Math.sin(2 * Math.PI * 3 * f0 * i / SR), 0.4), m = median(r.map(x => x.hz));
  ok(Math.abs(cents(m, f0)) < 3, `strong 2nd harmonic: reads ${m.toFixed(2)} Hz (the fundamental ${f0})`); }
// ---- noise is unvoiced; silence is unvoiced; a quiet voice under the gate is unvoiced
{ let s = 7; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2147483648 - 1; };
  const r = track(() => 0.3 * rnd(), 0.4); ok(r.filter(x => x.voiced).length < r.length * 0.05, `white noise: ${r.filter(x => x.voiced).length} of ${r.length} voiced`);
  ok(track(() => 0, 0.2).every(x => !x.voiced && x.hz === 0), 'silence: unvoiced, 0 Hz');
  ok(track((i) => 0.001 * Math.sin(2 * Math.PI * 220 * i / SR), 0.3).every(x => !x.voiced), 'under −50 dBFS: unvoiced'); }
// ---- it follows a glide (an auto-tune input): a slide 200 → 300 Hz over a second, each reading within 15 cents of where the slide was ~21 ms before
{ const f = (t) => 200 * Math.pow(1.5, t), r = [], p = PitchTracker(); p.set({}, SR); let ph = 0, bad = 0, cnt = 0;
  for (let i = 0; i < SR * 1.2; i++) { const t = i / SR; ph += 2 * Math.PI * f(Math.min(1, t)) / SR; if (p.push(0.5 * Math.sin(ph))) { const tc = Math.min(1, Math.max(0, t - 1024 / SR)); if (t > 0.1 && t < 1) { cnt++; if (Math.abs(cents(p.hz, f(tc))) > 15) bad++; } } }
  ok(bad === 0, `glide: ${bad} of ${cnt} readings off by > 15 c`); }
// ---- a new reading every hop; cents() against a reference
{ const p = PitchTracker(); p.set({}, SR); let k = 0; for (let i = 0; i < 2048 + 256 * 10; i++) if (p.push(Math.sin(2 * Math.PI * 440 * i / SR))) k++; ok(k === 11, `readings every 256 samples: ${k}`); ok(Math.abs(p.cents(440)) < 3, 'cents() against 440'); }
console.log(`✓ pitch-tracker: ${n} checks`);

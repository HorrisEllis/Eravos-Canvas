// node tools/music/components/beat-tracker/beat-tracker.test.mjs — tempo, beats and the bar from a recording (new code, Song Import SI1).
import { createRequire } from 'module'; const R = createRequire(import.meta.url), { BeatTracker } = R('./beat-tracker.js'), { OnsetDetector } = R('../onset-detector/onset-detector.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 22050;
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
// a hat: noise high-passed steeply (a third difference: almost all of it above 5 kHz, as a real hat)
const hatN = () => { let a = 0, b = 0, c = 0; return () => { const w = rnd(), y = w - 3 * a + 3 * b - c; c = b; b = a; a = w; return y / 8; }; };
const add = (x, t, len, f) => { const s = Math.round(t * SR); for (let i = 0; i < len && s + i < x.length; i++) x[s + i] += f(i); };
// a loop: kick on 1 (and 3 in four-on-the-floor), snare on 2 and 4, hats on the eighths (accented off the beat — the trap for a comb)
function loop(bpm, bars, o = {}) { const B = 60 / bpm, t0 = o.t0 || 0.2, x = new Float32Array(Math.ceil((t0 + bars * 4 * B + 1) * SR));
  for (let b = 0; b < bars * 4; b++) { const t = t0 + b * B;
    if (b % 4 === 0 || (!o.half && b % 2 === 0)) add(x, t, 4000, i => 0.9 * Math.exp(-i / 500) * Math.sin(2 * Math.PI * (50 + 100 * Math.exp(-i / 160)) * i / SR));
    if (b % 2 === 1 && !o.half) add(x, t, 3000, i => 0.5 * Math.exp(-i / 500) * rnd()); if (o.half && b % 4 === 2) add(x, t, 3000, i => 0.5 * Math.exp(-i / 500) * rnd());
    { const h = hatN(); add(x, t, 600, i => 0.12 * Math.exp(-i / 90) * h()); } { const h = hatN(); add(x, t + B / 2, 600, i => 0.25 * Math.exp(-i / 90) * h()); } }
  return { x, t0, B }; }
const run = (L) => { const on = OnsetDetector.analyse(L.x, SR); return BeatTracker.analyse(on.env, on.frameRate, { t0: on.t0, low: on.low, mid: on.mid }); };
for (const bpm of [87, 120, 128, 140, 174]) { const L = loop(bpm, 8), r = run(L), off = (((r.phase - L.t0) / L.B) % 1 + 1) % 1;
  ok(Math.abs(r.bpm - bpm) < 0.5, `${bpm} BPM → ${r.bpm}`); ok(Math.min(off, 1 - off) * L.B < 0.02, `${bpm}: the beat on the kicks (${(Math.min(off, 1 - off) * L.B * 1000).toFixed(1)} ms off) — not between them`);
  ok(r.conf > 0.5, `${bpm}: sure (${r.conf.toFixed(2)})`); }
// half-time (a kick on 1, a snare on 3) at 140; the bar starts on the kick on 1
// (half-time: the drums every two beats — read as 70, with 140 as its other octave: both true readings of a half-time groove)
{ const L = loop(140, 8, { half: true, t0: 0.35 }), r = run(L), bars = (r.downbeat - L.t0) / (4 * L.B);
  ok([r.bpm, r.alt].some(v => Math.abs(v - 140) < 0.5) && [r.bpm, r.alt].some(v => Math.abs(v - 70) < 0.5), `half-time 140 → ${r.bpm} (the other octave ${r.alt})`); ok(Math.abs(bars - Math.round(bars)) * 4 * L.B < 0.03, `the bar starts on a kick on 1 (${r.downbeat.toFixed(3)} s)`); }
// beats cover the recording at the period; silence is no tempo
{ const L = loop(120, 6), r = run(L); ok(r.beats.length >= 23 && r.beats.every((t, i) => i === 0 || Math.abs(t - r.beats[i - 1] - 0.5) < 0.005), `${r.beats.length} beats, 0.5 s apart`);
  ok(BeatTracker.analyse(new Float32Array(2000), 86).bpm === 0, 'silence: no tempo'); }
console.log(`beat-tracker: ${n} checks pass`);

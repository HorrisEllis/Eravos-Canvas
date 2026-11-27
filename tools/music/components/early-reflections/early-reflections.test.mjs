// node tools/music/components/early-reflections/early-reflections.test.mjs — the room's first echoes, proved (new code).
import { createRequire } from 'module'; const { Reflections } = createRequire(import.meta.url)('./early-reflections.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
const imp = (o, sec) => { const r = Reflections(); r.set(o, SR); const L = [], R = []; for (let i = 0; i < SR * (sec || 0.5); i++) { const v = r.process(i === 0 ? 1 : 0); L.push(v[0]); R.push(v[1]); } return { L, R, taps: r.taps() }; };
// ---- the first tap arrives at pre-delay + 0.27·size / 343 (one sample at most), nothing before it
{ const r = imp({ size: 10, predelay: 5, damping: 0 }), t0 = 0.005 + 0.27 * 10 / 343; let first = -1; for (let i = 0; i < r.L.length; i++) if (Math.abs(r.L[i]) + Math.abs(r.R[i]) > 1e-6) { first = i; break; }
  ok(Math.abs(first - t0 * SR) <= 1.5, `first echo at ${(first / SR * 1000).toFixed(2)} ms (want ${(t0 * 1000).toFixed(2)})`); }
// ---- a bigger room: every echo later; 12 taps, louder walls (absorption 0) than soft ones (0.8)
{ const a = imp({ size: 6 }).taps, b = imp({ size: 30 }).taps; ok(a.length === 12 && a.every((t, k) => b[k].t > t.t), 'size 30 m: every echo later than 6 m');
  const hard = imp({ absorption: 0 }).taps, soft = imp({ absorption: 0.8 }).taps; ok(hard.every((t, k) => soft[k].g < t.g), 'absorption: every echo quieter'); }
// ---- spread 0: mono (L = R); spread 1: the first two echoes on opposite sides
{ const m = imp({ spread: 0 }); let d = 0; m.L.forEach((v, i) => { d = Math.max(d, Math.abs(v - m.R[i])); }); ok(d < 1e-12, 'spread 0: L = R');
  const s = imp({ spread: 1 }).taps; ok(s[0].pan < -0.9 && s[1].pan > 0.9, 'spread 1: left then right'); }
// ---- damping: the late echoes darker (an 8 kHz tone loses more through the room than 500 Hz)
{ const tone = (hz, damping) => { const r = Reflections(); r.set({ damping, size: 12 }, SR); let s = 0; for (let i = 0; i < SR * 0.5; i++) { const v = r.process(Math.sin(2 * Math.PI * hz * i / SR)); if (i > SR * 0.2) s += v[0] * v[0]; } return Math.sqrt(s); };
  ok(tone(8000, 1) / tone(8000, 0) < tone(500, 1) / tone(500, 0) * 0.7, 'damping darkens'); }
// ---- stable and silent after a reset
{ const r = Reflections(); r.set({}, SR); for (let i = 0; i < 9999; i++) r.process(Math.random() * 2 - 1); r.reset(); const v = r.process(0); ok(v[0] === 0 && v[1] === 0, 'reset: silent'); }
console.log(`✓ early-reflections: ${n} checks`);

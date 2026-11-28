// node tools/music/components/spectral-features/spectral-features.test.mjs — the frames prove their numbers (new code, Song Import SI1).
import { createRequire } from 'module'; const { SpectralFrames } = createRequire(import.meta.url)('./spectral-features.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, feed = (f, sec, o) => { const s = SpectralFrames(); s.set(o || {}, SR); const fr = []; for (let i = 0; i < sec * SR; i++) if (s.push(f(i))) fr.push({ mag: Float32Array.from(s.mag), c: s.centroid, flux: s.flux(20, 20000), t: s.time, lo: s.band(20, 300), hi: s.band(3000, 20000) }); return { s, fr }; };
// a full-scale sine on a bin reads 1 at that bin; its centroid is its frequency
{ const f = 375 * 2048 / SR, hz = Math.round(f) * SR / 2048, { fr } = feed((i) => Math.sin(2 * Math.PI * hz * i / SR), 0.3), m = fr[fr.length - 1].mag, k = Math.round(hz * 2048 / SR);
  ok(Math.abs(m[k] - 1) < 0.02, `a full-scale sine reads ${m[k].toFixed(3)} at its bin`); ok(Math.abs(fr[fr.length - 1].c - hz) / hz < 0.02, `centroid ${fr[fr.length - 1].c.toFixed(1)} Hz for ${hz.toFixed(1)} Hz`); }
// a steady tone brings no flux after it settles; a tone that starts brings flux at its start
{ const { fr } = feed((i) => i > SR * 0.2 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / SR) : 0, 0.6), late = fr.filter(x => x.t > 0.35), at = fr.filter(x => x.t > 0.17 && x.t < 0.25);
  ok(late.every(x => x.flux < 0.05), `steady: flux ${Math.max(...late.map(x => x.flux)).toFixed(3)} (none)`); ok(Math.max(...at.map(x => x.flux)) > 10, `a start: flux ${Math.max(...at.map(x => x.flux)).toFixed(1)}`); }
// bands: a low tone is in the low band, a high one in the high band
{ const lo = feed((i) => Math.sin(2 * Math.PI * 80 * i / SR), 0.2).fr.pop(), hi = feed((i) => Math.sin(2 * Math.PI * 6000 * i / SR), 0.2).fr.pop();
  ok(lo.lo > 100 * lo.hi && hi.hi > 100 * hi.lo, 'bands keep low and high apart'); }
// frame times: a frame's time is its centre; a new frame every hop
{ const { fr } = feed(() => 0, 0.2, { size: 1024, hop: 256 }); ok(Math.abs(fr[0].t - 512 / SR) < 1e-9 && Math.abs(fr[1].t - fr[0].t - 256 / SR) < 1e-9, `first frame at ${(fr[0].t * 1000).toFixed(2)} ms, then every hop`); }
// silence is all zeros; reset forgets
{ const { s, fr } = feed(() => 0, 0.1); ok(fr.every(x => x.flux === 0 && x.mag.every(v => v === 0)), 'silence: nothing'); s.reset(); ok(s.frames === 0, 'reset forgets'); }
console.log(`spectral-features: ${n} checks pass`);

// node tools/music/components/onset-detector/onset-detector.test.mjs — where hits start, by band (new code, Song Import SI1 / SI2).
import { createRequire } from 'module'; const { OnsetDetector } = createRequire(import.meta.url)('./onset-detector.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 44100;
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
const kick = (x, t, a = 0.8) => { const s = Math.round(t * SR); for (let i = 0; i < 6000 && s + i < x.length; i++) x[s + i] += a * Math.exp(-i / 700) * Math.sin(2 * Math.PI * (50 + 110 * Math.exp(-i / 250)) * i / SR); };
const hat = (x, t, a = 0.3) => { const s = Math.round(t * SR); let y = 0; for (let i = 0; i < 1500 && s + i < x.length; i++) { const w = rnd(); x[s + i] += a * Math.exp(-i / 200) * (w - y); y = w; } };
const snare = (x, t, a = 0.5) => { const s = Math.round(t * SR); for (let i = 0; i < 5000 && s + i < x.length; i++) x[s + i] += a * Math.exp(-i / 900) * (0.6 * rnd() + 0.4 * Math.sin(2 * Math.PI * 190 * i / SR)); };
// kicks are found in the low band, each within 12 ms, once
{ const x = new Float32Array(SR * 3), T = [0.25, 0.71, 1.18, 1.52, 2.05, 2.6]; T.forEach(t => kick(x, t)); const lo = OnsetDetector.analyse(x, SR).onsets.filter(o => o.band === 'low');
  ok(lo.length === T.length, `${lo.length} low onsets for ${T.length} kicks`); T.forEach((t, i) => ok(lo[i] && Math.abs(lo[i].t - t) < 0.012, `kick at ${t}: found at ${lo[i] && lo[i].t.toFixed(4)}`)); }
// hats are found in the high band and not in the low; snares in the mid
{ const x = new Float32Array(SR * 2), H = [0.2, 0.45, 0.7, 0.95, 1.2, 1.45], S = [0.33, 1.08]; H.forEach(t => hat(x, t)); S.forEach(t => snare(x, t)); const on = OnsetDetector.analyse(x, SR).onsets;
  const hi = on.filter(o => o.band === 'high'), mid = on.filter(o => o.band === 'mid'), lo = on.filter(o => o.band === 'low');
  ok(H.every(t => hi.some(o => Math.abs(o.t - t) < 0.012)), `every hat in the high band (${hi.length} found)`); ok(S.every(t => mid.some(o => Math.abs(o.t - t) < 0.015)), `both snares in the mid band (${mid.length})`);
  ok(lo.length <= S.length, `nothing in the low band but the snares' body (${lo.length})`); }
// a held tone and silence give no onsets after the tone's start
{ const x = new Float32Array(SR * 2); for (let i = SR * 0.2; i < x.length; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * 220 * i / SR); const on = OnsetDetector.analyse(x, SR).onsets;
  ok(on.every(o => Math.abs(o.t - 0.2) < 0.03), `a held tone: only its start (${on.map(o => o.t.toFixed(3)).join(' ')})`); ok(OnsetDetector.analyse(new Float32Array(SR), SR).onsets.length === 0, 'silence: none'); }
// Gap: two kicks 30 ms apart are one onset at Gap 60 ms, two at 20 ms; the envelope has one value per frame
{ const x = new Float32Array(SR); kick(x, 0.3); kick(x, 0.33); const a = OnsetDetector.analyse(x, SR).onsets.filter(o => o.band === 'low').length, b = OnsetDetector.analyse(x, SR, { gap: 0.02 }).onsets.filter(o => o.band === 'low').length;
  ok(a === 1 && b === 2, `Gap: ${a} at 60 ms, ${b} at 20 ms`); const r = OnsetDetector.analyse(x, SR); ok(r.env.length === r.low.length && Math.abs(r.env.length - (SR - 1024) / 256) <= 2 && Math.abs(r.frameRate - SR / 256) < 1e-9, `envelope: ${r.env.length} frames at ${r.frameRate.toFixed(2)} / s`); }
console.log(`onset-detector: ${n} checks pass`);

// node tools/music/components/tension-meter/tension-meter.test.mjs — the meter hears loudness, brightness, density and motion (new code).
import { createRequire } from 'module'; const { TensionMeter } = createRequire(import.meta.url)('./tension-meter.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, B = 128;
function hear(f, sec, o) { const m = TensionMeter(); m.set(o || {}, SR); const L = new Float32Array(B); let st; for (let k = 0; k < sec * SR / B; k++) { for (let i = 0; i < B; i++) L[i] = f(k * B + i); st = m.block(L, null, B); } return Object.assign({}, st); }
const sine = (hz, a) => (i) => (a || 0.5) * Math.sin(2 * Math.PI * hz * i / SR);
// ---- loudness: −6 dB reads 0.875 (±0.02); silence 0; louder reads higher
{ const s = hear(sine(300, Math.SQRT2 * Math.pow(10, -6 / 20)), 2); ok(Math.abs(s.loudness - 0.875) < 0.02, `−6 dB RMS → ${s.loudness.toFixed(3)}`); ok(hear(() => 0, 1).loudness === 0, 'silence → 0'); }
// ---- brightness: the estimate finds a sine's frequency (±3 %), 4 kHz brighter than 200 Hz
for (const hz of [200, 1000, 4000]) { const s = hear(sine(hz), 1), want = Math.log(hz / 150) / Math.log(6000 / 150); ok(Math.abs(s.brightness - want) < 0.01, `${hz} Hz → ${s.brightness.toFixed(3)} (${want.toFixed(3)})`); }
// ---- density: clicks 6 times a second read ~0.375 (6/8); a steady tone 0
{ const clicks = (i) => (i % (SR / 6) < 200 ? Math.sin(i * 0.3) * 0.8 : 0); const s = hear(clicks, 3); ok(Math.abs(s.density - 6 / 8) < 0.07, `6 hits / s → ${s.density.toFixed(3)} (0.75 = 6 of 8)`);
  ok(hear(sine(300), 3).density === 0, 'a steady tone: no hits'); }
// ---- motion: a sweep moves, a steady tone does not
{ const sweep = (i) => 0.5 * Math.sin(2 * Math.PI * 200 * (Math.pow(2, i / SR) - 1) / Math.LN2); const want = Math.log(2) / Math.log(6000 / 150) / 0.5, a = hear(sweep, 2.5).motion, b = hear(sine(1000), 6).motion;   // the tone appearing from silence is motion too: measured once it has settled
  ok(Math.abs(a - want) < 0.06, `a sweep of one octave a second → ${a.toFixed(3)} (${want.toFixed(3)})`); ok(b < 0.02, `steady → ${b.toFixed(4)}`); }
// ---- the sum is the weighted mean; weights 0 leave a kind out
{ const s = hear(sine(4000), 1, { wLoud: 1, wBright: 0, wDense: 0, wMotion: 0 }); ok(Math.abs(s.sum - s.loudness) < 1e-12, 'only loudness weighted → sum = loudness'); }
console.log(`✓ tension-meter: ${n} checks`);

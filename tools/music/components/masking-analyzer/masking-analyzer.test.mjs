// node tools/music/components/masking-analyzer/masking-analyzer.test.mjs — where two spectra collide (new code).
import { createRequire } from 'module'; const { masking } = createRequire(import.meta.url)('./masking-analyzer.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const binHz = 48000 / 4096, N = 2048;
const spec = (peaks) => { const d = new Float32Array(N).fill(-120); peaks.forEach(([hz, db, w]) => { for (let i = 0; i < N; i++) { const f = i * binHz, x = Math.log2(f / hz) / (w || 0.3); d[i] = Math.max(d[i], db - 12 * x * x); } }); return d; };
const band = (r, hz) => r.bands.find(b => b.lo <= hz && hz < b.hi);
// a kick at 55 Hz and a sub at 55 Hz collide there; a kick at 55 and a lead at 2 kHz do not
{ const r = masking(spec([[55, -10]]), spec([[55, -12]]), { binHz }); ok(band(r, 55).collide > 0.9, `same band, both loud: ${band(r, 55).collide.toFixed(2)}`); ok(r.total > 0.8, `total ${r.total.toFixed(2)}`); }
{ const r = masking(spec([[55, -10]]), spec([[2000, -10]]), { binHz }); ok(band(r, 55).collide < 0.05 && band(r, 2000).collide < 0.05, 'apart: no collision'); ok(r.total < 0.1, `total ${r.total.toFixed(2)}`); }
// the quieter one decides: −10 against −40 collides less than −10 against −15
{ const a = band(masking(spec([[100, -10]]), spec([[100, -40]]), { binHz }), 100).collide, b = band(masking(spec([[100, -10]]), spec([[100, -15]]), { binHz }), 100).collide; ok(a < b && a > 0, `−40 vs −10: ${a.toFixed(2)} < −15 vs −10: ${b.toFixed(2)}`); }
// thirds of an octave from 20 Hz: 28 bands to 16 kHz (20·2^(28/3) = 12.7 kHz, the last edge under 16 kHz)
{ const r = masking(spec([]), spec([]), { binHz }); ok(r.bands.length === 28, `${r.bands.length} bands`); ok(r.total === 0, 'silence: 0'); }
console.log(`✓ masking-analyzer: ${n} checks`);

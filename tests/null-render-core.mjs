/* Null-render core — the maths of "this refactor changed nothing" (eravos.music-ecosystem §13 phase 0; eravos.components.spec:
 * "each move proved to change nothing"). Pure functions, no browser: tests/null-render-core.test.mjs runs them anywhere.
 *
 *   store(float32)        → { scale, i16 }   block-floating baseline: int16 against the render's own peak, so a quiet preset
 *                                            keeps ~−84 dB (re its RMS) of resolution, far under the −60 dB gate
 *   restore(scale, i16)   → Float32Array
 *   nullDb(ref, now)      → { relDb, peakDb, refDb, absolute }   residual RMS re the reference RMS (dB); a reference under
 *                                            −100 dBFS is judged absolutely (nothing to be relative to)
 *   judge(r, {gateDb, unstable}) → 'PASS' | 'FAIL' | 'UNSTABLE'
 */
export const GATE_DB = -60, SILENT_DB = -100, SELF_DB = -90;
const db = (x) => 20 * Math.log10(Math.max(1e-12, x));
const rms = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, a.length)); };

export function store(f) {
  let pk = 0; for (let i = 0; i < f.length; i++) { const q = Math.abs(f[i]); if (isFinite(q) && q > pk) pk = q; }
  const scale = pk || 1, i16 = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) i16[i] = isFinite(f[i]) ? Math.round(f[i] / scale * 32767) : 0;
  return { scale, i16 };
}
export function restore(scale, i16) { const f = new Float32Array(i16.length); for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 32767 * scale; return f; }

export function nullDb(ref, now) {
  const n = Math.min(ref.length, now.length), res = new Float32Array(n); let nan = 0, pk = 0;
  for (let i = 0; i < n; i++) { const x = now[i]; if (!isFinite(x)) { nan++; res[i] = ref[i]; continue; } res[i] = x - ref[i]; const q = Math.abs(res[i]); if (q > pk) pk = q; }
  const refRms = rms(ref.subarray(0, n)), resRms = rms(res), absolute = db(refRms) < SILENT_DB;
  return { relDb: absolute ? db(resRms) : db(resRms / refRms), peakDb: db(pk), refDb: db(refRms), absolute, lenDiff: now.length - ref.length, nan };
}

export function judge(r, opt = {}) {
  const gate = opt.gateDb ?? GATE_DB;
  if (opt.unstable) return 'UNSTABLE';
  if (r.nan || r.lenDiff) return 'FAIL';
  return r.relDb <= gate ? 'PASS' : 'FAIL';
}

/* a render that does not repeat itself cannot be nulled: record() renders twice and calls it unstable above SELF_DB */
export const isUnstable = (a, b) => nullDb(a, b).relDb > SELF_DB;

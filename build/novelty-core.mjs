/* The novelty measure, shared — build/novelty.mjs (the report) and build/novelty-gate.mjs (the advisory gate) measure with THIS code, so
 * the gate can never drift from the report. A fingerprint `v` (tests/audio-measure.js) is scaled 0…1 per feature across all of ERAVOS (lo/hi);
 * four groups count equally (tone colour · tone shape · envelope · motion); d = 0 the same fingerprint, 1 as far apart as anything in ERAVOS. */
export const NB = 24;
export const groupsFor = (D) => [[0, NB], [NB, NB + 5], [NB + 5, NB + 9], [NB + 9, D]];
export function scale(items) {
  const D = items[0].v.length, lo = new Array(D).fill(Infinity), hi = new Array(D).fill(-Infinity);
  items.forEach(it => it.v.forEach((x, i) => { lo[i] = Math.min(lo[i], x); hi[i] = Math.max(hi[i], x); }));
  return { D, lo, hi };
}
export const norm = (v, lo, hi) => v.map((x, i) => hi[i] > lo[i] ? (x - lo[i]) / (hi[i] - lo[i]) : 0);
export function makeDist(groups) {
  return function dist(a, b) { let s = 0; for (const [g0, g1] of groups) { let q = 0; for (let i = g0; i < g1; i++) q += (a.n[i] - b.n[i]) ** 2; s += q / (g1 - g0) / groups.length; } return Math.sqrt(s); };
}

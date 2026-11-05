// node tools/music/components/pitch-path/pitch-path.test.mjs — a drawn path plays smooth, through what was drawn, never past it.
import { createRequire } from 'module'; const { pathAt, smoothLine, simplifyPath } = createRequire(import.meta.url)('./pitch-path.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const P = [[0, 0], [0.25, 4], [0.5, 0], [0.75, -4], [1, 0]];
P.forEach(([f, v]) => ok(Math.abs(pathAt(P, f) - v) < 1e-9, 'passes through ' + f));
// smooth: no corners — the slope changes gradually (second difference small everywhere)
let worst = 0; for (let i = 1; i < 999; i++) { const a = pathAt(P, (i - 1) / 1000), b = pathAt(P, i / 1000), c = pathAt(P, (i + 1) / 1000); worst = Math.max(worst, Math.abs(a - 2 * b + c)); }
ok(worst < 0.01, 'no corners (largest change of slope per step ' + worst.toFixed(4) + ')');
// monotone: between two points it never goes past them (no overshoot)
for (let i = 0; i < P.length - 1; i++) { const lo = Math.min(P[i][1], P[i + 1][1]), hi = Math.max(P[i][1], P[i + 1][1]); for (let k = 0; k <= 50; k++) { const v = pathAt(P, P[i][0] + (P[i + 1][0] - P[i][0]) * k / 50); ok(v >= lo - 1e-9 && v <= hi + 1e-9, `segment ${i} stays within ${lo}…${hi}`); } }
ok(pathAt(P, -1) === 0 && pathAt(P, 2) === 0 && pathAt([[0, 3]], 0.5) === 3 && pathAt([], 0.5) === 0, 'ends and degenerate paths');
// a hand-drawn wave: jitter out, then a handful of points that still follow it within 0.1 semitone
const raw = []; let s = 7; for (let i = 0; i <= 200; i++) { s = (s * 1103515245 + 12345) >>> 0; raw.push([i / 200, 5 * Math.sin(i / 200 * Math.PI * 3) + ((s / 4294967296) - 0.5) * 0.4]); }
const sm = smoothLine(raw, 3), simp = simplifyPath(sm, 0.1, 48);
ok(simp.length <= 48 && simp.length >= 6, 'a wave in ' + simp.length + ' points');
let off = 0; sm.forEach(([f, v]) => { off = Math.max(off, Math.abs(pathAt(simp, f) - v)); });
ok(off <= 0.1 + 1e-6, 'every drawn point within 0.1 st of the path (' + off.toFixed(3) + ')');
let jit = 0; for (let i = 1; i < sm.length - 1; i++) jit = Math.max(jit, Math.abs(sm[i - 1][1] - 2 * sm[i][1] + sm[i + 1][1])); let jitRaw = 0; for (let i = 1; i < raw.length - 1; i++) jitRaw = Math.max(jitRaw, Math.abs(raw[i - 1][1] - 2 * raw[i][1] + raw[i + 1][1]));
ok(jit < jitRaw / 3, `the hand's jitter taken out (${jitRaw.toFixed(2)} → ${jit.toFixed(2)})`);
console.log(`pitch-path: ${n} checks passed — smooth, through the drawn points, never past them`);

// node tools/music/components/tape-transport/tape-transport.test.mjs — the tape transport proves its own numbers (new code).
import { createRequire } from 'module'; const { Transport, TRANSPORT_WORKLET, TRANSPORT_PARAMS } = createRequire(import.meta.url)('./tape-transport.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t, DEF = Object.fromEntries(TRANSPORT_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
// run N samples; o may be a function of the sample index (block-rate changes)
function run(N, o, k) { if (!k) { k = Transport(); k.setRate(SR); } const s = new Float32Array(N), l = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const m = Math.min(128, N - j); k.process([], [s.subarray(j, j + m), l.subarray(j, j + m)], m, P(typeof o === 'function' ? o(j) : o)); } return { s, l, k }; }
// ---- at rest: speed 1, no lag, sample for sample (a tool with nothing pressed changes nothing)
{ const { s, l } = run(SR, {}); ok(s.every(x => x === 1) && l.every(x => x === 0), 'running at 1×: speed exactly 1, lag exactly 0'); }
// ---- a straight stop (curve 0) over 0.5 s: at half time half speed; stopped at 0.5 s (to the block); monotone
{ const { s, l } = run(SR * 2, { stop: 1, stopTime: 0.5, curve: 0 });
  ok(near(s[12000], 0.5, 1e-3), `straight stop: half speed at half time (${s[12000].toFixed(4)})`);
  let first = -1; for (let j = 0; j < SR; j++) if (s[j] === 0) { first = j; break; } ok(Math.abs(first - 24000) <= 1, `stopped at 0.5 s (sample ${first})`);
  let mono = true; for (let j = 1; j < 24000; j++) if (s[j] > s[j - 1] + 1e-12) mono = false; ok(mono, 'it only ever slows');
  ok(near(l[24000], 0.25, 2e-3), `lag after a 0.5 s straight stop = 0.25 s (${l[24000].toFixed(4)}) — the area the tape fell behind`);
  ok(near(l[24000 + SR] - l[24000], 1, 1e-3), 'stopped: the lag grows one second per second'); }
// ---- the curve: > 0 slows early, < 0 slows late (at half time)
{ const early = run(SR, { stop: 1, stopTime: 0.5, curve: 1 }).s[12000], late = run(SR, { stop: 1, stopTime: 0.5, curve: -1 }).s[12000];
  ok(near(early, Math.pow(0.5, 4), 1e-3) && near(late, 1 - Math.pow(0.5, 4), 1e-3), `curve 1: ${early.toFixed(4)} (slows early) · curve −1: ${late.toFixed(4)} (slows late)`); }
// ---- spin up after a stop: back to 1× over startTime, and the lag then holds still
{ const { s, l } = run(SR * 3, (j) => ({ stop: j < SR ? 1 : 0, stopTime: 0.25, startTime: 0.5, curve: 0 }));
  ok(s[SR + 24000 + 128] === 1, `spun back to 1× by 0.5 s after letting go (${s[SR + 24000 + 128]})`);
  ok(near(l[SR * 3 - 1], l[SR + 24000 + 256], 1e-6), 'back at speed: the lag stays where it is'); }
// ---- let go half-way through a stop: it spins up from where it was (no jump)
{ const { s } = run(SR, (j) => ({ stop: j < 6016 ? 1 : 0, stopTime: 0.25, startTime: 0.25, curve: 0 })); let jump = 0; for (let j = 1; j < SR; j++) jump = Math.max(jump, Math.abs(s[j] - s[j - 1]));
  ok(jump < 1 / (0.25 * SR) * 1.01 + 1e-9, `letting go mid-stop: continuous (largest step ${jump.toExponential(2)})`); }
// ---- varispeed: half speed for 1 s → about 0.5 s of lag (the 20 ms glide in); faster than 1× cannot read ahead (lag stays 0)
{ const { s, l } = run(SR, { speed: 0.5 }); ok(near(s[SR - 1], 0.5, 1e-4), 'varispeed 0.5 settles at 0.5×'); ok(near(l[SR - 1], 0.5 - 0.02 * 0.5, 2e-3), `lag after 1 s at 0.5×: ${l[SR - 1].toFixed(4)} s`);
  const f = run(SR, { speed: 1.5 }).l; ok(f.every(x => x === 0), 'faster than 1× never reads ahead of real time (lag 0)'); }
// ---- rewind: backwards at 2× — the lag grows 3 s a second, up to maxLag
{ const { s, l } = run(SR * 2, { rewind: 1, maxLag: 4 }); ok(near(s[SR], -2, 1e-4), `rewind runs at −2× (${s[SR].toFixed(3)})`); ok(near(l[SR], 3 - 0.02 * 3, 0.01), `rewind: about 3 s of lag after 1 s (${l[SR].toFixed(3)})`);
  ok(l[SR * 2 - 1] === 4 && l.every(x => x <= 4), 'never past maxLag'); }
// ---- every sample finite over a minute of everything at once
{ const { s, l } = run(SR * 60, (j) => ({ speed: Math.sin(j / SR), stop: (j / SR | 0) % 3 === 0 ? 1 : 0, rewind: (j / SR | 0) % 7 === 0 ? 1 : 0, curve: 0.7 })); ok(s.every(Number.isFinite) && l.every(Number.isFinite), 'a minute of stops, rewinds and varispeed: every sample finite'); }
ok(TRANSPORT_WORKLET.includes(Transport.toString()) && /registerProcessor\('eravos-tape-transport'/.test(TRANSPORT_WORKLET), 'the worklet runs the tested kernel, unchanged');
console.log(`tape-transport: ${n} checks passed — stops on time and on its curve, spins up continuously, lag is the area it fell behind`);

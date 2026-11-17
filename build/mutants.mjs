#!/usr/bin/env node
/* CG3 — mutants that play (specs/eravos.compat-graph.spec). A parent tool's DAG → mutate() (CG2) → assemble() each into ONE engine from its
 * components' own kernels → render a reference phrase offline → measured: it plays (finite, not silent, not pinned) and how new it is (the
 * novelty measure — advisory, his ear decides). Plain node: no browser.
 *   node build/mutants.mjs [--seed 7] [--count 6] [--wav dir] [--md docs/mutants.md]
 * The phrase: four bass notes, 0.65 s each; the tool's note in is its unwired pitch and gate (assemble.js); the harness opens and closes
 * the sound with the gate (5 ms / 40 ms) — no VCA component has a contract yet. */
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { fileURLToPath } from 'url';
import { load } from './compat-graph.mjs';
import { groupsFor, norm, makeDist } from './novelty-core.mjs';
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Compat = require(path.join(ROOT, 'tools/core/compat/compat.js')), { assemble } = require(path.join(ROOT, 'tools/core/compat/assemble.js'));
const { MusicAdapters } = require(path.join(ROOT, 'tools/music/compat/adapters.js'));
require(path.join(ROOT, 'tests/audio-measure.js')); const AM = globalThis.AudioMeasure;

export function kernels() {
  const MP = {}, dir = path.join(ROOT, 'tools/music/components');
  for (const id of fs.readdirSync(dir)) { const f = path.join(dir, id, id + '.js'); if (fs.existsSync(f)) try { Object.assign(MP, require(f)); } catch (e) { /* a logic component that needs a page */ } }
  return MP;
}
export const PARENT = { nodes: [{ id: 'osc', component: 'osc-va', vars: { shape: 'saw' } }, { id: 'flt', component: 'filter-svf', vars: { frequency: 700, resonance: 0.45, stages: 2 } },
  { id: 'drv', component: 'saturator-tube', vars: { drive: 9 } }, { id: 'st', component: 'stereo-tools' }],
  edges: [{ from: 'osc.out', to: 'flt.in' }, { from: 'flt.out', to: 'drv.in' }, { from: 'drv.out', to: 'st.in' }], outs: ['st.out'] };
export const PHRASE = [55, 65.41, 73.42, 49].map((hz, i) => ({ t: 0.05 + i * 0.65, dur: 0.6, hz }));
const SR = 48000, SECS = 2.8, SAME = 0.005;   // under SAME from its parent = the same sound to the fingerprint

export function play(dag, contracts, domain) {
  const E = assemble(dag, contracts, domain, { sr: SR }); if (!E.ok) return { ok: false, why: E.why };
  const { L, R } = E.render(SECS, PHRASE);
  // the harness's gate: 5 ms open, 40 ms close
  let g = 0; const up = 1 / (0.005 * SR), dn = 1 / (0.04 * SR);
  for (let i = 0; i < L.length; i++) { const t = i / SR, on = PHRASE.some(x => t >= x.t && t < x.t + x.dur); g = on ? Math.min(1, g + up) : Math.max(0, g - dn); L[i] *= g; R[i] *= g; }
  let nan = 0, peak = 0, pinned = 0, q = 0; for (let i = 0; i < L.length; i++) { const a = L[i], b = R[i]; if (!Number.isFinite(a) || !Number.isFinite(b)) nan++; const m = Math.max(Math.abs(a), Math.abs(b)); if (m > peak) peak = m; if (m >= 0.999) pinned++; q += a * a; }
  const rmsDb = 20 * Math.log10(Math.sqrt(q / L.length) + 1e-12), mono = new Float32Array(L.length); for (let i = 0; i < L.length; i++) mono[i] = 0.5 * (L[i] + R[i]);
  const why = []; if (nan) why.push(`${nan} samples not finite`); if (rmsDb < -50) why.push(`silent (${rmsDb.toFixed(1)} dB)`); if (pinned / L.length > 0.01) why.push(`pinned ${(100 * pinned / L.length).toFixed(1)} %`);
  const fp = !nan && rmsDb > -90 ? AM.fingerprint(mono, SR, 0.1, 2.7) : null;
  return { ok: !why.length, why, peak, rmsDb, L, R, fp: fp && fp.frames > 4 ? fp.v : null };
}

function wav(file, L, R, peak) {
  const n = L.length, b = Buffer.alloc(44 + n * 4), k = peak > 0 ? 0.89 / peak : 1;   // −1 dB peak: every mutant heard at the same level
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * k * 32767))), 44 + i * 4); b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * k * 32767))), 46 + i * 4); }
  fs.writeFileSync(file, b);
}

export function run(o) {
  const { types, contracts } = load(), MP = kernels(), domain = MusicAdapters(MP);
  const can = contracts.filter(c => domain.adapters[c.id]);   // mutate only into parts that can be assembled today
  const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/novelty-baseline.json'), 'utf8')), dist = makeDist(groupsFor(B.D));
  const base = B.items.filter(x => x.kind !== 'effect').map(x => Object.assign({}, x, { n: norm(x.v, B.lo, B.hi) }));
  const me = (v) => ({ v, n: norm(v, B.lo, B.hi) });
  const nearest = (v) => { let d = 9, nn = null; for (const x of base) { const e = dist(me(v), x); if (e < d) { d = e; nn = x; } } return { d, nn, verdict: d < B.twin ? 'TWIN' : d < B.close ? 'CLOSE' : 'novel' }; };
  const parent = play(PARENT, contracts, domain);
  const M = Compat.mutate(PARENT, can, types, { seed: o.seed, count: o.count, from: 'cg3-voice@1' });
  const rows = M.map((m, i) => { const r = play(m.dag, contracts, domain); return Object.assign({ i: i + 1, op: m.lineage.ops[0], dag: m.dag }, r,
    r.fp && parent.fp ? { fromParent: dist(me(r.fp), me(parent.fp)), near: nearest(r.fp) } : {}); });
  // OFFERED (D4): it plays (finite, not silent, not pinned) AND it is heard to differ from its parent — a change no one can hear
  // (a pulse width on a saw, a level the fingerprint does not see) is not a new sound, so it is not offered
  rows.forEach(r => { r.heard = r.fromParent != null && r.fromParent >= SAME; r.offered = r.ok && r.heard; });
  if (o.wav) { fs.mkdirSync(o.wav, { recursive: true }); wav(path.join(o.wav, '0-parent.wav'), parent.L, parent.R, parent.peak); rows.forEach(r => { if (r.L) wav(path.join(o.wav, `${r.i}-${r.op.op}.wav`), r.L, r.R, r.peak); }); }
  return { parent: Object.assign(parent, parent.fp ? { near: nearest(parent.fp) } : {}), rows, B };
}

const say = (op) => op.op === 'swap' ? `swap ${op.from} → ${op.to}` : op.op === 'insert' ? `insert ${op.component} between ${op.between.join(' → ')}`
  : op.op === 'vary' ? `vary ${op.node}.${op.key} → ${op.value}` : op.op === 'rewire' ? `rewire ${op.from}: ${op.was} → ${op.to}` : `remove ${op.node}`;
if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  const R = run({ seed: +opt('--seed', 7), count: +opt('--count', 6), wav: opt('--wav', null) });
  const f = (x) => x == null ? '—' : x.toFixed(3);
  const L = ['# Mutants that play (CG3) — generated by `node build/mutants.mjs`', '',
    `Parent: osc-va (saw) → filter-svf (700 Hz, res 0.45, 24 dB) → saturator-tube (drive 9) → stereo-tools. Four bass notes, offline, ${SR} Hz.`,
    `Novelty (advisory, never blocks): distance from the parent, and the nearest sound already in ERAVOS (docs/novelty-baseline.json, CLOSE < ${R.B.close.toFixed(3)}, TWIN < ${R.B.twin.toFixed(3)}).`, '',
    `Parent: ${R.parent.ok ? 'plays' : 'FAILS ' + R.parent.why.join('; ')} · ${R.parent.rmsDb.toFixed(1)} dB · nearest ${R.parent.near ? `${R.parent.near.nn.label} · ${R.parent.near.nn.preset} (${f(R.parent.near.d)}, ${R.parent.near.verdict})` : '—'}`, '',
    `Offered: ${R.rows.filter(r => r.offered).length} of ${R.rows.length} (a mutant is offered when it plays cleanly AND is heard to differ from its parent).`, '',
    '| # | the mutation | plays | heard as new | offered | level | from the parent | nearest in ERAVOS | verdict |', '|---|---|---|---|---|---|---|---|---|',
    ...R.rows.map(r => `| ${r.i} | ${say(r.op)} | ${r.ok ? 'yes' : 'no: ' + r.why.join('; ')} | ${r.heard ? 'yes' : 'no'} | ${r.offered ? '**yes**' : 'no'} | ${r.rmsDb != null ? r.rmsDb.toFixed(1) + ' dB' : '—'} | ${f(r.fromParent)} | ${r.near ? `${r.near.nn.label} · ${r.near.nn.preset} (${f(r.near.d)})` : '—'} | ${r.near ? r.near.verdict : '—'} |`), '',
    'The nearest-sound column compares against the baseline\'s renders, which play a different phrase; treat it as a lead to listen to, not a verdict.', ''];
  const md = L.join('\n'); fs.writeFileSync(opt('--md', path.join(ROOT, 'docs/mutants.md')), md); console.log(md);
}

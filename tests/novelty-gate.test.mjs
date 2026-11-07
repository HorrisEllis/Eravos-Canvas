// node tests/novelty-gate.test.mjs — the advisory gate names TWIN / CLOSE / novel, tells the same role from a different one, skips the
// unchanged, and NEVER blocks (exit 0 even when everything is a twin). Synthetic fingerprints; the real measure is build/novelty-core.mjs.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), T = fs.mkdtempSync(path.join(os.tmpdir(), 'ngate-'));
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const D = 35, vec = (f) => Array.from({ length: D }, (_, i) => f(i)), A = vec(i => (i % 7) / 7), Bv = vec(i => ((i * 3) % 11) / 11), C = vec(i => 1 - (i % 5) / 5);
const base = { made: '2026-11-07T00:00:00Z', close: 0.06, twin: 0.03, mu: 0.06, sd: 0.03, D, lo: vec(() => 0), hi: vec(() => 1),
  items: [{ tool: 'eravos.sub-engine', label: 'Deep Sub', preset: 'Low', kind: 'sound', v: A }, { tool: 'eravos.reese-bass', label: 'Reese Bass', preset: 'Wide', kind: 'sound', v: Bv },
    { tool: 'eravos.fx-echo', label: 'Tape Echo', preset: 'Dub', kind: 'effect', v: C }] };
const near = (v, e) => v.map((x, i) => x + (i === 0 ? e : 0));
const fresh = [
  { id: 'eravos.wobble-bass', label: 'Wobble Bass', kind: 'instrument', presets: [{ preset: 'Copy of Low', fp: near(A, 0.01), level: 'OK' }, { preset: 'Far', fp: vec(i => (i % 2)), level: 'OK' }] },   // same category (bass) → duplicate lead
  { id: 'eravos.organ', label: 'Organ', kind: 'instrument', presets: [{ preset: 'Like Reese', fp: near(Bv, 0.02), level: 'OK' }] },                                                  // different category → overlap
  { id: 'eravos.sub-engine', label: 'Deep Sub', kind: 'instrument', presets: [{ preset: 'Low', fp: A, level: 'OK' }, { preset: 'Broken', fp: null, level: 'FAIL' }] },               // unchanged · failed
];
fs.writeFileSync(path.join(T, 'b.json'), JSON.stringify(base)); fs.writeFileSync(path.join(T, 'a.json'), JSON.stringify(fresh));
const run = () => execFileSync('node', ['build/novelty-gate.mjs', '--baseline', path.join(T, 'b.json'), '--audio', path.join(T, 'a.json'), '--md', path.join(T, 'out.md')], { cwd: ROOT, env: Object.assign({}, process.env, { GITHUB_STEP_SUMMARY: '' }) }).toString();
let txt; try { txt = run(); ok(true, 'exit 0'); } catch (e) { ok(false, 'the gate must never block (exit ' + e.status + ')'); }
const md = fs.readFileSync(path.join(T, 'out.md'), 'utf8'), line = (s) => md.split('\n').find(l => l.includes(s)) || '';
ok(/\*\*TWIN\*\*/.test(line('Copy of Low')) && /Deep Sub · Low/.test(line('Copy of Low')), 'a copy of Deep Sub · Low is a TWIN of it');
ok(/same role \(bass/.test(line('Copy of Low')) && /possible duplicate/.test(line('Copy of Low')), 'same category (bass): a possible duplicate, said so');
ok(/different role/.test(line('Like Reese')) && /usually fine/.test(line('Like Reese')), 'a different role: overlap, usually fine');
ok(/\| novel \|/.test(line('Wobble Bass · Far')), 'far from everything: novel');
ok(!md.split('\n').some(l => l.startsWith('| Deep Sub · Low |')), 'an unchanged preset is not listed (it may still be someone’s nearest)'); ok(/1 render\(s\) failed/.test(md) && md.includes('Deep Sub · Broken'), 'a failed render is named, not compared');
ok(/never blocks/.test(md) && /Novelty is not quality/.test(md), 'it says what it is and is not');
fs.rmSync(T, { recursive: true, force: true });
console.log(`✓ novelty gate: ${n} checks (advisory: exit 0 always)`);

#!/usr/bin/env node
/* The novelty gate — ADVISORY (specs/eravos.music-ecosystem.spec ADDENDUM 2026-11-07). It names, it never blocks: exit 0 always.
 * His order and rules (2026-11-07T10:26:25Z): "Novelty gate, advisory mode first. Establish a baseline, detect duplication and flag collisions.
 * Don’t hard-block merges until the measurement is validated against actual listening." · "Novelty isn’t the same as quality." · "Tool overlap
 * isn’t necessarily redundancy." · "ERAVOS should be able to recognize when it is repeating itself without accidentally preventing itself
 * from discovering something new."
 *
 *   node build/novelty-gate.mjs --base origin/main                  the tools this branch changed (git diff), rendered and compared
 *   node build/novelty-gate.mjs --tools swarm-oscillator,retro-dco   named tools
 *   node build/novelty-gate.mjs --audio ta.json                      an existing tests/tool-audio.mjs run (no rendering)
 *   … [--md out.md] (default docs/novelty-gate.md; in CI also the job summary)
 * For every preset that is NEW (not in docs/novelty-baseline.json) or CHANGED (its fingerprint moved), the nearest sound already in ERAVOS
 * (same kind; never its own earlier self), measured with build/novelty-core.mjs — the same code as the report:
 *   TWIN < twin · CLOSE < close (both calibrated from ERAVOS itself) · otherwise novel
 * and, for a CLOSE or TWIN match in ANOTHER tool, whether the two tools share a role ("roles" in tool.json if the tool declares them, else its
 * category — said which): the same role = "possible duplicate — listen"; a different role = "overlap, different role — usually fine".
 * Novelty is one measure of five (novelty · musical usefulness · expressiveness · controllability · functional distinctiveness); the other
 * four are his ear's, logged in docs/listening-log.md. A low distance is a lead to listen to, never a verdict. */
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process'; import { fileURLToPath } from 'url';
import { groupsFor, norm, makeDist } from './novelty-core.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const say = (m) => console.log(m), out = opt('--md') || path.join(ROOT, 'docs', 'novelty-gate.md');
function done(lines) { const md = lines.join('\n') + '\n'; fs.writeFileSync(out, md); if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md); say(md); process.exit(0); }
const BASE = opt('--baseline') || path.join(ROOT, 'docs', 'novelty-baseline.json');
if (!fs.existsSync(BASE)) done(['## Novelty gate (advisory)', '', 'No baseline yet (docs/novelty-baseline.json): run `node tests/tool-audio.mjs --json ta.json && node build/novelty.mjs ta.json`. Nothing compared.']);
const B = JSON.parse(fs.readFileSync(BASE, 'utf8')), dist = makeDist(groupsFor(B.D));
// tool folders by id, and what each says it is for
const toolDirs = {}; for (const d of fs.readdirSync(path.join(ROOT, 'tools'))) { const td = path.join(ROOT, 'tools', d, 'tools'); if (!fs.existsSync(td)) continue;
  for (const c of fs.readdirSync(td)) { const cd = path.join(td, c); if (!fs.statSync(cd).isDirectory()) continue; for (const t of fs.readdirSync(cd)) { const tj = path.join(cd, t, 'tool.json'); if (fs.existsSync(tj)) { const j = JSON.parse(fs.readFileSync(tj, 'utf8')); toolDirs[j.id] = { dir: path.relative(ROOT, path.join(cd, t)), folder: t, roles: Array.isArray(j.roles) && j.roles.length ? j.roles : null, category: j.category }; } } } }
const roleOf = (id) => { const t = toolDirs[id]; return t ? (t.roles ? { set: t.roles, from: 'roles' } : { set: [t.category], from: 'category' }) : { set: [], from: 'unknown' }; };
// which tools to render
let audioFile = opt('--audio'), names = (opt('--tools') || '').split(',').filter(Boolean);
if (!audioFile && !names.length && opt('--base')) {
  let changed = null; const git = (r) => execSync(`git diff --name-only ${r}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean);
  try { changed = git(`${opt('--base')}...HEAD`); } catch (e) { try { changed = git(`${opt('--base')} HEAD`); } catch (e2) { /* no history */ } }   // CI checks out one commit: no merge base — then a plain diff
  if (!changed) done(['## Novelty gate (advisory)', '', 'Could not diff against ' + opt('--base') + ' — nothing compared.']);
  names = Object.values(toolDirs).filter(t => changed.some(f => f.startsWith(t.dir + '/') && !/\.(md|spec|test\.js)$/.test(f))).map(t => t.folder);
}
if (!audioFile) {
  if (!names.length) done(['## Novelty gate (advisory)', '', 'No tool’s sound changed on this branch — nothing to compare.']);
  audioFile = path.join(ROOT, 'tests', 'out', 'novelty-gate-audio.json'); fs.mkdirSync(path.dirname(audioFile), { recursive: true });
  const all = [];
  for (const n of names) { const f = audioFile + '.' + n + '.json'; try { execSync(`node tests/tool-audio.mjs ${n} --json ${f}`, { cwd: ROOT, stdio: 'ignore', timeout: 600000 }); JSON.parse(fs.readFileSync(f, 'utf8')).filter(t => t.id.replace(/^eravos\./, '') === n).forEach(t => all.push(t)); } catch (e) { say('could not render ' + n + ': ' + e.message); } }
  fs.writeFileSync(audioFile, JSON.stringify(all));
}
const fresh = JSON.parse(fs.readFileSync(audioFile, 'utf8'));
const base = B.items.map(x => Object.assign({}, x, { n: norm(x.v, B.lo, B.hi) }));
const rows = [], failed = [];
for (const t of fresh) for (const p of (t.presets || [])) {
  if (/beat/.test(t.kind || '')) continue;
  const name = p.preset || '(default)';
  if (!p.fp || !p.fp.every(Number.isFinite) || p.level === 'FAIL') { failed.push(`${t.label || t.id} · ${name}`); continue; }
  const kind = t.kind === 'effect' ? 'effect' : 'sound', me = { v: p.fp, n: norm(p.fp, B.lo, B.hi) };
  const old = base.find(x => x.tool === t.id && x.preset === name);
  const status = !old ? 'new' : dist(me, old) > B.twin / 4 ? 'changed' : null; if (!status) continue;   // unchanged: nothing to say
  let nn = null, d = 9; for (const x of base) { if (x.kind !== kind || x === old) continue; const e = dist(me, x); if (e < d) { d = e; nn = x; } }
  const verdict = d < B.twin ? 'TWIN' : d < B.close ? 'CLOSE' : 'novel', other = nn && nn.tool !== t.id;
  let roleNote = '';
  if (verdict !== 'novel' && other) { const a = roleOf(t.id), b = roleOf(nn.tool), shared = a.set.filter(r => b.set.includes(r));
    roleNote = shared.length ? `same role (${shared.join(', ')}; from ${a.from}/${b.from}) — possible duplicate: listen` : `different role (${a.set.join('/')} vs ${b.set.join('/')}) — overlap, usually fine`; }
  else if (verdict !== 'novel') roleNote = 'inside its own tool — a variation, or a twin to change';
  rows.push({ tool: t.label || t.id, preset: name, status, verdict, d, z: (d - B.mu) / B.sd, near: nn ? `${nn.label} · ${nn.preset}` : '—', roleNote });
}
rows.sort((a, b) => a.d - b.d);
const n = (v) => rows.filter(r => r.verdict === v).length;
const L = ['## Novelty gate — advisory (it names, it never blocks)', '',
  `Baseline: docs/novelty-baseline.json (${B.items.length} sounds, ${B.made.slice(0, 10)}) · CLOSE < ${B.close.toFixed(3)} · TWIN < ${B.twin.toFixed(3)} · compared: ${rows.length} new or changed presets in ${fresh.length} tool(s)`, '',
  `**${n('novel')} novel · ${n('CLOSE')} close · ${n('TWIN')} twin**${failed.length ? ` · ${failed.length} render(s) failed (not compared)` : ''}`, '',
  '> Novelty is not quality. This measures one thing (how far a sound is from everything ERAVOS already has, over one 2.6 s note); usefulness, expressiveness, controllability and what it is for are heard, not measured — docs/listening-log.md. A close match is a lead to listen to, never a verdict.', ''];
if (rows.length) { L.push('| Preset | New / changed | Verdict | d (σ) | Nearest already in ERAVOS | Role |', '|---|---|---|---|---|---|');
  rows.forEach(r => L.push(`| ${r.tool} · ${r.preset} | ${r.status} | ${r.verdict === 'novel' ? 'novel' : '**' + r.verdict + '**'} | ${r.d.toFixed(3)} (${r.z >= 0 ? '+' : ''}${r.z.toFixed(1)}σ) | ${r.near} | ${r.roleNote || '—'} |`)); }
if (failed.length) L.push('', 'Renders that failed (fix first): ' + failed.join(' · '));
done(L);

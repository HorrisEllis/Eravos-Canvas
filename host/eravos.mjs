#!/usr/bin/env node
/* ERAVOS host — the command line (spec eravos.host). Node built-ins only.
 *   node host/eravos.mjs glass [--port 4747] [--open]     the canvas under ERAVOS Glass (event stream + command door)
 *   node host/eravos.mjs send <command> ['{json}'] [--port]  run a Glass command on a running Glass (canvas.* or cos.*)
 *   node host/eravos.mjs cos list                          every compartment and its state
 *   node host/eravos.mjs cos gate <id> | --all [--deep]    birth gates (deep: its own tests + the sound survey)
 *   node host/eravos.mjs cos snapshot <id> [--note "…"]    freeze it · snapshots <id> · diff <id> [snap]
 *   node host/eravos.mjs cos restore <id> [snap] [--prune] bring it back (a safety snapshot first)
 *   node host/eravos.mjs cos archetype <out-folder>        the COS `eravos-canvas` archetype, generated from this repo */
import { createRequire } from 'module'; import path from 'path'; import { fileURLToPath } from 'url'; import { exec } from 'child_process';
const require = createRequire(import.meta.url), HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const { Cos } = require('./cos.js'), glass = require('./glass.js');
const argv = process.argv.slice(2), flag = (k) => argv.includes(k), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--port', '--note'].includes(argv[i - 1])));
const port = parseInt(opt('--port', '4747'), 10);
const out = (x) => console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 1));
const STATE_MARK = { integrated: '✓', recycled: '✗', sandbox: '·' };

const [cmd, sub, a1, a2] = pos;
try {
  if (cmd === 'glass') {
    const g = await glass.start({ root: ROOT, port });
    out(`ERAVOS Glass — the canvas at ${g.url}canvas/  ·  events ${g.url}glass/events  ·  commands POST ${g.url}glass/cmd`);
    if (flag('--open')) { const u = g.url + 'canvas/'; exec(process.platform === 'win32' ? `start "" "${u}"` : process.platform === 'darwin' ? `open "${u}"` : `xdg-open "${u}"`, () => {}); }
  } else if (cmd === 'send') {
    if (!sub) throw new Error('send <command> [json]');
    const r = await fetch(`http://127.0.0.1:${port}/glass/cmd`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Eravos-Glass': '1' }, body: JSON.stringify({ type: sub, data: a1 ? JSON.parse(a1) : {} }) }).catch(() => null);
    if (!r) throw new Error(`no ERAVOS Glass on port ${port} — start it: node host/eravos.mjs glass`);
    const j = await r.json(); out(j.ok ? j.result : 'refused: ' + j.error); if (!j.ok) process.exitCode = 1;
  } else if (cmd === 'cos') {
    const cos = new Cos({ root: ROOT });
    if (sub === 'list' || !sub) cos.list().forEach(c => out(`${STATE_MARK[c.state] || '?'} ${c.id.padEnd(34)} ${c.kind.padEnd(6)} ${c.version.padEnd(10)} ${c.dir}`));
    else if (sub === 'gate') {
      const rows = flag('--all') ? cos.gateAll({ deep: flag('--deep') }) : [cos.gate(a1, { deep: flag('--deep') })].map(r => ({ id: r.id, state: r.state, failed: r.results.filter(x => !x.ok).map(x => x.gate), results: r.results }));
      rows.forEach(r => { out(`${STATE_MARK[r.state]} ${r.id} — ${r.state}${r.failed.length ? ' · failed: ' + r.failed.join(', ') : ''}`); (r.results || []).filter(x => !x.ok).forEach(x => x.why.forEach(w => out(`    ${x.gate}: ${w}`))); });
      const bad = rows.filter(r => r.state !== 'integrated').length; out(`${rows.length - bad} integrated · ${bad} recycled`); if (bad) process.exitCode = 1;
    } else if (sub === 'snapshot') out(cos.snapshot(a1, { note: opt('--note', '') }));
    else if (sub === 'snapshots') out(cos.snapshots(a1));
    else if (sub === 'diff') out(cos.diff(a1, a2));
    else if (sub === 'restore') out(cos.restore(a1, a2, { prune: flag('--prune') }));
    else if (sub === 'archetype') { if (!a1) throw new Error('archetype <out-folder>'); out(cos.archetype(a1)); }
    else throw new Error('cos: list | gate | snapshot | snapshots | diff | restore | archetype');
  } else out(`ERAVOS host — glass · send · cos   (see the top of host/eravos.mjs)`);
} catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }

#!/usr/bin/env node
/* ERAVOS host — the command line (spec eravos.host). Node built-ins only.
 *   node host/eravos.mjs glass [--port 4747] [--open]     the canvas under ERAVOS Glass (event stream + command door)
 *   node host/eravos.mjs send <command> ['{json}'] [--port]  run a Glass command on a running Glass (canvas.* or cos.*)
 *   node host/eravos.mjs cos list                          the compartment tree: canvas › domains › tools, with states
 *   node host/eravos.mjs cos gate [id] [--deep]            birth gates for it and everything nested in it (no id = all)
 *   node host/eravos.mjs cos archetype <out-folder>        the COS `eravos-canvas` archetype, generated from this repo */
import { createRequire } from 'module'; import path from 'path'; import { fileURLToPath } from 'url'; import { exec } from 'child_process';
const require = createRequire(import.meta.url), HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const { Cos } = require('./cos.js'), glass = require('./glass.js');
const argv = process.argv.slice(2), flag = (k) => argv.includes(k), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1] === '--port'));
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
    if (sub === 'list' || !sub) {
      const all = cos.list(), show = (c, d) => { out(`${'  '.repeat(d)}${STATE_MARK[c.state] || '?'} ${c.id}  ${c.version}  ${c.dir}`); all.filter(k => k.parent === c.id).forEach(k => show(k, d + 1)); };
      all.filter(c => !c.parent).forEach(c => show(c, 0));
    } else if (sub === 'gate') {
      const r = cos.gate(a1 || 'eravos.canvas', { deep: flag('--deep') }); let n = 0, bad = 0;
      const show = (x, d) => { n++; const g = x.results ? x : cos.state()[x.id] || {}; if (x.state !== 'integrated') bad++;
        const failed = (x.results ? x.results.filter(y => !y.ok).map(y => ({ gate: y.gate, why: y.why })) : (g.failed || []));
        if (x.state !== 'integrated' || d < 2) out(`${'  '.repeat(d)}${STATE_MARK[x.state]} ${x.id}${failed.length ? ' · failed: ' + failed.map(f => f.gate).join(', ') : ''}${(x.holding || []).length ? ' · held back by ' + x.holding.length + ' inside' : ''}`);
        failed.forEach(f => (f.why || []).forEach(w => out(`${'  '.repeat(d + 2)}${f.gate}: ${w}`))); (x.inside || []).forEach(k => show(k, d + 1)); };
      show(r, 0); out(`${n - bad} integrated · ${bad} recycled`); if (bad) process.exitCode = 1;
    }
    else if (sub === 'archetype') { if (!a1) throw new Error('archetype <out-folder>'); out(cos.archetype(a1)); }
    else throw new Error('cos: list | gate | archetype');
  } else out(`ERAVOS host — glass · send · cos   (see the top of host/eravos.mjs)`);
} catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }

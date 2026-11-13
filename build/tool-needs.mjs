#!/usr/bin/env node
/* Every tool announces what it needs, from its DAG (his words, 2026-11-13: "Each tool needs that. Dag. It has to anounce what it needs to
 * the canvas. The canvas needs to import it from the zip." — specs/eravos.store.spec ADDENDUM 2026-11-13). Never hand-written:
 *   needs.components  the components its spec's DAG says are in it now (build/spec-dag.mjs), each id@version (from the component's code)
 *   needs.elements    the UI element of each of those components that carries a contract (build/component-contract.mjs): id.element@version
 *   node build/tool-needs.mjs           write them into each tool.json (only those two keys; everything else in the file kept as it is)
 *   node build/tool-needs.mjs --check   fail when a tool.json says something else than its DAG (CI) */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), CHECK = process.argv.includes('--check');
const tools = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'planned' && f !== 'node_modules') walk(p); } else if (f === 'tool.json') tools.push(p); } })(path.join(ROOT, 'tools'));
let changed = 0, bad = 0, announced = 0, elems = 0; const missing = new Set();
for (const tj of tools.sort()) {
  const dir = path.dirname(tj), m = JSON.parse(fs.readFileSync(tj, 'utf8')), dom = path.relative(path.join(ROOT, 'tools'), tj).split(path.sep)[0];
  const specF = path.join(dir, (m.files && m.files.spec) || ''), spec = m.files && m.files.spec && fs.existsSync(specF) ? fs.readFileSync(specF, 'utf8') : '';
  const line = (spec.match(/^  in it now: (.*)$/m) || [])[1] || '—', ids = line.trim() === '—' ? [] : line.split('·').map(x => x.trim()).filter(x => /^[a-z][a-z0-9-]*$/.test(x));
  const comps = [], els = [];
  ids.forEach(id => { const cd = path.join(ROOT, 'tools', dom, 'components', id), js = path.join(cd, id + '.js'); if (!fs.existsSync(js)) { missing.add(id); return; }
    const v = (fs.readFileSync(js, 'utf8').match(/eravos\.component\.[\w-]+ (\d+\.\d+\.\d+)/) || [])[1] || '0.0.0'; comps.push(`${id}@${v}`);
    const cj = path.join(cd, id + '.contract.json'); if (fs.existsSync(cj)) { const c = JSON.parse(fs.readFileSync(cj, 'utf8')); els.push(`${id}.element@${c.element.version}`); } });
  const n = Object.assign({}, m.needs || {}); delete n.components; delete n.elements;
  if (comps.length) { n.components = comps; announced++; } if (els.length) { n.elements = els; elems++; }
  const before = JSON.stringify(m.needs || {}), after = JSON.stringify(n);
  if (before === after) continue;
  if (CHECK) { bad++; console.error(`✗ ${m.id}: tool.json needs ≠ its DAG — run node build/tool-needs.mjs`); continue; }
  const raw = fs.readFileSync(tj, 'utf8'), ind = (raw.match(/\n( +)"/) || [, ' '])[1];
  m.needs = n; fs.writeFileSync(tj, JSON.stringify(m, null, ind.length) + '\n'); changed++;
}
if (missing.size) console.log(`  named in a DAG but with no code yet: ${[...missing].join(', ')}`);
console.log(`${bad ? '✗' : '✓'} tool needs: ${announced} tools announce their components, ${elems} their components' UI elements${CHECK ? '' : ` · ${changed} tool.json written`}`);
process.exit(bad ? 1 : 0);

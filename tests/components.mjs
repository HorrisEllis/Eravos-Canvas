#!/usr/bin/env node
/* Runs every component's own node test: tools/<domain>/components/<id>/<id>.test.mjs (eravos.components: each component proves its
 * numbers on its own, no browser). node tests/components.mjs [filter] — exit 1 if any fails. Also runs tests/null-render-core.test.mjs. */
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), F = process.argv[2] || '';
const found = [path.join('tests', 'null-render-core.test.mjs')];
for (const d of fs.readdirSync(path.join(ROOT, 'tools'))) { const cd = path.join(ROOT, 'tools', d, 'components'); if (!fs.existsSync(cd)) continue;
  for (const c of fs.readdirSync(cd).sort()) for (const f of fs.readdirSync(path.join(cd, c))) if (/\.test\.mjs$/.test(f)) found.push(path.join('tools', d, 'components', c, f)); }
let bad = 0;
for (const f of found.filter(f => f.includes(F))) { try { process.stdout.write(execFileSync(process.execPath, [path.join(ROOT, f)], { encoding: 'utf8' })); } catch (e) { bad++; console.error('✗ ' + f + '\n' + (e.stdout || '') + (e.stderr || '')); } }
console.log(bad ? `${bad} component test file(s) FAILED` : 'every component test passed'); process.exit(bad ? 1 : 0);

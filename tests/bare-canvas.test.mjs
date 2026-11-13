#!/usr/bin/env node
/* The canvas stays bare (specs/eravos.bare-canvas.spec, his words 2026-11-13: "i feel the workshop should be a tool on its own. like can we
 * make the canvas more bare?"). Every file in canvas/runtime/*.js must be on the spec's host_files line — the canvas grows only by a
 * listed decision. The Field lives in tools/core/field/ (BC1); a file that comes back into the canvas fails here. Plain node. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = fs.readFileSync(path.join(ROOT, 'specs/eravos.bare-canvas.spec'), 'utf8'), m = /^host_files:(.*)$/m.exec(spec);
let bad = 0; const fail = (s) => { bad++; console.error('✗ ' + s); };
if (!m) fail('specs/eravos.bare-canvas.spec has no host_files: line');
const host = new Set(m ? m[1].trim().split(/\s+/) : []), files = fs.readdirSync(path.join(ROOT, 'canvas/runtime')).filter(f => /\.js$/.test(f));
files.filter(f => !host.has(f)).forEach(f => fail(`canvas/runtime/${f} is not on the host list — the canvas is the host only: move it to tools/, or list it in the spec with why`));
[...host].filter(f => !files.includes(f)).forEach(f => fail(`the host list names ${f}, which is not in canvas/runtime — take it off the list`));
['tools/core/field/field.js', 'tools/core/field/field.css', 'tools/core/domain.json', 'tools/core/index.js'].forEach(f => { if (!fs.existsSync(path.join(ROOT, f))) fail(`${f} is missing (the Field lives in tools/core)`); });
const dom = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/core/domain.json'), 'utf8'));
if (dom.always !== true) fail('tools/core/domain.json must be "always": true (the Field loads before any domain that uses it)');
if (!/ERAVOS_DOMAINS = \['core'/.test(fs.readFileSync(path.join(ROOT, 'tools/index.js'), 'utf8'))) fail('tools/index.js must list core first');
if (bad) process.exit(1);
console.log(`✓ the canvas is the host: ${files.length} files, every one listed; the Field in tools/core`);

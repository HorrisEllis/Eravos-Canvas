#!/usr/bin/env node
// node docs/previews/mutate/build.mjs → docs/previews/mutate/mutate.html — the CG4 preview (⚄ MUTATE in the Field) as ONE file that opens
// anywhere. It inlines the REAL code and data, nothing copied by hand: tools/core/compat/{compat,assemble}.js, tools/music/compat/adapters.js,
// every music component's kernel, the contracts, tools/music/types.json, tests/audio-measure.js, build/novelty-core.mjs (as NoveltyCore),
// docs/novelty-baseline.json, and the parent voice from build/mutants.mjs — so the preview mutates, checks, builds and plays exactly as CG3 does.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { load } from '../../../build/compat-graph.mjs';
import { PARENT } from '../../../build/mutants.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
const tag = (name, js) => `<script data-from="${name}">\n${safe(js)}\n</script>`;

const { types, contracts } = load();
const B = JSON.parse(rd('docs/novelty-baseline.json'));
const r4 = (x) => +x.toPrecision(5);
const baseline = { D: B.D, lo: B.lo, hi: B.hi, twin: B.twin, close: B.close,
  items: B.items.filter(x => x.kind !== 'effect').map(x => ({ label: x.label, preset: x.preset, kind: x.kind, v: x.v.map(r4) })) };
const nc = rd('build/novelty-core.mjs').replace(/^export (const|function) (\w+)/gm, '$1 $2');
const ncNames = [...rd('build/novelty-core.mjs').matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1]);

// the real tools and the components each announces (tool.json needs.components, build/tool-needs.mjs) — the sound tools only
// (at least two parts, one of them audio); voice-allocator is note logic, not a sound part
const audio = new Set(contracts.filter(c => c.kind === 'audio').map(c => c.id)), tools = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f === 'tool.json') {
  const j = JSON.parse(fs.readFileSync(p, 'utf8')), comps = ((j.needs || {}).components || []).map(x => x.split('@')[0]).filter(c => c !== 'voice-allocator');
  if (comps.length >= 2 && comps.some(c => audio.has(c))) tools.push({ id: j.id, label: j.label || j.id, components: comps }); } } })(path.join(ROOT, 'tools/music/tools'));

// Wobble Bass, exploded: the board of 2026-11-15 (docs/previews/workbench/Wobble-Exploded.dc.html) — its pieces, positions, wires and
// timing exactly as they were, the pieces cut from Wobble Bass's own face (the PNGs beside it), inlined
const WB = path.join(ROOT, 'docs/previews/workbench'), png = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(WB, f)).toString('base64');
const wobble = { pieces: JSON.parse(fs.readFileSync(path.join(WB, 'Wobble-Exploded.dc.html'), 'utf8').match(/const PIECES = (\[.*?\]);\n/s)[1])
  .map(x => Object.assign(x, { url: png((x.id === 'filter-formant' ? 'filter-vowels' : x.id) + '.png') })), surface: png('blank-surface2.png') };

const parts = [];
const cdir = path.join(ROOT, 'tools/music/components');
for (const id of fs.readdirSync(cdir).sort()) {
  const f = path.join('tools/music/components', id, id + '.js');
  if (fs.existsSync(path.join(ROOT, f))) parts.push(tag(f, 'try {\n' + rd(f) + '\n} catch (e) { /* a logic component that needs a page */ }'));
}
const inline = [
  tag('data', 'window.__MUTATE_DATA = ' + JSON.stringify({ types, contracts, baseline, parent: PARENT, tools, wobble }) + ';'),
  ...parts,
  tag('tools/core/compat/compat.js', rd('tools/core/compat/compat.js')),
  tag('tools/core/compat/assemble.js', rd('tools/core/compat/assemble.js')),
  tag('tools/music/compat/adapters.js', rd('tools/music/compat/adapters.js')),
  tag('tests/audio-measure.js', rd('tests/audio-measure.js')),
  tag('build/novelty-core.mjs', '(function(){\n' + nc + '\nwindow.NoveltyCore = { ' + ncNames.join(', ') + ' };\n})();'),
].join('\n');
const page = fs.readFileSync(path.join(HERE, 'mutate.page.html'), 'utf8').replace('<!--INLINE-->', () => inline);
const out = path.join(HERE, 'mutate.html'); fs.writeFileSync(out, page);
console.log('wrote', path.relative(ROOT, out), (page.length / 1024).toFixed(0) + ' KB,', parts.length, 'component kernels');

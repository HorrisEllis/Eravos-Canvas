#!/usr/bin/env node
// node docs/previews/wobble-builder/build.mjs → docs/previews/wobble-builder/wobble-builder.html — the Wobble Builder's UI preview (2026-11-20;
// tools/music/planned/wobble-builder.spec), shown to him before it is built. ONE file that opens anywhere. It inlines the REAL code, nothing copied
// by hand: every music component's kernel, tools/core/compat/assemble.js, tools/music/compat/adapters.js, tools/core/field/mutate.js (the one
// mutation every tool uses), the contracts, tests/audio-measure.js and build/novelty-core.mjs with docs/novelty-baseline.json (SYNTHESIZE's gate)
// — so the preview assembles, plays, mutates, learns and refuses a twin exactly as the built tool will.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { load } from '../../../build/compat-graph.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
const tag = (name, js) => `<script data-from="${name}">\n${safe(js)}\n</script>`;
const { contracts } = load();
const B = JSON.parse(rd('docs/novelty-baseline.json')), r4 = (x) => +x.toPrecision(5);
const baseline = { D: B.D, lo: B.lo, hi: B.hi, twin: B.twin, close: B.close, items: B.items.filter(x => x.kind !== 'effect').map(x => ({ label: x.label, preset: x.preset, kind: x.kind, v: x.v.map(r4) })) };
const nc = rd('build/novelty-core.mjs').replace(/^export (const|function) (\w+)/gm, '$1 $2');
const ncNames = [...rd('build/novelty-core.mjs').matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1]);
const parts = ['osc-va', 'osc-sub', 'lfo', 'filter-svf', 'filter-ladder', 'saturator-tube', 'saturator-tape', 'bitcrusher', 'delay-line', 'stereo-tools', 'env-adsr']
  .map(id => tag(`tools/music/components/${id}/${id}.js`, rd(`tools/music/components/${id}/${id}.js`)));
const inline = [
  tag('data', 'window.__WB = ' + JSON.stringify({ contracts, baseline }) + ';'),
  ...parts,
  tag('tools/core/compat/assemble.js', rd('tools/core/compat/assemble.js')),
  tag('tools/music/compat/adapters.js', rd('tools/music/compat/adapters.js')),
  tag('tools/core/field/mutate.js', rd('tools/core/field/mutate.js')),
  tag('tests/audio-measure.js', rd('tests/audio-measure.js')),
  tag('build/novelty-core.mjs', '(function(){\n' + nc + '\nwindow.NoveltyCore = { ' + ncNames.join(', ') + ' };\n})();'),
].join('\n');
const fieldCss = rd('tools/core/field/field.css').split('/* the mutation dock')[1];   // the dock's look, as the Field and the Workshop have it
const page = fs.readFileSync(path.join(HERE, 'wobble-builder.page.html'), 'utf8').replace('<!--INLINE-->', () => inline).replace('/*DOCKCSS*/', () => '/* the mutation dock' + fieldCss);
const out = path.join(HERE, 'wobble-builder.html'); fs.writeFileSync(out, page);
console.log('wrote', path.relative(ROOT, out), (page.length / 1024).toFixed(0) + ' KB,', parts.length, 'component kernels');

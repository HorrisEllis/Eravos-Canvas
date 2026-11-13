#!/usr/bin/env node
/* A component's contract — its ports, its variables and its UI element, as data (CG1: specs/eravos.compat-graph.spec, specs/eravos.components.spec
 * ADDENDA 2026-11-13). His words (2026-11-13): "Each component of each tool has a element for the ui to synthesis." · "Each tool needs that.
 * Dag. It has to anounce what it needs to the canvas." Each tools/<d>/components/<id>/<id>.contract.json is checked against the component's
 * own code, so the data can never drift from what plays:
 *   - variables_from (an exported *_PARAMS — the AudioParams): the variables carrying audio_param are exactly that list, in order, with the
 *     same min / max / default / rate (an enum's default is its option name, a boolean's true/false)
 *   - an enum with `from`: its options equal that export · any other variable: its key (or `code`) is a name in the component's code
 *   - the kernel and the worklet it names exist · every port's type is in the domain's types.json · the element's controls are its
 *     variables, each with a role from types.json, and needs_ui is what those controls need from the canvas kit
 *   node build/component-contract.mjs            check every contract, report coverage (exit 1 on any wrong contract)
 *   node build/component-contract.mjs --report   also write docs/component-contracts.md */
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = { number: 'kit.knob', enum: 'kit.segmented', boolean: 'kit.toggle' };
let bad = 0; const errs = []; const fail = (id, m) => { bad++; errs.push(`✗ ${id}: ${m}`); };
const rows = []; let exact = 0, byName = 0;
for (const d of fs.readdirSync(path.join(ROOT, 'tools')).filter(d => fs.existsSync(path.join(ROOT, 'tools', d, 'components')))) {
  const TJ = path.join(ROOT, 'tools', d, 'types.json'), T = fs.existsSync(TJ) ? JSON.parse(fs.readFileSync(TJ, 'utf8')) : null;
  for (const id of fs.readdirSync(path.join(ROOT, 'tools', d, 'components')).sort()) {
    const dir = path.join(ROOT, 'tools', d, 'components', id), js = path.join(dir, id + '.js'), cj = path.join(dir, id + '.contract.json');
    const hasCode = fs.existsSync(js), has = fs.existsSync(cj); rows.push({ d, id, hasCode, has });
    if (!has) continue;
    let c; try { c = JSON.parse(fs.readFileSync(cj, 'utf8')); } catch (e) { fail(id, 'contract is not JSON'); continue; }
    if (c.schema !== 'eravos.component-contract/1') fail(id, 'schema must be eravos.component-contract/1');
    if (c.id !== id) fail(id, `id says ${c.id}`);
    if (!hasCode) { fail(id, 'a contract with no code'); continue; }
    if (!T) { fail(id, `tools/${d}/types.json is missing`); continue; }
    const src = fs.readFileSync(js, 'utf8'), mod = require(js), ver = (src.match(/eravos\.component\.[\w-]+ (\d+\.\d+\.\d+)/) || [])[1];
    if (c.version !== ver) fail(id, `version ${c.version}, the code says ${ver}`);
    const kname = String(c.kernel || '').replace(/^MusicParts\./, ''); if (!mod[kname]) fail(id, `kernel ${c.kernel} is not exported`);
    if (c.worklet && !src.includes(`'${c.worklet}'`)) fail(id, `worklet ${c.worklet} not registered in the code`);
    if (!Array.isArray(c.ports) || !c.ports.length) fail(id, 'no ports');
    (c.ports || []).forEach(p => { if (!T.types[p.type]) fail(id, `port ${p.id}: type ${p.type} is not in tools/${d}/types.json`); if (!['in', 'out'].includes(p.dir)) fail(id, `port ${p.id}: dir ${p.dir}`); });
    const V = c.variables || [], keys = V.map(v => v.key);
    if (new Set(keys).size !== keys.length) fail(id, 'a variable key twice');
    if (c.variables_from) {
      const PA = mod[c.variables_from]; if (!Array.isArray(PA)) fail(id, `${c.variables_from} is not exported`);
      else { const AP = V.filter(v => v.audio_param);
        if (AP.map(v => v.key).join() !== PA.map(p => p.name).join()) fail(id, `audio params ${AP.map(v => v.key).join(', ')} ≠ the code's ${PA.map(p => p.name).join(', ')}`);
        PA.forEach(p => { const v = V.find(x => x.key === p.name); if (!v) return;
          const def = v.type === 'enum' ? v.options.indexOf(v.default) : v.type === 'boolean' ? (v.default ? 1 : 0) : v.default;
          if (v.min !== undefined && v.min !== p.minValue) fail(id, `${p.name}: min ${v.min}, the code ${p.minValue}`);
          if (v.max !== undefined && v.max !== p.maxValue) fail(id, `${p.name}: max ${v.max}, the code ${p.maxValue}`);
          if (def !== p.defaultValue) fail(id, `${p.name}: default ${v.default}, the code ${p.defaultValue}`);
          if (v.type === 'enum' && v.options.length - 1 !== p.maxValue - p.minValue) fail(id, `${p.name}: ${v.options.length} options for ${p.minValue}…${p.maxValue}`);
          if ((v.rate === 'audio') !== (p.automationRate === 'a-rate')) fail(id, `${p.name}: rate ${v.rate}, the code ${p.automationRate}`); }); }
    }
    exact += V.filter(v => v.audio_param).length; byName += V.filter(v => !v.audio_param).length;
    V.filter(v => !v.audio_param).forEach(v => {
      if (v.from) { const L = mod[v.from]; if (!Array.isArray(L) || L.join('|') !== v.options.join('|')) fail(id, `${v.key}: options ≠ ${v.from}`); }
      const name = v.code || v.key; if (!new RegExp(`\\b${name.replace(/[^\w]/g, '')}\\b`).test(src)) fail(id, `${v.key}: no "${name}" in the code`);
      if (v.type === 'number' && !(v.min <= v.default && v.default <= v.max)) fail(id, `${v.key}: default outside ${v.min}…${v.max}`);
      if (v.type === 'enum' && !v.options.includes(v.default)) fail(id, `${v.key}: default not an option`);
    });
    const E = c.element || {}, CK = (E.controls || []).map(x => x.key);
    if (CK.join() !== keys.join()) fail(id, 'element controls are not its variables, in order');
    (E.controls || []).forEach(x => { if (!T.roles.includes(x.role)) fail(id, `control ${x.key}: role ${x.role} not in types.json`); });
    if (!(E.controls || []).some(x => x.face)) fail(id, 'element: nothing on the face');
    const need = [...new Set(V.map(v => KIT[v.type]))].sort().join(); if ((E.needs_ui || []).slice().sort().join() !== need) fail(id, `element needs_ui ${E.needs_ui} ≠ ${need}`);
  }
}
errs.forEach(e => console.error(e));
const coded = rows.filter(r => r.hasCode), done = coded.filter(r => r.has);
console.log(`${bad ? '✗' : '✓'} component contracts: ${done.length} of ${coded.length} components with code have one · ${rows.length} components in all${bad ? ` · ${bad} problem(s)` : ', every one true to its code'}`);
console.log(`  variables: ${exact} checked exactly against the code's AudioParams (range, default, rate) · ${byName} checked by name (their ranges are from the code's own header — a range check needs the kernel to export them)`);
if (process.argv.includes('--report')) {
  const L = ['# Component contracts (generated by build/component-contract.mjs — do not edit)', '', `CG1 (specs/eravos.compat-graph.spec). ${done.length} of ${coded.length} components with code carry a contract: ports, variables, UI element — each checked against the code. Variables: ${exact} checked exactly (AudioParams: range, default, rate), ${byName} by name only (ranges from the code's header).`, '', '| component | code | contract |', '|---|---|---|'];
  rows.forEach(r => L.push(`| ${r.d}/${r.id} | ${r.hasCode ? '✓' : '—'} | ${r.has ? '✓' : r.hasCode ? 'to write' : '—'} |`));
  fs.writeFileSync(path.join(ROOT, 'docs', 'component-contracts.md'), L.join('\n') + '\n');
}
process.exit(bad ? 1 : 0);

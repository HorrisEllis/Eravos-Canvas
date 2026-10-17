#!/usr/bin/env node
/* ONE-TIME P37.0 consolidation (eravos.structure R1–R6, eravos.phase37-map P37.0). Moves every tool still in
 * tools/<d>/organisms/<id>/ into tools/<d>/tools/<category>/<id>/ and makes each folder whole:
 *   tool.json (from the running define()) · engine · ui · css · extra · <id>.spec (moved from specs/) · preview.png ·
 *   packs/factory/pack.json (the presets that lived INSIDE the engine code — removed from the code with acorn)
 * Bundles that span tools (PresetPacks data files) → tools/<d>/content/bundles/<id>/pack.json.
 * Specs of tools never built → tools/<d>/planned/<id>.spec. Runs the page once to read what the code defines.
 *   node build/migrate-tools.mjs            (then: node build/index-tools.mjs && node build/validate.mjs) */
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import * as acorn from 'acorn';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), MUSIC = path.join(ROOT, 'tools', 'music');
const ORG = path.join(MUSIC, 'organisms'); if (!fs.existsSync(ORG)) { console.log('nothing to migrate'); process.exit(0); }
const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------- 1. read what the code defines (engine presets vs pack presets)
const b = await chromium.launch(); const p = await b.newPage();
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.ContentPacks);
const R = await p.evaluate(() => {
  const fromPacks = new Map(); // tool id → Set(names that came from a pack)
  ContentPacks.list().forEach(pk => pk.for.forEach(t => ContentPacks.items(t, 'presets').filter(x => x.pack === pk.id).forEach(x => { if (!fromPacks.has(t)) fromPacks.set(t, new Set()); fromPacks.get(t).add(x.name); })));
  const clean = (x) => JSON.parse(JSON.stringify(x));
  const tools = (window.ERAVOS_ORGANISM_IDS || []).map(short => {
    const d = OrganismFactory.defined().find(x => x.id === 'eravos.' + short) || OrganismFactory.defined().find(x => x.id.endsWith('.' + short)); if (!d) return { short, missing: true };
    const packNames = fromPacks.get(d.id) || new Set(), presets = {};
    Object.keys(d.presets || {}).forEach(n => { if (!packNames.has(n)) { const v = clean(d.presets[n]); delete v.__item; presets[n] = v; } });
    let units = []; try { units = (Shell.X.deps(d.id).units || []).map(u => u.id || u); } catch (e) {}
    return { short, id: d.id, version: d.version || '1.0.0', label: d.label, icon: d.icon || '◆', accent: d.accent || '#7cc4ff', category: d.category || 'Tools', blurb: d.blurb || '', permissions: d.permissions || [], works_with: (d.needs && d.needs.works_with) || [], presets, defaultPreset: d.defaultPreset || null };
  });
  const bundles = (window.PresetPacks ? PresetPacks.list() : []).map(pk => ({ id: pk.id, label: pk.label, tag: pk.tag, presets: clean(pk.presets) }));
  return { tools, bundles };
});
await b.close();

// ---------------------------------------------------------------- 2. move each tool
function stripPresets(file) { // remove the presets: {…} property from OrganismFactory.define({…}) — nothing else
  let src = fs.readFileSync(file, 'utf8'); const ast = acorn.parse(src, { ecmaVersion: 2022 }); const cuts = [];
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.object.name === 'OrganismFactory' && n.callee.property.name === 'define' && n.arguments[0] && n.arguments[0].type === 'ObjectExpression')
      n.arguments[0].properties.forEach(pr => { if (pr.key && (pr.key.name === 'presets' || pr.key.value === 'presets')) { let a = pr.start, z = pr.end; const after = src.slice(z).match(/^\s*,/); if (after) z += after[0].length; const ls = src.lastIndexOf('\n', a) + 1; if (/^\s*$/.test(src.slice(ls, a))) a = ls; const le = src.indexOf('\n', z); if (le > -1 && /^\s*$/.test(src.slice(z, le))) z = le + 1; cuts.push([a, z]); } });
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(ast);
  cuts.sort((x, y) => y[0] - x[0]).forEach(([a, z]) => { src = src.slice(0, a) + src.slice(z); });
  acorn.parse(src, { ecmaVersion: 2022 }); fs.writeFileSync(file, src); return cuts.length;
}
const extra = { timeline: { js: ['pianoroll'], css: ['pianoroll'] }, 'fx-eq': { css: ['ui'] }, 'fx-glitch': { css: ['ui'] }, 'fx-box': { css: ['ui'] } };
const cats = new Map(); let moved = 0, presetCount = 0;
for (const t of R.tools) {
  if (t.missing) { console.warn('not defined: ' + t.short); continue; }
  const cat = slug(t.category), dst = path.join(MUSIC, 'tools', cat, t.short), src = path.join(ORG, t.short);
  if (!cats.has(cat)) cats.set(cat, t.category);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) fs.renameSync(path.join(src, f), path.join(dst, f));
  fs.rmdirSync(src);
  const x = extra[t.short] || {}, css = (x.css || []).map(c => `${t.short}.${c}.css`);
  if (fs.existsSync(path.join(dst, t.short + '.css'))) css.unshift(t.short + '.css');
  const files = { engine: `${t.short}.engine.js` };
  if (fs.existsSync(path.join(dst, t.short + '.ui.js'))) files.ui = `${t.short}.ui.js`;
  if (css.length === 1) files.css = css[0]; else if (css.length > 1) files.css = css;
  if (x.js && x.js.length) files.extra = x.js.map(j => `${t.short}.${j}.js`);
  const specSrc = path.join(ROOT, 'specs', `eravos.organism.${t.short}.spec`);
  if (fs.existsSync(specSrc)) { fs.renameSync(specSrc, path.join(dst, t.short + '.spec')); files.spec = t.short + '.spec'; }
  const shot = path.join(ROOT, 'docs', 'tools', t.short + '.png');
  if (fs.existsSync(shot)) { fs.copyFileSync(shot, path.join(dst, 'preview.png')); files.preview = 'preview.png'; }
  const n = Object.keys(t.presets).length; let shipped = [];
  if (n) {
    const cut = stripPresets(path.join(dst, files.engine)); if (!cut) console.warn(`${t.short}: ${n} presets but none in the code (computed?) — kept in the pack only`);
    fs.mkdirSync(path.join(dst, 'packs', 'factory'), { recursive: true });
    fs.writeFileSync(path.join(dst, 'packs', 'factory', 'pack.json'), JSON.stringify({ schema: 'eravos.pack/1', id: `${t.short}.factory`, version: '1.0.0', label: 'Factory', prefix: '', author: 'James Brooks', tags: ['factory', cat], for: t.id, items: { [t.id]: { presets: t.presets } } }, null, 1) + '\n');
    shipped = ['factory']; presetCount += n;
  }
  const tags = Array.from(new Set([cat].concat(t.short.split('-').filter(w => w.length > 2 && !/^fx$/.test(w)))));
  const tool = { schema: 'eravos.tool/1', id: t.id, version: t.version, label: t.label, icon: t.icon, accent: t.accent, domain: 'music', category: cat, summary: t.blurb || t.label, tags, files,
    needs: { units: ['music.engine'], tools: [], permissions: t.permissions }, packs: { accepts: ['presets'], shipped }, works_with: t.works_with, status: 'built' };
  if (t.defaultPreset) tool.default_preset = t.defaultPreset;
  fs.writeFileSync(path.join(dst, 'tool.json'), JSON.stringify(tool, null, 2) + '\n');
  moved++;
}
for (const [cat, label] of cats) { const f = path.join(MUSIC, 'tools', cat, 'category.json'); if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({ schema: 'eravos.category/1', id: cat, label, icon: '◆', order: 50, blurb: label }) + '\n'); }

// ---------------------------------------------------------------- 3. bundles (packs across tools) → content/bundles/<id>/pack.json
for (const bd of R.bundles) {
  const id = bd.id.replace(/^eravos\.presets\./, ''), dir = path.join(MUSIC, 'content', 'bundles', id); fs.mkdirSync(dir, { recursive: true });
  const items = {}; Object.keys(bd.presets).forEach(tool => { items[tool] = { presets: bd.presets[tool] }; });
  fs.writeFileSync(path.join(dir, 'pack.json'), JSON.stringify({ schema: 'eravos.pack/1', id: bd.id, version: '1.0.0', label: bd.label, prefix: bd.tag || bd.label, author: 'James Brooks', tags: [slug(bd.tag || bd.label)], for: Object.keys(items), items }, null, 1) + '\n');
}

// ---------------------------------------------------------------- 4. specs of tools never built → planned/
const built = new Set(R.tools.map(t => t.short));
for (const f of fs.readdirSync(path.join(ROOT, 'specs')).filter(f => /^eravos\.organism\..+\.spec$/.test(f))) {
  const name = f.replace(/^eravos\.organism\./, '').replace(/\.spec$/, ''), m = /^(image|video|ui|agents)\.(.+)$/.exec(name);
  const dom = m ? m[1] : 'music', short = m ? m[2] : name; if (!m && built.has(short)) continue;
  const dir = path.join(ROOT, 'tools', dom, 'planned'); fs.mkdirSync(dir, { recursive: true }); fs.renameSync(path.join(ROOT, 'specs', f), path.join(dir, short + '.spec'));
}
for (const dom of ['image', 'video', 'ui', 'agents']) { const f = path.join(ROOT, 'specs', `eravos.domain.${dom}.spec`); if (fs.existsSync(f)) { fs.mkdirSync(path.join(ROOT, 'tools', dom), { recursive: true }); fs.renameSync(f, path.join(ROOT, 'tools', dom, 'domain.spec')); } }
fs.rmSync(path.join(ORG, 'index.js'), { force: true }); try { fs.rmdirSync(ORG); } catch (e) { console.warn('organisms/ not empty: ' + fs.readdirSync(ORG).join(', ')); }
console.log(`moved ${moved} tools · ${presetCount} engine presets → packs/factory · ${R.bundles.length} bundles → content/bundles · categories: ${Array.from(cats.keys()).join(', ')}`);

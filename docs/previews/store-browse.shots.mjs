// node docs/previews/store-browse.shots.mjs — Browse (specs/eravos.store-browse.spec SB1), a PREVIEW in the real canvas, real data → docs/previews/browse-*.png
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), TOOL = 'eravos.retro-dco';
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
// the data the real thing will read: each tool's announcement (tool.json needs), component contracts, the decomposed songs
const announce = {}; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'planned') walk(p); } else if (f === 'tool.json') { const m = JSON.parse(fs.readFileSync(p, 'utf8')); if (m.needs && m.needs.components) announce[m.id] = { components: m.needs.components, elements: m.needs.elements || [] }; } } })(path.join(ROOT, 'tools'));
const contracts = {}; announce[TOOL].components.forEach(c => { const id = c.split('@')[0]; contracts[id] = J(`tools/music/components/${id}/${id}.contract.json`); });
const idx = J('tools/music/data/song-parts/index.json'), sp = J('tools/music/data/song-parts/' + idx.tools[TOOL].file), songs = J('tools/music/data/song-parts/songs.json').songs;
const parts = Object.fromEntries(Object.entries(idx.tools).map(([k, v]) => [k, { rhythms: v.rhythms, lines: v.lines }]));
const DATA = { announce, contracts, parts, songParts: { rhythms: sp.rhythms, lines: sp.lines, songCount: new Set(sp.rhythms.flatMap(r => r.songs)).size }, titles: Object.fromEntries(songs.map(s => [s.id, s.title])) };
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForFunction(() => window.Catalog && window.ContentPacks && window.OrganismFactory && OrganismFactory.def('eravos.retro-dco'), null, { timeout: 90000 });
await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
await p.evaluate(fs.readFileSync(path.join(ROOT, 'docs/previews/store-browse.preview.js'), 'utf8'));
const shots = [['browse-1-domains', { level: 'domains' }], ['browse-2-tools', { level: 'tools', domain: 'music', category: 'Genre instruments', tool: TOOL }],
  ['browse-3-needs', { level: 'tool', tool: TOOL, tab: 'Needs' }], ['browse-4-packs', { level: 'tool', tool: TOOL, tab: 'Packs' }], ['browse-5-sounds', { level: 'tool', tool: TOOL, tab: 'Sounds' }],
  ['browse-6-rhythms', { level: 'tool', tool: TOOL, tab: 'Rhythms' }], ['browse-7-notes', { level: 'tool', tool: TOOL, tab: 'Notes' }]];
const cat = await p.evaluate((t) => Catalog.meta(t).category, TOOL); shots[1][1].category = cat;
for (const [name, o] of shots) { await p.evaluate(([o, D]) => BrowsePreview.show(o, D), [o, DATA]); await p.waitForTimeout(500); await (await p.$('.browse-pv .ap-box')).screenshot({ path: path.join(ROOT, 'docs/previews', name + '.png') }); console.log('shot', name); }
await b.close();

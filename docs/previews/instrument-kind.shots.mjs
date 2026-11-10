// node docs/previews/instrument-kind.shots.mjs — PREVIEW: the instrument kind generated from Retro DCO's own settings, on the Workshop
// → docs/previews/instrument-kind-flow.png (2D: the signal flow as a field of nodes), instrument-kind-3d.png (each stage a plane)
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForFunction(() => window.Shell && window.Workshop && window.OrganismFactory && OrganismFactory.def('eravos.retro-dco'), null, { timeout: 30000 });
await p.waitForTimeout(800); await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/instrument-kind.preview.js', 'utf8'));
await p.evaluate(async () => { const id = OrganismFactory.spawn('eravos.retro-dco', { x: 40, y: 40 }); await new Promise(r => setTimeout(r, 400)); const ws = window.__instrumentPreview(id); ws.select('VCF'); });
await p.waitForTimeout(500); await p.screenshot({ path: ROOT + '/docs/previews/instrument-kind-flow.png' });
await p.evaluate(() => { Workshop.current.view({ mode: '3d' }); }); await p.waitForTimeout(400); await p.screenshot({ path: ROOT + '/docs/previews/instrument-kind-3d.png' });
await b.close(); console.log('ok');

// node docs/previews/compartment-workshop.shots.mjs — PREVIEW: a compartment (a pipeline) on the Workshop, its steps inside → compartment-workshop.png
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 840 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Workshop);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('orchestration'); document.querySelectorAll('.overlay').forEach(o => o.remove()); });
await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/compartment-workshop.preview.js', 'utf8'));
await p.evaluate(() => { const ws = Workshop.open('orchestration.compartment', window.__COMPARTMENT_DOC); ws.select('step:pricing'); });
await p.waitForTimeout(600);
await p.screenshot({ path: ROOT + '/docs/previews/compartment-workshop.png' }); await b.close(); console.log('ok');

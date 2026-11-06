// node docs/previews/workshop.shots.mjs — the Workshop preview (note, photo) → docs/previews/workshop-note.png, workshop-photo.png
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 920 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.UIKit && window.UIKit.Segmented);
await p.evaluate(() => { Shell.activate(); document.querySelectorAll('.overlay').forEach(o => o.remove()); });
await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/workshop.preview.js', 'utf8'));
for (const k of ['note', 'photo']) { await p.evaluate((k) => window.__workshop(k), k); await p.waitForTimeout(700); await p.screenshot({ path: ROOT + '/docs/previews/workshop-' + k + '.png' }); }
await b.close(); console.log('ok');

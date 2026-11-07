// node docs/previews/workshop-studio.shots.mjs — the Workshop as a build surface (preview) → docs/previews/workshop-studio.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/docs/previews/workshop-studio.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
await p.evaluate(() => location.reload()); await p.waitForTimeout(900);   // drawn again once the fonts are in
await p.screenshot({ path: ROOT + '/docs/previews/workshop-studio.png' }); await b.close(); console.log('ok');

// node docs/previews/installer/setup-window.shots.mjs — the Setup's own window (desktop/setup.html, 3.210) opened as a page: without Electron
// it plays a demo, so these are the real window's screens → setup-{where,writing,done,update}.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..'), url = 'file://' + ROOT + '/desktop/setup.html';
const b = await chromium.launch(); const errs = [];
async function page(w, h, q) { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message)); await p.goto(url + (q || '')); return p; }
let p = await page(700, 470); await p.waitForTimeout(2200); await p.screenshot({ path: HERE + '/setup-where.png' });
await p.evaluate(() => document.getElementById('go').click()); await p.waitForTimeout(1500); await p.screenshot({ path: HERE + '/setup-writing.png' });
await p.waitForTimeout(3500); await p.screenshot({ path: HERE + '/setup-done.png' });
p = await page(440, 460, '?mode=update'); await p.waitForTimeout(1900); await p.screenshot({ path: HERE + '/setup-update.png' });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'ok'); await b.close();

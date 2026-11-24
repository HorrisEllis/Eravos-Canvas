// node docs/previews/settings-performance.shots.mjs — 3.222: Settings › Performance with 10 tools playing (live numbers, the custom
// settings) → settings-performance.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.SongEngine && window.AppSettings);
await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); await SongEngine.write('synthwave', 4242); await new Promise(r => setTimeout(r, 1500)); Kernel.bus.publish('ui:transport-play', {}); });
await p.waitForTimeout(6000); await p.evaluate(() => AppSettings.open('performance')); await p.waitForTimeout(1500);
await p.screenshot({ path: HERE + '/settings-performance.png' });
console.log(await p.evaluate(() => JSON.stringify(Performance_.stats())), errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();

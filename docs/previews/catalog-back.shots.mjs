// node docs/previews/catalog-back.shots.mjs — 3.226: the toolbar without the Start button; the catalog's ← Domains (top left) → catalog-back.png;
// pressing it opens the domain screen → catalog-back-domains.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.AddMenu && window.ShellStart);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.getElementById('addBtn').click(); }); await p.waitForTimeout(1200);
const has = await p.evaluate(() => ({ start: !!document.getElementById('startBtn'), back: !!document.querySelector('.addpop .ap-back') }));
await p.screenshot({ path: HERE + '/catalog-back.png' });
await p.evaluate(() => document.querySelector('.addpop .ap-back').click()); await p.waitForTimeout(800);
const boot = await p.evaluate(() => !!document.querySelector('.overlay .boot') && !document.querySelector('.addpop'));
await p.screenshot({ path: HERE + '/catalog-back-domains.png' });
console.log(JSON.stringify(Object.assign(has, { domainScreenOpened: boot })), errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();

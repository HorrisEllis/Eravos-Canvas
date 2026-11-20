// node docs/previews/start/start.shots.mjs — the new Start screens (tools/core/start/start.js, SS1 preview) on the real canvas, each screen settled:
// → docs/previews/start/start-1-domains.png, start-2-domain.png, start-3-category.png, start-4-workshop.png, start-5-lab.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = (f) => ROOT + '/docs/previews/start/' + f;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.StartScreen);
await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); StartScreen.open(); }); await p.waitForTimeout(2500);
await p.screenshot({ path: OUT('start-1-domains.png') });
const dom = await p.evaluate(() => { const d = Catalog.domains().filter(x => !x.toolless)[0]; StartScreen.current.go('domain', d.id); return d.id; }); await p.waitForTimeout(2600);
await p.screenshot({ path: OUT('start-2-domain.png') });
await p.evaluate(() => { const c = document.querySelectorAll('.st-cat')[2]; if (c) c.click(); }); await p.waitForTimeout(1600);
await p.screenshot({ path: OUT('start-3-category.png') });
await p.evaluate(() => StartScreen.current.go('workshop')); await p.waitForTimeout(2400); await p.screenshot({ path: OUT('start-4-workshop.png') });
await p.evaluate(() => StartScreen.current.go('lab')); await p.waitForTimeout(2400); await p.screenshot({ path: OUT('start-5-lab.png') });
console.log('domain', dom, 'info', JSON.stringify(await p.evaluate(() => ({ setups: Recipes.list().filter(r => r.section === 'SETUPS').map(r => r.id), cats: [...document.querySelectorAll('.st-cat')].length }))), 'errors', errs);
await b.close();

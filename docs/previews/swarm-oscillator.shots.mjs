import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') console.log('CON', m.text()); });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/swarm-oscillator.preview.js', 'utf8'));
const ids = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  return [OrganismFactory.spawn('eravos.retro-poly', { x: 20, y: 20 }), OrganismFactory.spawn('eravos.swarm-oscillator', { x: 640, y: 20 })]; });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; }); await p.waitForTimeout(1500); console.log(JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + f.message))));
for (const [i, name] of [[0, 'retro-poly-today'], [1, 'swarm-oscillator-preview']]) { const el = await p.$(`.wm-win[data-instance="${ids[i]}"]`); await el.screenshot({ path: `${OUT}/${name}.png` }); }
await p.screenshot({ path: `${OUT}/swarm-beside-retro-poly.png` });
await p.evaluate((i) => { const w = CanvasWM.windowOf(i); [...w.querySelectorAll('button')].find(b => /More depth/.test(b.textContent)).click(); OrganismFactory.handle(i).ctx.params.set('mode', 'free'); }, ids[1]); await p.waitForTimeout(400);
await (await p.$(`.wm-win[data-instance="${ids[1]}"]`)).screenshot({ path: `${OUT}/swarm-more-depth-free.png` });
await p.evaluate((i) => { const w = CanvasWM.windowOf(i); [...w.querySelectorAll('button')].find(b => /More depth/.test(b.textContent)).click(); OrganismFactory.handle(i).ctx.params.set('mode', 'coupled'); }, ids[1]); await p.waitForTimeout(300);
const disp = async () => (await p.$$(`.wm-win[data-instance="${ids[1]}"] canvas`))[0];
for (const [name, test] of [['apart', 'window.__swarmCoh < 0.3'], ['locked', 'window.__swarmCoh > 0.93']]) { await p.waitForFunction(test, null, { timeout: 30000 }); await (await disp()).screenshot({ path: `${OUT}/swarm-display-${name}.png` }); }
console.log('ok', ids); await b.close();

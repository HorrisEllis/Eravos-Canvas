// node docs/previews/ripple.shots.mjs — Ripple's window in the real canvas (3.239), a note held; and More depth open.
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const d = document.getElementById('dock'); if (d) d.style.display = 'none'; return OrganismFactory.spawn('eravos.ripple', { x: 20, y: 20 }); });
await p.evaluate((i) => { const c = OrganismFactory.handle(i).ctx; c.noteOn(45, 0.9, c.ac.currentTime); }, id);
await p.waitForTimeout(2500);
const win = await p.$(`.wm-win[data-instance="${id}"]`);
await win.screenshot({ path: `${OUT}/ripple-window.png` });
await p.evaluate((i) => { [...CanvasWM.windowOf(i).querySelectorAll('button')].find(b => /More depth/.test(b.textContent)).click(); const c = OrganismFactory.handle(i).ctx; c.params.set('beat', 9); c.params.set('voices', 5); }, id);
await p.waitForTimeout(1500);
await win.screenshot({ path: `${OUT}/ripple-window-depth.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => (f.fault_class || f.code) + ' ' + (f.message || '').slice(0, 90)))));
await b.close(); console.log('ok');

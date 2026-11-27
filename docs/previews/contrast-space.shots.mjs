// node docs/previews/contrast-space.shots.mjs — pictures of the Contrast Space preview (the seven new component UI elements) in the real
// canvas, silent. Not built. Spec: specs/eravos.contrast-space.spec.
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(fs.readFileSync(`${OUT}/contrast-space.preview.js`, 'utf8'));
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  return OrganismFactory.spawn('eravos.contrast-space', { x: 20, y: 20 }); });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(4000);
const win = await p.$(`.wm-win[data-instance="${id}"]`);
await win.screenshot({ path: `${OUT}/contrast-space-preview.png` });
// a second picture: the ripple turned rough (beat 9 Hz), the collision split higher, emergence locked
await p.evaluate((i) => { const c = OrganismFactory.handle(i).ctx.params; c.set('beat', 9); c.set('split', 220); c.set('coupling', 2.6); c.set('lean', -0.7); }, id);
await p.waitForTimeout(3000);
await win.screenshot({ path: `${OUT}/contrast-space-moved.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '').slice(0, 80)))));
await b.close(); console.log('ok');

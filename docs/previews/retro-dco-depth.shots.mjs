// node docs/previews/retro-dco-depth.shots.mjs — the Retro DCO depth preview (silent) → docs/previews/retro-dco-depth-preview.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 1700 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(fs.readFileSync(`${OUT}/retro-dco-depth.preview.js`, 'utf8'));
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  return OrganismFactory.spawn('eravos.retro-dco-depth-preview', { x: 20, y: 20 }); });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.evaluate((id) => { const w = CanvasWM.windowOf(id); w.style.height = '1620px'; }, id); await p.waitForTimeout(1500);
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: `${OUT}/retro-dco-depth-preview.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '').slice(0, 80)))));
await b.close(); console.log('ok');

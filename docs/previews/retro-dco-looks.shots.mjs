// node docs/previews/retro-dco-looks.shots.mjs — Retro DCO in its two looks (sunset = Retro Poly's, synthwave = the whole scene), playing,
// beside Retro Poly → docs/previews/retro-dco-look-sunset.png, retro-dco-look-synthwave.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
for (const look of ['sunset', 'synthwave']) {
  const p = await b.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 });
  await p.addInitScript((l) => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_RDCO_LOOK = l; }, look);
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
  await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
  await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
    OrganismFactory.spawn('eravos.retro-poly', { x: 20, y: 20 }); const id = OrganismFactory.spawn('eravos.retro-dco', { x: 650, y: 20 }); const c = OrganismFactory.handle(id).ctx; c.params.set('voice', 'poly'); await c.internals.ready;
    [48, 55, 60, 64, 67].forEach((n, i) => c.internals.noteOn(n, 0.9, c.ac.currentTime + 0.05 + i * 0.08, 8)); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${OUT}/retro-dco-look-${look}.png`, clip: { x: 0, y: 40, width: 1300, height: 560 } });
  await p.close();
}
await b.close(); console.log('ok');

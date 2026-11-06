// node docs/previews/retro-dco-built.shots.mjs — the BUILT Retro DCO in the real canvas, playing a chord → docs/previews/retro-dco-built-playing.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
const id = await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const id = OrganismFactory.spawn('eravos.retro-dco', { x: 20, y: 20 }); const c = OrganismFactory.handle(id).ctx; c.params.set('voice', 'poly'); await c.internals.ready;
  [48, 55, 60, 64, 67].forEach((n, i) => c.internals.noteOn(n, 0.9, c.ac.currentTime + 0.05 + i * 0.08, 6)); return id; });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(1500);
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: `${OUT}/retro-dco-built-playing.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '').slice(0, 80)))));
await b.close(); console.log('ok');

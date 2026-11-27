// node docs/previews/collision.shots.mjs — Spatial Organism.s window in the real canvas (3.240): a saw through it, swinging (live).
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const d = document.getElementById('dock'); if (d) d.style.display = 'none'; return OrganismFactory.spawn('eravos.spatial-organism', { x: 20, y: 20 }); });
await p.evaluate(async (i) => { const c = OrganismFactory.handle(i).ctx, ac = c.ac; try { await ac.resume(); } catch (e) {}
  const K = c.K, inN = K.audio.ports(i).find(x => x.kind === 'audio' && x.direction === 'in').node;
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 220; const g = ac.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(inN); o.start();
  c.params.set('room', 0.6); c.params.set('ears', 0.6); c.params.set('lean', 0.6); c.params.set('orbit', 0.4); }, id);
await p.waitForTimeout(2600);
const win = await p.$(`.wm-win[data-instance="${id}"]`);
await win.screenshot({ path: `${OUT}/spatial-organism-window.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => (f.fault_class || f.code) + ' ' + (f.message || '').slice(0, 90)))));
await b.close(); console.log('ok');

// node docs/previews/collision.shots.mjs — Collision's window in the real canvas (3.243): a bass tone through it, a kick in its key (live).
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const d = document.getElementById('dock'); if (d) d.style.display = 'none'; return OrganismFactory.spawn('eravos.band-collision', { x: 20, y: 20 }); });
await p.evaluate(async (i) => { const c = OrganismFactory.handle(i).ctx, ac = c.ac; try { await ac.resume(); } catch (e) {}
  const K = c.K, ins = K.audio.ports(i).filter(x => x.kind === 'audio' && x.direction === 'in'), inN = ins.find(x => x.label === 'in').node, keyN = ins.find(x => x.label === 'key').node;
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55; const g = ac.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(inN); o.start();
  const t0 = ac.currentTime; for (let k = 0; k < 40; k++) { const t = t0 + 0.05 + k * 0.5, ko = ac.createOscillator(), kg = ac.createGain(); ko.frequency.setValueAtTime(120, t); ko.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    kg.gain.setValueAtTime(0.9, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18); ko.connect(kg); kg.connect(keyN); ko.start(t); ko.stop(t + 0.2); } }, id);
await p.waitForTimeout(2600);
const win = await p.$(`.wm-win[data-instance="${id}"]`);
await win.screenshot({ path: `${OUT}/collision-window.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => (f.fault_class || f.code) + ' ' + (f.message || '').slice(0, 90)))));
await b.close(); console.log('ok');

// node docs/previews/workbench/everywhere.shots.mjs — 3.224: Retro Poly, Piano and Tape Memory blown up; their parts now boxes with tiles
// (swap, Replace with, synthesize) → everywhere.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard);
await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  const a = OrganismFactory.spawn('eravos.retro-poly', { x: 20, y: 20 }), t = OrganismFactory.spawn('eravos.tape-memory', { x: 2600, y: 20 }); await new Promise(r => setTimeout(r, 800));
  OrganismFactory.handle(t).view.emit('config_change', { key: 'bits', value: 8 });
  FieldBoard.explode(a, 'eravos.retro-poly'); FieldBoard.explode(t, 'eravos.tape-memory'); await new Promise(r => setTimeout(r, 600));
  const bds = [...document.querySelectorAll('.fb-board')]; const L = Math.min(...bds.map(x => x.offsetLeft)), R = Math.max(...bds.map(x => x.offsetLeft + x.offsetWidth)), T = Math.min(...bds.map(x => x.offsetTop)), B = Math.max(...bds.map(x => x.offsetTop + x.offsetHeight));
  const z = Math.min(1800 / (R - L + 60), 1000 / (B - T + 60)); CanvasWM.view = { x: 30 - L * z, y: 30 - T * z, z }; CanvasWM.applyView(); });
await p.waitForTimeout(500); await p.screenshot({ path: HERE + '/everywhere.png' });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();

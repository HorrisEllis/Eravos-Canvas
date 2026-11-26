// node docs/previews/made-tool-workshop.shots.mjs — 3.231: a made tool's face (✎ Workshop · Rename · ✕ Delete tool) → made-tool-face.png ·
// the made tool open in the Workshop, every place a layer → made-tool-workshop.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.AssembledTool && window.Workshop);
const inst = await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  MadeTools.save(AssembledTool.MADE_KEY, []); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 4000, y: 20 }), r = OrganismFactory.spawn('eravos.retro-dco', { x: 6600, y: 20 }); await new Promise(res => setTimeout(res, 700));
  const m = await AssembledTool.synthesize(r, a); OrganismFactory.close(a); OrganismFactory.close(r);
  return OrganismFactory.spawn(m.id, { x: 30, y: 70 }); });
await p.waitForTimeout(800); const el = await p.$('.wm-win[data-instance="' + inst + '"]'); await el.screenshot({ path: HERE + '/made-tool-face.png' });
await p.evaluate((i) => { OrganismFactory.handle(i).view.emit('edit_workshop', {}); setTimeout(() => Workshop.current && Workshop.current.select('wobble'), 100); }, inst);
await p.waitForTimeout(900); await p.screenshot({ path: HERE + '/made-tool-workshop.png' });
await p.evaluate(() => { if (Workshop.current) Workshop.current.close(); MadeTools.save(AssembledTool.MADE_KEY, []); });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();

// node docs/previews/title-case.shots.mjs <tag> — Piano, Retro DCO, Swarm as they draw now → docs/previews/case-<tag>-<tool>.png (3.184: before / after)
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), TAG = process.argv[2] || 'now';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && OrganismFactory.def('eravos.piano'), null, { timeout: 90000 });
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
for (const id of ['eravos.piano', 'eravos.retro-dco', 'eravos.swarm-oscillator']) {
  const a = await p.evaluate((id) => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView(); return OrganismFactory.spawn(id, { x: 20, y: 20 }); }, id);
  await p.waitForTimeout(1300);
  await (await p.$(`.wm-win[data-instance="${a}"]`)).screenshot({ path: path.join(ROOT, 'docs/previews', `case-${TAG}-${id.replace('eravos.', '')}.png`) }); console.log('shot', TAG, id);
}
await b.close();

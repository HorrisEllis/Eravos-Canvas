#!/usr/bin/env node
/* Render every tool window to docs/tools/<name>.png (node build/shots.mjs). */
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = process.env.SHOTS_OUT || path.join(ROOT, 'docs', 'tools');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1500, height: 1500 }, deviceScaleFactor: Number(process.env.SHOTS_SCALE || 2) });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
const ids = await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); return OrganismFactory.defined().map(d => d.id); });
for (const id of ids) {
  const inst = await p.evaluate((id) => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView(); return OrganismFactory.spawn(id, { x: 30, y: 20 }); }, id);
  if (!inst) { const dock = await p.$('#dock'); if (dock) { await dock.screenshot({ path: path.join(OUT, id.replace(/^eravos\./, '') + '.png') }); continue; } console.log('skip', id); continue; }
  await p.evaluate((i) => Kernel.bus.publish('ui:audition:' + i, { note: 57, velocity: 0.9, duration: 1.5 }), inst);
  await p.waitForTimeout(700);
  const el = await p.$(`.wm-win[data-instance="${inst}"]`); await el.screenshot({ path: path.join(OUT, id.replace(/^eravos\./, '') + '.png') });
  await p.evaluate((i) => OrganismFactory.close(i), inst);
}
// the shell itself: agnostic boot, add menu, dock
await p.evaluate(() => { OrganismFactory.clearAll(Kernel); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => w.remove()); }); await p.click('#addBtn'); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(OUT, '_add-menu.png') });
console.log(ids.length + ' tools → docs/tools'); await b.close();

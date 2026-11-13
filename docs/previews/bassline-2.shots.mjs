// node docs/previews/bassline-2.shots.mjs — Bassline 2.0 (3.186): its window (unchanged) and its page's Steps tab (LOCK and REST lanes, TIME,
// NOTES) → docs/previews/bassline-2-window.png, bassline-2-steps.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 1400 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && OrganismFactory.def('eravos.bass-gen') && window.ToolPage, null, { timeout: 90000 });
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const a = OrganismFactory.spawn('eravos.bass-gen', { x: 20, y: 20 }), c = OrganismFactory.handle(a).ctx;
  c.params.set('steps', Object.assign(c.internals.STEPS0(), { vel: [0.6, 0, -0.4, 0, 0.3, 0, 0, 0, 0.6, 0, -0.4, 0, 0.3, 0, 0, 0], lock: [0, 0, 0, 0, 3, 0, 2, 0, 0, 0, 0, 0, 5, 0, 7, 0], rest: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], slide: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, -1, 0] }));
  c.params.setMany({ feel: 'normal', swing: 0.35, pool: 'chord tones', tension: 0.4, anticipate: 0.5, answer: 0.3, transpose: 2 }); return a; });
await p.waitForTimeout(1000);
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: path.join(ROOT, 'docs/previews/bassline-2-window.png') }); console.log('shot window');
await p.evaluate((id) => { ToolPage.open('eravos.bass-gen', { instanceId: id }); }, id); await p.waitForTimeout(800);
const tabs = await p.evaluate(() => [...document.querySelectorAll('.tp-nav button, .tp-tab')].map(x => x.textContent.trim()).slice(0, 14));
console.log('tabs', JSON.stringify(tabs));
await p.evaluate(() => { const t = [...document.querySelectorAll('.tp-nav button, .tp-tab')].find(x => /Steps/.test(x.textContent)); if (t) t.click(); }); await p.waitForTimeout(900);
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('canvas.bl-lanes')].find(c => c.offsetWidth); let e = a; while (e && e.parentElement && e.getBoundingClientRect().height < 700) e = e.parentElement; const r = (e || document.body).getBoundingClientRect(); return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, 1280), height: Math.min(r.height, 1380) }; });
console.log('page', JSON.stringify(box)); await p.screenshot({ path: path.join(ROOT, 'docs/previews/bassline-2-steps.png'), clip: box }); console.log('shot steps');
await b.close();

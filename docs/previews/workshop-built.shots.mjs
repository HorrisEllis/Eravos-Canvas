// node docs/previews/workshop-built.shots.mjs — the built W1 (3.150): the Pattern window on the canvas wired into Retro DCO, and the Workshop
// opened from it → docs/previews/workshop-built-window.png, workshop-built.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
const id = await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const a = OrganismFactory.spawn('eravos.pattern-field', { x: 20, y: 20 }), r = OrganismFactory.spawn('eravos.retro-dco', { x: 680, y: 20 });
  Kernel.wires.register({ src: { instanceId: a, hookId: 'pf.hook.note_out' }, dst: { instanceId: r, hookId: 'rd.hook.note_in' } });
  OrganismFactory.handle(a).ctx.params.set('locked', [{ s: 0, n: 45 }]); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; await Kernel.audio.ctx.resume(); Transport.play(); return a; });
await p.waitForTimeout(2200);
const box = await p.evaluate((id) => { const r = CanvasWM.windowOf(id).getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }, id);
await p.screenshot({ path: ROOT + '/docs/previews/workshop-built-window.png', clip: box });
await p.evaluate((id) => { const w = CanvasWM.windowOf(id); [...w.querySelectorAll('button')].find(x => /Open in Workshop/.test(x.textContent)).click(); }, id);
await p.waitForTimeout(600); await p.evaluate(() => { Workshop.current.select('density'); }); await p.waitForTimeout(400);
await p.screenshot({ path: ROOT + '/docs/previews/workshop-built.png' }); await p.evaluate(() => Transport.stop()); await b.close(); console.log('ok');

// node docs/previews/workbench/wires.shots.mjs — Wobble Bass blown up on the canvas with the new wires (2026-11-21, his: "You make those, like,
// the wires, too … when you explode the tools in the canvas"): the installer's cyan → violet → pink, glowing, light flowing in → wires-<theme>.png (each theme its own)
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); await new Promise(r => setTimeout(r, 800));
  const r = FieldBoard.explode(a, 'eravos.wobble-bass'); await (r && r.done); await new Promise(r2 => setTimeout(r2, 300));
  const core = document.querySelector('.fb-board .fb-core'), bd = core.closest('.fb-board'), z = 0.85;   // close on the core: the wires coming in
  const cx = bd.offsetLeft + core.offsetLeft + core.offsetWidth / 2, cy = bd.offsetTop + core.offsetTop + core.offsetHeight / 2;
  CanvasWM.view = { x: 800 - cx * z, y: 500 - cy * z, z }; CanvasWM.applyView();
});
for (const th of ['dusk', 'studio', 'field', 'midnight']) {   // each theme says its own wire colours (eravos.css --wire1..3)
  await p.evaluate((t) => Themes.set(t), th); await p.waitForTimeout(600); await p.screenshot({ path: HERE + '/wires-' + th + '.png', clip: { x: 0, y: 150, width: 1600, height: 560 } });
}
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'ok'); await b.close();

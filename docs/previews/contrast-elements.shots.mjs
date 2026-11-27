// node docs/previews/contrast-elements.shots.mjs — the seven component UI elements as seven separate windows on the real canvas, wired with
// ordinary wires (no tool gathers them), silent. Spec: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2).
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(fs.readFileSync(`${OUT}/contrast-elements.preview.js`, 'utf8'));
const res = await p.evaluate(() => {
  CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 0.78 }; CanvasWM.applyView();
  const E = window.__contrastElements, at = (k, x, y) => OrganismFactory.spawn(E[k], { x, y });
  const i = { pend: at('pend', 20, 20), ripple: at('ripple', 480, 20), coll: at('coll', 940, 20), space: at('space', 1400, 20),
    wave: at('wave', 20, 330), emer: at('emer', 480, 330), tens: at('tens', 940, 330) };
  const K = window.Kernel, W = (a, ah, d, dh) => { try { return !!K.wires.register({ src: { instanceId: i[a], hookId: E[a] + '.hook.' + ah }, dst: { instanceId: i[d], hookId: E[d] + '.hook.' + dh } }); } catch (e) { return e.message; } };
  return { wires: [W('ripple', 'audio_out', 'coll', 'audio_in'), W('coll', 'audio_out', 'space', 'audio_in'), W('pend', 'swing', 'ripple', 'beat_in'),
    W('tens', 'tension', 'space', 'distance_in'), W('emer', 'sync', 'tens', 'release_in')] };
});
console.log('wires', JSON.stringify(res));
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(4000);
await p.screenshot({ path: `${OUT}/contrast-elements-canvas.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '').slice(0, 80)))));
await b.close(); console.log('ok');

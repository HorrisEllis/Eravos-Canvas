// node docs/previews/workbench/field-live.shots.mjs — Wobble Bass exploded on the real canvas (tools/core/field/board.js), live:
// → docs/previews/workbench/field-live-whole.png (the window), field-live-apart.png (the board, every part live), field-live-scrolled.png (panned
//   down to what it has grown since the board), field-live-edited.png (a knob turned and a gate moved, still exploded)
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = (f) => ROOT + '/docs/previews/workbench/' + f;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__wb = OrganismFactory.spawn('eravos.wobble-bass', { x: 350, y: 140 }); });
await p.waitForTimeout(900);
await p.evaluate(() => { CanvasWM.place(window.__wb, { w: 1100, h: 840 }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView(); }); await p.waitForTimeout(400);
await p.screenshot({ path: OUT('field-live-whole.png') });
const r = await p.evaluate(() => FieldBoard.explode(window.__wb, 'eravos.wobble-bass')); console.log('explode:', JSON.stringify(r));
await p.waitForTimeout(5200); await p.screenshot({ path: OUT('field-live-apart.png') });
// edit it while apart: the cutoff knob's value, then move a gate by its label
await p.evaluate(() => { const h = OrganismFactory.handle(window.__wb); h.view.emit('config_change', { key: 'cutoff', value: 900 }); });
await p.evaluate(() => { const lab = document.querySelector('.fb-gate[data-piece="perform"] .fb-lab'), r = lab.getBoundingClientRect(), o = { bubbles: true, pointerId: 1, button: 0, clientX: r.x + 10, clientY: r.y + 5 };
  lab.setPointerCapture = () => {}; lab.dispatchEvent(new PointerEvent('pointerdown', o)); lab.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: r.x + 140, clientY: r.y - 60 })); lab.dispatchEvent(new PointerEvent('pointerup', o)); });
await p.waitForTimeout(400); await p.screenshot({ path: OUT('field-live-edited.png') });
console.log('cutoff now', await p.evaluate(() => OrganismFactory.handle(window.__wb).ctx.params.get('cutoff')));
// scroll the canvas down (the wheel, as everywhere) to what it has grown since the board
for (let i = 0; i < 2; i++) await p.evaluate(() => { const c = CanvasWM.canvas, r = c.getBoundingClientRect(); c.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 220, clientX: r.x + 40, clientY: r.y + 40 })); });
await p.waitForTimeout(500); await p.screenshot({ path: OUT('field-live-scrolled.png') });
await p.evaluate(() => { localStorage.removeItem('eravos.fieldboard.eravos.wobble-bass'); FieldBoard.assemble(window.__wb); });
console.log('back in its window:', await p.evaluate(() => !!CanvasWM.windowOf(window.__wb).querySelector('[data-key="cutoff"]')), 'errors', errs);
await b.close();

// node docs/previews/workbench/hover-replace.shots.mjs — 3.216: Wobble Bass and Retro DCO blown up; a component box framed whole, the hover card
// (what it is · what it is for · what it does to the sound), and right-click › REPLACE WITH → hover-card.png, replace-menu.png, replaced.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && FieldBoard.exchange && window.PartWords);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); window.__b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); await new Promise(r => setTimeout(r, 800));
  OrganismFactory.handle(window.__b).view.emit('config_change', { key: 'filter', value: 'ladder' });
  FieldBoard.explode(window.__a, 'eravos.wobble-bass'); FieldBoard.explode(window.__b, 'eravos.retro-dco'); await new Promise(r => setTimeout(r, 500));
  window.__box = (inst, re) => [...document.querySelectorAll('.fb-board[data-instance="' + inst + '"] .fb-gate.fb-comp')].find(g => re.test((g.querySelector('.fb-tile') || {}).textContent || ''));
  const g = __box(window.__a, /wobble/); const r = g.getBoundingClientRect();
  CanvasWM.view = { x: CanvasWM.view.x + (380 - r.left) / 1, y: CanvasWM.view.y + (260 - r.top), z: CanvasWM.view.z }; CanvasWM.applyView(); await new Promise(r2 => setTimeout(r2, 150));
  g.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false })); await new Promise(r2 => setTimeout(r2, 600));
});
await p.screenshot({ path: HERE + '/hover-card.png', clip: { x: 300, y: 150, width: 900, height: 520 } });
const menu = await p.evaluate(async () => {
  document.querySelectorAll('.fb-card').forEach(c => c.remove());
  const g = __box(window.__a, /SVF|ladder|mouth/i); const r = g.getBoundingClientRect();
  CanvasWM.view = { x: CanvasWM.view.x + (420 - r.left), y: CanvasWM.view.y + (260 - r.top), z: CanvasWM.view.z }; CanvasWM.applyView(); await new Promise(r2 => setTimeout(r2, 150));
  const q = g.getBoundingClientRect(); g.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: q.left + 30, clientY: q.top + 30 })); await new Promise(r2 => setTimeout(r2, 200));
  return [...document.querySelectorAll('.cm .cm-item, .cm .cm-s')].map(e => e.textContent);
});
await p.screenshot({ path: HERE + '/replace-menu.png', clip: { x: 360, y: 150, width: 1000, height: 640 } });
const after = await p.evaluate(async () => {
  const it = [...document.querySelectorAll('.cm .cm-item')].find(e => /from Retro DCO/.test(e.textContent)); if (!it) return 'no item from Retro DCO';
  it.click(); await new Promise(r2 => setTimeout(r2, 500)); return (__box(window.__a, /ladder/i) || {}).textContent || 'not replaced';
});
await p.screenshot({ path: HERE + '/replaced.png', clip: { x: 360, y: 150, width: 1000, height: 520 } });
console.log(JSON.stringify(menu)); console.log('after:', after); console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors');
await b.close();

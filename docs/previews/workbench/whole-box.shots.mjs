// node docs/previews/workbench/whole-box.shots.mjs — 3.211: Wobble Bass and Retro DCO blown up; three parts Ctrl+clicked across them, the
// right-click, then the tool synthesized from them, blown up → whole-box-{select,made}.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && FieldBoard.exchange);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); window.__b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); await new Promise(r => setTimeout(r, 800));
  const B = OrganismFactory.handle(window.__b); [['chorus', 'II'], ['filter', 'ladder'], ['pulse', 0.9], ['saw', 0.2]].forEach(([k, v]) => B.view.emit('config_change', { key: k, value: v }));
  FieldBoard.explode(window.__a, 'eravos.wobble-bass'); FieldBoard.explode(window.__b, 'eravos.retro-dco'); await new Promise(r => setTimeout(r, 400));
  CanvasWM.view = { x: 10, y: 30, z: 0.36 }; CanvasWM.applyView(); await new Promise(r => setTimeout(r, 100));
  const box = (inst, re) => [...document.querySelectorAll('.fb-board[data-instance="' + inst + '"] .fb-gate')].find(g => re.test(g.dataset.piece + ' ' + g.querySelector('.fb-lab').textContent));
  [box(window.__a, /rate-beyond|wobble/), box(window.__b, /vcf/i), box(window.__b, /chorus/i)].forEach(g => { const r = g.getBoundingClientRect(); g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: true, clientX: r.left + 10, clientY: r.top + 10 })); });
  const v = box(window.__b, /vcf/i).getBoundingClientRect(); v && v.width; window.__cm = { x: v.left + v.width / 2, y: v.top + v.height / 2 };
  box(window.__b, /vcf/i).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: window.__cm.x, clientY: window.__cm.y }));
});
await p.waitForTimeout(500); await p.screenshot({ path: HERE + '/whole-box-select.png' });
await p.evaluate(async () => { ContextMenu.close(); const r = await FieldBoard.synthesizeSel(); window.__m = r; await new Promise(res => setTimeout(res, 1400));
  const bd = r && document.querySelector('.fb-board[data-instance="' + r.inst + '"]'); if (bd) { const z = Math.min(1800 / (bd.offsetWidth + 80), 1000 / (bd.offsetHeight + 80)); CanvasWM.view = { x: 40 - bd.offsetLeft * z, y: 40 - bd.offsetTop * z, z }; CanvasWM.applyView(); } });
await p.waitForTimeout(700); await p.screenshot({ path: HERE + '/whole-box-made.png' });
console.log(await p.evaluate(() => window.__m ? window.__m.rec.name + ' · ' + window.__m.rec.chain : 'not made'), errs.length ? 'errors: ' + errs.join(' | ') : 'ok');
await p.evaluate(() => { const L = MadeTools.list(AssembledTool.MADE_KEY).filter(x => !window.__m || x.id !== window.__m.id); MadeTools.save(AssembledTool.MADE_KEY, L); });
await b.close();

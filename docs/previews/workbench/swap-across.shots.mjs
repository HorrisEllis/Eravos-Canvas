// node docs/previews/workbench/swap-across.shots.mjs — Wobble Bass and Retro DCO blown up on the real canvas; components DRAGGED between them, one
// deleted, one changed from the tray (2026-11-20: "drag components, delete them, change them. not drop down menus") → swap-across-{drag,after}.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1200 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && FieldBoard.exchange);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); window.__b = OrganismFactory.spawn('eravos.retro-dco', { x: 2000, y: 20 }); await new Promise(r => setTimeout(r, 800));
  const set = (i, k, v) => OrganismFactory.handle(i).view.emit('config_change', { key: k, value: v }); [['chorus', 'II'], ['filter', 'ladder'], ['cutoff', 1400], ['res', 0.4], ['drive', 6]].forEach(([k, v]) => set(window.__b, k, v));
  await new Promise(r => setTimeout(r, 150)); FieldBoard.explode(window.__a, 'eravos.wobble-bass'); FieldBoard.explode(window.__b, 'eravos.retro-dco'); await new Promise(r => setTimeout(r, 400));
  CanvasWM.view = { x: 10, y: 10, z: 0.42 }; CanvasWM.applyView();
  window.__box = (inst, re) => [...document.querySelectorAll('.fb-board[data-instance="' + inst + '"] .fb-gate.fb-comp')].find(g => re.test(g.dataset.piece + ' ' + g.querySelector('.fb-lab').textContent));
  window.__drag = (from, to, hold) => { const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), o = { bubbles: true, button: 0, pointerId: 1 };
    from.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: a.left + 6, clientY: a.top + 5 }, o)));
    document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: b.left + b.width / 2, clientY: b.top + Math.min(40, b.height / 2) }, o)));
    if (!hold) document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: b.left + b.width / 2, clientY: b.top + 20 }, o))); };
});
// mid-drag: Retro DCO's VCF tile carried over Wobble Bass's mouth (the boxes it fits lit, the rest dimmed)
await p.evaluate(() => { window.__drag(window.__box(window.__b, /vcf/i).querySelector('.fb-tile'), window.__box(window.__a, /filter-vowels/), true); });
await p.waitForTimeout(200); await p.screenshot({ path: HERE + '/swap-across-drag.png' });
const r = await p.evaluate(async () => {
  const A = OrganismFactory.handle(window.__a).ctx.params, B = OrganismFactory.handle(window.__b).ctx.params, out = {};
  out.lit = document.querySelectorAll('.fb-gate.fb-can').length + ' boxes it fits lit, ' + document.querySelectorAll('.fb-gate.fb-cannot').length + ' dimmed';
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 })); await new Promise(r => setTimeout(r, 300));
  out.mouth = A.get('partFilter') + ' · ' + A.get('cutoff') + ' Hz · ladder drive ' + A.get('pfLadDrive') + ' · tile: ' + window.__box(window.__a, /filter-vowels/).querySelector('.fb-tile').textContent;
  window.__drag(window.__box(window.__b, /chorus/i).querySelector('.fb-tile'), window.__box(window.__a, /squash/)); await new Promise(r => setTimeout(r, 300));
  out.afterAmp = A.get('partInsert') + ' · ' + A.get('peMode');
  window.__drag(window.__box(window.__a, /rate-beyond/).querySelector('.fb-tile'), window.__box(window.__b, /^auto.*lfo/i)); await new Promise(r => setTimeout(r, 300));
  out.retroLfo = B.get('lfoRate').toFixed(2) + ' Hz · ' + B.get('lfoShape') + ' · ' + B.get('lfoCutoff') + ' c';
  const tray = [...document.querySelectorAll('.fb-board[data-instance="' + window.__a + '"] .fb-ttile')]; out.tray = tray.map(t => t.textContent.replace('⠿ ', ''));
  window.__drag(tray.find(t => /bitcrusher/.test(t.textContent)), window.__box(window.__a, /grit/)); await new Promise(r => setTimeout(r, 300));
  out.gritFromTray = A.get('partDrive');
  window.__box(window.__b, /chorus/i).querySelector('.fb-del').click(); await new Promise(r => setTimeout(r, 200)); out.retroChorusDeleted = B.get('chorus');
  return out;
});
await p.waitForTimeout(400); await p.screenshot({ path: HERE + '/swap-across-after.png' });
console.log(JSON.stringify(r, null, 1)); console.log('errors', errs.slice(0, 6)); await b.close();

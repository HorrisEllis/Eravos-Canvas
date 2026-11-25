// node docs/previews/workbench/synthesis-why.shots.mjs — 3.226: Wobble Bass and Retro DCO blown up; (1) ◇ What will it make? beside the picked
// parts → synthesis-plan.png · (2) the same picks made twice: refused, the parts ringed red, the reason and its fixes → synthesis-why.png ·
// (3) the ＋ Add catalog's Modes as tool-like cards → catalog-modes.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard);
await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  MadeTools.save(AssembledTool.MADE_KEY, []);
  const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), r = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); await new Promise(res => setTimeout(res, 800));
  FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(r, 'eravos.retro-dco'); await new Promise(res => setTimeout(res, 600));
  const bds = [...document.querySelectorAll('.fb-board')]; const L = Math.min(...bds.map(x => x.offsetLeft)), R = Math.max(...bds.map(x => x.offsetLeft + x.offsetWidth)), T = Math.min(...bds.map(x => x.offsetTop)), B = Math.max(...bds.map(x => x.offsetTop + x.offsetHeight));
  const z = Math.min(1400 / (R - L + 60), 1000 / (B - T + 60)); CanvasWM.view = { x: 30 - L * z, y: 30 - T * z, z }; CanvasWM.applyView();
  const lab = (g) => String((g.lab.firstChild || g.lab).textContent).trim();
  window.__pick = () => { FieldBoard.clearSel(); FieldBoard.gates(a).filter(g => FieldBoard.exchange.fits({ inst: a, slot: g.slot, piece: g.p.id, label: lab(g) })).forEach(g => FieldBoard.select(a, g, true)); };
  window.__pick(); await FieldBoard.previewSel(); });
await p.waitForTimeout(500); await p.screenshot({ path: HERE + '/synthesis-plan.png' });
await p.evaluate(async () => { FieldBoard.hideWhy(); window.__pick(); await FieldBoard.synthesizeSel(); document.querySelectorAll('.wm-win').forEach(w => { if (/Wobble Bass · parts/.test(w.textContent)) w.style.display = 'none'; });
  document.querySelectorAll('.fb-board').forEach((bd, i) => { if (i > 1) bd.style.display = 'none'; }); window.__pick(); await FieldBoard.synthesizeSel(); });
await p.waitForTimeout(700); await p.screenshot({ path: HERE + '/synthesis-why.png' });
await p.evaluate(() => { FieldBoard.hideWhy(); FieldBoard.clearSel(); AddMenu.show(Shell, Shell.X, { view: 'modes' }); });
await p.waitForTimeout(500); await p.screenshot({ path: HERE + '/catalog-modes.png' });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();

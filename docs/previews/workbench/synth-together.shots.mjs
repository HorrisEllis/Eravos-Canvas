// node docs/previews/workbench/synth-together.shots.mjs — Wobble Bass and Retro DCO blown up; Wobble Bass's ◆ dragged onto Retro DCO's core → one tool
// of its own, opened blown up beside them (2026-11-21) → synth-together-{drag,made}.png; prints the new tool and its parts
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1200 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; try { localStorage.removeItem('eravos.made-tools.wobble-builder'); } catch (e) {} });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && window.AssembledTool);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); window.__b = OrganismFactory.spawn('eravos.retro-dco', { x: 2000, y: 20 }); await new Promise(r => setTimeout(r, 800));
  const B = OrganismFactory.handle(window.__b); [['chorus', 'II'], ['filter', 'ladder'], ['pulse', 0.9], ['saw', 0.2], ['cutoff', 1400]].forEach(([k, v]) => B.view.emit('config_change', { key: k, value: v }));
  await new Promise(r => setTimeout(r, 150)); FieldBoard.explode(window.__a, 'eravos.wobble-bass'); FieldBoard.explode(window.__b, 'eravos.retro-dco'); await new Promise(r => setTimeout(r, 400));
  CanvasWM.view = { x: 10, y: 10, z: 0.3 }; CanvasWM.applyView();
  const t = document.querySelector('.fb-board[data-instance="' + window.__a + '"] .fb-fuse'), c = document.querySelector('.fb-board[data-instance="' + window.__b + '"] .fb-core'), p1 = t.getBoundingClientRect(), p2 = c.getBoundingClientRect(), o = { bubbles: true, button: 0, pointerId: 1 };
  t.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: p1.left + 6, clientY: p1.top + 5 }, o))); document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p2.left + p2.width / 2, clientY: p2.top + 20 }, o)));
});
await p.waitForTimeout(200); await p.screenshot({ path: HERE + '/synth-together-drag.png' });
const r = await p.evaluate(async () => {
  const before = new Set(Kernel.registry.list().map(x => x.instance_id)); document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 }));
  let m = null; for (let i = 0; i < 60 && !m; i++) { await new Promise(r => setTimeout(r, 100)); m = Kernel.registry.list().find(x => !before.has(x.instance_id) && /^eravos\.wb-/.test(x.organism_id)); }
  await new Promise(r => setTimeout(r, 1200)); if (!m) return { made: null };
  const H = OrganismFactory.handle(m.instance_id), rec = AssembledTool.made()[0];
  CanvasWM.view = { x: 10, y: 10, z: 0.2 }; CanvasWM.applyView();
  return { made: rec.name, verdict: rec.verdict + ' · nearest ' + rec.near + ' (' + rec.d + ')', chain: rec.chain, blownUp: FieldBoard.isOpen(m.instance_id), tiles: [...document.querySelectorAll('.fb-board[data-instance="' + m.instance_id + '"] .fb-tile')].map(t => t.textContent.replace('⠿', '').trim()) };
});
await p.waitForTimeout(400); await p.screenshot({ path: HERE + '/synth-together-made.png' });
console.log(JSON.stringify(r, null, 1)); console.log('errors', errs.slice(0, 6)); await b.close();

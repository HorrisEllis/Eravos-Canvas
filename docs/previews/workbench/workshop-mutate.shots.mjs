// node docs/previews/workbench/workshop-mutate.shots.mjs — a note on the Workshop's BOARD, mutated (FieldMutate, shared with the Field board,
// 2026-11-20) → docs/previews/workbench/workshop-mutate.png; prints what the mutation changed and the undo history
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__tl = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1250, h: 560 }); });
await p.waitForTimeout(800);
await p.evaluate(async () => { const id = window.__tl, pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl), sleep = (ms) => new Promise(r => setTimeout(r, ms));
  pub('lane_add', { kind: 'inst', name: 'Lead' }); await sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [0, 3, 7, 10, 12, 10, 7, 3].map((x, i) => ({ s: i * 4, l: 4, n: 57 + x, v: 0.8 })) }); await sleep(100);
  const H = OrganismFactory.handle(id); H.view.openClip(H.ctx.internals.clips.find(c => c.kind === 'notes').id); await sleep(300); H.view.roll.openWorkshop(2); await sleep(300);
  [...document.querySelectorAll('.ws-vph .ws-chip')].find(c => c.textContent === 'BOARD').click(); await sleep(300); });
const r = await p.evaluate(async () => { const dock = document.querySelector('.ws-board .fm-dock'); if (!dock) return { dock: false }; dock.mutateNow(); await new Promise(r => setTimeout(r, 300));
  const c = document.querySelector('.ws-bcore').getBoundingClientRect(); return { dock: true, did: dock.querySelector('.fm-line').textContent, hist: Workshop.current.history().slice(-2), core: [c.left, c.top] }; });
console.log(JSON.stringify(r));
await p.screenshot({ path: ROOT + '/docs/previews/workbench/workshop-mutate.png' }); console.log('errors', errs.slice(0, 5)); await b.close();

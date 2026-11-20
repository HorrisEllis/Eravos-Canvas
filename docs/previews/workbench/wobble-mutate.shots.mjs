// node docs/previews/workbench/wobble-mutate.shots.mjs — Wobble Bass exploded on the real canvas, its sockets swapped and mutated (board.js + the
// engine's PARTS, 2026-11-20) → docs/previews/workbench/wobble-mutate-{board,swap,mutated}.png, and the measured level of each part
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = (f) => ROOT + '/docs/previews/workbench/' + f;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; try { localStorage.removeItem('eravos.mutate.eravos.wobble-bass'); } catch (e) {} });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__wb = OrganismFactory.spawn('eravos.wobble-bass', { x: 350, y: 140 }); });
await p.waitForTimeout(900);
await p.evaluate(() => { CanvasWM.place(window.__wb, { w: 1100, h: 840 }); });
// the level at the tool's output, while a note plays (an analyser on the engine's last node)
await p.evaluate(() => { const r = OrganismFactory.handle(window.__wb), ac = r.ctx.ac, an = ac.createAnalyser(); an.fftSize = 2048; r.ctx.internals.finalOut.connect(an); window.__an = an;
  window.__level = async () => { await (ac.resume && ac.resume()); r.ctx.audition({ note: 45, velocity: 0.9, duration: 1.0 }); let pk = 0, rms = 0, n = 0, bad = 0; const buf = new Float32Array(2048);
    for (let i = 0; i < 18; i++) { await new Promise(res => setTimeout(res, 40)); an.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) { if (!isFinite(x)) bad++; pk = Math.max(pk, Math.abs(x)); s += x * x; } rms += Math.sqrt(s / buf.length); n++; }
    await new Promise(res => setTimeout(res, 900)); return { peak: +pk.toFixed(3), rms: +(rms / n).toFixed(4), bad }; }; });
const out = {};
out.own = await p.evaluate(() => window.__level());
const r = await p.evaluate(() => { const x = FieldBoard.explode(window.__wb, 'eravos.wobble-bass'); return { pieces: x.pieces, missing: x.missing }; }); console.log('explode', JSON.stringify(r));
await p.waitForTimeout(600);
const chips = await p.evaluate(() => [...document.querySelectorAll('.fb-swap')].map(c => c.closest('.fb-gate').dataset.piece + ':' + c.textContent));
console.log('chips', chips, 'dock', await p.evaluate(() => !!document.querySelector('.fb-mut .fm-go')));
await p.evaluate(() => { const g = document.querySelector('.fb-mut'); g.scrollIntoView({ block: 'center' }); });
await p.evaluate(() => { const m = document.querySelector('.fb-mut').getBoundingClientRect(); const v = CanvasWM.view; CanvasWM.view = { x: v.x - (m.left - 500), y: v.y - (m.top - 500), z: v.z }; CanvasWM.applyView(); });
await p.waitForTimeout(300); await p.screenshot({ path: OUT('wobble-mutate-board.png') });
// each part on its own, measured
for (const [k, v] of [['partFilter', 'filter-svf'], ['partFilter', 'filter-ladder'], ['partDrive', 'saturator-tube'], ['partDrive', 'saturator-tape'], ['partDrive', 'bitcrusher'], ['partNoise', 'osc-noise'], ['partInsert', 'delay-line'], ['partInsert', 'saturator-tube'], ['partInsert', 'bitcrusher']]) {
  await p.evaluate(([k, v]) => { const h = OrganismFactory.handle(window.__wb); ['partFilter', 'partDrive', 'partNoise'].forEach(x => h.view.emit('config_change', { key: x, value: 'own' })); h.view.emit('config_change', { key: 'partInsert', value: 'none' }); h.view.emit('config_change', { key: 'noise', value: k === 'partNoise' ? 0.6 : 0 }); h.view.emit('config_change', { key: k, value: v }); }, [k, v]);
  await p.waitForFunction(() => OrganismFactory.handle(window.__wb).ctx.parts && true); await p.evaluate(async (k) => OrganismFactory.handle(window.__wb).ctx.parts.ready({ partFilter: 'filter', partDrive: 'drive', partNoise: 'noise', partInsert: 'insert' }[k]), k);
  await p.waitForTimeout(200); out[v] = await p.evaluate(() => window.__level());
}
await p.evaluate(() => { const h = OrganismFactory.handle(window.__wb); h.view.emit('config_change', { key: 'partFilter', value: 'filter-ladder' }); h.view.emit('config_change', { key: 'partDrive', value: 'own' }); });
await p.evaluate(() => document.querySelectorAll('.fb-swap')[0].click()); await p.waitForTimeout(300); await p.screenshot({ path: OUT('wobble-mutate-swap.png') });
await p.keyboard.press('Escape').catch(() => {}); await p.evaluate(() => document.querySelectorAll('.cm, .ctx-menu, .context-menu').forEach(e => e.remove()));
// mutate three times: throw, throw, keep
const muts = [];
for (let i = 0; i < 3; i++) {
  await p.evaluate(() => document.querySelector('.fm-go').click()); await p.waitForTimeout(400);
  await p.evaluate(async () => { const P = OrganismFactory.handle(window.__wb).ctx.parts; for (const s of P.sockets) await P.ready(s); });
  const lv = await p.evaluate(() => window.__level());
  muts.push({ line: await p.evaluate(() => document.querySelector('.fm-line').textContent), level: lv });
  if (i === 2) await p.screenshot({ path: OUT('wobble-mutate-mutated.png') });
  await p.evaluate((i) => document.querySelector(i < 2 ? '.fm-throw' : '.fm-keep').click(), i); await p.waitForTimeout(200);
}
console.log(JSON.stringify(out, null, 0)); muts.forEach(m => console.log('MUT', JSON.stringify(m)));
console.log('learned', await p.evaluate(() => JSON.stringify(FieldBoard.learned('eravos.wobble-bass'))).then(s => s.slice(0, 400)));
console.log('built', JSON.stringify(await p.evaluate(() => OrganismFactory.handle(window.__wb).ctx.parts.built)), 'errors', errs.slice(0, 8));
await b.close();

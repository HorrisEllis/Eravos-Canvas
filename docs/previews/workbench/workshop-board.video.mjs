// node docs/previews/workbench/workshop-board.video.mjs [out.mp4] — a note exploded on the Workshop's BOARD, as a VIDEO (his words, 2026-11-20:
// "Love that. Now the exploded view. Of the notes. Agnostic"). The real canvas: a Timeline clip's note open in the Workshop; BOARD: every layer
// flies out of its row in LAYERS into its gate, the core blooms, the wires draw in; then a field edited on the board; the board panned and zoomed.
// Each frame is the animations seeked to that moment (30 fps). Frames → ffmpeg → mp4.
import { chromium } from '../../../host/driver/glass.js'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = process.argv[2] || path.join(ROOT, 'docs/previews/workbench/workshop-board.mp4');
const DIR = fs.mkdtempSync(path.join(process.env.FRAMES_DIR || os.tmpdir(), 'wb-')); let n = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__tl = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1250, h: 560 }); });
await p.waitForTimeout(800);
await p.evaluate(async () => { const id = window.__tl, pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl), sleep = (ms) => new Promise(r => setTimeout(r, ms));
  pub('lane_add', { kind: 'inst', name: 'Lead' }); await sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [0, 3, 7, 10, 12, 10, 7, 3].map((x, i) => ({ s: i * 4, l: 4, n: 57 + x, v: 0.8 })) }); await sleep(100);
  const H = OrganismFactory.handle(id); H.view.openClip(H.ctx.internals.clips.find(c => c.kind === 'notes').id); await sleep(300);
  window.ERAVOS_NO_MOTION = true; H.view.roll.openWorkshop(2); await sleep(300); window.ERAVOS_NO_MOTION = false; });
const shot = async () => { const f = path.join(DIR, String(n++).padStart(5, '0') + '.png'); await p.screenshot({ path: f }); return f; };
const hold = async (frames) => { const f = await shot(); for (let i = 1; i < frames; i++) fs.copyFileSync(f, path.join(DIR, String(n++).padStart(5, '0') + '.png')); };
const step = async (ms) => { for (let t = 0; t <= ms; t += 1000 / 30) { await p.evaluate((t) => document.getAnimations().forEach(a => { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.currentTime = t; } catch (e) {} }), t); await shot(); } };
const land = () => p.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { a.play(); } }));
await hold(30);
// BOARD: the note exploded
await p.evaluate(() => { [...document.querySelectorAll('.ws-vph .ws-chip')].find(c => c.textContent === 'BOARD').click(); document.getAnimations().forEach(a => a.pause()); });
await step(2600); await land(); await p.waitForTimeout(200); await hold(30);
// edit on the board: the pitch layer's value, and the chord's strum direction
await p.evaluate(() => { const g = [...document.querySelectorAll('.ws-gate')].find(x => /PITCH/.test(x.querySelector('.ws-glab').textContent)); const inp = g && g.querySelector('.ws-num'); if (inp) { inp.value = String(+inp.value + 5); inp.dispatchEvent(new Event('change')); } });
await p.waitForTimeout(200); await hold(24);
// move around the board: zoom in toward the core, then drag across
for (let i = 0; i < 10; i++) { await p.evaluate(() => { const c = document.querySelector('.ws-bcore').getBoundingClientRect(), brd = document.querySelector('.ws-board'); brd.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -60, clientX: c.left + c.width / 2, clientY: c.top + c.height / 2 })); }); await shot(); }
for (let i = 0; i < 20; i++) { await p.evaluate((i) => { const brd = document.querySelector('.ws-board'), r = brd.getBoundingClientRect(), x = r.left + 30, y = r.top + 30;
  if (i === 0) brd.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: x, clientY: y, pointerId: 7 }));
  brd.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x + i * 18, clientY: y + i * 4, pointerId: 7 })); }, i); await shot(); }
await p.evaluate(() => document.querySelector('.ws-board').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 }))); await hold(30);
console.log('frames', n, 'errors', errs); await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(DIR, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', OUT]);
fs.rmSync(DIR, { recursive: true, force: true }); console.log('wrote', path.relative(ROOT, OUT), (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB');

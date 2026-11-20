// node docs/previews/workbench/field-transition.video.mjs [out.mp4] — the Field opening and closing, as a VIDEO (his words, 2026-11-20: "What about
// animated transition for the dynamic canvas changing. Like opening the field dynamically changes the ui. Animated and beautiful."). The real
// canvas: Wobble Bass among other tools; FieldBoard.explode → the board; then put back together. Every motion is a Web Animation, so each frame
// is the animation SEEKED to that moment (30 fps) — what the video shows is exactly what plays live. Frames → ffmpeg → mp4.
import { chromium } from '../../../host/driver/glass.js'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = process.argv[2] || path.join(ROOT, 'docs/previews/workbench/field-transition.mp4');
const DIR = fs.mkdtempSync(path.join(process.env.FRAMES_DIR || os.tmpdir(), 'ft-')); let n = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__wb = OrganismFactory.spawn('eravos.wobble-bass', { x: 520, y: 40 });
  ['eravos.chord-gen', 'eravos.groove-gen', 'eravos.fx-echo', 'eravos.xy-pad'].forEach((id, i) => OrganismFactory.spawn(id, { x: i < 2 ? 20 : 1700, y: 40 + (i % 2) * 470 })); });
await p.waitForTimeout(1200);
await p.evaluate(() => { CanvasWM.place(window.__wb, { w: 1100, h: 840 }); CanvasWM.fitAll(); }); await p.waitForTimeout(600);
const shot = async () => { const f = path.join(DIR, String(n++).padStart(5, '0') + '.png'); await p.screenshot({ path: f }); return f; };
const hold = async (frames) => { const f = await shot(); for (let i = 1; i < frames; i++) fs.copyFileSync(f, path.join(DIR, String(n++).padStart(5, '0') + '.png')); };
const step = async (ms) => { for (let t = 0; t <= ms; t += 1000 / 30) { await p.evaluate((t) => document.getAnimations().forEach(a => { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.currentTime = t; } catch (e) {} }), t); await shot(); } };
await hold(36);
// open the Field
await p.evaluate(() => { window.__r = FieldBoard.explode(window.__wb, 'eravos.wobble-bass'); document.getAnimations().forEach(a => a.pause()); });
await step(3700);
await p.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { a.play(); } }));   // land what was stepped (play() would restart a finished one) await p.waitForTimeout(400);
await hold(45);
// put it back together
await p.evaluate(() => { window.__back = FieldBoard.assemble(window.__wb); document.getAnimations().forEach(a => a.pause()); });
await step(2100);
await p.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { a.play(); } }));   // land what was stepped (play() would restart a finished one) await p.waitForFunction(() => !FieldBoard.isOpen(window.__wb), null, { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(300); await hold(30);
console.log('frames', n, 'errors', errs); await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(DIR, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', OUT]);
fs.rmSync(DIR, { recursive: true, force: true }); console.log('wrote', path.relative(ROOT, OUT), (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB');

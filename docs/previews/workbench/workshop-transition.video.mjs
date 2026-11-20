// node docs/previews/workbench/workshop-transition.video.mjs [out.mp4] — the Workshop opening and closing with the Field's motion, as a VIDEO
// (his words, 2026-11-20: "I like that. But do that with the workshop as well. It's supposed to be the same thing"). The real canvas: the Timeline
// with a clip open in its piano roll, Wobble Bass beside it; a note pressed, ✎ the Workshop opens out of it; then Esc, and it flies home into it.
// Every motion is a Web Animation, each frame seeked to its moment (30 fps). Frames → ffmpeg → mp4.
import { chromium } from '../../../host/driver/glass.js'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = process.argv[2] || path.join(ROOT, 'docs/previews/workbench/workshop-transition.mp4');
const DIR = fs.mkdtempSync(path.join(process.env.FRAMES_DIR || os.tmpdir(), 'wt-')); let n = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__tl = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1250, h: 560 }); OrganismFactory.spawn('eravos.wobble-bass', { x: 1300, y: 20 }); });
await p.waitForTimeout(900);
await p.evaluate(async () => { const id = window.__tl, pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl), sleep = (ms) => new Promise(r => setTimeout(r, ms));
  pub('lane_add', { kind: 'inst', name: 'Lead' }); await sleep(80);
  pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [0, 3, 7, 10, 12, 10, 7, 3].map((x, i) => ({ s: i * 4, l: 4, n: 57 + x, v: 0.8 })) }); await sleep(100);
  const H = OrganismFactory.handle(id); H.view.openClip(H.ctx.internals.clips.find(c => c.kind === 'notes').id); await sleep(300); CanvasWM.fitAll(); });
await p.waitForTimeout(700);
const shot = async () => { const f = path.join(DIR, String(n++).padStart(5, '0') + '.png'); await p.screenshot({ path: f }); return f; };
const hold = async (frames) => { const f = await shot(); for (let i = 1; i < frames; i++) fs.copyFileSync(f, path.join(DIR, String(n++).padStart(5, '0') + '.png')); };
const seekAll = (t) => p.evaluate((t) => document.getAnimations().forEach(a => { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.currentTime = t; } catch (e) {} }), t);
const step = async (ms) => { for (let t = 0; t <= ms; t += 1000 / 30) { await seekAll(t); await shot(); } };
const land = () => p.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { a.play(); } }));
await hold(36);
// he presses a note in the roll (the motion remembers where), and the Workshop opens out of it. The press lands on a mark over the note, so
// nothing in the roll reacts to the recording's own click
await p.evaluate(() => { const roll = OrganismFactory.handle(window.__tl).view.roll, cv = (roll.el || document).querySelector('canvas'), r = cv.getBoundingClientRect();
  const m = document.createElement('div'); m.style.cssText = `position:fixed;left:${r.left + r.width * 0.32}px;top:${r.top + r.height * 0.42}px;width:46px;height:12px;z-index:999999`;
  document.body.appendChild(m); m.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.32 + 20, clientY: r.top + r.height * 0.42 + 6 })); m.remove(); });
const opened = await p.evaluate(() => { OrganismFactory.handle(window.__tl).view.roll.openWorkshop(2); document.getAnimations().forEach(a => a.pause()); return !!document.querySelector('.ws-app'); });
if (!opened) throw new Error('the Workshop did not open');
await step(2300); await land(); await p.waitForTimeout(300);
await hold(45);
// Esc: it flies home into the note, the canvas comes back
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); document.getAnimations().forEach(a => a.pause()); });
await step(1700); await land(); await p.waitForTimeout(400); await hold(30);
console.log('frames', n, 'errors', errs); await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(DIR, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', OUT]);
fs.rmSync(DIR, { recursive: true, force: true }); console.log('wrote', path.relative(ROOT, OUT), (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB');

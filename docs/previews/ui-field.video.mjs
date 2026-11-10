// node docs/previews/ui-field.video.mjs [out.mp4] — the UI field as a VIDEO (his words, 2026-11-10: "I need like a video or something. It's just
// a static still"): the real Swarm Oscillator re-formed by the constraint field as its mode changes free → coupled → harmonic → chaotic → free,
// every glide stepped frame by frame (30 fps), the UI DAG beside it. Frames to a scratch folder, then ffmpeg → mp4.
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = process.argv[2] || path.join(ROOT, 'docs/previews/ui-field.mp4');
const DIR = fs.mkdtempSync(path.join(process.env.FRAMES_DIR || os.tmpdir(), 'uf-')); let n = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 0.7 }; CanvasWM.applyView();
  window.__sw = OrganismFactory.spawn('eravos.swarm-oscillator', { x: 20, y: 20 }); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(600);
await p.evaluate(fs.readFileSync(path.join(ROOT, 'docs/previews/ui-field.preview.js'), 'utf8'));
await p.evaluate(() => { const w0 = CanvasWM.windowOf(window.__sw); w0.style.height = '815px'; w0.style.maxHeight = 'none'; w0.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (/auto|scroll|hidden/.test(cs.overflowY)) { e.style.overflow = 'visible'; e.style.maxHeight = 'none'; } }); });
const shot = async () => { const f = path.join(DIR, String(n++).padStart(5, '0') + '.png'); await p.screenshot({ path: f }); return f; };
const hold = async (frames) => { const f = await shot(); for (let i = 1; i < frames; i++) fs.copyFileSync(f, path.join(DIR, String(n++).padStart(5, '0') + '.png')); };
const go = async (mode) => {
  await p.evaluate((mode) => { Kernel.bus.publish('ui:config_change:' + window.__sw, { key: 'mode', value: mode }); window.__uiField({ mode, shape: 'saw', manual: true }); window.__uiDag(500, 70, 920, 810, { mode, shape: 'saw' }); }, mode);
  for (let i = 1; i <= 24; i++) { await p.evaluate((u) => window.__ufStep(u), i / 24); await shot(); }
};
await p.evaluate(() => { window.__uiField({ mode: 'free', shape: 'saw', manual: true }); window.__ufStep(1); window.__uiDag(500, 70, 920, 810, { mode: 'free', shape: 'saw' }); });
await p.evaluate(() => Kernel.bus.publish('ui:config_change:' + window.__sw, { key: 'mode', value: 'free' }));
await hold(45);
for (const m of ['coupled', 'harmonic', 'chaotic', 'free']) { await go(m); await hold(45); }
await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(DIR, '%05d.png'), '-vf', 'scale=1440:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', OUT]);
fs.rmSync(DIR, { recursive: true, force: true }); console.log('ok', OUT, n + ' frames');

// node docs/previews/swarm-life.shots.mjs — Swarm 1.1 shown (3.145): the window with More depth ▸ LIFE open, playing Breathing Swarm;
// 8 s held-chord renders of the Living presets beside Supersaw (WAV); the coherence over 8 s with and without Restless
// → docs/previews/swarm-life.png, swarm-life-coherence.png; the clips to $AUDIO_OUT (keep them out of the repo)
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const AUD = process.env.AUDIO_OUT || OUT + '/audio'; fs.mkdirSync(AUD, { recursive: true });   // the clips are for listening, never shipped (no toys: no recordings in the repo)
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1300, height: 1400 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
// 1. the window, More depth open, a chord sounding on Breathing Swarm
await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const id = OrganismFactory.spawn('eravos.swarm-oscillator', { x: 20, y: 20 }), c = OrganismFactory.handle(id).ctx; c.presets.load('Breathing Swarm'); await c.internals.ready;
  const w = CanvasWM.windowOf(id); [...w.querySelectorAll('button')].find(x => /More depth/.test(x.textContent)).click();
  [48, 55, 60, 64].forEach(n => c.internals.on(n, 0.8, c.ac.currentTime + 0.05, 20)); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(2500);
const box = await p.evaluate(() => { const r = document.querySelector('.wm-win').getBoundingClientRect(); return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 }; });
await p.screenshot({ path: OUT + '/swarm-life.png', clip: box });
const box2 = await p.evaluate(() => { const life = [...document.querySelectorAll('.uk-group-title')].find(t => t.textContent === 'LIFE').closest('.uk-group').parentElement;
  // open the window to its full height (it scrolls inside) so the whole depth panel is on screen
  let e = life; while (e && !e.classList.contains('wm-win')) { e.style.maxHeight = 'none'; e.style.overflow = 'visible'; e = e.parentElement; } if (e) { e.style.height = 'auto'; e.style.maxHeight = 'none'; e.style.overflow = 'visible'; }
  window.scrollTo(0, 0); const r = life.getBoundingClientRect(); return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 }; });
console.log('depth box', JSON.stringify(box2));
await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/swarm-life-depth.png', clip: box2 });
// 2. renders: 8 s, a held chord (and one note for the coherence)
const wav = (ch, sr) => { const n = ch[0].length, buf = Buffer.alloc(44 + n * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(ch[c][i] * 32767))), 44 + i * 4 + c * 2); return buf; };
const render = (tool, preset, notes, sec) => p.evaluate(async ([tool, preset, notes, sec]) => {
  const sr = 44100, ctx = new OfflineAudioContext(2, sec * sr, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
  const a = OrganismFactory.spawn(tool, { K, headless: true }), c = OrganismFactory.handle(a).ctx; c.presets.load(preset); if (c.internals && c.internals.ready) await c.internals.ready;
  K.audio.chain.out.gain.value = 0; const ps = K.audio.ports(a), au = ps.find(x => x.kind === 'audio' && x.direction === 'out'), cp = ps.find(x => x.kind === 'mod' && x.label === 'coherence');
  au.node.connect(ctx.destination); let co = null; if (cp) { co = ctx.createAnalyser(); }
  notes.forEach(n => (c.internals && c.internals.on) ? c.internals.on(n, 0.85, 0.05, sec - 1.2) : K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.85, time: 0.05, duration: sec - 1.2 }));
  const bf = await ctx.startRendering(); const L = bf.getChannelData(0), R = bf.getChannelData(1); let pk = 0; for (const x of L) pk = Math.max(pk, Math.abs(x)); for (const x of R) pk = Math.max(pk, Math.abs(x));
  const g = pk > 0 ? 0.7 / pk : 1; return [Array.from(L, x => x * g), Array.from(R, x => x * g)]; }, [tool, preset, notes, sec]);
const chord = [48, 55, 60, 64];
const clips = [['eravos.supersaw', 'EDM Pad · Trance Supersaw Pad', 'supersaw-trance-pad'], ['eravos.swarm-oscillator', 'Locked Unison', 'swarm-old-locked-unison'],
  ['eravos.swarm-oscillator', 'Breathing Swarm', 'swarm-living-breathing'], ['eravos.swarm-oscillator', 'Blooming Chord', 'swarm-living-blooming-chord'],
  ['eravos.swarm-oscillator', 'Metal Swarm', 'swarm-living-metal'], ['eravos.swarm-oscillator', 'Growl Cloud', 'swarm-living-growl-cloud'],
  ['eravos.swarm-oscillator', 'Tide Lock', 'swarm-living-tide-lock'], ['eravos.swarm-oscillator', 'Shatter Bloom', 'swarm-living-shatter-bloom']];
for (const [t, pr, f] of clips) { try { const ch = await render(t, pr, f.includes('growl') ? [36, 43] : chord, 8); fs.writeFileSync(`${AUD}/${f}.wav`, wav(ch, 44100)); console.log('wav', f); } catch (e) { console.log('FAIL', f, e.message); } }
// 3. the coherence over 8 s: the same settings, Restless off vs on (one note)
const coh = await p.evaluate(async () => { const out = [];
  for (const restless of [0, 0.7]) { const sr = 22050, sec = 8, ctx = new OfflineAudioContext(1, sec * sr, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.swarm-oscillator', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries({ mode: 'coupled', voices: 12, spread: 0.5, coupling: 0.9, pull: 0.4, drift: 0.1, sustain: 1, restless }).forEach(([k, v]) => c.params.set(k, v)); await c.internals.ready; K.audio.chain.out.gain.value = 0;
    K.audio.ports(a).find(x => x.kind === 'mod' && x.label === 'coherence').node.connect(ctx.destination); c.internals.on(57, 0.9, 0.02, sec - 0.3);
    const d = (await ctx.startRendering()).getChannelData(0), pts = []; for (let i = 0; i < d.length; i += 220) pts.push(d[i]); out.push(pts); }
  return out; });
const q = await b.newPage({ viewport: { width: 600, height: 180 }, deviceScaleFactor: 2 }); await q.goto('about:blank');
await q.evaluate((out) => {
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 360; const g = cv.getContext('2d'); g.fillStyle = '#050507'; g.fillRect(0, 0, 1200, 360);
  g.font = '15px ui-monospace, monospace'; g.fillStyle = '#8f8f99'; g.fillText('COHERENCE over 8 s — one held note, coupling 0.9', 20, 28); g.fillText('1 = one locked wave', 1000, 62); g.fillText('0 = a cloud', 1000, 330);
  g.strokeStyle = '#222228'; for (let s = 0; s <= 8; s++) { const x = 40 + s * 140; g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 330); g.stroke(); g.fillText(s + ' s', x - 8, 350); }
  const draw = (pts, col, lab, ly) => { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); pts.forEach((v, i) => { const x = 40 + i / pts.length * 1120, y = 330 - v * 270; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.fillStyle = col; g.fillText(lab, 60, ly); };
  draw(out[0], '#6f6f7a', 'Restless off — locks once and stays', 290); draw(out[1], '#c7b0ff', 'Restless 0.7 — bursts apart and is drawn back, again and again', 312);
  document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:180px'; }, coh);
await q.screenshot({ path: OUT + '/swarm-life-coherence.png', clip: { x: 0, y: 0, width: 600, height: 180 } });
await b.close(); console.log('ok');

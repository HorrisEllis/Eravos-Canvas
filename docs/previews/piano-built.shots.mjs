// node docs/previews/piano-built.shots.mjs [outDir] — the built Piano (3.182) in the real canvas → docs/previews/piano-built.png; and a short
// phrase on four factory presets, rendered offline → <outDir>/piano-<preset>.wav (outDir: where to put the sound, default the scratch dir given)
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = process.argv[2] || path.join(ROOT, 'docs/previews');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.OrganismFactory && OrganismFactory.def('eravos.piano'), null, { timeout: 90000 });
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const a = OrganismFactory.spawn('eravos.piano', { at: [20, 20] }); const c = OrganismFactory.handle(a).ctx; c.params.set('model', 'tine');
  return a; });
await p.waitForTimeout(1500);   // the window settles first (its keyboard drawn), then the chord
await p.evaluate((a) => { const c = OrganismFactory.handle(a).ctx; [57, 60, 64, 67].forEach((n, i) => c.internals.noteOn(n, 0.8, c.ac.currentTime + i * 0.05, 1.5)); }, id);
await p.waitForTimeout(700);
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: path.join(ROOT, 'docs/previews/piano-built.png') }); console.log('shot piano-built.png');
const wavs = await p.evaluate(async () => {
  const phrase = [[57, 0, 0.9], [60, 0, 0.9], [64, 0, 0.9], [67, 0, 0.9], [55, 1, 0.9], [59, 1, 0.9], [62, 1, 0.9], [65, 1, 0.9], [53, 2, 1.6], [57, 2, 1.6], [60, 2, 1.6], [64, 2, 1.6], [72, 2.5, 0.3], [74, 2.8, 0.3], [76, 3.1, 0.9]];
  const out = {};
  for (const name of ['Lo-fi Keys', 'Tine Classic', 'Felt Lullaby', 'Concert Grand']) {
    const sr = 44100, sec = 5.5, ctx = new OfflineAudioContext(2, sr * sec, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 82 }).boot();
    const a = OrganismFactory.spawn('eravos.piano', { K, headless: true }), h = OrganismFactory.handle(a), c = h.ctx;
    const pr = (OrganismFactory.def('eravos.piano').presets || {})[name]; Object.entries((pr && pr.params) || pr || {}).forEach(([k, v]) => c.params.set(k, v));
    await c.internals.ready; K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    phrase.forEach(([n, t, d]) => c.internals.noteOn(n, 0.7 + 0.2 * ((n * 7) % 3) / 2, 0.1 + t * 0.73, d));
    const bf = await ctx.startRendering(), L = bf.getChannelData(0), R = bf.getChannelData(1), N = L.length, buf = new ArrayBuffer(44 + N * 4), v = new DataView(buf);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + N * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, N * 4, true);
    let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    for (let i = 0; i < N; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); out[name] = { b64: btoa(s), peak: pk };
  }
  return out; });
for (const [name, w] of Object.entries(wavs)) { const f = path.join(OUT, 'piano-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.wav'); fs.writeFileSync(f, Buffer.from(w.b64, 'base64')); console.log('wav', f, 'peak', w.peak.toFixed(3)); }
await b.close();

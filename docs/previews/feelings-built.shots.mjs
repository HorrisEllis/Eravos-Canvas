// node docs/previews/feelings-built.shots.mjs — the built Feelings tool: a screenshot in the canvas, and one drag per feeling rendered to WAV
// (bottom-left → top-right over 8 s, the pad's whole range, let go at 8 s) — docs/previews/feelings-{love,anger,sadness}.wav
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 980 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.waitForFunction(() => OrganismFactory.def('eravos.feelings'), null, { timeout: 30000 });
for (const f of ['love', 'anger', 'sadness']) {
  const b64 = await p.evaluate(async (feeling) => {
    const sr = 44100, sec = 11, ctx = new OfflineAudioContext(2, sec * sr, sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.feelings', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    c.params.set('feeling', feeling); c.params.set('x', 0.05); c.params.set('y', 0.05);
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    c.touch(true, 0.2);
    for (let i = 1; i <= 40; i++) { const t = 0.2 + i * 0.2; ctx.suspend(t).then(() => { const k = i / 40; c.params.set('x', 0.05 + 0.9 * k); c.params.set('y', 0.05 + 0.9 * k + 0.08 * Math.sin(k * 9)); ctx.resume(); }); }
    ctx.suspend(8.4).then(() => { c.touch(false); ctx.resume(); });
    const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    const ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);
  }, f);
  fs.writeFileSync(`${OUT}/feelings-${f}.wav`, Buffer.from(b64, 'base64'));
}
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const id = OrganismFactory.spawn('eravos.feelings', { x: 20, y: 20 }); const c = OrganismFactory.handle(id).ctx; c.params.set('feeling', 'sadness'); return id; });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(800);
await p.evaluate((id) => { const r = CanvasWM.windowOf(id).querySelector('canvas[data-pad]'), box = r.getBoundingClientRect(), at = (x, y) => ({ clientX: box.left + x * box.width, clientY: box.top + y * box.height, pointerId: 1, bubbles: true });
  r.dispatchEvent(new PointerEvent('pointerdown', at(0.25, 0.8))); window.__mv = (x, y) => r.dispatchEvent(new PointerEvent('pointermove', at(x, y))); }, id);
for (let i = 0; i <= 50; i++) { const k = i / 50; await p.evaluate(([x, y]) => window.__mv(x, y), [0.25 + 0.45 * k + 0.05 * Math.sin(k * 7), 0.8 - 0.5 * k]); await p.waitForTimeout(20); }
await p.waitForTimeout(150);
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: `${OUT}/feelings-built.png` });
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '').slice(0, 90)))));
await b.close(); console.log('ok');

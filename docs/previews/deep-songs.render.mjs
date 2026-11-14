// node docs/previews/deep-songs.render.mjs <out dir> [genre…] — each deep song (data/deep-songbook.js) rendered whole, offline, through the
// same path the tests play it (the Timeline's ticks into the real tools), encoded MP3 96 kbps with the app's own lamejs. For listening.
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = process.argv[2], ONLY = process.argv.slice(3);
const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/tests/run.html?auto=0'); await p.waitForFunction(() => window.Recipes && window.DeepSongbook && window.TH && window.lamejs, null, { timeout: 60000 });
const list = await p.evaluate(() => Songbook.all({ same: true }).filter(s => DeepSongbook.genres.includes(s.genre)).map(s => ({ genre: s.genre, seed: s.seed, title: s.title })));
for (const s of list.filter(x => !ONLY.length || ONLY.includes(x.genre))) {
  const t0 = Date.now();
  const r = await p.evaluate(async (s) => {
    const rec = Recipes.get('eravos.recipe.engine.' + s.genre); rec._pinned = s.seed;
    const st = SongEngine.generate(s.genre, s.seed), bpm = st.find(x => x.op === 'bpm').bpm, barSec = 240 / bpm, G = SongEngine.genres().find(g => g.id === s.genre), bars = G.form.reduce((a, x) => a + x.bars, 0);
    const U = TH.universe(0.3 + barSec * bars + 3, { bpm }), n0 = U.K.faults.list().length; await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    const sd = barSec / 16; for (let k = 0; k < bars * 16; k++) { const t = 0.2 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(k, k + 1, t); U.ctx.resume(); }); }
    const buf = await TH.render(U), L = buf.getChannelData(0), R = buf.getChannelData(1); let pk = 0, e = 0, clip = 0; for (let i = 0; i < L.length; i++) { const m = Math.max(Math.abs(L[i]), Math.abs(R[i])); pk = Math.max(pk, m); e += L[i] * L[i]; if (m > 0.98) clip++; }
    const enc = new lamejs.Mp3Encoder(2, buf.sampleRate, 96), q = (a) => { const o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.max(-32768, Math.min(32767, Math.round(a[i] * 32767))); return o; }, l = q(L), rr = q(R), parts = [];
    for (let i = 0; i < l.length; i += 1152) { const d = enc.encodeBuffer(l.subarray(i, i + 1152), rr.subarray(i, i + 1152)); if (d.length) parts.push(d); } parts.push(enc.flush());
    const all = new Uint8Array(parts.reduce((a, x) => a + x.length, 0)); let o = 0; parts.forEach(x => { all.set(x, o); o += x.length; });
    let bin = ''; for (let i = 0; i < all.length; i += 0x8000) bin += String.fromCharCode.apply(null, all.subarray(i, i + 0x8000));
    return { b64: btoa(bin), sec: Math.round(buf.length / buf.sampleRate), bpm, peak: pk, clip: 100 * clip / L.length, rms: 20 * Math.log10(Math.sqrt(e / L.length)), faults: U.K.faults.list().slice(n0).map(f => f.message).slice(0, 3) };
  }, s);
  const name = s.title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.mp3'; fs.writeFileSync(path.join(OUT, name), Buffer.from(r.b64, 'base64'));
  console.log(`${name}  ${r.sec}s @${r.bpm} BPM  rms ${r.rms.toFixed(1)} dB  peak ${r.peak.toFixed(2)}  clipped ${r.clip.toFixed(3)} %  ${r.faults.length ? 'FAULTS ' + r.faults.join(' | ') : 'no fault'}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await b.close();

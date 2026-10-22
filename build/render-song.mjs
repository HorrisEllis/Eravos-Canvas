#!/usr/bin/env node
/* render-song — node build/render-song.mjs <song.eravos.json> [out.wav] [--solo instanceId,…] [--json]
 * Renders a saved song offline in the real canvas (Clear Glass's driver) and measures it per section, from the timeline's
 * markers: loudness (RMS dBFS), peak (dBFS, clipping = ≥ −0.1), low end (energy under 100 Hz, share of the total), air
 * (energy over 6 kHz, share), and the spectral centre (Hz) — where a part sits in pitch. --solo keeps only those instances'
 * outputs (one part alone). Nothing is written to the song. Map: eravos.phase52-map P52.1.
 * Made for his song "For Her · Festival #1203" (2026-10-22): "the pad (yellow) is to high pitched ... need more bass ... make it
 * bun dem, at around 45 seconds ... also make sure it's crstal clear". */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from '../host/driver/glass.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), file = args[0], out = args[1] && !args[1].startsWith('--') ? args[1] : null;
const soloArg = (args.find(a => a.startsWith('--solo=')) || '').slice(7), asJson = args.includes('--json');
const fromBar = +((args.find(a => a.startsWith('--from=')) || '--from=1').slice(7)), toBar = +((args.find(a => a.startsWith('--to=')) || '--to=0').slice(5));
if (!file) { console.error('usage: render-song.mjs <song.eravos.json> [out.wav] [--solo=id,id] [--from=bar] [--to=bar] [--json]'); process.exit(1); }
const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=4096'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/tests/run.html?auto=0');
await p.waitForFunction(() => window.Workspace && window.OrganismFactory && window.MasterTransport, null, { timeout: 30000 });
const r = await p.evaluate(async ({ snap, solo, fromBar, toBar, wantWav }) => {
  const sess = snap.organisms.find(o => o.id === 'eravos.session'), bpm = (sess && sess.state.params.bpm) || 120;
  const tl = snap.organisms.find(o => o.id === 'eravos.timeline'), ex = tl && tl.state.extra;
  const lastBar = toBar || Math.ceil(Math.max(...ex.clips.map(c => c.startBar + (c.bars || (c.lengthSec || 0) / (240 / bpm))))) - 1;
  const sr = 44100, barSec = 240 / bpm, sec = (lastBar - fromBar + 1) * barSec + 2;
  const ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
  const K = Kernel.create({ ctx, quiet: true, syncIR: true }); const T = MasterTransport.create(K, { offline: true, bpm }); T.boot();
  Workspace.boot(K, { interval: 0, headless: true });
  const map = await Workspace.restore(JSON.parse(JSON.stringify(snap)));
  if (!map) return { err: 'restore failed', faults: K.faults.list().map(f => f.message).slice(0, 8) };
  await new Promise(res => setTimeout(res, 400));   // decoded assets, async preset loads
  if (solo.length) {
    const keep = new Set(solo.map(s => map[s] || s));
    K.registry.list().forEach(rec => { if (keep.has(rec.instance_id)) return; (K.audio.ports(rec.instance_id) || []).forEach(pt => { if (pt.kind === 'audio' && pt.direction === 'out') { try { pt.node.disconnect(); } catch (e) {} } }); });
  }
  T.renderTicks((fromBar - 1) * 16, lastBar * 16, 0.05);
  const buf = await ctx.startRendering();
  // measures per section (markers), on a mono sum
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) / 2;
  const lp = (x, f) => { const a = 1 - Math.exp(-2 * Math.PI * f / sr), y = new Float32Array(x.length); let s = 0; for (let i = 0; i < x.length; i++) { s += a * (x[i] - s); y[i] = s; } return y; };
  const low = lp(mono, 100), notHigh = lp(mono, 6000);
  const db = (x) => x > 0 ? +(10 * Math.log10(x)).toFixed(1) : -120;
  const marks = (ex.markers || []).slice().sort((a, b) => a.bar - b.bar).filter(m => m.bar >= fromBar && m.bar <= lastBar);
  if (!marks.length || marks[0].bar > fromBar) marks.unshift({ bar: fromBar, name: 'start' });
  const secs = marks.map((m, i) => ({ name: m.name, from: m.bar, to: (marks[i + 1] ? marks[i + 1].bar : lastBar + 1) }));
  const zc = (a, b) => { let c = 0; for (let i = a + 1; i < b; i++) if ((mono[i - 1] < 0) !== (mono[i] < 0)) c++; return c; };
  const rows = secs.map(s => {
    const a = Math.floor((s.from - fromBar) * barSec * sr), e = Math.min(n, Math.floor((s.to - fromBar) * barSec * sr));
    let tot = 0, lo = 0, hi = 0, pk = 0;
    for (let i = a; i < e; i++) { const x = mono[i]; tot += x * x; lo += low[i] * low[i]; const h = x - notHigh[i]; hi += h * h; const q = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (q > pk) pk = q; }
    const len = Math.max(1, e - a);
    return { section: s.name, bars: `${s.from}–${s.to - 1}`, seconds: `${((s.from - 1) * barSec).toFixed(1)}–${((s.to - 1) * barSec).toFixed(1)}`,
      rms: db(tot / len), peak: db(pk * pk), lowShare: +(lo / Math.max(tot, 1e-12)).toFixed(2), airShare: +(hi / Math.max(tot, 1e-12)).toFixed(3), centreHz: Math.round(zc(a, e) / 2 / (len / sr)) };
  });
  let wav = null;
  if (wantWav) { const w = new Uint8Array(AudioRecorder.encodeWAV(buf, 16)); let s = ''; for (let i = 0; i < w.length; i += 0x8000) s += String.fromCharCode.apply(null, w.subarray(i, i + 0x8000)); wav = btoa(s); }
  return { bpm, bars: `${fromBar}–${lastBar}`, rows, wav, faults: K.faults.list().map(f => f.fault_class + ' ' + f.message).slice(0, 12) };
}, { snap, solo: soloArg ? soloArg.split(',') : [], fromBar, toBar, wantWav: !!out });
await b.close();
if (r.err) { console.error(r.err, r.faults); process.exit(1); }
if (out) fs.writeFileSync(out, Buffer.from(r.wav, 'base64'));
delete r.wav;
if (asJson) console.log(JSON.stringify(r));
else {
  console.log(`${path.basename(file)} · ${r.bpm} BPM · bars ${r.bars}${soloArg ? ' · solo ' + soloArg : ''}`);
  console.log('section     bars    seconds       RMS dB  peak dB  low<100Hz  air>6k  centre Hz');
  r.rows.forEach(x => console.log(`${x.section.padEnd(11)} ${x.bars.padEnd(7)} ${x.seconds.padEnd(13)} ${String(x.rms).padStart(6)}  ${String(x.peak).padStart(7)}  ${String(x.lowShare).padStart(9)}  ${String(x.airShare).padStart(6)}  ${String(x.centreHz).padStart(9)}`));
  if (r.faults.length) console.log('faults:', r.faults.join(' | '));
}
if (errs.length) console.log('page errors:', errs.slice(0, 5).join(' | '));

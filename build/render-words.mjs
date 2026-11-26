#!/usr/bin/env node
/* render-words — node build/render-words.mjs <lyrics.txt> <out.wav> [--genre=darkwave] [--depth=0.7] [--dims=0.7] [--contrast=1] [--shape=contrast|verses]
 *   [--flow=spoken] [--seed=1] [--bars=N]
 * 3.229 (his words, 2026-11-25: "How does it sound? Like I want it deep as hell."): the song ♫ Make a song writes from the words, rendered
 * offline in the real canvas (Clear Glass's driver, its own OfflineAudioContext — nothing plays, nothing is kept) and measured per section:
 * loudness (RMS dBFS), peak (dBFS), pinned (the share of samples at the ceiling, ≥ −0.26 dB: crushed), LOW END (share of the energy under 100 Hz — how deep it sits), and the spectral centre (Hz).
 * The words are read from the file given at run time; nothing of them is written anywhere but the WAV. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from '../host/driver/glass.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), pos = args.filter(a => !a.startsWith('--')), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
if (pos.length < 2) { console.error('usage: render-words.mjs <lyrics.txt> <out.wav> [--genre=] [--depth=] [--contrast=] [--shape=] [--flow=] [--seed=] [--bars=]'); process.exit(1); }
const text = fs.readFileSync(pos[0], 'utf8'), out = pos[1];
const o = { genre: opt('genre', 'darkwave'), depth: +opt('depth', 0.7), contrast: +opt('contrast', 1), dims: +opt('dims', 0.7), tension: +opt('tension', 0.6), expr: +opt('expr', 1), piano: opt('piano', '1') !== '0', shape: opt('shape', 'contrast'), flow: opt('flow', 'spoken'), seed: +opt('seed', 1), bars: +opt('bars', 0) };
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=4096'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/tests/run.html?auto=0');
await p.waitForFunction(() => window.RhythmExpand && window.MasterTransport && window.Kernel, null, { timeout: 60000 });
const r = await p.evaluate(async ({ text, o }) => {
  const steps = RhythmExpand.generate(text, o), cfg = (steps.find(s => s.op === 'configure' && s.target === 'session') || {}).params || {}, bpm = cfg.bpm || 120;
  const marks = steps.filter(s => s.topic === 'marker_edit').map(s => s.payload), clips = steps.filter(s => s.topic === 'clip_add').map(s => s.payload);
  const end = Math.max(...clips.map(c => c.startBar + c.bars)), bars = o.bars || end - 1, SR = 32000, barSec = 240 / bpm, sec = bars * barSec + 3;
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * sec), SR), K = Kernel.create({ ctx, quiet: true, syncIR: true });
  const T = MasterTransport.create(K, { offline: true, bpm }); T.boot();
  await RhythmExpand.write(text, Object.assign({}, o, { run: { K, headless: true, clear: false } }));
  await new Promise(res => setTimeout(res, 600));
  T.bpm = bpm; T.renderTicks(0, bars * 16, 0.05);
  const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
  // per section: rms, peak, low-end share (one-pole low-pass at 100 Hz), centre (zero-crossing estimate of the high-passed signal is too rough → band energies)
  const a = Math.exp(-2 * Math.PI * 100 / SR); let lp = 0; const low = new Float32Array(n); for (let i = 0; i < n; i++) { const m = 0.5 * (L[i] + R[i]); lp = (1 - a) * m + a * lp; low[i] = lp; }
  const secs = marks.map((m, i) => ({ name: m.name, from: m.bar, to: (marks[i + 1] ? marks[i + 1].bar : end) })).filter(s => s.from <= bars);
  const meas = secs.map(s => { const i0 = Math.floor((s.from - 1) * barSec * SR), i1 = Math.min(n, Math.floor((s.to - 1) * barSec * SR)); let e = 0, el = 0, pk = 0, hot = 0;
    for (let i = i0; i < i1; i++) { const m = 0.5 * (L[i] + R[i]); e += m * m; el += low[i] * low[i]; const q = Math.max(Math.abs(L[i]), Math.abs(R[i])); pk = Math.max(pk, q); if (q >= 0.97) hot++; }
    const N = Math.max(1, i1 - i0); return { name: s.name, bars: s.to - s.from, rmsDb: +(10 * Math.log10(e / N + 1e-12)).toFixed(1), peakDb: +(20 * Math.log10(pk + 1e-12)).toFixed(1), lowShare: +(el / Math.max(1e-12, e)).toFixed(2), pinned: +(100 * hot / N).toFixed(2) }; });
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const k = pk > 0.89 ? 0.89 / pk : 1, pcm = new Int16Array(n * 2); for (let i = 0; i < n; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i] * k)) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i] * k)) * 32767; }
  let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { bpm, bars, sr: SR, seconds: +sec.toFixed(1), peak: +pk.toFixed(3), meas, pcm: btoa(bin) };
}, { text, o });
const pcm = Buffer.from(r.pcm, 'base64'), hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(r.sr, 24); hdr.writeUInt32LE(r.sr * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([hdr, pcm]));
console.log(`${o.genre} · depth ${o.depth} · dimensions ${o.dims} · ${r.bpm} BPM · ${r.bars} bars · ${r.seconds} s · peak ${r.peak} → ${out}`);
r.meas.forEach(m => console.log(`  ${m.name.padEnd(42)} ${String(m.bars).padStart(3)} bars  rms ${m.rmsDb} dB  peak ${m.peakDb} dB  low end ${Math.round(m.lowShare * 100)} %  pinned ${m.pinned} %`));
if (errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));
await b.close();

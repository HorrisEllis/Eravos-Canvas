#!/usr/bin/env node
/* Sound audit — every tool that makes or changes sound, measured the way the Destroyer was (3.77, his ask: "can you run tests like that
 * on all of them"). node build/sound-audit.mjs [--out docs/sound-audit.md] [--only id,id]
 * Runs in the test page (headless Chromium), offline renders, default settings:
 *   EFFECTS (audio in → out): a loud 50 Hz + a quiet 1 kHz → INTERMODULATION (what the bass does to the music: the blown-speaker
 *     test, dB under the 1 kHz), level change (out vs in, a −18 dBFS 220 Hz tone), DC, peak, NaN, CPU (one instance, 10 s).
 *   INSTRUMENTS (notes in → out): A1, A3 and A5 notes and a C-major chord → peak (clipping), DC, the share of energy under 20 Hz (sub
 *     you cannot hear), whether it goes quiet within 2 s of the release, NaN, CPU (a note every beat, 10 s).
 * Writes a table (worst first) and exits 0 — it reports, the tests guard (tests/p77-audit.test.js). */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const OUT = path.resolve(ROOT, arg('--out') || 'docs/sound-audit.md'), ONLY = arg('--only') ? arg('--only').split(',') : null;
const b = await chromium.launch(); const p = await b.newPage(); p.setDefaultTimeout(0);
await p.goto('file://' + ROOT + '/tests/run.html?auto=0'); await p.waitForFunction(() => window.TH && window.OrganismFactory && window.SoundAudit !== undefined || window.TH, null, { timeout: 60000 });
const rows = await p.evaluate(async (ONLY) => {
  const SR = 48000, db = (x) => 20 * Math.log10(Math.max(1e-12, x));
  const audioIn = (d) => (d.hooks || []).find(h => h.wire_type === 'audio' && h.direction === 'in');
  const audioOut = (d) => (d.hooks || []).find(h => h.wire_type === 'audio' && h.direction === 'out');
  const notesIn = (d) => (d.hooks || []).some(h => h.direction === 'in' && h.event_type === 'note:trigger');
  function stats(d, a, z) { let s = 0, m = 0, pk = 0, nan = 0; const A = Math.floor(a * SR), Z = Math.min(d.length, Math.floor(z * SR)); for (let i = A; i < Z; i++) { const x = d[i]; if (!isFinite(x)) { nan++; continue; } s += x * x; m += x; const q = x < 0 ? -x : x; if (q > pk) pk = q; } const n = Math.max(1, Z - A); return { rms: Math.sqrt(s / n), dc: m / n, pk, nan }; }
  function spec(d, at, N0) { const N = N0 || 16384, off = Math.floor(at * SR), re = new Float32Array(N), im = new Float32Array(N), w = OrganismSDK.dsp.hann(N); for (let i = 0; i < N; i++) re[i] = (d[off + i] || 0) * w[i]; OrganismSDK.dsp.fft(re, im); return { re, im, N }; }
  const mag = (S, f) => { const k = Math.round(f * S.N / SR); let m = 0; for (let j = k - 2; j <= k + 2; j++) m = Math.max(m, Math.hypot(S.re[j], S.im[j])); return m; };
  const band = (S, a, z) => { let s = 0; for (let k = Math.max(1, Math.round(a * S.N / SR)); k <= Math.round(z * S.N / SR); k++) s += S.re[k] * S.re[k] + S.im[k] * S.im[k]; return s; };
  async function rig(id, secs) {
    const U = TH.universe(secs), iid = TH.spawn(U, id), c = OrganismFactory.handle(iid).ctx; if (c.ready) { try { await Promise.race([c.ready, new Promise(r => setTimeout(r, 1500))]); } catch (e) {} }
    try { if (c.params.get('mix') !== undefined) c.params.set('mix', 1); } catch (e) {}
    const out = U.K.audio.port(iid, 'out') || (U.K.audio.ports(iid) || []).find(x => x.kind === 'audio' && x.direction === 'out');
    U.K.audio.chain.out.disconnect(U.ctx.destination); if (out && out.node) out.node.connect(U.ctx.destination);
    const inp = U.K.audio.port(iid, 'in') || (U.K.audio.ports(iid) || []).find(x => x.kind === 'audio' && x.direction === 'in' && x.node);
    return { U, iid, c, inp };
  }
  const defs = OrganismFactory.defined().filter(d => d.domain === 'music' && !d.hidden && audioOut(d) && (!ONLY || ONLY.includes(d.id)));
  const rows = [];
  for (const d of defs) {
    const row = { id: d.id, label: d.label, kind: audioIn(d) && !notesIn(d) ? 'effect' : notesIn(d) ? 'instrument' : 'source' };
    try {
      if (row.kind === 'effect') {
        { const { U, inp } = await rig(d.id, 1.0); const ac = U.ctx, o1 = ac.createOscillator(), o2 = ac.createOscillator(), g1 = ac.createGain(), g2 = ac.createGain(); o1.frequency.value = 50; o2.frequency.value = 1000; g1.gain.value = 0.4; g2.gain.value = 0.1; o1.connect(g1); o2.connect(g2); g1.connect(inp.node); g2.connect(inp.node); o1.start(0); o2.start(0);
          const dd = (await TH.render(U)).getChannelData(0), S = spec(dd, 0.5), st = stats(dd, 0.3, 1.0), c1 = mag(S, 1000);
          row.imd = c1 > 1e-6 ? db(Math.hypot(mag(S, 950), mag(S, 1050), mag(S, 900), mag(S, 1100)) / c1) : null; row.peak = db(st.pk); row.dc = st.dc; row.nan = st.nan; }
        { const { U, inp } = await rig(d.id, 1.0); const ac = U.ctx, o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 220; g.gain.value = Math.pow(10, -18 / 20) * Math.SQRT2; o.connect(g); g.connect(inp.node); o.start(0);
          const st = stats((await TH.render(U)).getChannelData(0), 0.4, 1.0); row.gain = db(st.rms) - (-18); }
        { const { U, inp } = await rig(d.id, 10); const ac = U.ctx, o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110; o.connect(inp.node); o.start(0); const t0 = performance.now(); await TH.render(U); row.cpu = (performance.now() - t0) / 10; }
      } else {
        const play = async (notes, secs, dur) => { const { U, iid } = await rig(d.id, secs); notes.forEach(([n, t]) => U.K.bus.publish('note:trigger', { target: iid, note: n, velocity: 0.9, time: t, duration: dur })); return (await TH.render(U)).getChannelData(0); };
        const dd = await play([[33, 0.05], [57, 0.8], [81, 1.55], [60, 2.3], [64, 2.3], [67, 2.3]], 5.5, 0.6);
        const st = stats(dd, 0, 3.2), tail = stats(dd, 4.9, 5.5), S = spec(dd, 0.06, 32768);   // 0.7 Hz bins: a 27.5 Hz note does not leak under 20
        row.peak = db(st.pk); row.dc = st.dc; row.nan = st.nan + tail.nan; row.tail = db(tail.rms); row.infra = db(Math.sqrt(band(S, 1, 20) / Math.max(1e-20, band(S, 1, 20000))));
        { const { U, iid } = await rig(d.id, 10); for (let i = 0; i < 20; i++) U.K.bus.publish('note:trigger', { target: iid, note: 45 + (i % 4) * 3, velocity: 0.8, time: 0.05 + i * 0.5, duration: 0.4 }); const t0 = performance.now(); await TH.render(U); row.cpu = (performance.now() - t0) / 10; }
      }
    } catch (e) { row.error = String(e.message || e).slice(0, 120); }
    rows.push(row);
  }
  return rows;
}, ONLY);
await b.close();
// what the measurement cannot judge: tools that are meant to behave so (shown as a note, not a flag)
const BY_DESIGN = { 'eravos.clip-maker': 'records and slices — it does not pass sound through', 'eravos.breath': 'a breathing guide: it sounds continuously',
  'eravos.embodiment-lab': 'a drone: it sounds continuously', 'eravos.recursive-spectra': 'a drone: it sounds continuously',
  'eravos.fx-squash': 'upward compression (OTT) raises quiet sound — Depth and Out set it' };
// flags: what a pro would hear as wrong
const flag = (r) => { const f = []; if (BY_DESIGN[r.id]) { r.note = BY_DESIGN[r.id]; if (!r.error && !r.nan && !(r.peak > 0.5)) return f; }
  if (r.error) f.push('error: ' + r.error);
  if (r.nan) f.push('NaN in the output');
  if (r.peak !== undefined && r.peak > 0.5) f.push(`clips (peak ${r.peak.toFixed(1)} dBFS)`);
  if (r.dc !== undefined && Math.abs(r.dc) > 0.01) f.push(`DC offset ${r.dc.toFixed(3)}`);
  if (r.kind === 'effect' && r.imd !== null && r.imd !== undefined && r.imd > -20) f.push(`bass chews the music (intermodulation ${r.imd.toFixed(1)} dB)`);
  if (r.kind === 'effect' && r.gain !== undefined && Math.abs(r.gain) > 6) f.push(`level jump ${r.gain > 0 ? '+' : ''}${r.gain.toFixed(1)} dB when on`);
  if (r.kind !== 'effect' && r.infra !== undefined && r.infra > -12) f.push(`energy under 20 Hz — under hearing (${r.infra.toFixed(1)} dB of the total)`);
  if (r.kind !== 'effect' && r.tail !== undefined && r.tail > -50) f.push(`does not go quiet after release (${r.tail.toFixed(1)} dBFS)`);
  if (r.cpu !== undefined && r.cpu > 60) f.push(`heavy (${r.cpu.toFixed(0)} ms per second of sound)`);
  return f; };
rows.forEach(r => { r.flags = flag(r); });
rows.sort((a, z) => z.flags.length - a.flags.length || (z.cpu || 0) - (a.cpu || 0));
const n = (v, d = 1) => v === undefined || v === null ? '—' : v.toFixed(d);
const md = ['# Sound audit', '', `${new Date().toISOString().slice(0, 10)} · ${rows.length} tools · default settings · \`node build/sound-audit.mjs\``, '',
  `Flagged: ${rows.filter(r => r.flags.length).length}. Effects: intermodulation = a loud 50 Hz + a quiet 1 kHz, sidebands under the 1 kHz (−20 dB or lower is clean; the Destroyer was −1.6, now −49). CPU = ms of work per second of sound (one instance).`, '',
  '| Tool | Kind | Flags | IMD dB | Gain dB | Peak dBFS | <20 Hz dB | Tail dBFS | DC | CPU ms/s |', '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.label} | ${r.kind} | ${r.flags.join('; ') || (r.note ? 'ok — ' + r.note : 'ok')} | ${n(r.imd)} | ${n(r.gain)} | ${n(r.peak)} | ${n(r.infra)} | ${n(r.tail)} | ${n(r.dc, 3)} | ${n(r.cpu, 0)} |`)];
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, md.join('\n') + '\n');
console.log(`${rows.length} tools · ${rows.filter(r => r.flags.length).length} flagged → ${path.relative(ROOT, OUT)}`);
rows.filter(r => r.flags.length).forEach(r => console.log(`  ${r.label.padEnd(26)} ${r.flags.join('; ')}`));

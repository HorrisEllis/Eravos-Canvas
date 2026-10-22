#!/usr/bin/env node
/* preset-survey — node build/preset-survey.mjs [toolId,…] [--match=text] [--json]  → measures every preset of the named tools
 * Map eravos.phase52-map P52.2. James, 2026-10-22: "the presets for bun dem sound aweful same with odd couples ... make sure it's
 * crstal clear". Each preset plays the same bass phrase (A1 · E1 · G1 · D2 eighths, 140 BPM, 2 bars) offline, alone, into the master.
 * Measured: peak dBFS (clipping ≥ −0.3), RMS dBFS, crest (peak − RMS: < 6 dB = squashed flat), low (share of energy under 120 Hz:
 * the bass you feel), fizz (share over 10 kHz on a bass phrase: aliasing / harsh distortion), DC (offset), silent (nothing came out).
 * A verdict per preset names what is wrong. Nothing is changed. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from '../host/driver/glass.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const tools = (args.find(a => !a.startsWith('--')) || 'eravos.wobble-bass,eravos.reese-bass,eravos.wub-osc,eravos.wub-sub,eravos.sub-engine,eravos.bass-forge,eravos.acid-synth,eravos.dub-station').split(',');
const match = ((args.find(a => a.startsWith('--match=')) || '').slice(8)).toLowerCase(), asJson = args.includes('--json');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=4096'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/tests/run.html?auto=0');
await p.waitForFunction(() => window.OrganismFactory && window.MasterTransport && OrganismFactory.def('eravos.wobble-bass'), null, { timeout: 30000 });
const rows = [];
for (const tool of tools) {
  const names = await p.evaluate((t) => { const d = OrganismFactory.def(t); return d ? Object.keys(d.presets || {}) : null; }, tool);
  if (!names) { rows.push({ tool, preset: '—', verdict: 'not installed' }); continue; }
  for (const name of names.filter(n => !match || n.toLowerCase().includes(match))) {
    const r = await p.evaluate(async ({ tool, name }) => {
      const sr = 44100, bpm = 140, step = 60 / bpm / 2, sec = 16 * step + 1;
      const ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
      const K = Kernel.create({ ctx, quiet: true, syncIR: true }); const T = MasterTransport.create(K, { offline: true, bpm }); T.boot();
      const id = OrganismFactory.spawn(tool, { K, headless: true }); if (!id) return { err: 'did not open' };
      K.bus.publish('ui:preset_load:' + id, { name });
      const c = OrganismFactory.handle(id).ctx; if (c.ready) await c.ready;
      const notes = [33, 33, 40, 40, 31, 31, 38, 38, 33, 33, 40, 40, 31, 31, 38, 38];
      notes.forEach((n, i) => K.bus.publish('note:trigger', { target: id, note: n, velocity: 0.9, time: 0.05 + i * step, duration: step * 0.9 }));
      if (tool === 'eravos.dub-station') K.bus.publish('ui:skank:' + id, {});
      T.renderTicks(0, 32, 0.05);
      const buf = await ctx.startRendering();
      const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
      let tot = 0, pk = 0, dc = 0; const mono = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (L[i] + R[i]) / 2; mono[i] = x; tot += x * x; dc += x; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
      const lp = (f) => { const a = 1 - Math.exp(-2 * Math.PI * f / sr); let s = 0, e = 0; for (let i = 0; i < n; i++) { s += a * (mono[i] - s); e += s * s; } return e; };
      const hp = (f) => { const a = 1 - Math.exp(-2 * Math.PI * f / sr); let s = 0, e = 0; for (let i = 0; i < n; i++) { s += a * (mono[i] - s); const h = mono[i] - s; e += h * h; } return e; };
      const db = (x) => x > 0 ? +(10 * Math.log10(x)).toFixed(1) : -120;
      const rms = db(tot / n), peak = db(pk * pk);
      return { peak, rms, crest: +(peak - rms).toFixed(1), low: +(lp(120) / Math.max(tot, 1e-12)).toFixed(2), fizz: +(hp(10000) / Math.max(tot, 1e-12)).toFixed(4), dc: +(dc / n).toFixed(4),
        faults: K.faults.list().filter(f => !/permission|PORT_00/.test(f.fault_class)).map(f => f.fault_class + ' ' + f.message).slice(0, 2) };
    }, { tool, name });
    const v = [];
    if (r.err) v.push(r.err);
    else {
      if (r.rms < -60) v.push('silent');
      if (r.peak >= -0.3) v.push('CLIPS');
      if (r.crest < 6 && r.rms > -60) v.push('squashed flat');
      if (r.fizz > 0.01) v.push('fizz (harsh/aliasing)');
      if (Math.abs(r.dc) > 0.01) v.push('DC offset');
      if (r.low < 0.15 && /bass|sub|wub|reese|wobble/i.test(tool)) v.push('little low end');
    }
    rows.push(Object.assign({ tool: tool.replace('eravos.', ''), preset: name }, r, { verdict: v.join(', ') || 'clean' }));
    if (!asJson) { const x = rows[rows.length - 1]; console.log(`${x.tool.padEnd(12)} ${x.preset.slice(0, 44).padEnd(44)} pk ${String(x.peak).padStart(6)} rms ${String(x.rms).padStart(6)} crest ${String(x.crest).padStart(5)} low ${String(x.low).padStart(4)} fizz ${String(x.fizz).padStart(6)}  ${x.verdict}`); }
  }
}
await b.close();
if (asJson) console.log(JSON.stringify(rows));
const bad = rows.filter(r => r.verdict !== 'clean');
console.log(`\n${rows.length} presets · ${bad.length} with a problem`);
if (errs.length) console.log('page errors:', errs.slice(0, 3).join(' | '));

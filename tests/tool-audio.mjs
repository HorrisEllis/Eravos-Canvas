#!/usr/bin/env node
/* Every tool, every preset, measured — what we can know about a sound without ears (tests/audio-measure.js, itself checked
 * by tests/audio-measure.test.mjs). Renders each tool OFFLINE in its own universe and taps its raw output port (before its
 * mixer strip and the master), so the numbers are the tool's own, not the master limiter's.
 *
 *   node tests/tool-audio.mjs [filter] [--json out.json] [--md out.md]
 *
 * Per preset (instrument): one note → valid samples · clipping · silent · DC · pitch (octave-folded cents vs the note played)
 *   · onset latency · L/R correlation · Stop all (hard, note still held) is silent 0.45 s later · envelope movement rate.
 * Effects: a 110 Hz saw burst goes in → valid · clipping · silent · DC · Stop all.
 * Beat tools (they play from the transport): 2 bars at 128 BPM → every onset against the 16th grid (ms).
 * Verdicts: FAIL (broken: NaN, silent, clipping, Stop ignored, off the grid) · WARN (worth a look) · OK. */
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21) import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const FILTER = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--'))) || '';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir, re) => fs.readdirSync(path.join(ROOT, dir)).filter(f => re.test(f)).map(f => dir + '/' + f);
const skeleton = [...list('canvas/kernel', /\.js$/), ...list('canvas/runtime', /\.(js|css)$/), 'canvas/index.html', 'canvas/scripts.js'];
const toolDirs = fs.readdirSync(path.join(ROOT, 'tools')).filter(d => fs.existsSync(path.join(ROOT, 'tools', d, 'tools')))
  .flatMap(d => fs.readdirSync(path.join(ROOT, 'tools', d, 'tools')).filter(c => fs.statSync(path.join(ROOT, 'tools', d, 'tools', c)).isDirectory())
  .flatMap(c => fs.readdirSync(path.join(ROOT, 'tools', d, 'tools', c)).filter(t => fs.existsSync(path.join(ROOT, 'tools', d, 'tools', c, t, 'tool.json'))).map(t => `tools/${d}/tools/${c}/${t}`)));
const SOURCES = { skeleton: Object.fromEntries(skeleton.map(f => [f, read(f)])), organisms: Object.fromEntries(toolDirs.flatMap(dir => list(dir, /\.js$/).filter(f => !/\.test\.js$/.test(f))).map(f => [f, read(f)])) };
const MEASURE = read('tests/audio-measure.js');

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=4096'] });
async function page() {
  const p = await browser.newPage(); await p.addInitScript((s) => { window.__SOURCES = s; }, SOURCES);
  await p.goto('file://' + path.join(HERE, 'run.html') + '?auto=0'); await p.waitForFunction(() => window.TH && window.OrganismFactory, null, { timeout: 60000 });
  await p.addScriptTag({ content: MEASURE }); return p;
}

// ---------------------------------------------------------------- in the page: measure one tool (all presets)
async function measureTool(id) {
  const M = window.AudioMeasure, d = OrganismFactory.def(id), SR = TH.SR;
  if (!d) return { id, skip: 'not defined' };
  const hookIn = (t) => (d.hooks || []).some(h => h.direction === 'in' && String(h.event_type || '').split('|').map(s => s.trim()).includes(t));
  const plays = hookIn('note:trigger'), ticks = hookIn('transport:tick');
  const presets = Object.keys(d.presets || {}); if (!presets.length) presets.push(null);
  const DRUMS = { 'eravos.pads': [36, 37, 38, 39], 'eravos.drum-forge': [36, 37, 38, 39] }, ONESHOTS = { 'eravos.fx-box': [36, 37, 38, 39] };   // FX Box: risers / reverse swells lead in by design — no onset timing
  const CONTAINERS = { 'eravos.timeline': 'plays the other tools — measured through the 189 song renders', 'eravos.song-recorder': 'records the master — measured through the song renders' };
  const xen = /xen|ratio|spectra|embodiment/i.test(id);   // not 12-tone by design: the pitch check does not apply
  const bass = /bass|sub|wub|reese|808|wobble/i.test(id + ' ' + (d.category || ''));
  const NOTE = bass ? 45 : 57;   // A2 / A3 — in the default key (A minor) and in C major, so key-snapping cannot move it
  const out = { id, label: d.label, category: d.category, kind: null, presets: [], defaults: Object.fromEntries((d.config || []).map(c => [c.key, c.default])) };   // build/gain-stage.mjs reads the defaults
  if (CONTAINERS[id]) { out.kind = 'container'; out.skip = CONTAINERS[id]; return out; }
  const tap = (U, inst) => {   // the tool's own audio-out ports, summed, straight to the destination (master taken off)
    try { U.K.audio.chain.out.disconnect(U.ctx.destination); } catch (e) {}
    const outs = U.K.audio.ports(inst).filter(p => p.kind === 'audio' && p.direction === 'out');
    const sum = U.ctx.createGain(); outs.forEach(p => p.node.connect(sum)); sum.connect(U.ctx.destination); return outs.length;
  };
  // press Stop all when the render clock REACHES t (OfflineAudioContext.suspend) — exactly what the ■ button does live
  const stopAt = (U, t) => { U.ctx.suspend(t).then(() => { U.K.silence({ hard: true, reason: 'tool-audio' }); U.ctx.resume(); }); };
  // an effect's signal input; an instrument's FM / ring inputs (3.42 Morph Osc) and mod-slot returns are not one
  const inPort = (U, inst) => U.K.audio.ports(inst).find(p => p.kind === 'audio' && p.direction === 'in' && !/^(fm|ring|slot\.)/.test(p.port_id));
  const mixDown = (buf) => { const m = new Float32Array(buf.length); for (let c = 0; c < buf.numberOfChannels; c++) { const dd = buf.getChannelData(c); for (let i = 0; i < dd.length; i++) m[i] += dd[i] / buf.numberOfChannels; } return m; };
  const wav = (hz, secs) => { const b = new AudioBuffer({ numberOfChannels: 1, length: Math.round(secs * SR), sampleRate: SR }), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) { const t = i / SR; dd[i] = 0.5 * (2 * ((t * hz) % 1) - 1) * Math.min(1, t / 0.005, (secs - t) / 0.01); } return AudioRecorder.encodeWAV(b, 16); };
  { const U = TH.universe(0.1), inst = TH.spawn(U, id), hasOut = U.K.audio.ports(inst).some(p => p.kind === 'audio' && p.direction === 'out');
    out.kind = !hasOut ? 'silent-by-design' : DRUMS[id] ? 'drums' : ONESHOTS[id] ? 'oneshots' : id === 'eravos.bass-drop-builder' ? 'drop' : id === 'eravos.sample-player' ? 'sampler' : id === 'eravos.clip-maker' ? 'clip'
      : inPort(U, inst) ? 'effect' : plays ? 'instrument' : ticks ? 'beat' : 'other'; }
  if (out.kind === 'silent-by-design' || out.kind === 'other') return out;
  const levels = (r, buf, mono, from, to) => { const s = M.scan(buf); Object.assign(r, { nan: s.nan, clip: s.clip, peakDb: +s.peakDb.toFixed(1), rmsDb: +M.db(M.rms(mono, SR, from, to)).toFixed(1), dc: +M.mean(mono, SR, from, to).toFixed(4), corr: +M.correlation(buf, from, to).toFixed(2) }); };
  for (const name of presets) {
    const r = { preset: name }; const t0 = performance.now();
    try {
      if (out.kind === 'drums') {
        // each pad ALONE (nothing masks it): asked for at 0.1 s → its first non-zero sample = its latency; heard = level in 200 ms.
        // then all of them together for levels and Stop all.
        const lat = [], quiet = [];
        for (const n of DRUMS[id]) {
          const U = TH.universe(0.6), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (name) c.presets.load(name); if (c.ready) await c.ready; tap(U, inst);
          U.K.bus.publish('note:trigger', { target: inst, note: n, velocity: 0.9, time: 0.1, duration: 0.2 });
          const mono = mixDown(await TH.render(U)), s0 = Math.round(0.1 * SR); let k = s0; while (k < mono.length && Math.abs(mono[k]) < 1e-6) k++;
          if (M.db(M.rms(mono, SR, 0.1, 0.3)) < -60) quiet.push(n); else lat.push([n, k - s0]);
        }
        r.hits = `${lat.length}/${DRUMS[id].length}`; r.missing = quiet;
        r.maxGridMs = lat.length ? +Math.max(...lat.map(([, x]) => x / SR * 1000)).toFixed(3) : null; r.worst = lat.slice().sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, x]) => `pad ${n}: ${x} samples`);
        const U = TH.universe(3), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (name) c.presets.load(name); if (c.ready) await c.ready; r.outs = tap(U, inst);
        const notes = DRUMS[id]; for (let k = 0; k < 8; k++) U.K.bus.publish('note:trigger', { target: inst, note: notes[k % notes.length], velocity: 0.9, time: 0.1 + k * 0.25, duration: 0.2 });
        stopAt(U, 2.2);
        const buf = await TH.render(U), mono = mixDown(buf); levels(r, buf, mono, 0.1, 2.1);
        r.afterStopDb = +M.db(M.rms(mono, SR, 2.6, 2.95)).toFixed(1);
      } else if (out.kind === 'oneshots') {
        // each of 4 requests (1 s apart) must make a sound in its own second; levels, Stop all
        const U = TH.universe(5), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (name) c.presets.load(name); r.outs = tap(U, inst);
        ONESHOTS[id].forEach((n, k) => U.K.bus.publish('note:trigger', { target: inst, note: n, velocity: 0.9, time: 0.2 + k, duration: 0.5 }));
        stopAt(U, 4.2);
        const buf = await TH.render(U), mono = mixDown(buf); levels(r, buf, mono, 0.2, 4.2);
        // risers run 2–4 bars from near-silence: each slot is heard ALONE over 9 s, not in a 1-second window
        const heard = []; for (const n of ONESHOTS[id]) { const U2 = TH.universe(9), i2 = TH.spawn(U2, id), c2 = OrganismFactory.handle(i2).ctx; if (name) c2.presets.load(name); tap(U2, i2);
          U2.K.bus.publish('note:trigger', { target: i2, note: n, velocity: 0.9, time: 0.1, duration: 0.5 }); if (M.db(M.rms(mixDown(await TH.render(U2)), SR, 0.1, 9)) > -60) heard.push(n); }
        r.hits = `${heard.length}/${ONESHOTS[id].length}`;
        r.afterStopDb = +M.db(M.rms(mono, SR, 4.65, 4.95)).toFixed(1);
      } else if (out.kind === 'drop') {
        // fire it at bar 1 with short sections (1 / 1 / ¼ / 1 bars at 128): the impact must land on DROP beat 1
        const bpm = 128, U = TH.universe(8, { bpm }), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (name) c.presets.load(name);
        [['tensionBars', 1], ['buildBars', 1], ['pauseBars', 0.25], ['dropBars', 1]].forEach(([k, v]) => c.params.set(k, v)); r.outs = tap(U, inst);
        c.arm({ atStep: 0 }); U.T.bpm = bpm; U.T.renderTicks(0, 16 * 4, 0.05);
        const buf = await TH.render(U), mono = mixDown(buf), b = c.bounds(0, 0.05, 60 / bpm / 4); levels(r, buf, mono, 0.05, b.DROP.te);
        // timing: the same preset with the gap set to silence (its default reverse cymbal fills the pause on purpose) — the pause
        // must then be silent and the impact must start on DROP beat 1 (first sample after the pause)
        { const U2 = TH.universe(8, { bpm }), i2 = TH.spawn(U2, id), c2 = OrganismFactory.handle(i2).ctx; if (name) c2.presets.load(name);
          [['tensionBars', 1], ['buildBars', 1], ['pauseBars', 0.25], ['dropBars', 1], ['gapSound', 'silence']].forEach(([k, v]) => c2.params.set(k, v)); tap(U2, i2);
          c2.arm({ atStep: 0 }); U2.T.bpm = bpm; U2.T.renderTicks(0, 16 * 4, 0.05);
          const m2 = mixDown(await TH.render(U2)), b2 = c2.bounds(0, 0.05, 60 / bpm / 4), s0 = Math.round(b2.DROP.ts * SR);
          r.gapDb = +M.db(M.rms(m2, SR, b2.PAUSE.ts + 0.05, b2.PAUSE.te - 0.005)).toFixed(1);
          let k = Math.round((b2.PAUSE.ts + 0.06) * SR); while (k < m2.length && Math.abs(m2[k]) < 0.01) k++;   // −40 dBFS: build tails ring on under it
          r.maxGridMs = +(Math.abs(k - s0) / SR * 1000).toFixed(3); r.worst = [`first sound after the pause: ${((k - s0) / SR * 1000).toFixed(2)} ms from DROP beat 1`]; }
      } else if (out.kind === 'beat') {
        const bpm = 128, bars = 2, secs = bars * 240 / bpm + 1.2, U = TH.universe(secs, { bpm }), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx;
        if (name) c.presets.load(name); if (c.ready) await c.ready; r.outs = tap(U, inst);
        U.T.bpm = bpm; U.T.renderTicks(0, bars * 16, 0.05);
        const buf = await TH.render(U), mono = mixDown(buf); levels(r, buf, mono, 0.05, bars * 240 / bpm);
        const ons = M.onsets(mono, SR, { floorDb: -36 }), g = M.gridError(ons, bpm, 0.05);
        r.onsets = ons.length; r.maxGridMs = g.length ? +Math.max(...g.map(e => Math.abs(e.errMs))).toFixed(3) : null;
        r.worst = g.slice().sort((a, b) => Math.abs(b.errMs) - Math.abs(a.errMs)).slice(0, 3).map(e => `step ${e.step}: ${e.errMs.toFixed(2)} ms`);
      } else {
        const secs = 3, bpm = 120, U = TH.universe(secs, { bpm }), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx;
        if (name) c.presets.load(name); if (c.ready) await c.ready; r.outs = tap(U, inst);
        let expectHz = M.midiHz(NOTE), note = NOTE;
        if (out.kind === 'sampler') { await c.load(wav(220, 2.6), 'a3-saw.wav'); note = c.params.get('mode') === 'slice' ? 36 : c.params.get('root'); expectHz = 220; }
        if (out.kind === 'clip') { await c.loadAB(wav(220, 2.6), 'a3-saw.wav'); U.K.bus.publish('ui:play:' + inst, {}); expectHz = 220; }
        // chord tools are measured the way songs play them — a triad (A minor: the pitch check reads the root an octave-folded way)
        const POLY = /pad-forge|supersaw|retro-poly|organ|coven|xen-synth/.test(id), chord = out.kind === 'instrument' && POLY ? [note, note + 3, note + 7] : [note];
        if (out.kind === 'instrument' || out.kind === 'sampler') chord.forEach(n => U.K.bus.publish('note:trigger', { target: inst, note: n, velocity: 0.9, time: 0.1, duration: 2.7 }));   // still held when Stop all lands
        if (chord.length > 1) { r.chord = true; expectHz = 0; }   // a triad has no single pitch to check
        if (out.kind === 'effect') { const o = U.ctx.createOscillator(), g = U.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 110; g.gain.value = 0.5; o.connect(g); g.connect(inPort(U, inst).node); o.start(0.1); o.stop(1.3); expectHz = 0; if (plays) U.K.bus.publish('note:trigger', { target: inst, note: 60, velocity: 0.9, time: 0.1, duration: 1.2 }); }   // an effect that takes notes (Granular keys) is measured with one held
        U.T.bpm = bpm; U.T.renderTicks(0, Math.floor(secs * bpm / 15), 0);   // the transport runs: arps, gates and synced LFOs move as they do in a song
        stopAt(U, 2.0);   // Stop all (hard), pressed when the clock reaches 2.0 s
        const buf = await TH.render(U), mono = mixDown(buf); levels(r, buf, mono, 0.3, 1.2);
        r.afterStopDb = +M.db(M.rms(mono, SR, 2.45, 2.95)).toFixed(1);
        const first = M.onsets(mono, SR, { floorDb: -40, ratio: 3 })[0]; r.onsetMs = first !== undefined ? +((first - 0.1) * 1000).toFixed(1) : null;
        // latency: the first non-zero sample after the note — any attack shape is non-zero at once, so this reads pure delay
        if (out.kind !== 'effect') { const s0 = Math.round(0.1 * SR); let k = s0; while (k < mono.length && Math.abs(mono[k]) < 1e-7) k++; r.latencySamples = k < mono.length ? k - s0 : null; }
        if (expectHz && !xen) { const p = M.pitch(mono, SR, 0.35, 1.15, { fmin: 20, fmax: 1800 }); r.note = note; r.hz = +p.hz.toFixed(2); r.clarity = +p.clarity.toFixed(2); r.cents = p.hz ? +M.foldCents(p.hz, expectHz).toFixed(1) : null; }
        const mr = M.modRate(mono, SR, 0.3, 1.25, { lo: 0.5, hi: 30, step: 0.02 }); r.modHz = +mr.hz.toFixed(2); r.modDepthDb = +mr.depthDb.toFixed(1);
      }
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200); }
    r.ms = Math.round(performance.now() - t0);
    out.presets.push(r);
  }
  return out;
}

function verdict(tool, r) {
  const f = [], w = [];
  if (r.error) f.push('error: ' + r.error);
  if (r.nan) f.push(`${r.nan} NaN/Inf samples`);
  if (r.clip) f.push(`over full scale (${r.clip} samples ≥ 0 dBFS at the tool's own output)`);
  if (r.peakDb !== undefined && r.peakDb < -60) f.push(`silent (peak ${r.peakDb} dBFS)`);   // by PEAK: a pluck or stab is over before the 0.3–1.2 s level window
  if (r.afterStopDb !== undefined && r.afterStopDb > -60) f.push(`still sounding 0.45 s after Stop all (${r.afterStopDb} dBFS)`);
  if (r.maxGridMs !== null && r.maxGridMs !== undefined && r.maxGridMs > 1) f.push(`off time by up to ${r.maxGridMs} ms (${(r.worst || []).join('; ')})`);
  if (r.hits && r.hits.split('/')[0] !== r.hits.split('/')[1]) f.push(`only ${r.hits} hits heard`);
  if (r.gapDb !== undefined && r.gapDb > -50) f.push(`the PAUSE is not silent with In the gap = silence (${r.gapDb} dBFS)`);
  if (r.latencySamples > 16) f.push(`late: the first sound is ${r.latencySamples} samples (${(r.latencySamples / 48).toFixed(2)} ms) after the note`);
  if (r.dc !== undefined && Math.abs(r.dc) > 0.01) w.push(`DC offset ${r.dc}`);
  if (r.peakDb !== undefined && r.peakDb > -0.3 && !r.clip) w.push(`peaks at ${r.peakDb} dBFS (no headroom)`);
  if (r.cents !== null && r.cents !== undefined && r.clarity >= 0.8 && Math.abs(r.cents) > 10) w.push(`pitch ${r.cents > 0 ? '+' : ''}${r.cents} cents from the note played (${r.hz} Hz, clarity ${r.clarity})`);
  if (r.corr !== undefined && r.corr < -0.3) w.push(`L/R correlation ${r.corr} (cancels in mono)`);
  if (r.onsetMs !== null && r.onsetMs !== undefined && r.onsetMs > 60 && tool.kind === 'instrument') w.push(`first sound ${r.onsetMs} ms after the note`);
  return { level: f.length ? 'FAIL' : w.length ? 'WARN' : 'OK', notes: f.concat(w) };
}

let p = await page();
const ids = await p.evaluate((F) => { const a = []; OrganismFactory.onDefine(d => { if (d.domain === 'music' && (!F || d.id.includes(F))) a.push(d.id); }); return a; }, FILTER);
const results = []; let n = 0;
for (const id of ids) {
  if (n++ && n % 6 === 0) { await p.close(); p = await page(); }   // fresh page: offline universes pile up
  let r; try { r = await p.evaluate(measureTool, id); } catch (e) { r = { id, error: String(e.message).slice(0, 200) }; await p.close().catch(() => {}); p = await page(); }
  (r.presets || []).forEach(x => Object.assign(x, verdict(r, x)));
  results.push(r);
  const c = { OK: 0, WARN: 0, FAIL: 0 }; (r.presets || []).forEach(x => c[x.level]++);
  console.log(`${(r.presets || []).some(x => x.level === 'FAIL') ? '✗' : (r.presets || []).some(x => x.level === 'WARN') ? '△' : '✓'} ${id.padEnd(30)} ${String(r.kind || r.skip || r.error).padEnd(17)} ${r.presets ? `${r.presets.length} presets · ${c.OK} ok ${c.WARN} warn ${c.FAIL} fail` : ''}`);
  (r.presets || []).filter(x => x.level !== 'OK').slice(0, 6).forEach(x => console.log(`    ${x.level} ${x.preset}: ${x.notes.join(' · ')}`));
}
await browser.close();
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(results, null, 1));
if (opt('--md')) {
  const rows = results.flatMap(t => (t.presets || []).map(x => `| ${t.label || t.id} | ${t.kind} | ${x.preset || '—'} | ${x.level} | ${x.peakDb ?? ''} | ${x.rmsDb ?? ''} | ${x.cents ?? ''} | ${x.maxGridMs ?? ''} | ${x.afterStopDb ?? ''} | ${x.notes.join(' · ')} |`));
  fs.writeFileSync(opt('--md'), ['# Tool output — measured', '', `Generated by tests/tool-audio.mjs · ${new Date().toISOString().slice(0, 10)}`, '',
    '| Tool | Kind | Preset | Verdict | Peak dBFS | Level dBFS | Pitch (cents) | Grid (ms) | After Stop (dBFS) | Notes |', '|---|---|---|---|---|---|---|---|---|---|', ...rows, ''].join('\n'));
}
const all = results.flatMap(t => t.presets || []), fails = all.filter(x => x.level === 'FAIL').length;
console.log(`\n${results.length} tools · ${all.length} presets · ${all.filter(x => x.level === 'OK').length} OK · ${all.filter(x => x.level === 'WARN').length} WARN · ${fails} FAIL`);
process.exit(fails ? 1 : 0);

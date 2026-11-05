#!/usr/bin/env node
/* Null render — proves a refactor changed nothing (eravos.music-ecosystem phase 0; eravos.components.spec).
 *
 *   node tests/null-render.mjs --record [filter]     on the code BEFORE the change: render every tool × preset with a fixed,
 *                                                    seeded stimulus, twice (to find renders that do not repeat), and keep the
 *                                                    result in tests/null-baseline/ (gitignored: yours, per machine/commit)
 *   node tests/null-render.mjs [--check] [filter]    on the code AFTER the change: render again and subtract. PASS = the
 *                                                    residual is under −60 dB re the baseline's RMS (--db -70 to be stricter)
 *   --json out.json                                  the table as data
 *
 * Exit 0 = every compared preset nulls. 1 = any FAIL (or a missing baseline when checking). UNSTABLE renders (Math.random is
 * seeded here, so what is left is a tool's own unseeded randomness or time dependence) are listed, never passed: fix the tool's
 * seed to make it provable. Tools whose kind this stimulus does not cover (drop, sampler, one-shots, containers, clip) are
 * listed as NOT COVERED — a harness that hides what it skips is worse than none.
 * The maths is tests/null-render-core.mjs (tested without a browser: node tests/null-render-core.test.mjs). */
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, as tests/tool-audio.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { store, restore, nullDb, judge, isUnstable, GATE_DB } from './null-render-core.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..'), BASE = path.join(HERE, 'null-baseline');
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const RECORD = argv.includes('--record'), GATE = opt('--db') !== null ? Number(opt('--db')) : GATE_DB;
const FILTER = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && /^--(db|json)$/.test(argv[i - 1]))) || '';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir, re) => fs.readdirSync(path.join(ROOT, dir)).filter(f => re.test(f)).map(f => dir + '/' + f);
const skeleton = [...list('canvas/kernel', /\.js$/), ...list('canvas/runtime', /\.(js|css)$/), 'canvas/index.html', 'canvas/scripts.js'];
const toolDirs = fs.readdirSync(path.join(ROOT, 'tools')).filter(d => fs.existsSync(path.join(ROOT, 'tools', d, 'tools')))
  .flatMap(d => fs.readdirSync(path.join(ROOT, 'tools', d, 'tools')).filter(c => fs.statSync(path.join(ROOT, 'tools', d, 'tools', c)).isDirectory())
  .flatMap(c => fs.readdirSync(path.join(ROOT, 'tools', d, 'tools', c)).filter(t => fs.existsSync(path.join(ROOT, 'tools', d, 'tools', c, t, 'tool.json'))).map(t => `tools/${d}/tools/${c}/${t}`)));
const SOURCES = { skeleton: Object.fromEntries(skeleton.map(f => [f, read(f)])), organisms: Object.fromEntries(toolDirs.flatMap(dir => list(dir, /\.js$/).filter(f => !/\.test\.js$/.test(f))).map(f => [f, read(f)])) };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=4096'] });
async function page() {
  const p = await browser.newPage();
  // seeded Math.random BEFORE any tool loads: same numbers on every render, every machine
  await p.addInitScript((s) => { let a = 0x9E3779B9; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__SOURCES = s; }, SOURCES);
  await p.goto('file://' + path.join(HERE, 'run.html') + '?auto=0'); await p.waitForFunction(() => window.TH && window.OrganismFactory, null, { timeout: 60000 });
  return p;
}

// ------------------------------------------------------------ in the page: one tool, one preset → mono Float32 as base64
async function renderOne(arg) {
  const { id, name } = arg, d = OrganismFactory.def(id), SR = TH.SR;
  const hookIn = (t) => (d.hooks || []).some(h => h.direction === 'in' && String(h.event_type || '').split('|').map(s => s.trim()).includes(t));
  const SKIP = { 'eravos.timeline': 'container', 'eravos.song-recorder': 'container', 'eravos.sample-player': 'sampler', 'eravos.clip-maker': 'clip', 'eravos.bass-drop-builder': 'drop', 'eravos.fx-box': 'one-shots' };
  if (SKIP[id]) return { skip: SKIP[id] };
  const DRUMS = { 'eravos.pads': [36, 37, 38, 39], 'eravos.drum-forge': [36, 37, 38, 39] };
  const bass = /bass|sub|wub|reese|808|wobble/i.test(id + ' ' + (d.category || '')), NOTE = bass ? 45 : 57;
  const probe = TH.universe(0.1), pi = TH.spawn(probe, id), ports = probe.K.audio.ports(pi);
  const hasOut = ports.some(p => p.kind === 'audio' && p.direction === 'out');
  const hasIn = ports.some(p => p.kind === 'audio' && p.direction === 'in' && !/^(fm|ring|slot\.)/.test(p.port_id));
  if (!hasOut) return { skip: 'no audio out' };
  const kind = hasIn ? 'effect' : hookIn('note:trigger') ? 'instrument' : hookIn('transport:tick') ? 'beat' : null;
  if (!kind) return { skip: 'no stimulus for this kind' };
  const tap = (U, inst) => { try { U.K.audio.chain.out.disconnect(U.ctx.destination); } catch (e) {} const sum = U.ctx.createGain(); U.K.audio.ports(inst).filter(p => p.kind === 'audio' && p.direction === 'out').forEach(p => p.node.connect(sum)); sum.connect(U.ctx.destination); };
  const mono = (buf) => { const m = new Float32Array(buf.length); for (let c = 0; c < buf.numberOfChannels; c++) { const x = buf.getChannelData(c); for (let i = 0; i < x.length; i++) m[i] += x[i] / buf.numberOfChannels; } return m; };
  const b64 = (f) => { const u = new Uint8Array(f.buffer, f.byteOffset, f.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const bpm = 120, secs = 3, U = TH.universe(secs, { bpm }), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx;
  if (name) c.presets.load(name); if (c.ready) await c.ready; tap(U, inst);
  if (kind === 'effect') {   // a 110 Hz saw burst + a fixed noise floor, the same samples every time
    const n = Math.round(secs * SR), b = U.ctx.createBuffer(1, n, SR), x = b.getChannelData(0); let a = 12345;
    for (let i = 0; i < n; i++) { a = (a * 1664525 + 1013904223) >>> 0; const t = i / SR; x[i] = (0.4 * (2 * ((t * 110) % 1) - 1) * Math.min(1, t / 0.005, Math.max(0, (1.5 - t)) / 0.01) + 0.02 * (a / 2147483648 - 1)); }
    const src = U.ctx.createBufferSource(), inp = U.K.audio.ports(inst).find(p => p.kind === 'audio' && p.direction === 'in' && !/^(fm|ring|slot\.)/.test(p.port_id));
    src.buffer = b; src.connect(inp.node); src.start(0);
  } else if (kind === 'instrument') {
    const ns = DRUMS[id] ? [[DRUMS[id][0], 0.1], [DRUMS[id][1], 0.6], [DRUMS[id][2], 1.1], [DRUMS[id][3], 1.6]] : [[NOTE, 0.1], [NOTE + 7, 0.8], [NOTE + 12, 1.5], [NOTE, 2.2], [NOTE + 4, 2.2], [NOTE + 7, 2.2]];
    ns.forEach(([n, t]) => U.K.bus.publish('note:trigger', { target: inst, note: n, velocity: 0.9, time: t, duration: 0.5 }));
  } else { U.T.bpm = bpm; U.T.renderTicks(0, 16, 0.05); }
  const out = mono(await TH.render(U)); return { kind, sr: SR, data: b64(out) };
}
async function presetsOf(id) { const d = OrganismFactory.def(id); const k = Object.keys(d.presets || {}); return k.length ? k : [null]; }

const fromB64 = (s) => { const b = Buffer.from(s, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice(); };
const safe = (s) => String(s).replace(/[^a-z0-9._-]+/gi, '_');
const fileFor = (id, name) => path.join(BASE, safe(id), safe(name || 'default') + '.i16');

let p = await page();
const ids = await p.evaluate((F) => { const a = []; OrganismFactory.onDefine(d => { if (d.domain === 'music' && (!F || d.id.includes(F))) a.push(d.id); }); return a; }, FILTER);
const rows = []; let seen = 0;
if (RECORD) fs.mkdirSync(BASE, { recursive: true });
const prior = fs.existsSync(path.join(BASE, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(BASE, 'index.json'), 'utf8')) : null;
// recording one tool keeps every other tool's baseline (it used to start the index empty, so --record <tool> wiped the rest)
const index = RECORD ? Object.assign({}, prior || {}) : prior;
if (!RECORD && !index) { console.error('No baseline. On the code BEFORE your change: node tests/null-render.mjs --record'); process.exit(1); }

for (const id of ids) {
  if (seen++ && seen % 5 === 0) { await p.close(); p = await page(); }   // fresh page: offline universes pile up
  if (RECORD) Object.keys(index).forEach(k => { if (k.startsWith(id + '|')) delete index[k]; });   // this tool's old entries go; its new ones follow
  let names; try { names = await p.evaluate(presetsOf, id); } catch (e) { rows.push({ id, preset: '—', verdict: 'FAIL', note: 'error: ' + String(e.message).slice(0, 100) }); continue; }
  for (const name of names) {
    const row = { id, preset: name || '(default)' };
    try {
      const r1 = await p.evaluate(renderOne, { id, name });
      if (r1.skip) { row.verdict = 'NOT COVERED'; row.note = r1.skip; rows.push(row); break; }   // one row per tool
      const now = fromB64(r1.data);
      if (RECORD) {
        const r2 = await p.evaluate(renderOne, { id, name }), unstable = isUnstable(now, fromB64(r2.data)), { scale, i16 } = store(now);
        fs.mkdirSync(path.dirname(fileFor(id, name)), { recursive: true }); fs.writeFileSync(fileFor(id, name), Buffer.from(i16.buffer, i16.byteOffset, i16.byteLength));
        index[id + '|' + (name || '')] = { scale, length: now.length, sr: r1.sr, kind: r1.kind, unstable }; row.verdict = unstable ? 'UNSTABLE' : 'RECORDED'; row.note = unstable ? 'renders differently from itself (unseeded randomness or time)' : r1.kind;
      } else {
        const ent = index[id + '|' + (name || '')], f = fileFor(id, name);
        if (!ent || !fs.existsSync(f)) { row.verdict = 'FAIL'; row.note = 'no baseline for this preset (new or renamed?)'; }
        else {
          const b = fs.readFileSync(f), ref = restore(ent.scale, new Int16Array(b.buffer, b.byteOffset, b.length / 2).slice()), res = nullDb(ref, now);
          row.verdict = judge(res, { gateDb: GATE, unstable: ent.unstable }); row.relDb = +res.relDb.toFixed(1); row.peakDb = +res.peakDb.toFixed(1);
          row.note = ent.unstable ? 'baseline unstable — cannot be proven' : res.lenDiff ? `length changed by ${res.lenDiff} samples` : res.nan ? `${res.nan} NaN samples` : res.absolute ? 'silent render, judged absolutely' : '';
        }
      }
    } catch (e) { row.verdict = 'FAIL'; row.note = 'error: ' + String(e.message).slice(0, 100); try { await p.close(); } catch (_) {} p = await page(); }
    rows.push(row);
  }
  const mine = rows.filter(r => r.id === id), bad = mine.filter(r => r.verdict === 'FAIL').length, un = mine.filter(r => r.verdict === 'UNSTABLE').length;
  console.log(`${bad ? '✗' : un ? '△' : mine[0] && mine[0].verdict === 'NOT COVERED' ? '·' : '✓'} ${id.padEnd(32)} ${mine.length} ${mine.length === 1 ? 'row' : 'presets'}${bad ? ` · ${bad} FAIL` : ''}${un ? ` · ${un} unstable` : ''}${mine[0] && mine[0].verdict === 'NOT COVERED' ? ' · not covered: ' + mine[0].note : ''}`);
  mine.filter(r => r.verdict === 'FAIL').slice(0, 5).forEach(r => console.log(`    FAIL ${r.preset}: ${r.relDb !== undefined ? r.relDb + ' dB (gate ' + GATE + ')' : ''} ${r.note || ''}`));
}
await browser.close();
if (RECORD) { fs.writeFileSync(path.join(BASE, 'index.json'), JSON.stringify(index)); }
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(rows, null, 1));
const c = (v) => rows.filter(r => r.verdict === v).length;
console.log(RECORD ? `\nrecorded ${c('RECORDED')} presets · ${c('UNSTABLE')} unstable · ${c('NOT COVERED')} tools not covered · ${c('FAIL')} errors → tests/null-baseline/`
  : `\n${c('PASS')} PASS · ${c('FAIL')} FAIL · ${c('UNSTABLE')} unstable (unproven) · ${c('NOT COVERED')} tools not covered   (gate ${GATE} dB)`);
process.exit(c('FAIL') ? 1 : 0);

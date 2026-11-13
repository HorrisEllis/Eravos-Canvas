#!/usr/bin/env node
/* Songs decomposed, one by one (his words, 2026-11-13: "also songs decomposed one by one." · "rhythmes and notes per tool." —
 * specs/eravos.song-decomposition.spec SD1). Every song the Songs menu lists is generated as data (SongEngine.generate — no audio) or read
 * from its recipe, and taken apart:
 *   per song   its tempo, key, sections, and each part: the tool (organism), its preset, its role, and bar by bar which RHYTHM (the onsets: step +
 *              velocity, a drum's pads kept) and which LINE (the notes relative to the key's root) it plays — ids into the per-tool files —
 *              plus how its tools are patched, modulated and wired
 *   per tool   the rhythms and lines it plays across all songs, the same content kept once (an id = its content's hash), each naming how many
 *              bars use it and the songs it came from
 * Writes tools/music/data/song-parts/ (index.json, songs.json, <tool>.json — data only) and docs/song-decomposition.md.
 * Deterministic: the same songbooks → byte-identical files. Fails when a listed song does not decompose (it names it).
 *   node build/song-decompose.mjs   (needs the browser the driver drives; host/driver/glass.js) */
import { chromium } from '../host/driver/glass.js';
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tools/music/data/song-parts');
const b = await chromium.launch(); const p = await b.newPage();
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + path.join(ROOT, 'canvas/index.html')); await p.waitForFunction(() => window.Songbook && window.SongEngine && window.Recipes && Songbook.all().length > 50, null, { timeout: 90000 });
const raw = await p.evaluate(() => {
  const G = new Map(SongEngine.genres().map(g => [g.id, g]));
  return Songbook.all().map(s => {
    let steps = null, from;
    try { if (s.recipe) { const r = Recipes.get(s.recipe); steps = r && r.steps; from = 'recipe'; } else { const g = SongEngine.generate(s.genre, s.seed || 1); steps = g && (g.steps || g); from = 'engine'; } }
    catch (e) { return { id: s.id, title: s.title, fail: String(e && e.message || e).slice(0, 160) }; }
    if (!steps) return { id: s.id, title: s.title, fail: 'no steps' };
    const g = G.get(s.genre) || {}, sess = steps.find(x => x.op === 'configure' && x.target === 'session'), bpm = (steps.find(x => x.op === 'bpm') || {}).bpm || s.bpm || 120;
    const mounts = steps.filter(x => x.op === 'mount').map(x => ({ as: x.as, organism: x.organism, preset: x.preset || null }));
    const conf = {}; steps.filter(x => x.op === 'configure' && x.target !== 'session').forEach(x => { conf[x.target] = Object.assign(conf[x.target] || {}, x.params || {}); });
    const clips = steps.filter(x => x.op === 'event' && x.topic === 'clip_add' && x.payload && x.payload.kind === 'notes').map(x => x.payload);
    const lanes = steps.filter(x => x.op === 'event' && x.topic === 'lane_add' && x.payload && x.payload.kind !== 'inst').map(x => x.payload);
    const marks = steps.filter(x => x.op === 'event' && x.topic === 'marker_edit' && x.payload && x.payload.op === 'add').map(x => ({ bar: x.payload.bar, name: x.payload.name }));
    return { id: s.id, title: s.title, shelf: s.shelf || s.category || null, genre: s.genre || null, seed: s.seed || null, from, bpm,
      key: sess && sess.params ? { root: sess.params.root | 0, scale: sess.params.scale || 'minor' } : { root: 0, scale: 'minor' },
      roles: Object.fromEntries(Object.entries(g.parts || {}).map(([k, v]) => [k, v.role || null])),
      mounts, conf, clips: clips.map(c => ({ target: c.target, startBar: c.startBar, bars: c.bars, notes: c.notes })), curves: lanes.map(l => ({ target: l.target || null, key: l.key || l.param || null, name: l.name || null, points: (l.points || []).length })),
      patches: steps.filter(x => x.op === 'patch').map(x => [x.from, x.to]), modulates: steps.filter(x => x.op === 'modulate').map(x => [x.from, x.to, x.key]), wires: steps.filter(x => x.op === 'wire').length, marks };
  });
});
await b.close();
const hash = (o) => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 10);
const tools = new Map(), songs = [], fails = raw.filter(r => r.fail);
const T = (org) => { if (!tools.has(org)) tools.set(org, { rhythms: new Map(), lines: new Map() }); return tools.get(org); };
// identity = the onsets (a rhythm: steps, a drum's pads) or the notes (a line: step, length, interval) — velocity is not identity: it is kept
// as the mean over every bar that plays it (humanised velocities would otherwise make every bar "new")
const add = (map, id, content, vels, song) => { if (!map.has(id)) map.set(id, Object.assign({ id, bars: 0, songs: new Set(), _v: vels.map(() => 0) }, content)); const e = map.get(id); e.bars++; e.songs.add(song); vels.forEach((v, i) => { e._v[i] += v; }); };
for (const r of raw.filter(r => !r.fail)) {
  const byAs = new Map(r.mounts.map(m => [m.as, m])), parts = [];
  const targets = [...new Set(r.clips.map(c => c.target))];
  for (const tg of targets) {
    const as = String(tg).replace(/^@/, ''), m = byAs.get(as); if (!m) continue;
    const role = r.roles[as] || null, drums = role === 'drums' || /drum|pads|groove/.test(m.organism), bars = {};
    r.clips.filter(c => c.target === tg).forEach(c => (c.notes || []).forEach(n => { const bar = c.startBar + Math.floor(n.s / 16); (bars[bar] = bars[bar] || []).push(n); }));
    const seq = [];
    Object.keys(bars).map(Number).sort((a, b) => a - b).forEach(bar => {
      const ns = bars[bar].map(n => ({ s: +(n.s % 16).toFixed(3), l: +(+n.l).toFixed(3), n: n.n, v: +(+n.v).toFixed(2) })).sort((a, b) => a.s - b.s || a.n - b.n);
      const vels = ns.map(n => n.v), rhythm = { steps: ns.map(n => drums ? [n.s, n.n] : [n.s]) }, rid = 'r' + hash(rhythm); add(T(m.organism).rhythms, rid, rhythm, vels, r.id);
      let lid = null; if (!drums) { const line = { notes: ns.map(n => [n.s, n.l, n.n - r.key.root - 60]) }; lid = 'l' + hash(line); add(T(m.organism).lines, lid, line, vels, r.id); }
      seq.push([bar, rid, lid]);
    });
    const runs = []; seq.forEach(([bar, rid, lid]) => { const L = runs[runs.length - 1]; if (L && L[0] + L[1] === bar && L[2] === rid && L[3] === lid) L[1]++; else runs.push([bar, 1, rid, lid]); });
    parts.push({ as, tool: m.organism, preset: m.preset || (r.conf[as] && r.conf[as].preset) || null, role, drums, runs });   // runs: [first bar, how many bars, rhythm id, line id]
  }
  songs.push({ id: r.id, title: r.title, from: r.from, genre: r.genre, seed: r.seed, bpm: r.bpm, key: r.key, sections: r.marks,
    tools: r.mounts.map(m => m.organism), parts, patches: r.patches, modulates: r.modulates, wires: r.wires, curves: r.curves });
}
fs.mkdirSync(OUT, { recursive: true }); fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f)));
const ser = (map) => [...map.values()].sort((a, b) => b.bars - a.bars || (a.id < b.id ? -1 : 1)).map(e => { const o = Object.assign({}, e, { vel: e._v.map(v => +(v / e.bars).toFixed(2)), songs: [...e.songs].sort() }); delete o._v; return o; });
const index = { schema: 'eravos.song-parts/1', about: 'songs decomposed (build/song-decompose.mjs — do not edit): per tool, the rhythms and lines it plays across the songs', songs: songs.length, failed: fails.map(f => f.id), tools: {} };
for (const [org, t] of [...tools.entries()].sort()) {
  const R = ser(t.rhythms), L = ser(t.lines), file = org.replace(/^eravos\./, '') + '.json';
  fs.writeFileSync(path.join(OUT, file), JSON.stringify({ schema: 'eravos.song-parts/1', tool: org, rhythms: R, lines: L }) + '\n');
  index.tools[org] = { file, rhythms: R.length, lines: L.length, bars: R.reduce((a, e) => a + e.bars, 0) };
}
fs.writeFileSync(path.join(OUT, 'songs.json'), JSON.stringify({ schema: 'eravos.song-parts/1', songs }) + '\n');
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
const totBars = Object.values(index.tools).reduce((a, t) => a + t.bars, 0), totR = Object.values(index.tools).reduce((a, t) => a + t.rhythms, 0), totL = Object.values(index.tools).reduce((a, t) => a + t.lines, 0);
const md = ['# Songs decomposed (generated by build/song-decompose.mjs — do not edit)', '', `His words (2026-11-13): "also songs decomposed one by one." · "rhythmes and notes per tool." — specs/eravos.song-decomposition.spec.`, '',
  `${songs.length} songs taken apart (${songs.filter(s => s.from === 'engine').length} from the Song Engine, ${songs.filter(s => s.from === 'recipe').length} from recipes)${fails.length ? `; ${fails.length} failed: ${fails.map(f => f.id).join(', ')}` : '; none failed'}.`,
  `${totBars} part-bars → ${totR} distinct rhythms and ${totL} distinct lines across ${tools.size} tools (the same content kept once; each names the songs it came from).`, '',
  '| tool | rhythms | lines | bars played |', '|---|---:|---:|---:|', ...Object.entries(index.tools).sort((a, b) => b[1].bars - a[1].bars).map(([o, t]) => `| ${o} | ${t.rhythms} | ${t.lines} | ${t.bars} |`),
  '', `Not decomposed into notes: ${songs.filter(s => !s.parts.length).map(s => s.title + ' (' + s.from + ' — its notes come from a sequencer starter, not clips; its tools are listed)').join('; ') || 'none'}.`,
  '', 'A rhythm = one bar\'s onsets (its steps; a drum part keeps its pads). A line = one bar\'s notes (step, length, interval from the song\'s key root — so it plays in any key). Velocity is not part of either\'s identity: each keeps the mean velocity of every bar that plays it (vel). Files: `tools/music/data/song-parts/` (index.json, songs.json, one file per tool).'];
fs.writeFileSync(path.join(ROOT, 'docs/song-decomposition.md'), md.join('\n') + '\n');
console.log(`${fails.length ? '✗' : '✓'} songs decomposed: ${songs.length} songs · ${tools.size} tools · ${totR} rhythms · ${totL} lines from ${totBars} part-bars${fails.length ? ' · failed: ' + fails.map(f => f.id + ' (' + f.fail + ')').join(', ') : ''}`);
process.exit(fails.length ? 1 : 0);

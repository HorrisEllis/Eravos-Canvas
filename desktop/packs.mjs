#!/usr/bin/env node
/* Build the music domain as drop-in packs (P13 · eravos.phase13-skeleton-packs). Node built-ins only.
 *   node desktop/packs.mjs --out <folder>
 * One core pack (the domain: theory, audio engine, transport, data, recipes, css) + one pack per tool family.
 * File order comes from RUNNING the dev loaders (tools/music/index.js, tools/index.js) against a stub document.write,
 * so the source tree stays the single truth: add an organism there and it lands in the right pack by its category. */
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import zlib from 'zlib'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..'), MUSIC = path.join(ROOT, 'tools', 'music');
const VERSION = JSON.parse(fs.readFileSync(path.join(HERE, 'package.json'), 'utf8')).version;
const KERNEL_TARGET = (fs.readFileSync(path.join(ROOT, 'canvas', 'kernel', 'kernel.js'), 'utf8').match(/KERNEL_VERSION = '([^']+)'/) || [])[1] || '3.2.0';

// ---------------------------------------------------------------- zip writer (deflate, CRC-32) — readable by kernel/intake.js
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zip(entries) { // [{name, data:Buffer}]
  const locals = [], centrals = []; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), raw = e.data, def = zlib.deflateRawSync(raw, { level: 9 }), crc = crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(0x00210000, 10); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(0x00210000, 12); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(def.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, name, def); centrals.push(ch, name); off += 30 + name.length + def.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------------------------------------------------------------- run a loader, capture what it would load
function loaderOutput(file, win) {
  const tags = [];
  const sandbox = { window: Object.assign({ ERAVOS_TOOLS: '' }, win || {}), document: { write: (t) => tags.push(t), currentScript: null } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  const out = [];
  for (const t of tags) { let m; if ((m = t.match(/<script src="([^"]+)"/))) out.push({ kind: 'js', path: m[1] }); else if ((m = t.match(/<link rel="stylesheet" href="([^"]+)"/))) out.push({ kind: 'css', path: m[1] }); }
  return out;
}
const rel = (p) => p.replace(/^music\//, '');

// ---------------------------------------------------------------- 3.74c one tool = one zip with EVERYTHING it is and uses
// James, 2026-10-30: "each tool is supposed to be bundled with its dag, tool file, ui and packs, anything that tool uses and has, is
// its own zip." The zip carries the whole tool folder (tool.json, engine, ui, styles, spec, tests, every pack and its schema,
// pictures) and dag.json — the tool as a node: what it needs (the core pack, units, tools, permissions), its hooks in and out,
// what it works with, its packs, and every file with its role and SHA-256. Only the listed scripts run on install (engine, ui —
// in load order); the rest travels with it (contents.files, contents.dag: not run).
import crypto from 'crypto';
function walk(dir, base) { let out = []; for (const n of fs.readdirSync(dir).sort()) { const f = path.join(dir, n), r = base ? base + '/' + n : n; if (fs.statSync(f).isDirectory()) out = out.concat(walk(f, r)); else out.push(r); } return out; }
const roleOf = (f, m) => { const fl = m.files || {}, n = path.basename(f);
  for (const [k, v] of Object.entries(fl)) if (v === n || v === f) return k;
  return /^packs\/.*pack\.json$/.test(f) ? 'pack' : /pack\.schema\.json$/.test(f) ? 'pack-schema' : /^packs\/index\.js$/.test(f) ? 'packs-loader' : /\.css$/.test(f) ? 'style' : /\.test\.js$/.test(f) ? 'tests' : /\.spec$/.test(f) ? 'spec' : /\.png$/.test(f) ? 'picture' : n === 'tool.json' ? 'tool' : /\.js$/.test(f) ? 'code' : 'file'; };
function hooksOf(src) {   // S.audio_out('x.hook.audio_out') · S.note_in(…) · S.mod_in(…, key) · S.event(id, 'out', topic…) — read from the engine
  const out = { in: [], out: [] }; const re = /S\.(\w+)\(\s*'([^']+)'(?:\s*,\s*'([^']+)')?(?:\s*,\s*'([^']+)')?/g; let m;
  while ((m = re.exec(src))) { const b = m[1], id = m[2]; if (!/hook|knob|curve|bend/.test(id)) continue;
    const dir = b === 'event' ? (m[3] === 'out' ? 'out' : 'in') : /_out$|^mod_out$/.test(b) ? 'out' : /_in$|^mod_in$/.test(b) ? 'in' : (/out/.test(id) ? 'out' : 'in');
    out[dir].push(Object.assign({ hook: id, kind: b.replace(/_(in|out)$/, '') }, b === 'event' && m[4] ? { topic: m[4] } : b === 'mod_in' && m[3] ? { knob: m[3] } : {})); }
  return out;
}
export function toolZip(dir, list, base, styles, scripts) {
  const abs = path.join(MUSIC, dir), m = JSON.parse(fs.readFileSync(path.join(abs, 'tool.json'), 'utf8'));
  const all = walk(abs).map(r => dir + '/' + r), engine = m.files && m.files.engine ? fs.readFileSync(path.join(abs, m.files.engine), 'utf8') : '';
  const packs = all.filter(f => /\/packs\/[^/]+\/pack\.json$/.test(f)).map(f => { try { const j = JSON.parse(fs.readFileSync(path.join(MUSIC, f), 'utf8')); const items = j.items || {};
    return { id: j.id, label: j.label, version: j.version, presets: Object.values(items).reduce((a, it) => a + Object.keys((it && it.presets) || {}).length, 0), path: f }; } catch (e) { return { path: f, error: e.message }; } });
  const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(MUSIC, f))).digest('hex');
  const dag = {
    schema: 'eravos.tool-dag/1', tool: m.id, label: m.label, version: m.version, category: m.category,
    needs: { packs: [CORE.id], units: (m.needs || {}).units || [], tools: (m.needs || {}).tools || [], permissions: ((m.needs || {}).permissions || []).slice().sort() },
    hooks: hooksOf(engine), works_with: m.works_with || [], conflicts: m.conflicts || [],
    load_order: list.map(f => f.path), packs,
    files: all.map(f => ({ path: f, role: roleOf(f.slice(dir.length + 1), m), bytes: fs.statSync(path.join(MUSIC, f)).size, sha256: sha(f) })),
  };
  const dagPath = dir + '/dag.json';
  const manifest = Object.assign({}, base, { pack_id: m.id + '.tool', pack_type: 'organism_pack', label: m.label, tool_version: m.version, dependencies: [CORE.id], permissions: dag.needs.permissions,
    provides: [m.id], contents: { styles: styles(list), organisms: scripts(list), dag: dagPath, files: all.concat([dagPath]) } });
  const entries = [{ name: 'manifest.json', data: Buffer.from(JSON.stringify(manifest, null, 2)) }, { name: dagPath, data: Buffer.from(JSON.stringify(dag, null, 2)) }]
    .concat(all.map(f => ({ name: f, data: fs.readFileSync(path.join(MUSIC, f)) })));
  return { file: `Music · ${m.label}.zip`, manifest, dag, entries };
}

// ---------------------------------------------------------------- tool families (every organism category must be covered)
export const FAMILIES = [
  { id: 'eravos.music.start', file: 'Music 1 - Start here.zip', label: 'Start here — Session, Coach', cats: ['Start here'] },
  { id: 'eravos.music.mix', file: 'Music 2 - Mixer.zip', label: 'Mixer — Channel, Master, Sidechain', cats: ['Mix'] },
  { id: 'eravos.music.sounds', file: 'Music 3 - Synths and basses.zip', label: 'Synths & basses', cats: ['Sound sources'] },
  { id: 'eravos.music.drums', file: 'Music 4 - Drums and sequencer.zip', label: 'Drums & sequencer', cats: ['Drums & rhythm'] },
  { id: 'eravos.music.arrange', file: 'Music 5 - Arrange.zip', label: 'Arrange — Timeline, Drop Builder', cats: ['Arrange'] },
  { id: 'eravos.music.effects', file: 'Music 6 - Effects.zip', label: 'Effects — Echo, Filter, Mod Delay, Destroyer, Phaser, EQ, Dynamics, Glitch, Pitch', cats: ['Effects'] },
  { id: 'eravos.music.modulation', file: 'Music 7 - Modulation.zip', label: 'Modulation — LFO, Macro, XY', cats: ['Modulation'] },
  { id: 'eravos.music.voice', file: 'Music 8 - Voice and samples.zip', label: 'Voice & samples', cats: ['Voice & samples'] },
  { id: 'eravos.music.generators', file: 'Music 9 - Generators.zip', label: 'Generators — EDM Lab', cats: ['Generators'] },
  { id: 'eravos.music.tools', file: 'Music 10 - Tools.zip', label: 'Tools — MIDI Map, Contrast Analyser', cats: ['Tools'] },
  { id: 'eravos.music.xen', file: 'Music 11 - Xenharmonic and Analysis.zip', label: 'Xenharmonic + Analysis — Xen Synth, Ratio Lattice, Recursive Spectra, Harmonic Analyzer', cats: ['Xenharmonic', 'Analysis'] },
  { id: 'eravos.music.forge', file: 'Music 12 - Sound Forge.zip', label: 'Sound Forge — Drum Forge, Bass Forge, FX Box', cats: ['Sound Forge'] },
  { id: 'eravos.music.genre', file: 'Music 13 - Genre instruments.zip', label: 'Genre instruments — Dub Station, Gothic Organ, Retro Poly, Coven', cats: ['Genre instruments'] },
];
const CORE = { id: 'eravos.music', file: 'Music 0 - Core.zip', label: 'Music — core (theory, audio engine, transport, recipes)' };

export function buildPacks(outDir, only) {   // only: a Set of tool ids — just those tools' zips (no core, no bundles)
  fs.mkdirSync(outDir, { recursive: true });
  const domainFiles = loaderOutput(path.join(MUSIC, 'index.js')).map(f => ({ kind: f.kind, path: rel(f.path) }));
  const toolLoader = domainFiles.find(f => f.path === 'tools/index.js'); if (!toolLoader) throw new Error('tools/index.js not in the music loader');
  const coreFiles = domainFiles.filter(f => f !== toolLoader);
  const made = [];
  const write = (file, manifest, list) => {
    const entries = [{ name: 'manifest.json', data: Buffer.from(JSON.stringify(manifest, null, 2)) }].concat(list.map(f => ({ name: f.path, data: fs.readFileSync(path.join(MUSIC, f.path)) })));
    fs.writeFileSync(path.join(outDir, file), zip(entries)); made.push({ file, pack_id: manifest.pack_id, files: list.length });
  };
  const base = { manifest_version: '1.0.0', kernel_target: KERNEL_TARGET, author: 'James Brooks', pack_version: VERSION };
  const styles = (list) => Object.fromEntries(list.filter(f => f.kind === 'css').map(f => [f.path, f.path]));
  const scripts = (list) => Object.fromEntries(list.filter(f => f.kind === 'js').map(f => [f.path, f.path]));
  if (!only) write(CORE.file, Object.assign({}, base, { pack_id: CORE.id, pack_type: 'domain', label: CORE.label, permissions: [],
    description: 'The music domain: everything the music tools share. Install first — every Music pack depends on it.',
    contents: { styles: styles(coreFiles), runtime: scripts(coreFiles) } }), coreFiles);
  // P37.0: ONE zip per tool folder (its code + its packs) — remove a tool's zip and only that tool is gone
  const byTool = new Map(), bundleFiles = [];
  for (const f of loaderOutput(path.join(MUSIC, 'tools', 'index.js')).map(f => ({ kind: f.kind, path: rel(f.path) }))) {
    if (f.path.startsWith('content/')) { bundleFiles.push(f); continue; }
    const k = f.path.split('/').slice(0, 3).join('/'); if (!byTool.has(k)) byTool.set(k, []); byTool.get(k).push(f);
  }
  let tools = 0;
  for (const [dir, list] of byTool) {
    if (only && !only.has(JSON.parse(fs.readFileSync(path.join(MUSIC, dir, 'tool.json'), 'utf8')).id)) continue;
    const t = toolZip(dir, list, base, styles, scripts);
    fs.writeFileSync(path.join(outDir, t.file), zip(t.entries)); made.push({ file: t.file, pack_id: t.manifest.pack_id, files: t.entries.length - 1 }); tools++;
  }
  if (only) return { made, organisms: tools };
  // the packs that span several tools (80s, Club, EDM Pads, Sequencer songs) — content only, after the tools
  if (bundleFiles.length) write('Music · Bundles.zip', Object.assign({}, base, { pack_id: 'eravos.music.bundles', pack_type: 'organism_pack', label: 'Music — preset bundles (80s, Club, EDM Pads, Sequencer songs)', dependencies: [CORE.id], permissions: [],
    contents: { organisms: scripts(bundleFiles) } }), bundleFiles);
  return { made, organisms: tools };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--out'); const out = path.resolve(i >= 0 ? process.argv[i + 1] : path.join(ROOT, '..', 'ERAVOS-packs'));
  const ti = process.argv.indexOf('--tool'), only = ti >= 0 ? new Set(process.argv[ti + 1].split(',')) : null;   // --tool eravos.sub-engine[,…]: just those zips
  const r = buildPacks(out, only);
  r.made.forEach(m => console.log(`› ${m.file.padEnd(34)} ${m.pack_id.padEnd(26)} ${m.files} files`));
  console.log(only ? `${r.organisms} tool zip(s) → ${out}` : `${r.organisms} organisms in ${r.made.length - 1} tool packs + core → ${out}`);
}

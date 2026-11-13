#!/usr/bin/env node
/* The decomposed songs hold together (specs/eravos.song-decomposition.spec SD1; his words 2026-11-13: "also songs decomposed one by one."):
 * every rhythm / line a song's part plays exists in that tool's file; each tool's bars equal the bars its songs' parts play; every line is
 * relative to the key (intervals, no absolute notes); a rhythm's identity is its onsets (no two the same). Plain node, no browser. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const D = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools/music/data/song-parts'), J = (f) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
let bad = 0; const fail = (m) => { bad++; if (bad < 20) console.error('✗ ' + m); };
const idx = J('index.json'), songs = J('songs.json').songs, files = {};
Object.entries(idx.tools).forEach(([org, t]) => { const f = J(t.file); files[org] = { r: new Map(f.rhythms.map(x => [x.id, x])), l: new Map(f.lines.map(x => [x.id, x])) };
  const keys = new Set(); f.rhythms.forEach(x => { const k = JSON.stringify(x.steps); if (keys.has(k)) fail(`${org}: two rhythms with the same onsets`); keys.add(k); if (x.vel.length !== x.steps.length) fail(`${org} ${x.id}: a velocity per onset`); });
  f.lines.forEach(x => x.notes.forEach(n => { if (Math.abs(n[2]) > 72) fail(`${org} ${x.id}: interval ${n[2]} is not relative to the key`); })); });
if (songs.length !== idx.songs) fail(`index says ${idx.songs} songs, songs.json holds ${songs.length}`);
const played = {};
songs.forEach(s => s.parts.forEach(p => { const F = files[p.tool]; if (!F) return fail(`${s.id}: part ${p.as} plays ${p.tool}, which has no file`);
  p.runs.forEach(([bar, n, rid, lid]) => { if (!F.r.has(rid)) fail(`${s.id} ${p.as} bar ${bar}: rhythm ${rid} missing`); if (lid && !F.l.has(lid)) fail(`${s.id} ${p.as} bar ${bar}: line ${lid} missing`);
    if (!p.drums && !lid) fail(`${s.id} ${p.as}: a pitched part with no line`); played[p.tool] = (played[p.tool] || 0) + n; }); }));
Object.entries(idx.tools).forEach(([org, t]) => { if (played[org] !== t.bars) fail(`${org}: its songs play ${played[org]} bars, its file counts ${t.bars}`);
  const sum = [...files[org].r.values()].reduce((a, x) => a + x.bars, 0); if (sum !== t.bars) fail(`${org}: rhythms count ${sum} bars, the index ${t.bars}`); });
if (bad) { console.error(`✗ song parts: ${bad} problem(s)`); process.exit(1); }
console.log(`✓ song parts: ${songs.length} songs, ${Object.keys(idx.tools).length} tools — every rhythm and line a song plays is in its tool's file, the bars add up`);

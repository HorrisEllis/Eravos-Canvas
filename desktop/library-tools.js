/* ERAVOS desktop — the tools live in the library (spec eravos.store S3, his words 2026-11-08: "no they were in program files. my eravos
 * folder in documents is empty, just empty folders." · "like i want to make everything outside of the canvas, in a seperate repo. like a
 * tool store."). The app folder (Program Files\ERAVOS) carries the canvas and, until the store repo exists, a first copy of the tools: the
 * "bundle". On start the bundle is put into Documents\ERAVOS\tools and the page is served the tools from THERE.
 *
 *   sync(bundleDir, libDir, { version }) → { copied, updated, kept, removed, skipped }   (plain node; no Electron)
 *   resolve(rel, libDir, bundleDir) → the file to serve for tools/<rel> (the library's, else the bundle's), or null
 *
 * Nothing you changed is overwritten: .bundled.json records the digest of every file as it was copied; on a new version a file is
 * replaced only while it still matches that digest (untouched), a file you edited is kept (and counted), a file the bundle no longer has
 * is removed only if untouched. Zips at the top of tools\ (extra tool packs) are never touched. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const STATE = '.bundled.json';
const digest = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
const skipName = (n) => n === 'node_modules' || n.startsWith('.');

function walk(dir, base = dir, out = []) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of ents) {
    if (skipName(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, base, out); else if (e.isFile()) out.push(path.relative(base, f).split(path.sep).join('/'));
  }
  return out;
}

function sync(bundleDir, libDir, o = {}) {
  const r = { copied: 0, updated: 0, kept: [], removed: 0, skipped: false };
  if (!bundleDir || !fs.existsSync(bundleDir) || path.resolve(bundleDir) === path.resolve(libDir)) { r.skipped = true; return r; }
  fs.mkdirSync(libDir, { recursive: true });
  const stFile = path.join(libDir, STATE);
  let st = { version: null, files: {} }; try { st = Object.assign(st, JSON.parse(fs.readFileSync(stFile, 'utf8'))); } catch (e) {}
  const files = walk(bundleDir);
  // the same version and every file still there: nothing to do (a quick start)
  if (o.version && st.version === o.version && files.every(rel => st.files[rel] && fs.existsSync(path.join(libDir, rel)))) { r.skipped = true; return r; }
  const next = {};
  for (const rel of files) {
    const src = path.join(bundleDir, rel), dst = path.join(libDir, rel), want = digest(src);
    if (!fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); r.copied++; next[rel] = want; continue; }
    const have = digest(dst);
    if (have === want) { next[rel] = want; continue; }
    if (st.files[rel] && st.files[rel] === have) { fs.copyFileSync(src, dst); r.updated++; next[rel] = want; continue; }   // untouched → the new one
    r.kept.push(rel); next[rel] = st.files[rel] || null;   // yours: kept as you left it
  }
  for (const rel of Object.keys(st.files)) {   // gone from the bundle: removed only if untouched
    if (next[rel] !== undefined) continue;
    const dst = path.join(libDir, rel);
    try { if (fs.existsSync(dst) && st.files[rel] && digest(dst) === st.files[rel]) { fs.unlinkSync(dst); r.removed++; } } catch (e) {}
  }
  fs.writeFileSync(stFile, JSON.stringify({ version: o.version || null, synced: new Date().toISOString(), files: next }));
  return r;
}

function resolve(rel, libDir, bundleDir) {
  const parts = String(rel).split(/[\\/]+/).filter(Boolean);
  if (!parts.length || parts.some(p => p === '..' || skipName(p))) return null;
  for (const base of [libDir, bundleDir]) {
    if (!base) continue;
    const f = path.resolve(base, ...parts);
    if (!f.startsWith(path.resolve(base) + path.sep)) continue;
    try { if (fs.statSync(f).isFile()) return f; } catch (e) {}
  }
  return null;
}

module.exports = { sync, resolve, walk, STATE };

#!/usr/bin/env node
/* P0.4 — the duplicate finder. Which code do the tools repeat? That is what becomes a component (eravos.music-ecosystem §3,
 * phase 0: "extract the shared parts with no sound change"). The P0.2 scan matched functions by NAME; this one reads the code:
 *   every tool file (tools/<domain>/tools/**\/*.js, not tests) → tokens, with names and numbers normalised (so the same code with
 *   other variable names or constants still matches) → windows of W tokens hashed → windows found in 2+ tools → grown into the
 *   longest shared runs → grouped by the set of tools sharing them.
 *   node build/duplicates.mjs [--min 60] [--out docs/duplicates.md] [--json]
 * Reports, writes nothing else. Exact (same names, same numbers) vs shape-only (renamed / other constants) is said per block:
 * an exact block can be moved as is; a shape-only one is a component with parameters. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const W = +arg('--min', 60), OUT = arg('--out', 'docs/duplicates.md'), JSON_OUT = process.argv.includes('--json');

// ---- files: every tool's own code
const files = [];
(function walk(dir) {
  for (const n of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = dir + '/' + n, st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) { if (!/^(packs|node_modules)$/.test(n)) walk(rel); }
    else if (/\.js$/.test(n) && !/\.test\.js$/.test(n) && /\/tools\/[^/]+\/[^/]+\//.test(rel)) files.push(rel);
  }
})('tools');
const toolOf = (rel) => rel.split('/').slice(0, -1).join('/').replace(/^tools\/([^/]+)\/tools\/[^/]+\//, '$1/');

// ---- tokens: comments and whitespace dropped; identifiers → I, numbers → N, strings → S (shape); the raw text kept (exact)
const KW = new Set('const let var function return if else for while do switch case break continue new this typeof instanceof in of try catch finally throw class extends super null undefined true false async await yield delete void default import export from'.split(' '));
const RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|0x[0-9a-f]+|\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?|[A-Za-z_$][\w$]*|=>|\.\.\.|[=!]==?|[<>]=?|&&|\|\||\?\?|\?\.|\*\*|[-+*/%&|^]=?|[{}()[\];,.:?~]/gi;
function tokens(src) {
  const out = []; let m; RE.lastIndex = 0;
  const lineAt = []; let line = 1, last = 0;
  while ((m = RE.exec(src))) {
    const t = m[0]; for (let i = last; i < m.index; i++) if (src.charCodeAt(i) === 10) line++; last = m.index;
    if (t.startsWith('/*') || t.startsWith('//')) continue;
    const shape = /^['"`]/.test(t) ? 'S' : /^[\d.]/.test(t) && /\d/.test(t) ? 'N' : /^[A-Za-z_$]/.test(t) ? (KW.has(t) ? t : 'I') : t;
    out.push({ s: shape, raw: t, line });
  }
  return out;
}
const T = files.map(f => ({ file: f, tool: toolOf(f), toks: tokens(fs.readFileSync(path.join(ROOT, f), 'utf8')) }));

// ---- windows of W shape-tokens, hashed; keep the ones seen in 2+ different tools
const hash = (a, i) => { let h = 2166136261; for (let k = i; k < i + W; k++) { const s = a[k].s; for (let c = 0; c < s.length; c++) { h ^= s.charCodeAt(c); h = Math.imul(h, 16777619); } h ^= 124; h = Math.imul(h, 16777619); } return h >>> 0; };
const seen = new Map();
T.forEach((f, fi) => { for (let i = 0; i + W <= f.toks.length; i++) { const h = hash(f.toks, i); let l = seen.get(h); if (!l) seen.set(h, l = []); l.push([fi, i]); } });
const shared = new Map();   // file index → Set of start positions in a window shared across tools
seen.forEach((l) => { if (new Set(l.map(([fi]) => T[fi].tool)).size < 2) return; l.forEach(([fi, i]) => { let s = shared.get(fi); if (!s) shared.set(fi, s = new Set()); s.add(i); }); });

// ---- grow into runs per file, then pair runs across files by their first window's hash
const runs = [];
shared.forEach((starts, fi) => {
  const a = [...starts].sort((x, y) => x - y); let s0 = a[0], prev = a[0];
  const close = (from, to) => runs.push({ fi, from, to: to + W, key: hash(T[fi].toks, from) });
  for (let k = 1; k < a.length; k++) { if (a[k] !== prev + 1) { close(s0, prev); s0 = a[k]; } prev = a[k]; }
  if (a.length) close(s0, prev);
});
const byKey = new Map(); runs.forEach(r => { let l = byKey.get(r.key); if (!l) byKey.set(r.key, l = []); l.push(r); });
const blocks = [];
byKey.forEach((l) => {
  const tools = [...new Set(l.map(r => T[r.fi].tool))]; if (tools.length < 2) return;
  const len = Math.min(...l.map(r => r.to - r.from));
  const exact = l.every(r => T[r.fi].toks.slice(r.from, r.from + len).map(t => t.raw).join(' ') === T[l[0].fi].toks.slice(l[0].from, l[0].from + len).map(t => t.raw).join(' '));
  const at = l.map(r => ({ file: T[r.fi].file, tool: T[r.fi].tool, lines: [T[r.fi].toks[r.from].line, T[r.fi].toks[Math.min(r.from + len, T[r.fi].toks.length) - 1].line] }));
  const sample = T[l[0].fi].toks.slice(l[0].from, l[0].from + Math.min(len, 40)).map(t => t.raw).join(' ');
  // settings = a run of the tool's knob declarations ({ key, type, default, … }); code = everything else (DSP, wiring, UI)
  const raws = T[l[0].fi].toks.slice(l[0].from, l[0].from + len).map(t => t.raw), keys = raws.filter((t, i) => t === 'key' && raws[i + 1] === ':').length;
  blocks.push({ tokens: len, tools, exact, at, sample, kind: keys >= 2 ? 'settings' : 'code' });
});
blocks.sort((a, b) => b.tokens * b.tools.length - a.tokens * a.tools.length);

// ---- the families: which tools share the most code with each other
const pair = new Map(); blocks.forEach(b => { for (let i = 0; i < b.tools.length; i++) for (let j = i + 1; j < b.tools.length; j++) { const k = [b.tools[i], b.tools[j]].sort().join(' ⇄ '); pair.set(k, (pair.get(k) || 0) + b.tokens); } });
const pairs = [...pair.entries()].sort((a, b) => b[1] - a[1]);
const totalTok = T.reduce((n, f) => n + f.toks.length, 0), dupTok = blocks.reduce((n, b) => n + b.tokens * (b.tools.length - 1), 0);

if (JSON_OUT) { console.log(JSON.stringify({ window: W, files: files.length, tokens: totalTok, duplicated: dupTok, blocks, pairs }, null, 1)); process.exit(0); }
const md = [
  '# Duplicates across tools (P0.4)', '',
  `Generated by \`node build/duplicates.mjs --min ${W}\` — ${files.length} tool files, ${totalTok.toLocaleString('en')} tokens. ` +
  `A block is ≥ ${W} tokens with the same shape in 2+ tools (names and numbers may differ). **exact** = identical text: it can move as is. ` +
  `**shape** = same code, other names or constants: a component with parameters.`, '',
  `About **${dupTok.toLocaleString('en')} tokens (${(100 * dupTok / totalTok).toFixed(1)} %)** are repeats of code another tool already has.`, '',
  '## Tools that share the most code', '', '| tools | shared tokens |', '|---|---|',
  ...pairs.slice(0, 30).map(([k, n]) => `| ${k} | ${n} |`), '',
  ...['code', 'settings'].flatMap(kind => [`## ${kind === 'code' ? 'Code' : 'Settings (repeated knob groups mark repeated parts)'} — biggest first (tokens × tools)`, '',
  ...blocks.filter(b => b.kind === kind).slice(0, 40).flatMap((b, i) => [
    `### ${i + 1}. ${b.tokens} tokens · ${b.tools.length} tools · ${b.exact ? 'exact' : 'shape'}`,
    ...b.at.map(a => `- \`${a.file}\` lines ${a.lines[0]}–${a.lines[1]}`),
    '', '```js', b.sample.slice(0, 400) + (b.sample.length > 400 ? ' …' : ''), '```', ''])]),
].join('\n');
fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true }); fs.writeFileSync(path.join(ROOT, OUT), md);
console.log(`code blocks ${blocks.filter(b => b.kind === 'code').length} · settings blocks ${blocks.filter(b => b.kind === 'settings').length}`);
console.log(`${files.length} files · ${blocks.length} shared blocks · ~${(100 * dupTok / totalTok).toFixed(1)} % repeated → ${OUT}`);
console.log(pairs.slice(0, 12).map(([k, n]) => `  ${n}\t${k}`).join('\n'));

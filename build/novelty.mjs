#!/usr/bin/env node
/* N1 — the novelty report across ALL of ERAVOS (specs/eravos.music-ecosystem.spec §6 ADDENDUM 2026-11-06; his words: "Need to make
 * sure it's all novel" · "The sworm and other tools need to be checked for novelty, like I need to be able to make more with this.").
 * It changes nothing: it measures and names.
 *
 *   node tests/tool-audio.mjs --json ta.json      every preset of every tool rendered, each with its fingerprint (tests/audio-measure.js)
 *   node build/novelty.mjs ta.json                → docs/novelty-report.md (+ docs/novelty.json)
 *
 * The distance: every feature scaled 0…1 across everything ERAVOS has; three groups count equally — tone colour (24 bands),
 * brightness / noisiness (centroid, flatness, flux and how they move), envelope / movement (attack, level half way and at the end,
 * loudness movement) — so 24 bands do not drown the rest. d = √(⅓·shape + ⅓·bright + ⅓·envelope) (each a mean of squared
 * differences): 0 = the same fingerprint, 1 = as far apart as anything in ERAVOS.
 * Instruments are compared with instruments (a note or a triad), effects with effects (the same saw burst through each). Beat tools
 * (patterns) are not sounds of their own here.
 *   CLOSE < 0.15 (the spec's threshold) · TWIN < 0.07 (indistinguishable by this measure)
 * Honest limits: one note (or one triad) per preset, 2.6 s — a preset whose character is in its motion over bars, in the pitch range or
 * in what you play reads closer than it sounds; the measure does not hear pitch movement (bends, glides). A low distance is a lead to
 * listen to, not a verdict. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { NB, groupsFor, scale, norm, makeDist } from './novelty-core.mjs';   // the measure, shared with build/novelty-gate.mjs
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2]; if (!src) { console.error('usage: node build/novelty.mjs <tool-audio.json>'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
let CLOSE = 0.15, TWIN = 0.07, MU = 0, SD = 1;   // calibrated below from ERAVOS itself
const items = [];
for (const t of data) for (const p of (t.presets || [])) if (p.fp && p.fp.every(Number.isFinite) && !/beat/.test(t.kind) && p.level !== 'FAIL')   // a broken render (silent, clipping, NaN) is no fingerprint — it is reported, not compared
  items.push({ tool: t.id, label: t.label || t.id, kind: t.kind === 'effect' ? 'effect' : 'sound', preset: p.preset || '(default)', v: p.fp, chord: p.chord });
if (!items.length) { console.error('no fingerprints in ' + src + ' (run tests/tool-audio.mjs with this build)'); process.exit(1); }
const { D, lo, hi } = scale(items);
items.forEach(it => { it.n = norm(it.v, lo, hi); });
const groups = groupsFor(D);   // tone colour · tone shape · envelope · motion (3.145)
const dist = makeDist(groups);
// calibration: CLOSE = as close as two DIFFERENT presets of ONE tool usually are (the median, over every tool, of each preset's nearest
// preset in its own tool) — "this sound is no further from that one than a tool's presets are from each other"; TWIN = half of it
{ const own = []; items.forEach(a => { let d = 9; for (const b of items) if (b !== a && b.tool === a.tool && b.kind === a.kind) d = Math.min(d, dist(a, b)); if (d < 9) own.push(d); });
  own.sort((x, y) => x - y); CLOSE = own[Math.floor(own.length / 2)]; TWIN = CLOSE / 2;
  // 3.144 sigmas (his: "could always use sigmas to measure deviations between sounds and tools?"): every distance also as standard
  // deviations from how far apart ERAVOS's own presets usually are (the same nearest-in-own-tool distances): σ < 0 = closer than usual
  MU = own.reduce((a, b) => a + b, 0) / own.length; SD = Math.sqrt(own.reduce((a, b) => a + (b - MU) ** 2, 0) / own.length) || 1; }
const failed = data.flatMap(t => (t.presets || []).filter(p => p.level === 'FAIL').map(p => ({ tool: t.label || t.id, preset: p.preset || '(default)', notes: (p.notes || []).join(' · ') })));
// nearest neighbours: anywhere, and in another tool
items.forEach(a => { let any = null, da = 9, other = null, dor = 9;
  for (const b of items) { if (a === b || a.kind !== b.kind) continue; const d = dist(a, b); if (d < da) { da = d; any = b; } if (b.tool !== a.tool && d < dor) { dor = d; other = b; } }
  Object.assign(a, { nn: any, nnD: da, nnOther: other, nnOtherD: dor }); });
const byTool = new Map(); items.forEach(it => { if (!byTool.has(it.tool)) byTool.set(it.tool, []); byTool.get(it.tool).push(it); });
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f2 = (x) => x.toFixed(3), name = (it) => `${it.label} · ${it.preset}`, sig = (d) => { const z = (d - MU) / SD; return (z >= 0 ? '+' : '') + z.toFixed(1) + 'σ'; };
// a tool inside another: the share of its presets whose nearest sound in another tool is CLOSE and in the same tool B
const tools = [...byTool.entries()].map(([id, list]) => {
  const close = list.filter(x => x.nnOtherD < CLOSE), count = {}; close.forEach(x => { count[x.nnOther.tool] = (count[x.nnOther.tool] || 0) + 1; });
  const [top, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return { id, label: list[0].label, kind: list[0].kind, presets: list.length, novel: list.filter(x => x.nnD >= CLOSE).length, medAny: med(list.map(x => x.nnD)), medOther: med(list.map(x => x.nnOtherD)),
    insideOf: top ? byTool.get(top)[0].label : null, insideShare: list.length ? n / list.length : 0, twinsInside: list.filter(x => x.nn && x.nn.tool === id && x.nnD < TWIN).length };
}).sort((a, b) => b.insideShare - a.insideShare || a.medOther - b.medOther);
// Swarm against Supersaw, directly
const pair = (A, B) => { const a = byTool.get(A), b = byTool.get(B); if (!a || !b) return null;
  const cross = a.map(x => Math.min(...b.map(y => dist(x, y)))), within = b.map(y => Math.min(...b.filter(z => z !== y).map(z => dist(y, z))));
  return { cross: med(cross), crossMin: Math.min(...cross), within: med(within), closeShare: cross.filter(d => d < CLOSE).length / a.length }; };
const sw = pair('eravos.swarm-oscillator', 'eravos.supersaw'), rd = pair('eravos.retro-dco', 'eravos.retro-poly');
const pairs = []; const seen = new Set();
items.forEach(a => { if (!a.nnOther || a.nnOtherD >= CLOSE) return; const k = [name(a), name(a.nnOther)].sort().join('|'); if (seen.has(k)) return; seen.add(k); pairs.push([a, a.nnOther, a.nnOtherD]); });
pairs.sort((x, y) => x[2] - y[2]);
const all = items.length, closeOther = items.filter(x => x.nnOtherD < CLOSE).length, novel = items.filter(x => x.nnD >= CLOSE).length;
const L = [];
L.push('# Novelty across ERAVOS — the N1 report', '', `Generated by \`node build/novelty.mjs\` from a \`tests/tool-audio.mjs\` run (${new Date().toISOString().slice(0, 10)}). It changes nothing; it names where ERAVOS repeats itself.`,
  '> his words (2026-11-06): "Need to make sure it’s all novel." · "The sworm and other tools need to be checked for novelty, like I need to be able to make more with this."', '',
  `How: every preset rendered (a preset whose render FAILED — silent, clipping, NaN — is listed at the end, not compared) (instruments: one note or a triad, 2.6 s; effects: the same saw burst), fingerprinted (tone colour in 24 bands, brightness and noisiness and how they move, envelope and loudness movement), scaled across all of ERAVOS; distance 0 = identical … 1 = as far apart as anything here. **CLOSE < ${f2(CLOSE)}** — calibrated: as close as two different presets of one tool usually are (the median, over ERAVOS, of each preset's nearest neighbour in its own tool); **TWIN < ${f2(TWIN)}** (half that). **σ**: every distance also in standard deviations from that usual spacing (mean ${f2(MU)}, σ ${f2(SD)}) — below 0σ = closer than two presets of one tool usually are; +2σ and up = clearly its own sound. Limits: one note per preset — motion over bars, pitch movement and playing range are not heard; a low distance is a lead to listen to, not a verdict.`, '',
  '## Summary', '',
  `- ${all} presets in ${byTool.size} tools measured.`,
  `- ${novel} (${Math.round(100 * novel / all)} %) are novel: nothing else in ERAVOS (same kind) within ${f2(CLOSE)}.`,
  `- ${closeOther} (${Math.round(100 * closeOther / all)} %) have a CLOSE sound in **another** tool.`, '');
if (sw) L.push('## Swarm Oscillator ↔ Supersaw (his ear: "doesn’t seem like anything new sound wise")', '',
  `- Swarm's presets to their nearest Supersaw preset: median **${f2(sw.cross)}** (${sig(sw.cross)}; closest ${f2(sw.crossMin)}, ${sig(sw.crossMin)}); ${Math.round(100 * sw.closeShare)} % of Swarm's presets are CLOSE to a Supersaw preset.`,
  `- For scale: Supersaw's presets to each other, median ${f2(sw.within)}.`,
  `- Reading: ${sw.cross < sw.within * 1.3 ? 'Swarm sits about as close to Supersaw as Supersaw sits to itself — by this measure it is another Supersaw. N2 (make the swarm audibly new) is confirmed.' : 'Swarm is measurably apart from Supersaw on this measure; motion is now in the fingerprint (how fast tone and level move, 3.145), but over one 2.6 s note — Swarm 1.1 (the Living pack) measures no further from Supersaw than the older presets: its breathing (Restless) takes seconds to show. The test is his ear, on held notes.'}`, '');
if (rd) L.push('## Retro DCO ↔ Retro Poly (for scale: Retro DCO is Retro Poly\'s family on purpose)', '', `- Retro DCO's presets to their nearest Retro Poly preset: median ${f2(rd.cross)}; ${Math.round(100 * rd.closeShare)} % CLOSE. Retro Poly to itself: median ${f2(rd.within)}.`, '');
L.push('> **Effects are not measured fairly yet.** One dry saw burst cannot show a gate without a key, a sidechain without a kick, a glitch or a throw without the transport — those read as identical (0.000) because the burst comes out untouched. Each effect needs the signal its kind works on before its rows mean anything; the instrument rows stand.', '');
L.push('## Tools inside another tool', '', 'A tool whose presets mostly have a CLOSE sound in one other tool. First in the list = the most contained.', '',
  '| Tool | Presets | Novel (nothing CLOSE) | Median to its nearest in another tool (σ) | Mostly near | Share CLOSE to it | Twins inside the tool |', '|---|---|---|---|---|---|---|');
tools.forEach(t => L.push(`| ${t.label}${t.kind === 'effect' ? ' (fx)' : ''} | ${t.presets} | ${t.novel} | ${f2(t.medOther)} (${sig(t.medOther)}) | ${t.insideOf || '—'} | ${Math.round(100 * t.insideShare)} % | ${t.twinsInside} |`));
L.push('', `## The closest sounds in different tools (${Math.min(60, pairs.length)} of ${pairs.length} CLOSE pairs)`, '', '| d | σ | One | The other |', '|---|---|---|---|');
pairs.slice(0, 60).forEach(([a, b, d]) => L.push(`| ${f2(d)} | ${sig(d)} | ${name(a)} | ${name(b)} |`));
const twins = items.filter(x => x.nn && x.nn.tool === x.tool && x.nnD < TWIN).sort((a, b) => a.nnD - b.nnD), tw = new Set();
L.push('', '## Twins inside a tool (two presets this measure cannot tell apart)', '', '| d | Preset | Its twin |', '|---|---|---|');
twins.forEach(a => { const k = [a.preset, a.nn.preset, a.tool].sort().join('|'); if (tw.has(k)) return; tw.add(k); L.push(`| ${f2(a.nnD)} | ${name(a)} | ${a.nn.preset} |`); });
L.push('', `## Renders that failed (${failed.length}) — not compared; each is a fault to fix first`, '', '| Tool | Preset | What failed |', '|---|---|---|');
failed.forEach(f => L.push(`| ${f.tool} | ${f.preset} | ${f.notes.replace(/\|/g, '/')} |`));
L.push('', '## What comes next (the spec\'s order)', '', '- N2 Swarm made audibly new: 1.1 built (Restless, Form glide, Field FM, Lock → tone; the Living pack) — his ear decides; a longer render (8 s, held) is the next measure.',
  '- N4 per tool, worst first (the top of "Tools inside another tool"): depth and packs until its presets stand apart; twins changed, merged or dropped.',
  '- Every new preset, pad sound, unit and mod: this report run again — CLOSE to anything in ERAVOS is not shipped as new.', '');
fs.writeFileSync(path.join(ROOT, 'docs/novelty-report.md'), L.join('\n'));
// the gate's baseline (build/novelty-gate.mjs): every fingerprint as measured, the scale and the calibration — what "already in ERAVOS" means
const role = (id) => { try { const f = data.find(t => t.id === id); return f && f.category ? String(f.category) : null; } catch (e) { return null; } };
fs.writeFileSync(path.join(ROOT, 'docs/novelty-baseline.json'), JSON.stringify({ made: new Date().toISOString(), close: CLOSE, twin: TWIN, mu: MU, sd: SD, lo, hi, D,
  items: items.map(x => ({ tool: x.tool, label: x.label, preset: x.preset, kind: x.kind, category: role(x.tool), v: x.v.map(n => +n.toPrecision(6)) })) }));
fs.writeFileSync(path.join(ROOT, 'docs/novelty.json'), JSON.stringify({ close: CLOSE, twin: TWIN, items: items.map(x => ({ tool: x.tool, preset: x.preset, kind: x.kind, nn: x.nn && `${x.nn.tool} · ${x.nn.preset}`, d: +x.nnD.toFixed(3), nnOther: x.nnOther && `${x.nnOther.tool} · ${x.nnOther.preset}`, dOther: +x.nnOtherD.toFixed(3) })), tools }, null, 1));
console.log(`${all} presets · ${byTool.size} tools · ${novel} novel · ${closeOther} close to another tool → docs/novelty-report.md` + (sw ? ` · Swarm↔Supersaw median ${f2(sw.cross)} (Supersaw within ${f2(sw.within)})` : ''));
